// 洗衣服务管理控制器（后台管理接口）
// 对接鲸蚁生活洗护API + 独立快递API
const { Op } = require('sequelize');
const { Order, Setting } = require('../models');
const { 推送预约单, 同步订单状态, 修改预约单 } = require('../services/laundryApiService');
const { 查询物流路由, 测试快递API连接 } = require('../services/expressApiService');
const { 安全解析JSON } = require('../utils/helpers');
const { 执行洗衣下单内部 } = require('./laundryApiController');

/**
 * 获取洗衣订单列表
 * GET /admin/api/laundry-orders
 * 支持筛选：keyword/status/city/date_start/date_end，支持分页
 */
const 获取洗衣订单列表 = async (req, res) => {
  try {
    const { keyword, status, city, date_start, date_end, page = 1, limit = 20 } = req.query;
    const 查询条件 = { business_type: 'xiyifu' };

    if (keyword) {
      查询条件[Op.or] = [
        { order_no: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined && status !== '') {
      查询条件.status = parseInt(status);
    }
    if (city) {
      查询条件.city = { [Op.like]: `%${city}%` };
    }
    if (date_start && date_end) {
      查询条件.created_at = {
        [Op.between]: [new Date(date_start + ' 00:00:00'), new Date(date_end + ' 23:59:59')],
      };
    } else if (date_start) {
      查询条件.created_at = { [Op.gte]: new Date(date_start + ' 00:00:00') };
    } else if (date_end) {
      查询条件.created_at = { [Op.lte]: new Date(date_end + ' 23:59:59') };
    }

    const 偏移量 = (parseInt(page) - 1) * parseInt(limit);
    const { count: 总数, rows: 列表 } = await Order.findAndCountAll({
      where: 查询条件,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: 偏移量,
    });

    res.json({ code: 1, message: '获取成功', data: { list: 列表, total: 总数 } });
  } catch (错误) {
    console.error('获取洗衣订单列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取洗衣订单详情
 * GET /admin/api/laundry-orders/:id
 */
const 获取洗衣订单详情 = async (req, res) => {
  try {
    const 订单 = await Order.findOne({ where: { id: req.params.id, business_type: 'xiyifu' } });
    if (!订单) return res.json({ code: 0, message: '洗衣订单不存在' });

    const 订单数据 = 订单.toJSON();
    订单数据.order_log = 安全解析JSON(订单.order_log, []);

    res.json({ code: 1, message: '获取成功', data: 订单数据 });
  } catch (错误) {
    console.error('获取洗衣订单详情出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 触发洗衣订单下单（推送到鲸蚁API）
 * POST /admin/api/laundry-orders/:id/place-order
 */
const 触发洗衣下单 = async (req, res) => {
  try {
    const 订单 = await Order.findOne({
      where: { id: req.params.id, business_type: 'xiyifu' },
    });
    if (!订单) return res.json({ code: 0, message: '洗衣订单不存在' });
    if (订单.status === 1) return res.json({ code: 0, message: '订单正在下单中，请勿重复操作' });
    if (订单.status === 2) return res.json({ code: 0, message: '订单已下单成功' });

    // 获取设置（用于商品信息）
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    // 解析取件时间 start/end（优先用结构化字段，其次从 visit_time 解析）
    let 开始时间 = 订单.visit_time_start || '09:00:00';
    let 结束时间 = 订单.visit_time_end || '10:00:00';
    if (!订单.visit_time_start && 订单.visit_time && 订单.visit_time.includes('-')) {
      const [s, e] = 订单.visit_time.split('-');
      开始时间 = s.trim().length === 5 ? s.trim() + ':00' : s.trim();
      结束时间 = e.trim().length === 5 ? e.trim() + ':00' : e.trim();
    }

    // 异步执行下单
    执行洗衣下单内部(订单, 设置对象, 开始时间, 结束时间).catch(err => {
      console.error('触发洗衣下单失败:', err);
    });

    res.json({ code: 1, message: '洗衣下单任务已启动，请稍后刷新查看结果' });
  } catch (错误) {
    console.error('触发洗衣下单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 查询洗衣订单状态
 * GET /admin/api/laundry-orders/:id/status
 */
const 查询洗衣订单状态 = async (req, res) => {
  try {
    const 订单 = await Order.findOne({
      where: { id: req.params.id, business_type: 'xiyifu' },
    });
    if (!订单) return res.json({ code: 0, message: '洗衣订单不存在' });

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        id: 订单.id,
        status: 订单.status,
        laundry_order_id: 订单.laundry_order_id,
        laundry_status: 订单.laundry_status,
        express_order_id: 订单.express_order_id,
        express_company: 订单.express_company,
        return_waybill_code: 订单.return_waybill_code,
        factory_name: 订单.factory_name,
        factory_code: 订单.factory_code,
        laundry_images: 安全解析JSON(订单.laundry_images, []),
      },
    });
  } catch (错误) {
    console.error('查询洗衣订单状态出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 修改洗衣订单并同步鲸蚁（如已下单）
 * PUT /admin/api/laundry-orders/:id
 */
const 修改洗衣订单并同步鲸蚁 = async (req, res) => {
  try {
    const 订单 = await Order.findOne({
      where: { id: req.params.id, business_type: 'xiyifu' },
    });
    if (!订单) return res.json({ code: 0, message: '洗衣订单不存在' });

    const {
      visit_date, visit_time, visit_time_start, visit_time_end,
      return_name, return_phone, return_province, return_city, return_district, return_address,
      remark,
    } = req.body;

    const 更新数据 = {};
    if (visit_date !== undefined) 更新数据.visit_date = visit_date;
    if (visit_time !== undefined) 更新数据.visit_time = visit_time;
    if (visit_time_start !== undefined) 更新数据.visit_time_start = visit_time_start;
    if (visit_time_end !== undefined) 更新数据.visit_time_end = visit_time_end;
    if (return_name !== undefined) 更新数据.return_name = return_name;
    if (return_phone !== undefined) 更新数据.return_phone = return_phone;
    if (return_province !== undefined) 更新数据.return_province = return_province;
    if (return_city !== undefined) 更新数据.return_city = return_city;
    if (return_district !== undefined) 更新数据.return_district = return_district;
    if (return_address !== undefined) 更新数据.return_address = return_address;
    if (remark !== undefined) 更新数据.remark = remark;

    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `管理员修改订单信息：${Object.keys(更新数据).join('、')}`,
      状态: 'info',
    });
    更新数据.order_log = JSON.stringify(现有日志);

    await 订单.update(更新数据);

    // 如果订单已下单到鲸蚁，同步修改
    if (订单.status === 2 && (visit_date || visit_time_start || visit_time_end || return_name || return_address)) {
      try {
        const 新开始时间 = visit_time_start || 订单.visit_time_start || '09:00:00';
        const 新结束时间 = visit_time_end || 订单.visit_time_end || '10:00:00';
        const 新日期 = visit_date || 订单.visit_date;

        const 取件地址 = {
          contact: 订单.name,
          phone: 订单.phone,
          province: 订单.province,
          city: 订单.city,
          district: 订单.district,
          address: 订单.address,
        };
        const 收件地址 = {
          contact: return_name || 订单.return_name || 订单.name,
          phone: return_phone || 订单.return_phone || 订单.phone,
          province: return_province || 订单.return_province || 订单.province,
          city: return_city || 订单.return_city || 订单.city,
          district: return_district || 订单.return_district || 订单.district,
          address: return_address || 订单.return_address || 订单.address,
        };

        await 修改预约单(订单.order_no, `B${订单.order_no}`, 新日期, 新开始时间, 新结束时间, 取件地址, 收件地址);

        // 追加同步成功日志
        const 更新后日志 = 安全解析JSON((await Order.findByPk(订单.id)).order_log, []);
        更新后日志.push({
          时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          操作: '已同步修改到鲸蚁系统',
          状态: 'success',
        });
        await Order.update({ order_log: JSON.stringify(更新后日志) }, { where: { id: 订单.id } });

        return res.json({ code: 1, message: '修改成功，已同步到鲸蚁系统' });
      } catch (同步错误) {
        console.error('同步修改到鲸蚁失败:', 同步错误.message);
        return res.json({ code: 1, message: `修改已保存，但同步到鲸蚁失败：${同步错误.message}` });
      }
    }

    res.json({ code: 1, message: '修改成功' });
  } catch (错误) {
    console.error('修改洗衣订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 取消洗衣订单（同步状态-1到鲸蚁）
 * POST /admin/api/laundry-orders/:id/cancel
 */
const 取消洗衣订单 = async (req, res) => {
  try {
    const 订单 = await Order.findOne({
      where: { id: req.params.id, business_type: 'xiyifu' },
    });
    if (!订单) return res.json({ code: 0, message: '洗衣订单不存在' });
    if (订单.status === 4) return res.json({ code: 0, message: '订单已取消' });

    // 如果已有鲸蚁订单号，同步取消状态
    if (订单.laundry_order_id) {
      try {
        await 同步订单状态(订单.order_no, `B${订单.order_no}`, -1);
      } catch (同步错误) {
        console.error('同步取消状态到鲸蚁失败:', 同步错误.message);
      }
    }

    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: '管理员取消洗衣订单',
      状态: 'info',
    });

    await 订单.update({
      status: 4,
      laundry_status: '已取消',
      order_log: JSON.stringify(现有日志),
    });

    res.json({ code: 1, message: '订单已取消' });
  } catch (错误) {
    console.error('取消洗衣订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 查询快递物流路由
 * POST /admin/api/laundry-orders/:id/express-routes
 * 参数：type=pickup（取件）或 type=return（回寄）
 */
const 查询快递物流路由 = async (req, res) => {
  try {
    const 订单 = await Order.findOne({
      where: { id: req.params.id, business_type: 'xiyifu' },
    });
    if (!订单) return res.json({ code: 0, message: '洗衣订单不存在' });

    const { type = 'pickup' } = req.body;

    // 确定查询单号
    let 查询单号 = null;
    if (type === 'pickup') {
      查询单号 = 订单.express_order_id;
      if (!查询单号) return res.json({ code: 0, message: '暂无取件快递单号' });
    } else if (type === 'return') {
      查询单号 = 订单.return_waybill_code;
      if (!查询单号) return res.json({ code: 0, message: '暂无回寄快递单号' });
    } else {
      return res.json({ code: 0, message: '无效的type参数，请传入 pickup 或 return' });
    }

    // 调用快递API查询路由
    const 路由数据 = await 查询物流路由(查询单号);

    // 将结果缓存到订单（分段存储）
    const 现有路由 = 安全解析JSON(订单.express_routes, {});
    现有路由[type] = {
      waybillCode: 查询单号,
      ...路由数据,
      查询时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    };
    await 订单.update({ express_routes: JSON.stringify(现有路由) });

    res.json({ code: 1, message: '查询成功', data: 路由数据 });
  } catch (错误) {
    console.error('查询快递物流路由出错:', 错误);
    res.json({ code: 0, message: `查询失败：${错误.message}` });
  }
};

/**
 * 测试快递API连接
 * POST /admin/api/laundry/test-express-connection
 */
const 测试快递连接 = async (req, res) => {
  try {
    const 结果 = await 测试快递API连接();
    res.json({
      code: 1,
      message: '快递API连接成功',
      data: { tenantId: 结果.tenantId },
    });
  } catch (错误) {
    console.error('测试快递API连接失败:', 错误.message);
    res.json({ code: 0, message: `连接失败：${错误.message}` });
  }
};

/**
 * 接收鲸蚁回调（完整版）
 * POST /api/laundry/callback
 * 无需JWT鉴权
 *
 * 回调参数：app_id, out_order_no, status, waybillCode, images, images_v2, factory_name, factory_code
 * images_v2 为新版预检图片字段（优先使用），images 为旧版兼容字段
 *
 * 状态码含义：
 * 1=已分配（鲸蚁分配工厂和快递员），2=已取件，3=已入厂，
 * 4=预检中（含衣物图片 images_v2/images），5=已回寄，6=已送达，11=质检中，-1=已取消
 */
const 接收鲸蚁回调 = async (req, res) => {
  try {
    const 回调数据 = req.body;
    console.log('收到鲸蚁回调:', JSON.stringify(回调数据));

    const {
      app_id,
      out_order_no,
      status,
      waybillCode,
      images,
      images_v2,
      factory_name,
      factory_code,
    } = 回调数据;

    // 统一转为数值（鲸蚁可能传字符串或数值）
    const 状态数值 = Number(status);

    // 验证 app_id（软验证，不匹配只打日志，不拒绝）
    const 设置列表 = await Setting.findAll();
    const 配置 = {};
    设置列表.forEach(s => { 配置[s.key_name] = s.key_value; });
    if (app_id && 配置.laundry_app_id && app_id !== 配置.laundry_app_id) {
      console.warn('鲸蚁回调 app_id 不匹配:', app_id, '期望:', 配置.laundry_app_id);
    }

    // 查找订单
    const 订单 = await Order.findOne({ where: { order_no: out_order_no, business_type: 'xiyifu' } });
    if (!订单) {
      console.warn('鲸蚁回调订单不存在:', out_order_no);
      return res.json({ code: 0 }); // 仍返回0避免鲸蚁重试
    }

    // 状态映射（统一用数值为key）
    const 洗衣状态映射 = {
      1: '已分配',
      2: '已取件',
      3: '已入厂',
      4: '预检中',
      5: '已回寄',
      6: '已送达',
      11: '质检中',
      [-1]: '已取消',
    };

    const 更新数据 = {
      laundry_status: 洗衣状态映射[状态数值] || `状态${状态数值}`,
    };

    // 根据 status 更新对应字段（统一用数值比较）
    if (状态数值 === 1) {
      // 已分配：写入取件快递单号、工厂信息
      if (waybillCode) {
        更新数据.express_order_id = waybillCode;
        更新数据.express_company = 'JD';
      }
      if (factory_name) 更新数据.factory_name = factory_name;
      if (factory_code) 更新数据.factory_code = factory_code;
    } else if (状态数值 === 4) {
      // 预检中：保存图片（优先用 images_v2）
      const 图片数据 = images_v2 || images;
      if (图片数据) {
        更新数据.laundry_images = typeof 图片数据 === 'string' ? 图片数据 : JSON.stringify(图片数据);
      }
    } else if (状态数值 === 5) {
      // 已回寄：写入回寄快递单号
      if (waybillCode) {
        更新数据.return_waybill_code = waybillCode;
      }
    } else if (状态数值 === 6) {
      // 已送达：更新主状态
      更新数据.status = 6;
    } else if (状态数值 === -1) {
      // 已取消
      更新数据.status = 4;
      更新数据.laundry_status = '已取消';
    }

    // 操作日志
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    let 日志说明 = `鲸蚁回调：${更新数据.laundry_status}`;
    if (waybillCode) 日志说明 += `，快递单号：${waybillCode}`;
    if (factory_name) 日志说明 += `，工厂：${factory_name}`;
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: 日志说明,
      状态: 'info',
    });
    更新数据.order_log = JSON.stringify(现有日志);

    await 订单.update(更新数据);
    console.log('✅ 鲸蚁回调处理成功:', out_order_no, status);

    // 鲸蚁要求始终返回 { code: 0 }
    res.json({ code: 0 });
  } catch (错误) {
    console.error('处理鲸蚁回调出错:', 错误);
    res.json({ code: 0 }); // 始终返回0，避免鲸蚁重复推送
  }
};

/**
 * 测试洗衣API连接
 * POST /admin/api/laundry/test-connection
 */
const 测试洗衣API连接 = async (req, res) => {
  try {
    const { 测试API连接 } = require('../services/laundryApiService');
    const 结果 = await 测试API连接();
    res.json({
      code: 1,
      message: '连接成功',
      data: { tenantId: 结果.tenantId },
    });
  } catch (错误) {
    console.error('测试洗衣API连接失败:', 错误.message);
    res.json({ code: 0, message: `连接失败：${错误.message}` });
  }
};

module.exports = {
  获取洗衣订单列表,
  获取洗衣订单详情,
  触发洗衣下单,
  查询洗衣订单状态,
  修改洗衣订单并同步鲸蚁,
  取消洗衣订单,
  查询快递物流路由,
  测试快递连接,
  接收鲸蚁回调,
  测试洗衣API连接,
};
