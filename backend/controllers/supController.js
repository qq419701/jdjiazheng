// 奇所SUP系统控制器
// 实现标准SUP接口：供阿奇索开放平台调用，作为货源方（供应商）
// 接口说明：
//   - 本系统的商品全部是卡密类型（productType=2），不做直充
//   - 同步发货模式：下单后直接返回卡密，不需要异步回调
//   - 商品编号来自 Product 表的 product_no 字段

const { Op } = require('sequelize');
const { Card, Order, Setting, Product } = require('../models');
const 数据库连接 = require('../config/database');
const { 加密卡密 } = require('../services/agisoService');
const { 安全解析JSON } = require('../utils/helpers');

// 洗衣价格单位换算常量（Setting表中以分存储，转换为元返回）
const 分转元 = 100;

/**
 * 格式化过期时间为字符串
 * @param {Date|null} 时间 - 过期时间
 * @returns {string} 格式化后的时间字符串，如 '2024-12-31 23:59:59'
 */
const 格式化过期时间 = (时间) => {
  if (!时间) return '';
  return new Date(时间).toISOString().replace('T', ' ').slice(0, 19);
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
    res.json({
      code: 200,
      message: '接口调用成功',
      data: { appId },
    });
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
      return res.json({ code: 1100, message: '失败原因:商品不存在', data: null });
    }

    res.json({
      code: 200,
      message: '接口调用成功',
      data: {
        apiType: 1,        // 1=同步发货
        productTitle: 商品.product_name,
        productType: 2,    // 2=卡密类型
        productCost: parseFloat(商品.cost_price) || 0,
        attach: [],        // 卡密商品不需要额外参数
      },
    });
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
 *   - 同步发货模式：下单后直接返回加密卡密
 *   - 防重复下单：若 agiso_order_no 已存在则返回已有订单状态
 *   - 卡密AES加密：cardNo=卡密code，cardPwd为空，expireTime=过期时间
 */
