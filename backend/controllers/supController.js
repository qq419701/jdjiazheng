// 实现标准SUP接口：供阿奇索开放平台调用，作为货源方（供应商）
// 接口说明：
//   - 本系统的商品全部是卡密类型（productType=2），不做直充
//   - 同步发货模式：下单后直接返回卡密，不需要异步回调
//   - 商品编号来自 Product 表的 product_no 字段

const { Op } = require('sequelize');
const { Card, Order, Setting, Product, SupLog } = require('../models');
const 数据库连接 = require('../config/database');
const { 加密卡密 } = require('../services/agisoService');
const { 安全解析JSON } = require('../utils/helpers');

// 洗衣价格单位换算常量（Setting表中以分存储，转换为元返回）
const 分转元 = 100;

/**
 * 业务类型 → H5路径前缀映射
 * 家政: /jz/  洗衣: /xi/  充值: /cz/
 */
const 业务路径前缀 = {
  jiazheng: 'jz',
  xiyifu:   'xi',
  topup:    'cz',
};

/**
 * 根据 site_url + business_type + code 构建完整可点击卡密链接
 * 例如：https://jz.hebeiwanwu.com/jz/TJR93VDP9Q3Q9984
 * @param {string} siteUrl - 站点域名（末尾不含斜线），来自 Setting.site_url
 * @param {string} businessType - 业务类型（jiazheng/xiyifu/topup）
 * @param {string} code - 卡密码
 * @returns {string} 完整链接，siteUrl 未配置时降级为裸码
 */
const 构建卡密链接 = (siteUrl, businessType, code) => {
  if (!siteUrl) return code;
  const 前缀 = 业务路径前缀[businessType] || 'jz';
  return `${siteUrl}/${前缀}/${code}`;
};

/**
 * 格式化过期时间为字符串
 * @param {Date|null} 时间 - 过期时间
 * @returns {string} 格式化后的时间字符串，如 '2024-12-31 23:59:59'
 */
const 格式化过期时间 = (时间) => {
  if (!时间) return '';
  const d = new Date(时间);
  // 转换为北京时间 (UTC+8)
  const 北京时间 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return 北京时间.toISOString().replace('T', ' ').slice(0, 19);
};

/**
 * 从数据库批量读取配置项，转换为键值对象
 * @param {Array} 键名列表 - 需要读取的配置键名数组
 * @returns {Object} 配置键值对象
 */
const 读取配置 = async (键名列表) => {
  const 配置列表 = await Setting.findAll({
    where: { key_name: 键名列表 },
  });
  const 配置 = {};
  配置列表.forEach(项 => {
    配置[项.key_name] = 项.key_value;
  });
  return 配置;
};

/**
 * 提取电商平台订单号
 * 优先从 attach 字段解析 platformOrderNo / ecOrderNo / orderNo；
 * 若 attach 无法解析，则从 orderNo 去掉末尾的 "-数字" 后缀（如 P791381403338389551-00 → P791381403338389551）
 * @param {string} orderNo - 阿奇所订单号（如 P791381403338389551-00）
 * @param {string|Object} attach - attach 字段（JSON字符串或对象，可为空）
 * @returns {string} 电商平台真实订单号，或空字符串
 */
const 提取电商单号 = (orderNo, attach) => {
  if (attach) {
    try {
      const obj = typeof attach === 'string' ? JSON.parse(attach) : attach;
      const fromAttach = obj.platformOrderNo || obj.ecOrderNo || obj.orderNo || '';
      if (fromAttach) return fromAttach;
    } catch {}
  }
  // 兜底：去掉 agiso_order_no 末尾的 -数字 后缀
  if (orderNo) {
    return orderNo.replace(/-\d+$/, '');
  }
  return '';
};

/**
 * 根据卡密的 business_type、service_type、service_hours 生成商品编号
 * 格式：{business_type}_{service_type}_{service_hours}h
 * 例如：jiazheng_日常保洁_2h、xiyifu_任洗一件_0h
 * @param {string} businessType - 业务类型
 * @param {string} serviceType - 服务类型
 * @param {number} serviceHours - 服务时长
 * @returns {string} 商品编号
 */
const 生成商品编号 = (businessType, serviceType, serviceHours) => {
  return `${businessType}_${serviceType}_${serviceHours}h`;
};

/**
 * 解析商品编号，还原 business_type、service_type、service_hours
 * @param {string} productNo - 商品编号
 * @returns {Object|null} { businessType, serviceType, serviceHours } 或 null
 */
const 解析商品编号 = (productNo) => {
  if (!productNo) return null;
  // 格式：{businessType}_{serviceType}_{serviceHours}h
  // 注意 serviceType 可能包含中文，用最后一个 _ 分割
  const 最后下划线位置 = productNo.lastIndexOf('_');
  if (最后下划线位置 < 0) return null;
  const 后缀 = productNo.substring(最后下划线位置 + 1); // 如 2h 或 0h
  const 前缀 = productNo.substring(0, 最后下划线位置); // 如 jiazheng_日常保洁
  const 第一下划线位置 = 前缀.indexOf('_');
  if (第一下划线位置 < 0) return null;
  const businessType = 前缀.substring(0, 第一下划线位置);
  const serviceType = 前缀.substring(第一下划线位置 + 1);
  const serviceHours = parseInt(后缀.replace('h', ''), 10);
  return { businessType, serviceType, serviceHours };
};

// =============================================
// 接口1：获取应用ID（匿名接口，无需签名）
// POST /agisoAcprSupplierApi/app/getAppId
// 返回：从Setting表读取 agiso_app_id
// =============================================

/**
 * 获取应用ID接口
 * 接口名称：获取应用ID
 * 请求参数：无
 * 响应格式：{ code: 200, message: '接口调用成功', data: { appId: xxx } }
 * 业务说明：匿名接口，奇所平台用此接口获取货源方appId
 */
