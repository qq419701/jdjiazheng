// 前端H5接口控制器
const { Card, Order, Setting } = require('../models');
const { 生成预约时间表 } = require('../services/timeRuleService');
const { 验证卡密有效性 } = require('../services/cardService');
const { 生成订单号, 验证手机号, 安全解析JSON } = require('../utils/helpers');

/**
 * 验证卡密接口
 * GET /api/verify-card/:code
 */
const 验证卡密 = async (req, res) => {
  try {
    const { code } = req.params;
    const 结果 = await 验证卡密有效性(code);

    if (!结果.有效) {
      if (结果.原因 === '卡密已被使用') {
        return res.json({ code: 2, message: '卡密已被使用', data: { used: true, card_code: 结果.卡密?.code || '' } });
      }
      if (结果.原因 === '卡密已失效') {
        return res.json({ code: 3, message: '卡密已作废', data: null });
      }
      return res.json({
        code: 0,
        message: 结果.原因,
        data: null,
      });
    }

    // 获取公开设置
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    return res.json({
      code: 1,
      message: '卡密有效',
      data: {
        card_code: 结果.卡密.code,
        category: 结果.卡密.category,
        service_type: 结果.卡密.service_type || 设置对象.service_type || '日常保洁',
        service_hours: 结果.卡密.service_hours || parseInt(设置对象.service_hours) || 2,
        banner_url: 设置对象.banner_url || '',
        notice: 设置对象.notice || '',
        service_content: 安全解析JSON(设置对象.service_content, []),
        // 多备选时间设置（H5端读取并传给TimeSlot组件）
        multi_time_enabled: 设置对象.multi_time_enabled || '0',
        multi_time_max_count: 设置对象.multi_time_max_count || '3',
        multi_time_tip: 设置对象.multi_time_tip || '',
        multi_time_min_count: 设置对象.multi_time_min_count || '1',
      },
    });
  } catch (错误) {
    console.error('验证卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取预约时间表接口
 * GET /api/time-slots?city=城市名
 */
const 获取时间表 = async (req, res) => {
  try {
    const { city = '' } = req.query;
    const 时间表 = await 生成预约时间表(city);

    res.json({
      code: 1,
      message: '获取成功',
      data: 时间表,
    });
  } catch (错误) {
    console.error('获取时间表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 提交预约订单接口
 * POST /api/orders
 */
const 提交订单 = async (req, res) => {
  try {
    const {
      card_code,
      name,
      phone,
      province,
      city,
      district,
      street,
      address,
      visit_date,
      visit_time,
      visit_times, // 多备选时间JSON字符串（可选）
    } = req.body;

    // 基础参数验证
    if (!card_code || !name || !phone || !province || !city || !district || !address) {
      return res.json({ code: 0, message: '请填写完整信息' });
    }

    if (!验证手机号(phone)) {
      return res.json({ code: 0, message: '手机号格式不正确' });
    }

    if (!visit_date || !visit_time) {
      return res.json({ code: 0, message: '请选择上门时间' });
    }

    // 验证卡密
    const 卡密验证结果 = await 验证卡密有效性(card_code);
    if (!卡密验证结果.有效) {
      return res.json({ code: 0, message: `卡密无效：${卡密验证结果.原因}` });
    }

    const 卡密 = 卡密验证结果.卡密;

    // 生成订单号
    const 订单号 = 生成订单号();
    // 完整地址包含街道（如有）
    const 完整地址 = `${province}${city}${district}${street ? street : ''}${address}`;

    // 创建订单
    const 新订单 = await Order.create({
      order_no: 订单号,
      card_code: 卡密.code,
      name,
      phone,
      province,
      city,
      district,
      street: street || null,
      address,
      full_address: 完整地址,
      visit_date,
      visit_time,
      visit_times: visit_times || null, // 保存多备选时间（向下兼容原字段）
      service_type: 卡密.service_type || '日常保洁',
      service_hours: 卡密.service_hours || 2,
      status: 0,
      created_at: new Date(),
      order_log: JSON.stringify([{
        时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        操作: '客户提交预约订单',
        状态: 'success',
      }]),
    });

    // 标记卡密为已使用
    await 卡密.update({
      status: 1,
      used_by_order: 新订单.id,
    });

    return res.json({
      code: 1,
      message: '预约成功',
      data: {
        order_no: 订单号,
        name,
        phone,
        full_address: 完整地址,
        visit_date,
        visit_time,
        service_type: 卡密.service_type || '日常保洁',
        service_hours: 卡密.service_hours || 2,
      },
    });
  } catch (错误) {
    console.error('提交订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取公开设置接口
 * GET /api/settings/public
 */
const 获取公开设置 = async (req, res) => {
  try {
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        banner_url: 设置对象.banner_url || '',
        service_type: 设置对象.service_type || '日常保洁',
        service_hours: parseInt(设置对象.service_hours) || 2,
        notice: 设置对象.notice || '',
        service_content: 安全解析JSON(设置对象.service_content, [
          { icon: '🏆', title: '清洁标准流程', desc: '专业培训标准作业' },
          { icon: '✨', title: '清洁彻底高效', desc: '高效工具深度清洁' },
          { icon: '📦', title: '分格收纳卫生', desc: '分类收纳整洁卫生' },
        ]),
      },
    });
  } catch (错误) {
    console.error('获取公开设置出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 验证卡密, 获取时间表, 提交订单, 获取公开设置 };