const 卡密下单 = async (req, res) => {
  try {
    const { orderNo, productNo, buyNum = 1 } = req.body;

    if (!orderNo) {
      return res.json({ code: 400, message: '订单号不能为空' });
    }
    if (!productNo) {
      return res.json({ code: 400, message: '商品编号不能为空' });
    }

    // 读取 AppSecret 配置（用于AES加密）
    const 配置 = await 读取配置(['agiso_app_secret']);
    const appSecret = 配置.agiso_app_secret || '';

    // 防重复下单：先查 agiso_order_no 是否已存在
    const 已有卡密 = await Card.findOne({
      where: { agiso_order_no: orderNo },
    });
    if (已有卡密) {
      // 重复请求，直接返回已有订单状态（加密卡密返回）
      const 卡密信息 = [
        {
          cardNo: 已有卡密.code,
          cardPwd: '',
          expireTime: 格式化过期时间(已有卡密.expired_at),
        },
      ];
      const 加密结果 = 加密卡密(卡密信息, appSecret);
      // 查询关联商品以获取成本价
      let orderCost = 0;
      if (已有卡密.product_id) {
        const 关联商品 = await Product.findByPk(已有卡密.product_id);
        if (关联商品) orderCost = parseFloat(关联商品.cost_price) || 0;
      }
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: {
          orderNo: orderNo,
          outTradeNo: 已有卡密.id.toString(),
          orderStatus: 20,
          orderCost,
          cards: 加密结果,
        },
      });
    }

    // 解析商品编号：从 Product 表查询
    const 商品 = await Product.findOne({
      where: { product_no: productNo, status: 1 },
    });
    if (!商品) {
      return res.json({ code: 1100, message: '失败原因:商品不存在', data: null });
    }
    // 使用事务+原子更新防止并发竞争：
    // 直接用 UPDATE SET agiso_order_no=orderNo WHERE agiso_order_no IS NULL AND status=0
    // 只有一个请求能成功更新，其他请求得到 affectedRows=0
    let 目标卡密 = null;
    await 数据库连接.transaction(async (t) => {
      // 先在事务内查找可用卡密（加行锁），直接用商品ID关联精准匹配
      const 候选卡密 = await Card.findOne({
        where: {
          product_id: 商品.id,
          status: 0,
          agiso_order_no: null,
        },
        lock: t.LOCK.UPDATE, // SELECT FOR UPDATE 行锁，防止并发
        transaction: t,
      });

      if (!候选卡密) return; // 库存不足

      // 在事务内更新（原子操作）
      await 候选卡密.update({
        status: 1,
        agiso_order_no: orderNo,
        sup_status: 1,  // 1=已发货
        sup_product_no: productNo,
        product_id: 商品.id,
      }, { transaction: t });

      目标卡密 = 候选卡密;
    });

    if (!目标卡密) {
      return res.json({
        code: 1230,
        message: '失败原因:库存不足',
        data: null,
      });
    }

    // AES加密卡密信息
    const 卡密信息 = [
      {
        cardNo: 目标卡密.code,
        cardPwd: '',
        expireTime: 格式化过期时间(目标卡密.expired_at),
      },
    ];
    const 加密结果 = 加密卡密(卡密信息, appSecret);

    res.json({
      code: 200,
      message: '接口调用成功',
      data: {
        orderNo: orderNo,
        outTradeNo: 目标卡密.id.toString(),
        orderStatus: 20, // 20=成功
        orderCost: parseFloat(商品.cost_price) || 0,
        cards: 加密结果,
      },
    });
  } catch (错误) {
    console.error('SUP卡密下单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
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

    // 读取 AppSecret 配置
    const 配置 = await 读取配置(['agiso_app_secret']);
    const appSecret = 配置.agiso_app_secret || '';

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
    let failReason = '';
    if (卡密记录.sup_status === 1) {
      orderStatus = 20; // 成功
    } else if (卡密记录.sup_status === 2) {
      orderStatus = 30; // 已撤单/失败
      failCode = 30;
      failReason = '订单已撤单';
    } else {
      orderStatus = 10; // 处理中
    }

    // 查询关联商品获取成本价
    let orderCost = 0;
    if (卡密记录.product_id) {
      const 关联商品 = await Product.findByPk(卡密记录.product_id);
      if (关联商品) orderCost = parseFloat(关联商品.cost_price) || 0;
    }

    // 格式化过期时间并加密卡密
    const 卡密信息 = [
      {
        cardNo: 卡密记录.code,
        cardPwd: '',
        expireTime: 格式化过期时间(卡密记录.expired_at),
      },
    ];
    const 加密结果 = 加密卡密(卡密信息, appSecret);

    res.json({
      code: 200,
      message: '接口调用成功',
      data: {
        orderNo: orderNo,
        outTradeNo: 卡密记录.id.toString(),
        orderStatus,
        failCode,
        failReason,
        orderCost,
        cards: 加密结果,
      },
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

    // 根据奇所订单号查找卡密记录
    const 卡密记录 = await Card.findOne({
      where: { agiso_order_no: orderNo },
    });

    if (!卡密记录) {
      return res.json({ code: 404, message: '订单不存在' });
    }

    // 幂等处理：如果已经是已撤单状态，直接返回成功
    if (卡密记录.sup_status === 2) {
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: { cancelStatus: 20 },
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
      await 卡密记录.update({ status: 2, sup_status: 2 });
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: { cancelStatus: 20 },
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
        // 预约完成（status>=6）：不允许撤单
        if (关联订单.status >= 6) {
          return res.json({
            code: 200,
            message: '接口调用成功',
            data: {
              cancelStatus: 30,
              cancelErrMsg: '家政服务已预约完成，无法撤单',
            },
          });
        }
        // 其他状态（待处理/下单中/失败等）：允许撤单，取消订单
        const 现有日志 = 安全解析JSON(关联订单.order_log, []);
        现有日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '阿奇所平台撤单，订单自动取消',
          状态: 'cancel',
        });
        await 关联订单.update({ status: 4, order_log: JSON.stringify(现有日志) });
      }

      // 将卡密状态设为已失效，sup_status 设为已撤单
      await 卡密记录.update({ status: 2, sup_status: 2 });

      // 撤单成功后，自动将关联的预约订单改为"退款处理中(8)"
      try {
        const 更新条数 = await Order.update(
          { status: 8 },
          {
            where: {
              card_code: 卡密记录.code,
              status: { [Op.in]: [0, 1, 2, 5] },
            },
          }
        );
        if (更新条数[0] > 0) {
          console.log(`SUP撤单自动退款：卡密 ${卡密记录.code} 关联的 ${更新条数[0]} 个订单已标记为退款处理中`);
        }
      } catch (退款错误) {
        console.error('SUP撤单自动更新订单状态出错:', 退款错误);
        // 不影响撤单结果返回
      }

    } else if (业务类型 === 'xiyifu') {
      // ===== 洗衣业务 =====
      const 关联订单 = await Order.findOne({
        where: { card_code: 卡密记录.code },
      });

      if (关联订单) {
        // 已在鲸蚁系统处理中（有laundry_order_id且laundry_status不为空/已取消）：拒绝撤单
        if (关联订单.laundry_order_id && 关联订单.laundry_status && !['已取消'].includes(关联订单.laundry_status)) {
          return res.json({
            code: 200,
            message: '接口调用成功',
            data: {
              cancelStatus: 30,
              cancelErrMsg: `洗衣服务已在鲸蚁系统处理（${关联订单.laundry_status}），无法撤单`,
            },
          });
        }

        // 如果已推送到鲸蚁（有 laundry_order_id 但已取消状态），尝试通知鲸蚁取消
        if (关联订单.laundry_order_id) {
          try {
            const { 同步订单状态 } = require('../services/laundryApiService');
            const out_booking_no = `B${关联订单.id}`;
            await 同步订单状态(关联订单.order_no, out_booking_no, -1);
          } catch (鲸蚁错误) {
            // 通知失败时记录日志，但不阻塞撤单流程
            console.warn(`洗衣撤单通知鲸蚁失败（不阻塞），订单号：${关联订单.order_no}，错误：${鲸蚁错误.message}`);
          }
        }

        // 取消订单
        const 现有日志 = 安全解析JSON(关联订单.order_log, []);
        现有日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '阿奇所平台撤单，订单自动取消',
          状态: 'cancel',
        });
        await 关联订单.update({ status: 4, order_log: JSON.stringify(现有日志) });
      }

      // 将卡密状态设为已失效，sup_status 设为已撤单
      await 卡密记录.update({ status: 2, sup_status: 2 });

      // 撤单成功后，自动将关联的预约订单改为"退款处理中(8)"
      try {
        const 更新条数 = await Order.update(
          { status: 8 },
          {
            where: {
              card_code: 卡密记录.code,
              status: { [Op.in]: [0, 1, 2, 5] },
            },
          }
        );
        if (更新条数[0] > 0) {
          console.log(`SUP撤单自动退款：卡密 ${卡密记录.code} 关联的 ${更新条数[0]} 个订单已标记为退款处理中`);
        }
      } catch (退款错误) {
        console.error('SUP撤单自动更新订单状态出错:', 退款错误);
        // 不影响撤单结果返回
      }

    } else if (业务类型 === 'topup') {
      // ===== 充值业务 =====
      const 关联订单 = await Order.findOne({
        where: { card_code: 卡密记录.code },
      });

      // 已完成充值（status=2）：拒绝撤单
      if (关联订单 && 关联订单.status === 2) {
        return res.json({
          code: 200,
          message: '接口调用成功',
          data: {
            cancelStatus: 30,
            cancelErrMsg: '充值已完成，无法撤单',
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
      await 卡密记录.update({ status: 2, sup_status: 2 });

    } else {
      // 未知业务类型：按原逻辑处理（查关联订单，未使用则撤单）
      const 关联订单 = await Order.findOne({
        where: {
          card_code: 卡密记录.code,
          status: { [Op.ne]: 4 },
        },
      });

      if (关联订单) {
        return res.json({
          code: 200,
          message: '接口调用成功',
          data: {
            cancelStatus: 30,
            cancelErrMsg: '卡密已用于服务预约，无法退款',
          },
        });
      }

      await 卡密记录.update({ status: 2, sup_status: 2 });
    }

    res.json({
      code: 200,
      message: '接口调用成功',
      data: { cancelStatus: 20 },
    });
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
