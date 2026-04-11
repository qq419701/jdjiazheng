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

    // 关键词搜索（支持订单号/姓名/手机号/卡密/备注/电商平台单号）
    if (keyword) {
      条件[Op.or] = [
        { order_no: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { card_code: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } }, // 支持备注关键词搜索
        { ecommerce_order_no: { [Op.like]: `%${keyword}%` } }, // 支持电商平台单号搜索
      ];
    }

    // 状态筛选
    if (status !== undefined && status !== '') {
      条件.status = parseInt(status);
    }

    // 城市筛选
    // 充值订单（business_type='topup'）的城市存储在 login_city 字段，其他订单在 city 字段
    if (city) {
      if (business_type === 'topup') {
        条件.login_city = { [Op.like]: `%${city}%` };
      } else {
        条件.city = { [Op.like]: `%${city}%` };
      }
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
    // 保存失败原因（状态5失败时）
    if (fail_reason !== undefined) 更新数据.fail_reason = fail_reason;

    // 状态文字映射
    const 状态文字映射 = { 0: '待处理', 1: '处理中', 2: '服务中', 3: '已完成', 4: '已取消', 5: '失败', 6: '拒绝退款' };
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

    // 只有失败(5)的订单才能重置
    if (订单.status !== 5) {
      return res.json({ code: 0, message: '只有失败的订单才能重置' });
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
 * 快速更新订单备注（独立接口，无需更新状态）
 * PUT /admin/api/orders/:id/remark
 * 支持同时保存文字备注（remark）和图片数组（remark_images，JSON字符串）
 */
const 更新订单备注 = async (req, res) => {
  try {
    const { remark, remark_images } = req.body;
    const 订单 = await Order.findByPk(req.params.id);

    if (!订单) {
      return res.json({ code: 0, message: '订单不存在' });
    }

    // 记录操作日志
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    const 图片数量 = (() => { try { return (JSON.parse(remark_images || '[]') || []).length } catch { return 0 } })();
    const 日志描述 = [remark ? `备注：${remark}` : null, 图片数量 ? `${图片数量}张图片` : null].filter(Boolean).join('，') || '（已清空）';
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `管理员更新备注：${日志描述}`,
      状态: 'info',
    });

    const 更新数据 = {
      remark: remark || null,
      order_log: JSON.stringify(现有日志),
    };
    // 仅当 remark_images 字段存在时才更新（防止旧版本前端误清空）
    if (remark_images !== undefined) {
      更新数据.remark_images = remark_images || null;
    }

    await 订单.update(更新数据);

    res.json({ code: 1, message: '备注更新成功' });
  } catch (错误) {
    console.error('更新订单备注出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 导出订单为CSV文件
 * GET /admin/api/orders/export
 * GET /admin/api/laundry-orders/export（路由层强制 business_type='xiyifu'）
 * 支持与订单列表相同的搜索参数（keyword、status、city、date_start、date_end、business_type）
 */
const 导出订单 = async (req, res) => {
  try {
    const {
      keyword = '',
      status,
      city,
      date_start,
      date_end,
      business_type,
    } = req.query;

    const 条件 = {};

    // 关键词搜索（同订单列表接口）
    if (keyword) {
      条件[Op.or] = [
        { order_no: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { card_code: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
        { ecommerce_order_no: { [Op.like]: `%${keyword}%` } },
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

    const 订单列表 = await Order.findAll({
      where: 条件,
      order: [['created_at', 'DESC']],
    });

    // 订单状态文字映射
    const 状态文字映射 = {
      0: '待处理', 1: '处理中', 2: '服务中', 3: '已完成',
      4: '已取消', 5: '失败', 6: '拒绝退款',
    };

    // 转义CSV字段（含逗号/引号/换行时加双引号包裹）
    const 转义字段 = (值) => {
      if (值 === null || 值 === undefined) return '';
      const 文本 = String(值);
      if (文本.includes(',') || 文本.includes('"') || 文本.includes('\n')) {
        return `"${文本.replace(/"/g, '""')}"`;
      }
      return 文本;
    };

    const 是洗衣 = business_type === 'xiyifu';

    // 根据业务类型决定导出字段
    let 表头;
    let 生成行;
    if (是洗衣) {
      // 洗衣订单包含洗衣专用字段
      表头 = ['订单号', '姓名', '手机号', '省', '市', '区', '详细地址', '预约日期', '取件时间段',
        '商品名称', '卡密', '鲸蚁订单号', '洗衣状态', '取件快递单号', '状态', '备注', '创建时间'];
      生成行 = (订单) => [
        订单.order_no,
        订单.name,
        订单.phone,
        订单.province || '',
        订单.city || '',
        订单.district || '',
        订单.address || '',
        订单.visit_date || '',
        订单.visit_time || '',
        订单.service_type || '',
        订单.card_code || '',
        订单.laundry_order_id || '',
        订单.laundry_status || '',
        订单.express_order_id || '',
        状态文字映射[订单.status] || String(订单.status),
        订单.remark || '',
        订单.created_at ? new Date(订单.created_at).toLocaleString('zh-CN') : '',
      ].map(转义字段).join(',');
    } else {
      // 家政订单
      表头 = ['订单号', '姓名', '手机号', '省', '市', '区', '街道', '详细地址', '预约日期', '预约时间',
        '服务类型', '服务时长(小时)', '卡密', '状态', '京东订单号', '备注', '创建时间'];
      生成行 = (订单) => [
        订单.order_no,
        订单.name,
        订单.phone,
        订单.province || '',
        订单.city || '',
        订单.district || '',
        订单.street || '',
        订单.address || '',
        订单.visit_date || '',
        订单.visit_time || '',
        订单.service_type || '',
        订单.service_hours || '',
        订单.card_code || '',
        状态文字映射[订单.status] || String(订单.status),
        订单.jd_order_id || '',
        订单.remark || '',
        订单.created_at ? new Date(订单.created_at).toLocaleString('zh-CN') : '',
      ].map(转义字段).join(',');
    }

    const CSV行 = 订单列表.map(生成行);
    const CSV内容 = [表头.join(','), ...CSV行].join('\r\n');

    // 添加 UTF-8 BOM，防止 Excel 打开时中文乱码
    const BOM = '\uFEFF';
    const 业务名称 = 是洗衣 ? '洗衣' : '家政';
    const 文件名 = `${业务名称}订单_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(文件名)}"`);
    res.send(BOM + CSV内容);
  } catch (错误) {
    console.error('导出订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 确认退款完成
 * POST /admin/api/orders/:id/confirm-refund
 * 逻辑：将订单状态改为4（已取消），将关联卡密状态改为2（已失效）
 */
const 确认退款完成 = async (req, res) => {
  try {
    const 订单 = await Order.findByPk(req.params.id);
    if (!订单) {
      return res.json({ code: 0, message: '订单不存在' });
    }

    if (订单.status !== 6) {
      return res.json({ code: 0, message: '只有拒绝退款的订单才能确认退款完成' });
    }

    // 通过 card_code 找到对应的卡密记录
    let 卡密作废成功 = false;
    if (订单.card_code) {
      const 卡密 = await Card.findOne({ where: { code: 订单.card_code } });
      if (卡密) {
        await 卡密.update({ status: 2, invalidated_at: new Date() });
        卡密作废成功 = true;
      }
    }

    // 记录操作日志
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `管理员确认退款完成，卡密已作废`,
      状态: 'info',
    });

    // 把订单状态改为4（已取消）
    await 订单.update({
      status: 4,
      order_log: JSON.stringify(现有日志),
    });

    res.json({ code: 1, message: 卡密作废成功 ? '退款完成，卡密已作废' : '退款完成（未找到关联卡密）' });
  } catch (错误) {
    console.error('确认退款完成出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 获取订单列表, 获取订单详情, 获取洗衣订单详情, 更新订单状态, 触发自动下单, 重置订单, 更新订单备注, 导出订单, 确认退款完成 };
