// 洗衣服务管理控制器（后台管理接口）
const { Op } = require('sequelize');
const { Order, Setting } = require('../models');
const { 推送预约单, 同步订单状态 } = require('../services/laundryApiService');
const { 安全解析JSON } = require('../utils/helpers');
const { 执行洗衣下单内部 } = require('./laundryApiController');

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

    // 解析取件时间 start/end（从 visit_time 字段，格式：09:00-10:00）
    let 开始时间 = '09:00:00';
    let 结束时间 = '10:00:00';
    if (订单.visit_time && 订单.visit_time.includes('-')) {
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
      },
    });
  } catch (错误) {
    console.error('查询洗衣订单状态出错:', 错误);
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
      order_log: JSON.stringify(现有日志),
    });

    res.json({ code: 1, message: '订单已取消' });
  } catch (错误) {
    console.error('取消洗衣订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 查询快递状态
 * GET /admin/api/laundry-orders/:id/express-status
 */
const 查询快递状态 = async (req, res) => {
  try {
    const 订单 = await Order.findOne({
      where: { id: req.params.id, business_type: 'xiyifu' },
    });
    if (!订单) return res.json({ code: 0, message: '洗衣订单不存在' });

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        express_order_id: 订单.express_order_id,
        express_company: 订单.express_company,
        laundry_status: 订单.laundry_status,
      },
    });
  } catch (错误) {
    console.error('查询快递状态出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 接收鲸蚁回调
 * POST /api/laundry/callback
 * 无需JWT鉴权
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
    } = 回调数据;

    // 验证 app_id
    const 设置列表 = await Setting.findAll();
    const 配置 = {};
    设置列表.forEach(s => { 配置[s.key_name] = s.key_value; });
    if (app_id && 配置.laundry_app_id && app_id !== 配置.laundry_app_id) {
      console.warn('鲸蚁回调 app_id 不匹配:', app_id);
    }

    // 查找订单
    const 订单 = await Order.findOne({ where: { order_no: out_order_no, business_type: 'xiyifu' } });
    if (!订单) {
      console.warn('鲸蚁回调订单不存在:', out_order_no);
      return res.json({ code: 0 }); // 仍返回0避免鲸蚁重试
    }

    // 状态映射：1已分配,2已取件,3已入厂,4预检,5已回寄,6已送达,11质检
    const 洗衣状态映射 = {
      1: '已分配',
      2: '已取件',
      3: '已入厂',
      4: '预检中',
      5: '已回寄',
      6: '已送达',
      11: '质检中',
    };

    const 更新数据 = {
      laundry_status: 洗衣状态映射[status] || `状态${status}`,
    };

    // 保存快递单号（状态1已分配，5已回寄）
    if ((status === 1 || status === 5) && waybillCode) {
      if (status === 1) {
        更新数据.express_order_id = waybillCode;
        更新数据.express_company = 'JD';
      } else {
        更新数据.express_order_id = waybillCode;
      }
    }

    // 保存预检图片（状态4）
    if (status === 4 && images) {
      更新数据.laundry_images = typeof images === 'string' ? images : JSON.stringify(images);
    }

    // 已送达：更新status=6
    if (status === 6) {
      更新数据.status = 6;
    }

    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `鲸蚁回调：${洗衣状态映射[status] || `状态${status}`}${waybillCode ? '，快递单号：' + waybillCode : ''}`,
      状态: 'info',
    });
    更新数据.order_log = JSON.stringify(现有日志);

    await 订单.update(更新数据);
    console.log('✅ 鲸蚁回调处理成功:', out_order_no, status);

    // 必须返回 { code: 0 }
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

module.exports = { 触发洗衣下单, 查询洗衣订单状态, 取消洗衣订单, 查询快递状态, 接收鲸蚁回调, 测试洗衣API连接 };