const 获取应用ID = async (req, res) => {
  try {
    const 配置 = await Setting.findOne({ where: { key_name: 'agiso_app_id' } });
    const appId = 配置 ? 配置.key_value : '';
    const 响应数据 = { code: 200, message: '接口调用成功', data: { appId } };
    res.json(响应数据);
    // 写入SUP日志（不影响主流程）
    try {
      await SupLog.create({
        log_type: 'getAppId',
        request_data: JSON.stringify(req.body || {}),
        response_data: JSON.stringify(响应数据),
        status_code: 200,
        result: 'success',
      });
    } catch (日志错误) {
      console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
    }
  } catch (错误) {
    console.error('获取应用ID出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
};

// =============================================
// 接口2：获取商品分页列表
// POST /agisoAcprSupplierApi/product/getList
// 请求参数：userId, keyword, productType, pageIndex, pageSize, timestamp, version, sign
// =============================================

/**
 * 获取商品分页列表接口
 * 接口名称：获取商品分页列表
 * 请求参数：userId, keyword, productType, pageIndex, pageSize, timestamp, version, sign
 * 响应格式：{ code: 200, message: '接口调用成功', data: { items: [...], hasNextPage: false } }
 * 业务说明：
 *   - 本系统商品类型全部是卡密类型（productType=2）
 *   - 从 Product 表查询 status=1（启用）的商品列表
 *   - 支持 keyword 模糊搜索商品名称
 *   - 支持分页（pageIndex从1开始）
 */
const 获取商品列表 = async (req, res) => {
  try {
    const {
      keyword = '',
      pageIndex = 1,
      pageSize = 20,
    } = req.body;

    const 查询条件 = { status: 1 };

    // keyword 模糊搜索商品名称或商品编号
    if (keyword && keyword.trim()) {
      查询条件[Op.or] = [
        { product_name: { [Op.like]: `%${keyword.trim()}%` } },
        { product_no: { [Op.like]: `%${keyword.trim()}%` } },
      ];
    }

    const 全部商品 = await Product.findAll({
      where: 查询条件,
      order: [['product_no', 'ASC']],
    });

    // 分页处理
    const 当前页 = parseInt(pageIndex) || 1;
    const 每页数量 = parseInt(pageSize) || 20;
    const 起始位置 = (当前页 - 1) * 每页数量;
    const 分页数据 = 全部商品.slice(起始位置, 起始位置 + 每页数量);
    const hasNextPage = 起始位置 + 每页数量 < 全部商品.length;

    const 商品列表 = 分页数据.map(商品 => ({
      productNo: 商品.product_no,
      productTitle: 商品.product_name,
      productCost: parseFloat(商品.cost_price) || 0,
      productType: 2, // 卡密类型
      businessType: 商品.business_type,
      serviceType: 商品.service_type,
      serviceHours: 商品.service_hours,
    }));

    // 写入SUP日志（不影响主流程）
    try {
      const reqCopy = { ...req.body };
      delete reqCopy.sign;
      await SupLog.create({
        log_type: 'getList',
        user_id: req.body.userId || null,
        request_data: JSON.stringify(reqCopy),
        response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { items: 商品列表, hasNextPage } }),
        status_code: 200,
        result: 'success',
      });
    } catch (日志错误) {
      console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
    }

    res.json({
      code: 200,
      message: '接口调用成功',
      data: {
        items: 商品列表,
        hasNextPage,
      },
    });
  } catch (错误) {
    console.error('获取SUP商品列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
};

// =============================================
// 接口3：获取商品模板
// POST /agisoAcprSupplierApi/product/getTemplate
// 请求参数：userId, productNo, timestamp, version, sign
// =============================================

/**
 * 获取商品模板接口
 * 接口名称：获取商品模板
 * 请求参数：userId, productNo, timestamp, version, sign
 * 响应格式：{ code: 200, message: '接口调用成功', data: { apiType: 1, productTitle: '...', productType: 2, productCost: xx, attach: [] } }
 * 业务说明：
 *   - 根据 productNo 从 Product 表查找对应商品
 *   - 本系统是卡密类型（apiType=1同步，productType=2卡密）
 *   - 卡密商品的attach数组返回空数组（不需要额外参数）
 */
const 获取商品模板 = async (req, res) => {
  try {
    const { productNo } = req.body;

    if (!productNo) {
      return res.json({ code: 400, message: '商品编号不能为空' });
    }

    // 从 Product 表按 product_no 查询商品
    const 商品 = await Product.findOne({
      where: { product_no: productNo, status: 1 },
    });

    if (!商品) {
      // 写入SUP日志（不影响主流程）
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'getTemplate',
          product_no: productNo,
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 1100, message: '失败原因:商品不存在', data: null }),
          status_code: 1100,
          result: 'fail',
          error_msg: '商品不存在',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }
      return res.json({ code: 1100, message: '失败原因:商品不存在', data: null });
    }

    const 响应数据 = {
      code: 200,
      message: '接口调用成功',
      data: {
        apiType: 1,        // 1=同步发货
        productTitle: 商品.product_name,
        productType: 2,    // 2=卡密类型
        productCost: parseFloat(商品.cost_price) || 0,
        attach: [],        // 卡密商品不需要额外参数
      },
    };
    // 写入SUP日志（不影响主流程）
    try {
      const reqCopy = { ...req.body };
      delete reqCopy.sign;
      await SupLog.create({
        log_type: 'getTemplate',
        product_no: productNo,
        user_id: req.body.userId || null,
        request_data: JSON.stringify(reqCopy),
        response_data: JSON.stringify(响应数据),
        status_code: 200,
        result: 'success',
      });
    } catch (日志错误) {
      console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
    }
    res.json(响应数据);
  } catch (错误) {
    console.error('获取SUP商品模板出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
};

// =============================================
// 接口4：卡密下单（核心接口）
// POST /agisoAcprSupplierApi/order/cardOrder
// 请求参数：userId, orderNo, productNo, buyNum, attach, maxAmount, callbackUrl, timestamp, version, sign
// =============================================

/**
 * 卡密下单接口（核心接口）
 * 接口名称：卡密下单
 * 请求参数：userId, orderNo, productNo, buyNum, attach, maxAmount, callbackUrl, timestamp, version, sign
 * 响应格式：{ code: 200, message: '接口调用成功', data: { orderStatus: 20, cards: '加密后的Base64字符串' } }
 * 业务说明：
 *   - orderStatus说明：10=处理中，20=成功，30=失败
 *   - 同步发货模式（callbackUrl为空）：下单后直接返回加密卡密
 *   - 异步发货模式（callbackUrl非空）：先返回orderStatus:10，后台异步推送卡密到callbackUrl
 *   - 防重复下单：若 agiso_order_no 已存在则返回已有订单状态
 *   - 卡密AES加密：cardNo=卡密code，cardPwd为空，expireTime=过期时间
 */
const 卡密下单 = async (req, res) => {
  try {
    const { orderNo, productNo, buyNum = 1, maxAmount, callbackUrl = '' } = req.body;

    // 提取电商平台订单号（优先从 attach 解析，兜底从 orderNo 去掉 -数字 后缀）
    const ecommerceOrderNo = 提取电商单号(orderNo, req.body.attach);

    if (!orderNo) {
      return res.json({ code: 400, message: '订单号不能为空' });
    }
    if (!productNo) {
      return res.json({ code: 400, message: '商品编号不能为空' });
    }
    // 校验 callbackUrl：仅允许 http/https 协议，防止 SSRF
    if (callbackUrl) {
      try {
        const 回调URL对象 = new URL(callbackUrl);
        if (!['http:', 'https:'].includes(回调URL对象.protocol)) {
          return res.json({ code: 400, message: 'callbackUrl协议不合法' });
        }
      } catch {
        return res.json({ code: 400, message: 'callbackUrl格式不合法' });
      }
    }

    // 读取 AppSecret 配置（用于AES加密）及 site_url（用于构建完整卡密链接）
    const 配置 = await 读取配置(['agiso_app_secret', 'agiso_merchant_key', 'site_url']);
    const appSecret = 配置.agiso_app_secret || '';
    const merchantKey = 配置.agiso_merchant_key || '';
    const siteUrl = (配置.site_url || '').replace(/\/$/, ''); // 去掉末尾斜线

    // 解析商品编号：从 Product 表查询（先于防重检查，确保无效商品直接返回1100）
    const 商品 = await Product.findOne({
      where: { product_no: productNo, status: 1 },
    });
    if (!商品) {
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'createPurchase',
          order_no: orderNo,
          product_no: productNo,
          buy_num: parseInt(buyNum) || 1,
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 1100, message: '失败原因:商品不存在', data: null }),
          status_code: 1100,
          result: 'fail',
          error_msg: '商品不存在',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }
      return res.json({ code: 1100, message: '失败原因:商品不存在', data: null });
    }

    // 购买数量
    const 购买数量 = Math.max(1, parseInt(buyNum) || 1);

    // 计算订单成本（4位小数，number类型）
    const orderCost = Number(parseFloat((商品.cost_price || 0) * 购买数量).toFixed(4));

    // maxAmount 校验（值非空时才校验）
    if (maxAmount !== undefined && maxAmount !== '' && maxAmount !== null) {
      const 最大金额 = parseFloat(maxAmount);
      if (!isNaN(最大金额) && orderCost > 最大金额) {
        try {
          const reqCopy = { ...req.body };
          delete reqCopy.sign;
          await SupLog.create({
            log_type: 'createPurchase',
            order_no: orderNo,
            product_no: productNo,
            buy_num: 购买数量,
            user_id: req.body.userId || null,
            request_data: JSON.stringify(reqCopy),
            response_data: JSON.stringify({ code: 1220, message: '失败原因:超出订单金额限制', data: null }),
            status_code: 1220,
            order_cost: orderCost,
            result: 'fail',
            error_msg: `超出订单金额限制：orderCost=${orderCost} > maxAmount=${maxAmount}`,
          });
        } catch (日志错误) {
          console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
        }
        return res.json({ code: 1220, message: '失败原因:超出订单金额限制', data: null });
      }
    }

    // 防重复下单：商品存在后再查 agiso_order_no 是否已存在
    const 已有卡密 = await Card.findOne({
      where: { agiso_order_no: orderNo },
    });
    if (已有卡密) {
      // 重复请求，直接返回已有订单状态（加密卡密返回）
      const 卡密信息 = [
        {
          cardNo: 构建卡密链接(siteUrl, 已有卡密.business_type, 已有卡密.code),
          cardPwd: '',
          expireTime: 格式化过期时间(已有卡密.expired_at),
        },
      ];
      const 加密结果 = 加密卡密(卡密信息, appSecret);
      const 重复响应数据 = {
        orderNo: orderNo,
        outTradeNo: 已有卡密.id.toString(),
        orderStatus: 20,
        orderCost,
        cards: 加密结果,
      };
      // 写入SUP日志（不影响主流程）
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'createPurchase',
          order_no: orderNo,
          out_trade_no: 已有卡密.id.toString(),
          product_no: productNo,
          buy_num: parseInt(buyNum) || 1,
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 1250, message: '失败原因:订单号重复', data: 重复响应数据 }),
          status_code: 1250,
          order_status: 20,
          order_cost: orderCost,
          result: 'success',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }
      return res.json({
        code: 1250,
        message: '失败原因:订单号重复',
        data: 重复响应数据,
      });
    }

    // ===== buyNum > 1 时批量分配卡密（同步模式）=====
    if (购买数量 > 1) {
      const 目标卡密列表 = [];
      let 库存不足 = false;
      try {
        await 数据库连接.transaction(async (t) => {
          for (let i = 0; i < 购买数量; i++) {
            const 候选卡密 = await Card.findOne({
              where: { product_id: 商品.id, status: 0, agiso_order_no: null },
              lock: t.LOCK.UPDATE,
              transaction: t,
            });
            if (!候选卡密) {
              throw Object.assign(new Error('库存不足'), { isStockError: true });
            }
            await 候选卡密.update({
              agiso_order_no: i === 0 ? orderNo : `${orderNo}_${i}`,
              ecommerce_order_no: ecommerceOrderNo || null,
              sup_status: 1,
              sup_product_no: productNo,
              product_id: 商品.id,
            }, { transaction: t });
            目标卡密列表.push(候选卡密);
          }
        });
      } catch (err) {
        if (err.isStockError) {
          库存不足 = true;
        } else {
          throw err;
        }
      }

      if (库存不足 || 目标卡密列表.length === 0) {
        try {
          const reqCopy = { ...req.body };
          delete reqCopy.sign;
          await SupLog.create({
            log_type: 'createPurchase',
            order_no: orderNo,
            product_no: productNo,
            buy_num: 购买数量,
            user_id: req.body.userId || null,
            request_data: JSON.stringify(reqCopy),
            response_data: JSON.stringify({ code: 1230, message: '失败原因:库存不足', data: null }),
            status_code: 1230,
            order_cost: orderCost,
            result: 'fail',
            error_msg: `库存不足（批量${购买数量}件）`,
          });
        } catch (日志错误) {
          console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
        }
        return res.json({ code: 1230, message: '失败原因:库存不足', data: null });
      }

      const 卡密信息批量 = 目标卡密列表.map(c => ({
        cardNo: 构建卡密链接(siteUrl, c.business_type, c.code),
        cardPwd: '',
        expireTime: 格式化过期时间(c.expired_at),
      }));
      const 加密结果批量 = 加密卡密(卡密信息批量, appSecret);
      const 批量响应数据 = {
        orderNo: orderNo,
        outTradeNo: 目标卡密列表[0].id.toString(),
        orderStatus: 20,
        orderCost,
        cards: 加密结果批量,
      };

      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'createPurchase',
          order_no: orderNo,
          ecommerce_order_no: ecommerceOrderNo || null,
          out_trade_no: 目标卡密列表[0].id.toString(),
          card_code: 目标卡密列表[0].code,
          product_no: productNo,
          buy_num: 购买数量,
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: 批量响应数据 }),
          status_code: 200,
          order_status: 20,
          order_cost: orderCost,
          result: 'success',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }

      return res.json({
        code: 200,
        message: '接口调用成功',
        data: 批量响应数据,
      });
    }

    // ===== buyNum = 1 单卡分配（含三级级联匹配，保留原有逻辑）=====
    // 使用事务+原子更新防止并发竞争：
    // 直接用 UPDATE SET agiso_order_no=orderNo WHERE agiso_order_no IS NULL AND status=0
    // 只有一个请求能成功更新，其他请求得到 affectedRows=0
    let 目标卡密 = null;
    await 数据库连接.transaction(async (t) => {
      // 第一级：精确匹配 product_id（正常情况）
      let 候选卡密 = await Card.findOne({
        where: {
          product_id: 商品.id,
          status: 0,
          agiso_order_no: null,
        },
        lock: t.LOCK.UPDATE, // SELECT FOR UPDATE 行锁，防止并发
        transaction: t,
      });

      // 第二级：business_type + service_type + service_hours 匹配（旧接口生成的卡密 product_id 为 null）
      if (!候选卡密) {
        const 条件2 = { status: 0, agiso_order_no: null, business_type: 商品.business_type, product_id: null };
        if (商品.service_type) 条件2.service_type = 商品.service_type;
        if (商品.service_hours > 0) 条件2.service_hours = 商品.service_hours;
        候选卡密 = await Card.findOne({ where: 条件2, lock: t.LOCK.UPDATE, transaction: t });
      }

      // 第三级：只按 business_type 匹配（最宽松兜底，product_id 为 null 的旧卡密）
      if (!候选卡密 && 商品.business_type) {
        候选卡密 = await Card.findOne({
          where: { status: 0, agiso_order_no: null, business_type: 商品.business_type, product_id: null },
          lock: t.LOCK.UPDATE, transaction: t,
        });
      }

      if (!候选卡密) return; // 库存不足

      // 在事务内更新（原子操作），同时修正 product_id 关联
      await 候选卡密.update({
        agiso_order_no: orderNo,
        ecommerce_order_no: ecommerceOrderNo,
        sup_status: callbackUrl ? 0 : 1,  // 异步：0=未发货（等待回调），同步：1=已发货
        sup_product_no: productNo,
        product_id: 商品.id,  // 修正关联（兜底匹配时补齐 product_id）
      }, { transaction: t });

      目标卡密 = 候选卡密;
    });

    if (!目标卡密) {
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'createPurchase',
          order_no: orderNo,
          product_no: productNo,
          buy_num: 1,
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 1230, message: '失败原因:库存不足', data: null }),
          status_code: 1230,
          order_cost: orderCost,
          result: 'fail',
          error_msg: '库存不足',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }
      return res.json({
        code: 1230,
        message: '失败原因:库存不足',
        data: null,
      });
    }

    // ===== 异步发货模式（callbackUrl非空）=====
    if (callbackUrl) {
      const 异步响应数据 = {
        orderNo: orderNo,
        outTradeNo: 目标卡密.id.toString(),
        orderStatus: 10, // 处理中
        orderCost,
        cards: '',
      };

      // 写入SUP日志（不影响主流程）
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'createPurchase',
          order_no: orderNo,
          ecommerce_order_no: ecommerceOrderNo,
          out_trade_no: 目标卡密.id.toString(),
          card_code: 目标卡密.code,
          product_no: productNo,
          buy_num: parseInt(buyNum) || 1,
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: 异步响应数据 }),
          status_code: 200,
          order_status: 10,
          order_cost: orderCost,
          result: 'pending',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }

      // 先返回处理中状态
      res.json({
        code: 200,
        message: '接口调用成功',
        data: 异步响应数据,
      });

      // 后台异步发送回调
      setImmediate(async () => {
        try {
          await 发送异步回调(callbackUrl, orderNo, 目标卡密.id.toString(), 目标卡密, 商品, buyNum, appSecret, merchantKey, siteUrl);
        } catch (未捕获错误) {
          console.error(`SUP异步回调未捕获异常: orderNo=${orderNo}`, 未捕获错误.message);
        }
      });

      return;
    }

    // ===== 同步发货模式（callbackUrl为空）=====
    // AES加密卡密信息
    const 卡密信息 = [
      {
        cardNo: 构建卡密链接(siteUrl, 目标卡密.business_type, 目标卡密.code),
        cardPwd: '',
        expireTime: 格式化过期时间(目标卡密.expired_at),
      },
    ];
    const 加密结果 = 加密卡密(卡密信息, appSecret);

    const 同步响应数据 = {
      orderNo: orderNo,
      outTradeNo: 目标卡密.id.toString(),
      orderStatus: 20,
      orderCost,
      cards: 加密结果,
    };

    // 写入SUP日志（不影响主流程）
    try {
      const reqCopy = { ...req.body };
      delete reqCopy.sign;
      await SupLog.create({
        log_type: 'createPurchase',
        order_no: orderNo,
        ecommerce_order_no: ecommerceOrderNo,
        out_trade_no: 目标卡密.id.toString(),
        card_code: 目标卡密.code,
        product_no: productNo,
        buy_num: parseInt(buyNum) || 1,
        user_id: req.body.userId || null,
        request_data: JSON.stringify(reqCopy),
        response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: 同步响应数据 }),
        status_code: 200,
        order_status: 20,
        order_cost: orderCost,
        result: 'success',
      });
    } catch (日志错误) {
      console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
    }

    res.json({
      code: 200,
      message: '接口调用成功',
      data: 同步响应数据,
    });
  } catch (错误) {
    console.error('SUP卡密下单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
};

/**
 * 异步回调函数：发货完成后向callbackUrl推送卡密结果
 * @param {string} callbackUrl - 阿奇所提供的回调地址
 * @param {string} orderNo - 阿奇所订单号
 * @param {string} outTradeNo - 我方卡密ID字符串
 * @param {Object} 卡密 - Card模型实例
 * @param {Object} 商品 - Product模型实例
 * @param {number|string} buyNum - 购买数量
 * @param {string} appSecret - 阿奇所appSecret（用于AES加密和签名）
 * @param {string} merchantKey - 商户密钥（用于签名）
 * @param {string} siteUrl - 站点域名（构建卡密完整链接，末尾不含斜线）
 */
const 发送异步回调 = async (callbackUrl, orderNo, outTradeNo, 卡密, 商品, buyNum, appSecret, merchantKey, siteUrl = '') => {
  try {
    const 卡密信息 = [{
      cardNo: 构建卡密链接(siteUrl, 卡密.business_type, 卡密.code),
      cardPwd: '',
      expireTime: 格式化过期时间(卡密.expired_at),
    }];
    const 加密结果 = 加密卡密(卡密信息, appSecret);
    const orderCost = Number(parseFloat((商品.cost_price || 0) * (parseInt(buyNum) || 1)).toFixed(4));

    const 回调数据 = {
      orderNo,
      outTradeNo,
      orderStatus: 20,
      orderCost,
      cards: 加密结果,
      timestamp: Math.floor(Date.now() / 1000),
    };

    // 计算签名（按阿奇所规则：appSecret + 排序后的key=value&... + appSecret，MD5大写）
    const crypto = require('crypto');
    const 参数键列表 = Object.keys(回调数据).sort();
    const 查询字符串 = 参数键列表.map(key => `${key}=${回调数据[key] ?? ''}`).join('&');
    const 密钥串 = appSecret + (merchantKey || '');
    const sign = crypto.createHash('md5').update(密钥串 + 查询字符串 + 密钥串, 'utf8').digest('hex').toUpperCase();

    const axios = require('axios');
    await axios.post(callbackUrl, { ...回调数据, sign }, {
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      timeout: 10000,
    });

    // 回调成功后更新卡密发货状态（仅更新sup_status，status由客户提交订单时更新）
    await 卡密.update({ sup_status: 1 });

    // 写入回调成功日志
    try {
      await SupLog.create({
        log_type: 'callback',
        order_no: orderNo,
        ecommerce_order_no: 卡密.ecommerce_order_no || null,
        out_trade_no: outTradeNo,
        card_code: 卡密.code,
        order_status: 20,
        order_cost: orderCost,
        result: 'success',
        response_data: JSON.stringify(回调数据),
      });
    } catch (日志错误) {
      console.error('SUP回调日志写入失败:', 日志错误.message);
    }

    console.log(`SUP异步回调成功: orderNo=${orderNo}`);
  } catch (回调错误) {
    console.error(`SUP异步回调失败: orderNo=${orderNo}`, 回调错误.message);
    // 写入回调失败日志
    try {
      await SupLog.create({
        log_type: 'callback',
        order_no: orderNo,
        out_trade_no: outTradeNo,
        result: 'fail',
        error_msg: 回调错误.message,
      });
    } catch (日志错误) {
      console.error('SUP回调失败日志写入失败:', 日志错误.message);
    }
  }
};

// =============================================
// 接口5：订单查询
// POST /agisoAcprSupplierApi/order/queryOrder
// 请求参数：userId, orderNo, timestamp, version, sign
// =============================================

/**
 * 订单查询接口
 * 接口名称：订单查询
 * 请求参数：userId, orderNo, timestamp, version, sign
 * 响应格式：{ code: 200, message: '接口调用成功', data: { orderStatus: xx, cards: '...' } }
 * 业务说明：根据 agiso_order_no 查找Card表，返回当前订单状态和加密卡密
 */
const 查询订单 = async (req, res) => {
  try {
    const { orderNo } = req.body;

    if (!orderNo) {
      return res.json({ code: 400, message: '订单号不能为空' });
    }

    // 读取 AppSecret 配置及 site_url
    const 配置 = await 读取配置(['agiso_app_secret', 'site_url']);
    const appSecret = 配置.agiso_app_secret || '';
    const siteUrl = (配置.site_url || '').replace(/\/$/, '');

    // 根据奇所订单号查找卡密记录
    const 卡密记录 = await Card.findOne({
      where: { agiso_order_no: orderNo },
    });

    if (!卡密记录) {
      return res.json({ code: 404, message: '订单不存在' });
    }

    // 根据 sup_status 映射订单状态
    // sup_status: 0=未发货, 1=已发货, 2=已撤单
    let orderStatus;
    let failCode = 0;
    let failReason = null;
    if (卡密记录.sup_status === 1) {
      orderStatus = 20; // 成功
    } else if (卡密记录.sup_status === 2) {
      orderStatus = 30; // 已撤单/失败
      failCode = 30;
      failReason = '订单已撤单';
    } else {
      orderStatus = 10; // 处理中
    }

    // 查询关联商品获取成本价（查单接口为单件查询，buyNum固定为1）
    let orderCost = 0;
    if (卡密记录.product_id) {
      const 关联商品 = await Product.findByPk(卡密记录.product_id);
      if (关联商品) {
        orderCost = Number(parseFloat(关联商品.cost_price || 0).toFixed(4));
      }
    }

    // 格式化过期时间并加密卡密
    const 卡密信息 = [
      {
        cardNo: 构建卡密链接(siteUrl, 卡密记录.business_type, 卡密记录.code),
        cardPwd: '',
        expireTime: 格式化过期时间(卡密记录.expired_at),
      },
    ];
    const 加密结果 = 加密卡密(卡密信息, appSecret);

    const 查询响应数据 = {
      orderNo: orderNo,
      outTradeNo: 卡密记录.id.toString(),
      orderStatus,
      failCode,
      failReason,
      orderCost,
      cards: 加密结果,
    };

    // 写入SUP日志（不影响主流程）
    try {
      const reqCopy = { ...req.body };
      delete reqCopy.sign;
      await SupLog.create({
        log_type: 'queryOrder',
        order_no: orderNo,
        ecommerce_order_no: 卡密记录.ecommerce_order_no || null,
        card_code: 卡密记录.code,
        out_trade_no: 卡密记录.id.toString(),
        user_id: req.body.userId || null,
        request_data: JSON.stringify(reqCopy),
        response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: 查询响应数据 }),
        status_code: 200,
        order_status: orderStatus,
        order_cost: orderCost,
        result: orderStatus === 20 ? 'success' : orderStatus === 10 ? 'pending' : 'fail',
      });
    } catch (日志错误) {
      console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
    }

    res.json({
      code: 200,
      message: null,
      data: 查询响应数据,
    });
  } catch (错误) {
    console.error('SUP订单查询出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
};

// =============================================
// 接口6：撤单（退款核心接口）
// POST /agisoAcprSupplierApi/order/cancelOrder
// 请求参数：userId, orderNo, timestamp, version, sign
// =============================================

/**
 * 撤单接口（退款核心接口）
 * 接口名称：撤单
 * 请求参数：userId, orderNo, timestamp, version, sign
 * 响应格式：{ code: 200, message: '接口调用成功', data: { cancelStatus: 20 } }
 * 业务说明：
 *   - cancelStatus说明：20=撤单成功，30=撤单失败
 *   - 按业务类型分别处理：家政/洗衣/充值
 *   - 撤单成功后卡密 status 改为 2（已失效），防止重复使用
 */
const 撤销订单 = async (req, res) => {
  try {
    const { orderNo } = req.body;

    if (!orderNo) {
      return res.json({ code: 400, message: '订单号不能为空' });
    }

    // 读取撤单拒绝凭证配置
    const 撤单配置 = await 读取配置(['agiso_refuse_proof']);
    const 拒绝凭证URL = 撤单配置.agiso_refuse_proof || '';

    // 先按 agiso_order_no 查找卡密记录
    let 卡密记录 = await Card.findOne({
      where: { agiso_order_no: orderNo },
    });

    // 找不到时，再按 outTradeNo（cards.id）查找
    if (!卡密记录 && req.body.outTradeNo) {
      卡密记录 = await Card.findOne({
        where: { id: req.body.outTradeNo },
      });
    }

    if (!卡密记录) {
      // 根据阿奇所文档：找不到订单时返回 code:200, cancelStatus:30
      const 未找到响应 = { orderNo: orderNo, cancelStatus: 30, refuseReason: '订单不存在', refuseProof: 拒绝凭证URL };
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'cancelOrder',
          order_no: orderNo,
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: 未找到响应 }),
          status_code: 200,
          cancel_status: 30,
          result: 'fail',
          error_msg: '订单不存在',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }
      return res.json({ code: 200, message: '接口调用成功', data: 未找到响应 });
    }

    // 幂等处理：如果已经是已撤单状态，直接返回成功
    if (卡密记录.sup_status === 2) {
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'cancelOrder',
          order_no: orderNo,
          out_trade_no: 卡密记录.id.toString(),
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 20 } }),
          status_code: 200,
          cancel_status: 20,
          result: 'success',
          error_msg: '幂等：订单已撤单',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: { orderNo: orderNo, cancelStatus: 20 },
      });
    }

    // ===== 核心规则：卡密 status=0（未使用）→ 直接作废 + 取消关联订单 =====
    if (卡密记录.status === 0) {
      // 卡密未使用，无论什么业务直接作废并撤单
      const 关联订单 = await Order.findOne({
        where: { card_code: 卡密记录.code, status: { [Op.ne]: 4 } },
      });
      if (关联订单) {
        const 日志 = 安全解析JSON(关联订单.order_log, []);
        日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '阿奇所平台撤单（卡密未使用），订单自动取消',
          状态: 'cancel',
        });
        await 关联订单.update({ status: 4, order_log: JSON.stringify(日志) });
      }
      await 卡密记录.update({ status: 2, sup_status: 2, invalidated_at: new Date() });
      // 写入日志：卡密未使用，直接撤单成功
      try {
        const reqCopy = { ...req.body };
        delete reqCopy.sign;
        await SupLog.create({
          log_type: 'cancelOrder',
          order_no: orderNo,
          out_trade_no: 卡密记录.id.toString(),
          user_id: req.body.userId || null,
          request_data: JSON.stringify(reqCopy),
          response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 20 } }),
          status_code: 200,
          cancel_status: 20,
          result: 'success',
          error_msg: '卡密未使用，直接作废撤单',
        });
      } catch (日志错误) {
        console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
      }
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: { orderNo: orderNo, cancelStatus: 20 },
      });
    }

    const 业务类型 = 卡密记录.business_type || 'jiazheng';

    if (业务类型 === 'jiazheng') {
      // ===== 家政业务 =====
      // 查找关联且未取消的订单
      const 关联订单 = await Order.findOne({
        where: {
          card_code: 卡密记录.code,
          status: { [Op.ne]: 4 },
        },
      });

      if (关联订单) {
        // 服务中（status=2，已成功对接京东预约）：不允许撤单，返回凭证并标记为拒绝退款
        if (关联订单.status === 2) {
          const 拒绝原因 = '家政服务已预约进行中，无法撤单';
          const 拒绝日志 = 安全解析JSON(关联订单.order_log, []);
          拒绝日志.push({
            时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            操作: `阿奇所平台撤单被拒绝：${拒绝原因}，已返回拒绝凭证`,
            状态: 'error',
          });
          await 关联订单.update({ status: 6, order_log: JSON.stringify(拒绝日志) });
          try {
            const reqCopy = { ...req.body };
            delete reqCopy.sign;
            await SupLog.create({
              log_type: 'cancelOrder',
              order_no: orderNo,
              out_trade_no: 卡密记录.id.toString(),
              user_id: req.body.userId || null,
              request_data: JSON.stringify(reqCopy),
              response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 30, refuseReason: 拒绝原因, refuseProof: 拒绝凭证URL } }),
              status_code: 200,
              cancel_status: 30,
              result: 'fail',
              error_msg: 拒绝原因,
            });
          } catch (日志错误) {
            console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
          }
          return res.json({
            code: 200,
            message: '接口调用成功',
            data: {
              orderNo: orderNo,
              cancelStatus: 30,
              refuseReason: 拒绝原因,
              refuseProof: 拒绝凭证URL,
            },
          });
        }
        // 其他状态（待处理/处理中/失败等）：允许撤单，取消订单
        const 现有日志 = 安全解析JSON(关联订单.order_log, []);
        现有日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '阿奇所平台撤单，订单自动取消',
          状态: 'cancel',
        });
        await 关联订单.update({ status: 4, order_log: JSON.stringify(现有日志) });
      }

      // 将卡密状态设为已失效，sup_status 设为已撤单
      await 卡密记录.update({ status: 2, sup_status: 2, invalidated_at: new Date() });

    } else if (业务类型 === 'xiyifu') {
      // ===== 洗衣业务 =====
      const 关联订单 = await Order.findOne({
        where: { card_code: 卡密记录.code },
      });

      if (关联订单) {
        // 已推送到鲸蚁（status=1已提交 或 status=2已分配）：先尝试通知鲸蚁取消
        if (关联订单.status === 1 || 关联订单.status === 2) {
          try {
            const { 同步订单状态 } = require('../services/laundryApiService');
            // 修复：out_booking_no 必须和下单时一致，用 B+order_no
            const out_booking_no = `B${关联订单.order_no}`;
            await 同步订单状态(关联订单.order_no, out_booking_no, -1);
            // 鲸蚁取消成功，继续往下执行取消本地订单
            console.log(`洗衣撤单通知鲸蚁成功，订单号：${关联订单.order_no}`);
          } catch (鲸蚁错误) {
            // 判断是否是"订单不存在"（code:10000），视为鲸蚁侧已取消，允许继续本地取消
            const 是订单不存在 = 鲸蚁错误.message && (
              鲸蚁错误.message.includes('"code":10000') ||
              鲸蚁错误.message.includes('10000') ||
              鲸蚁错误.message.includes('订单不存在')
            );

            if (!是订单不存在) {
              // 真正的取消失败（非订单不存在），仅在 status=2 时拒绝撤单（已分配，风险高）
              // status=1 时（未分配），即使鲸蚁失败也允许继续本地取消
              if (关联订单.status === 2) {
                const 拒绝原因 = `洗衣服务处理中（${关联订单.laundry_status || '已分配'}），鲸蚁取消失败：${鲸蚁错误.message}`;
                const 拒绝日志 = 安全解析JSON(关联订单.order_log, []);
                拒绝日志.push({
                  时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
                  操作: `阿奇所平台撤单被拒绝：${拒绝原因}，已返回拒绝凭证`,
                  状态: 'error',
                });
                await 关联订单.update({ order_log: JSON.stringify(拒绝日志) });
                try {
                  const reqCopy = { ...req.body };
                  delete reqCopy.sign;
                  await SupLog.create({
                    log_type: 'cancelOrder',
                    order_no: orderNo,
                    out_trade_no: 卡密记录.id.toString(),
                    user_id: req.body.userId || null,
                    request_data: JSON.stringify(reqCopy),
                    response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 30, refuseReason: 拒绝原因, refuseProof: 拒绝凭证URL } }),
                    status_code: 200,
                    cancel_status: 30,
                    result: 'fail',
                    error_msg: 拒绝原因,
                  });
                } catch (日志错误) {
                  console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
                }
                return res.json({
                  code: 200,
                  message: '接口调用成功',
                  data: {
                    orderNo: orderNo,
                    cancelStatus: 30,
                    refuseReason: 拒绝原因,
                    refuseProof: 拒绝凭证URL,
                  },
                });
              }
            }
            // 订单不存在（鲸蚁侧已取消）或 status=1 时鲸蚁失败，记录警告但继续本地取消
            console.warn(`洗衣撤单鲸蚁通知失败（继续本地取消），订单号：${关联订单.order_no}，错误：${鲸蚁错误.message}`);
          }
        }

        // 取消本地订单
        const 现有日志 = 安全解析JSON(关联订单.order_log, []);
        现有日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '阿奇所平台撤单，订单自动取消',
          状态: 'cancel',
        });
        await 关联订单.update({ status: 4, laundry_status: '已取消', order_log: JSON.stringify(现有日志) });
      }

      // 将卡密状态设为已失效，sup_status 设为已撤单
      await 卡密记录.update({ status: 2, sup_status: 2, invalidated_at: new Date() });

    } else if (业务类型 === 'topup') {
      // ===== 充值业务 =====
      const 关联订单 = await Order.findOne({
        where: { card_code: 卡密记录.code },
      });

      // 已完成充值（status=2）：拒绝撤单
      if (关联订单 && 关联订单.status === 2) {
        const 拒绝原因 = '充值已完成，无法撤单';
        try {
          const reqCopy = { ...req.body };
          delete reqCopy.sign;
          await SupLog.create({
            log_type: 'cancelOrder',
            order_no: orderNo,
            out_trade_no: 卡密记录.id.toString(),
            user_id: req.body.userId || null,
            request_data: JSON.stringify(reqCopy),
            response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 30, refuseReason: 拒绝原因, refuseProof: 拒绝凭证URL } }),
            status_code: 200,
            cancel_status: 30,
            result: 'fail',
            error_msg: 拒绝原因,
          });
        } catch (日志错误) {
          console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
        }
        return res.json({
          code: 200,
          message: '接口调用成功',
          data: {
            orderNo: orderNo,
            cancelStatus: 30,
            refuseReason: 拒绝原因,
            refuseProof: 拒绝凭证URL,
          },
        });
      }

      if (关联订单 && 关联订单.status !== 4) {
        const 现有日志 = 安全解析JSON(关联订单.order_log, []);
        现有日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '阿奇所平台撤单，订单自动取消，卡密已失效',
          状态: 'cancel',
        });
        await 关联订单.update({ status: 4, order_log: JSON.stringify(现有日志) });
      }

      // 将卡密状态设为已失效，sup_status 设为已撤单
      await 卡密记录.update({ status: 2, sup_status: 2, invalidated_at: new Date() });

    } else if (业务类型 === 'sjz') {
      // ===== 三角洲业务 =====
      // 三角洲服务：服务中（status=4）或已完成（status=5）不允许撤单，其余允许
      const 关联订单sjz = await Order.findOne({
        where: { card_code: 卡密记录.code },
      });

      if (关联订单sjz && (关联订单sjz.status === 4 || 关联订单sjz.status === 5)) {
        const 拒绝原因 = '三角洲服务已处理中或完成，无法撤单';
        try {
          const reqCopy = { ...req.body };
          delete reqCopy.sign;
          await SupLog.create({
            log_type: 'cancelOrder',
            order_no: orderNo,
            out_trade_no: 卡密记录.id.toString(),
            user_id: req.body.userId || null,
            request_data: JSON.stringify(reqCopy),
            response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 30, refuseReason: 拒绝原因, refuseProof: 拒绝凭证URL } }),
            status_code: 200,
            cancel_status: 30,
            result: 'fail',
            error_msg: 拒绝原因,
          });
        } catch (日志错误) {
          console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
        }
        return res.json({
          code: 200,
          message: '接口调用成功',
          data: { orderNo: orderNo, cancelStatus: 30, refuseReason: 拒绝原因, refuseProof: 拒绝凭证URL },
        });
      }

      if (关联订单sjz && 关联订单sjz.status !== 6) {
        const 现有日志 = 安全解析JSON(关联订单sjz.order_log, []);
        现有日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '阿奇所平台撤单，三角洲订单自动取消',
          状态: 'cancel',
        });
        await 关联订单sjz.update({ status: 6, order_log: JSON.stringify(现有日志) });

        // 撤单成功后：异步更新企业微信客户备注 + 群名称
        const 关联订单快照 = 关联订单sjz.toJSON ? 关联订单sjz.toJSON() : { ...关联订单sjz };
        setImmediate(async () => {
          try {
            const { Setting } = require('../models');
            const qywxSvc = require('../services/qywxService');
            const 设置列表 = await Setting.findAll();
            const 设置对象 = {};
            设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });
            if (设置对象.qywx_enabled !== '1') return;

            const 额外参数 = { status_text: '已撤单/退款', refund_reason: '阿奇所平台撤单' };

            const 退款备注模板 = 设置对象.qywx_refund_remark_template || '';
            if (退款备注模板 && 关联订单快照.qywx_assigned_user && 关联订单快照.qywx_external_userid) {
              const 备注内容 = qywxSvc.安全截断(qywxSvc.渲染模板(退款备注模板, 关联订单快照, 额外参数));
              if (备注内容) {
                await qywxSvc.自动备注客户(关联订单快照.qywx_assigned_user, 关联订单快照.qywx_external_userid, 备注内容).catch(e => {
                  console.warn('[三角洲-SUP撤单] 更新客户备注失败:', e.message);
                });
              }
            }

            const 退款群名称模板 = 设置对象.qywx_refund_group_name_template || '';
            if (退款群名称模板 && 关联订单快照.qywx_group_chat_id) {
              const 新群名称 = qywxSvc.渲染模板(退款群名称模板, 关联订单快照, 额外参数);
              if (新群名称) {
                await qywxSvc.更新客户群名称(关联订单快照.qywx_group_chat_id, 新群名称).catch(e => {
                  console.warn('[三角洲-SUP撤单] 更新群名称失败:', e.message);
                });
              }
            }

            // 撤单后往群里发通知消息
            const 退款群消息模板 = 设置对象.qywx_refund_group_msg || '';
            if (退款群消息模板 && 关联订单快照.qywx_group_chat_id) {
              const 通知内容 = qywxSvc.渲染模板(退款群消息模板, 关联订单快照, 额外参数);
              if (通知内容) {
                await qywxSvc.发送群消息(关联订单快照.qywx_group_chat_id, 通知内容).catch(e => {
                  console.warn('[三角洲-SUP撤单] 发送群通知失败:', e.message);
                });
              }
            }
          } catch (企微错误) {
            console.error('[三角洲-SUP撤单] 企业微信更新出错（不影响撤单结果）:', 企微错误.message);
          }
        });
      }

      await 卡密记录.update({ status: 2, sup_status: 2, invalidated_at: new Date() });

    } else {
      // 未知业务类型：按原逻辑处理（查关联订单，未使用则撤单）
      const 关联订单 = await Order.findOne({
        where: {
          card_code: 卡密记录.code,
          status: { [Op.ne]: 4 },
        },
      });

      if (关联订单) {
        const 拒绝原因 = '卡密已用于服务预约，无法退款';
        try {
          const reqCopy = { ...req.body };
          delete reqCopy.sign;
          await SupLog.create({
            log_type: 'cancelOrder',
            order_no: orderNo,
            out_trade_no: 卡密记录.id.toString(),
            user_id: req.body.userId || null,
            request_data: JSON.stringify(reqCopy),
            response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 30, refuseReason: 拒绝原因, refuseProof: 拒绝凭证URL } }),
            status_code: 200,
            cancel_status: 30,
            result: 'fail',
            error_msg: 拒绝原因,
          });
        } catch (日志错误) {
          console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
        }
        return res.json({
          code: 200,
          message: '接口调用成功',
          data: {
            orderNo: orderNo,
            cancelStatus: 30,
            refuseReason: 拒绝原因,
            refuseProof: 拒绝凭证URL,
          },
        });
      }

      await 卡密记录.update({ status: 2, sup_status: 2, invalidated_at: new Date() });
    }

    res.json({
      code: 200,
      message: '接口调用成功',
      data: { orderNo: orderNo, cancelStatus: 20 },
    });

    // 写入SUP日志（不影响主流程）
    try {
      const reqCopy = { ...req.body };
      delete reqCopy.sign;
      await SupLog.create({
        log_type: 'cancelOrder',
        order_no: orderNo,
        ecommerce_order_no: 卡密记录.ecommerce_order_no || null,
        out_trade_no: 卡密记录.id.toString(),
        card_code: 卡密记录.code,
        user_id: req.body.userId || null,
        request_data: JSON.stringify(reqCopy),
        response_data: JSON.stringify({ code: 200, message: '接口调用成功', data: { orderNo: orderNo, cancelStatus: 20 } }),
        status_code: 200,
        cancel_status: 20,
        result: 'success',
      });
    } catch (日志错误) {
      console.error('SUP日志写入失败（不影响主流程）:', 日志错误.message);
    }
  } catch (错误) {
    console.error('SUP撤单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
};

module.exports = {
  获取应用ID,
  获取商品列表,
  获取商品模板,
  卡密下单,
  查询订单,
  撤销订单,
};
