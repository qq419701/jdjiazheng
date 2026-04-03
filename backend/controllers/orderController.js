// 订单控制器（后台管理）
const { Op } = require('sequelize');
const { Order, Card, JdAccount } = require('../models');
const { 执行自动下单 } = require('../services/jdAutoOrder');
const { 安全解析JSON } = require('../utils/helpers');

/**
 * 获取订单列表
 * GET /admin/api/orders
 */
const 获取订单列表 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      keyword = '',
      status,
      city,
      date_start,
      date_end,
      business_type,
    } = req.query;

    const 条件 = {};

    // 关键词搜索
    if (keyword) {
      条件[Op.or] = [
        { order_no: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { card_code: { [Op.like]: `%${keyword}%` } },
      ];
    }

    // 状态筛选
    if (status !== undefined && status !== '') {
      条件.status = parseInt(status);
    }

    // 城市筛选
    if (city) {
      条件.city = { [Op.like]: `%${city}%` };
    }

    // 业务类型筛选
    if (business_type) {
      条件.business_type = business_type;
    }

    // 日期范围
    if (date_start || date_end) {
      条件.created_at = {};
      if (date_start) 条件.created_at[Op.gte] = new Date(date_start);
      if (date_end) 条件.created_at[Op.lte] = new Date(date_end + ' 23:59:59');
    }

    const { count, rows } = await Order.findAndCountAll({
      where: 条件,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        list: rows,
      },
    });
  } catch (错误) {
    console.error('获取订单列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取订单详情
 * GET /admin/api/orders/:id
 */
const 获取订单详情 = async (req, res) => {
  try {
    const 订单 = await Order.findByPk(req.params.id);
    if (!订单) {
      return res.json({ code: 0, message: '订单不存在' });
    }

    // 解析操作日志
    const 日志 = 安全解析JSON(订单.order_log, []);

    res.json({
      code: 1,
      message: '获取成功',
      data: { ...订单.toJSON(), order_log: 日志 },
    });
  } catch (错误) {
    console.error('获取订单详情出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 更新订单状态
 * PUT /admin/api/orders/:id/status
 */
const 更新订单状态 = async (req, res) => {
  try {
    const { status, remark, fail_reason } = req.body;
    const 订单 = await Order.findByPk(req.params.id);

    if (!订单) {
      return res.json({ code: 0, message: '订单不存在' });
    }

    const 更新数据 = { status };
    if (remark) 更新数据.remark = remark;
    // 保存失败原因（状态3失败或7预约失败时）
    if (fail_reason !== undefined) 更新数据.fail_reason = fail_reason;

    // 状态文字映射（包含新增状态5安排中 6预约完成 7预约失败）
    const 状态文字映射 = ['待处理', '下单中', '已下单', '失败', '已取消', '安排中', '预约完成', '预约失败'];
    const 状态文字 = 状态文字映射[status] || '未知';

    // 记录操作日志
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `管理员手动更新状态为：${状态文字}`,
      状态: 'info',
    });
    更新数据.order_log = JSON.stringify(现有日志);

    await 订单.update(更新数据);

    res.json({ code: 1, message: '更新成功' });
  } catch (错误) {
    console.error('更新订单状态出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 触发自动下单
 * POST /admin/api/orders/:id/place-order
 */
const 触发自动下单 = async (req, res) => {
  try {
    const 订单ID = parseInt(req.params.id);
    const 订单 = await Order.findByPk(订单ID);

    if (!订单) {
      return res.json({ code: 0, message: '订单不存在' });
    }

    if (订单.status === 1) {
      return res.json({ code: 0, message: '订单正在下单中，请勿重复操作' });
    }

    if (订单.status === 2) {
      return res.json({ code: 0, message: '订单已下单成功' });
    }

    // 异步执行下单（不等待结果）
    执行自动下单(订单ID).catch(err => {
      console.error('自动下单失败:', err);
    });

    res.json({ code: 1, message: '自动下单任务已启动，请稍后刷新查看结果' });
  } catch (错误) {
    console.error('触发自动下单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 重置订单（将失败订单重置为待处理）
 * POST /admin/api/orders/:id/reset
 */
const 重置订单 = async (req, res) => {
  try {
    const 订单 = await Order.findByPk(req.params.id);

    if (!订单) {
      return res.json({ code: 0, message: '订单不存在' });
    }

    // 只有失败(3)或预约失败(7)的订单才能重置
    if (订单.status !== 3 && 订单.status !== 7) {
      return res.json({ code: 0, message: '只有失败或预约失败的订单才能重置' });
    }

    // 记录操作日志
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `管理员重置订单，状态恢复为待处理`,
      状态: 'info',
    });

    // 重置状态为0（待处理），清空失败原因
    await 订单.update({
      status: 0,
      fail_reason: null,
      order_log: JSON.stringify(现有日志),
    });

    res.json({ code: 1, message: '订单已重置为待处理' });
  } catch (错误) {
    console.error('重置订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取洗衣订单详情（预留扩展）
 * GET /admin/api/laundry/orders/:id
 */
const 获取洗衣订单详情 = async (req, res) => {
  try {
    const 订单 = await Order.findByPk(req.params.id);
    if (!订单) {
      return res.json({ code: 0, message: '订单不存在' });
    }

    // 解析操作日志
    const 日志 = 安全解析JSON(订单.order_log, []);

    res.json({
      code: 1,
      message: '获取成功',
      data: { ...订单.toJSON(), order_log: 日志 },
    });
  } catch (错误) {
    console.error('获取洗衣订单详情出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 导出订单（CSV格式）
 * GET /admin/api/orders/export
 * 支持与列表相同的筛选参数：keyword, status, city, date_start, date_end, business_type, ids
 */
const 导出订单 = async (req, res) => {
  try {
    const { keyword = '', status, city, date_start, date_end, business_type, ids } = req.query;
    const 条件 = {};

    if (ids) {
      const idList = ids.split(',').map(Number).filter(Boolean);
      条件.id = { [Op.in]: idList };
    } else {
      if (keyword) {
        条件[Op.or] = [
          { order_no: { [Op.like]: `%${keyword}%` } },
          { name: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } },
        ];
      }
      if (status !== undefined && status !== '') 条件.status = parseInt(status);
      if (city) 条件.city = { [Op.like]: `%${city}%` };
      if (business_type) 条件.business_type = business_type;
      if (date_start || date_end) {
        条件.created_at = {};
        if (date_start) 条件.created_at[Op.gte] = new Date(date_start);
        if (date_end) 条件.created_at[Op.lte] = new Date(date_end + ' 23:59:59');
      }
    }

    const 订单列表 = await Order.findAll({ where: 条件, order: [['created_at', 'DESC']] });

    const 状态文字映射 = ['待处理', '下单中', '已下单', '失败', '已取消', '安排中', '预约完成', '预约失败'];
    const BOM = '\uFEFF';
    const 表头 = '订单号,客户姓名,手机号,省,市,区/县,街道,详细地址,完整地址,预约日期,预约时间段,服务类型,服务时长(小时),状态,下单方式,京东订单号,失败原因,备注,创建时间\n';

    const 转义CSV字段 = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const 数据行 = 订单列表.map(o => [
      o.order_no, o.name, o.phone, o.province, o.city, o.district, o.street,
      o.address, o.full_address, o.visit_date, o.visit_time, o.service_type,
      o.service_hours, 状态文字映射[o.status] || o.status,
      o.auto_order === 1 ? '自动' : '手动',
      o.jd_order_id, o.fail_reason, o.remark,
      o.created_at ? new Date(o.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '',
    ].map(转义CSV字段).join(',')).join('\n');

    const 日期 = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${日期}.csv"`);
    res.send(BOM + 表头 + 数据行);
  } catch (错误) {
    console.error('导出订单出错:', 错误);
    res.status(500).json({ code: -1, message: '导出失败' });
  }
};

module.exports = { 获取订单列表, 获取订单详情, 获取洗衣订单详情, 更新订单状态, 触发自动下单, 重置订单, 导出订单 };
