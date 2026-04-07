// 奇所SUP系统控制器
// 实现标准SUP接口：供阿奇索开放平台调用，作为货源方（供应商）
// 接口说明：
//   - 本系统的商品全部是卡密类型（productType=2），不做直充
//   - 同步发货模式：下单后直接返回卡密，不需要异步回调
//   - 商品编号格式：{business_type}_{service_type}_{service_hours}h

const { Op } = require('sequelize');
const { Card, Order, Setting } = require('../models');
const 数据库连接 = require('../config/database');
const { 加密卡密 } = require('../services/agisoService');

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
 *   - 优先从 agiso_products 配置读取商品列表
 *   - 若配置为空则自动扫描Card表，按 business_type+service_type+service_hours 去重生成商品列表
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

    // 读取配置
    const 配置 = await 读取配置(['agiso_products', 'service_cost_price', 'laundry_product_price']);
    const appSecret配置 = await Setting.findOne({ where: { key_name: 'agiso_app_secret' } });
    const appSecret = appSecret配置 ? appSecret配置.key_value : '';

    let 商品列表 = [];

    // 优先从配置读取自定义商品列表
    if (配置.agiso_products && 配置.agiso_products.trim()) {
      try {
        商品列表 = JSON.parse(配置.agiso_products);
      } catch (解析错误) {
        console.error('agiso_products配置JSON解析失败:', 解析错误);
        商品列表 = [];
      }
    }

    // 若商品列表为空，自动扫描Card表生成
    if (!商品列表 || 商品列表.length === 0) {
      // 查询Card表中所有未失效的卡密，按 business_type+service_type+service_hours 去重
      const 卡密类型列表 = await Card.findAll({
        attributes: ['business_type', 'service_type', 'service_hours'],
        where: { status: { [Op.ne]: 2 } }, // 排除已失效
        group: ['business_type', 'service_type', 'service_hours'],
        raw: true,
      });

      // 计算各类型的成本价
      const jiazheng成本价 = parseFloat(配置.service_cost_price || '50') || 50;
      // 洗衣价格在Setting表中以分为单位存储，使用分转元常量换算
      const xiyifu成本价 = (parseInt(配置.laundry_product_price || '0', 10) / 分转元) || 0;

      商品列表 = 卡密类型列表.map(卡密类型 => {
        const productNo = 生成商品编号(卡密类型.business_type, 卡密类型.service_type, 卡密类型.service_hours);
        const 成本价 = 卡密类型.business_type === 'xiyifu' ? xiyifu成本价 : jiazheng成本价;
        return {
          productNo,
          productTitle: `${卡密类型.service_type}${卡密类型.service_hours > 0 ? 卡密类型.service_hours + '小时' : ''}卡`,
          productCost: 成本价,
          businessType: 卡密类型.business_type,
          productType: 2, // 卡密类型
        };
      });
    }

    // keyword 模糊搜索商品名称
    let 过滤后列表 = 商品列表;
    if (keyword && keyword.trim()) {
      const 关键词 = keyword.trim().toLowerCase();
      过滤后列表 = 商品列表.filter(商品 =>
        (商品.productTitle || '').toLowerCase().includes(关键词) ||
        (商品.productNo || '').toLowerCase().includes(关键词)
      );
    }

    // 分页处理
    const 当前页 = parseInt(pageIndex) || 1;
    const 每页数量 = parseInt(pageSize) || 20;
    const 起始位置 = (当前页 - 1) * 每页数量;
    const 分页数据 = 过滤后列表.slice(起始位置, 起始位置 + 每页数量);
    const hasNextPage = 起始位置 + 每页数量 < 过滤后列表.length;

    res.json({
      code: 200,
      message: '接口调用成功',
      data: {
        items: 分页数据,
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
 *   - 根据 productNo 查找对应商品
 *   - 本系统是卡密类型（apiType=1同步，productType=2卡密）
 *   - 卡密商品的attach数组返回空数组（不需要额外参数）
 */
const 获取商品模板 = async (req, res) => {
  try {
    const { productNo } = req.body;

    if (!productNo) {
      return res.json({ code: 400, message: '商品编号不能为空' });
    }

    // 解析商品编号获取业务类型和服务类型
    const 商品信息 = 解析商品编号(productNo);
    if (!商品信息) {
      return res.json({ code: 404, message: '商品不存在' });
    }

    const { businessType, serviceType, serviceHours } = 商品信息;

    // 检查该类型的卡密是否存在
    const 卡密数量 = await Card.count({
      where: {
        business_type: businessType,
        service_type: serviceType,
        service_hours: serviceHours,
        status: { [Op.ne]: 2 },
      },
    });

    if (卡密数量 === 0) {
      return res.json({ code: 404, message: '商品不存在' });
    }

    // 读取成本价配置
    const 配置 = await 读取配置(['service_cost_price', 'laundry_product_price']);
    let 成本价 = 50;
    if (businessType === 'xiyifu') {
      成本价 = (parseInt(配置.laundry_product_price || '0', 10) / 分转元) || 0;
    } else {
      成本价 = parseFloat(配置.service_cost_price || '50') || 50;
    }

    const 商品标题 = `${serviceType}${serviceHours > 0 ? serviceHours + '小时' : ''}卡`;

    res.json({
      code: 200,
      message: '接口调用成功',
      data: {
        apiType: 1,        // 1=同步发货
        productTitle: 商品标题,
        productType: 2,    // 2=卡密类型
        productCost: 成本价,
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
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: {
          orderStatus: 20,
          cards: 加密结果,
        },
      });
    }

    // 解析商品编号
    const 商品信息 = 解析商品编号(productNo);
    if (!商品信息) {
      return res.json({ code: 404, message: '商品不存在' });
    }
    const { businessType, serviceType, serviceHours } = 商品信息;

    // 使用事务+原子更新防止并发竞争：
    // 直接用 UPDATE SET agiso_order_no=orderNo WHERE agiso_order_no IS NULL AND status=0
    // 只有一个请求能成功更新，其他请求得到 affectedRows=0
    let 目标卡密 = null;
    await 数据库连接.transaction(async (t) => {
      // 先在事务内查找可用卡密（加行锁）
      const 候选卡密 = await Card.findOne({
        where: {
          business_type: businessType,
          service_type: serviceType,
          service_hours: serviceHours,
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
      }, { transaction: t });

      目标卡密 = 候选卡密;
    });

    if (!目标卡密) {
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: { orderStatus: 30 }, // 30=失败（库存不足）
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
        orderStatus: 20, // 20=成功
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
    if (卡密记录.sup_status === 1) {
      orderStatus = 20; // 成功
    } else if (卡密记录.sup_status === 2) {
      orderStatus = 30; // 已撤单/失败
    } else {
      orderStatus = 10; // 处理中
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
        orderStatus,
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
 *   - 检查卡密是否已被用于预约（Order表中存在 card_code = card.code 且 status != 4 的记录）
 *   - 如果卡密已用于预约，不允许撤单（返回cancelStatus=30）
 *   - 如果卡密未用于预约，撤单成功（status改回0，清空agiso_order_no，sup_status改为2）
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

    // 检查该卡密是否已被用于创建预约订单
    // 查 Order 表中 card_code = card.code 且 status != 4（未取消）的记录
    const 关联预约订单 = await Order.findOne({
      where: {
        card_code: 卡密记录.code,
        status: { [Op.ne]: 4 }, // 排除已取消状态
      },
    });

    if (关联预约订单) {
      // 卡密已被用于服务预约，不允许撤单
      return res.json({
        code: 200,
        message: '接口调用成功',
        data: {
          cancelStatus: 30,
          cancelErrMsg: '卡密已用于服务预约，无法退款',
        },
      });
    }

    // 卡密未被用于预约，允许撤单
    // status改回0（未使用），清空 agiso_order_no，sup_status改为2（已撤单）
    await 卡密记录.update({
      status: 0,
      agiso_order_no: null,
      sup_status: 2, // 2=已撤单
    });

    res.json({
      code: 200,
      message: '接口调用成功',
      data: {
        cancelStatus: 20, // 20=撤单成功
      },
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
