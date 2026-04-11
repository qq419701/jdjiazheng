// 洗衣服务H5前端接口控制器
const { Op } = require('sequelize');
const { Card, Order, Setting, TimeRule } = require('../models');
const { 验证卡密有效性 } = require('../services/cardService');
const { 生成订单号, 验证手机号, 安全解析JSON } = require('../utils/helpers');
const { 推送预约单, 获取AccessToken } = require('../services/laundryApiService');

/**
 * 验证洗衣卡密
 * GET /api/xi/verify-card/:code
 */
const 验证洗衣卡密 = async (req, res) => {
  try {
    const { code } = req.params;
    const 结果 = await 验证卡密有效性(code);

    if (!结果.有效) {
      if (结果.原因 === '卡密已被使用') {
        let order_no = ''
        try {
          const 关联订单 = await Order.findOne({
            where: { card_code: 结果.卡密?.code, business_type: 'xiyifu' },
            order: [['created_at', 'DESC']],
            attributes: ['order_no'],
          })
          if (关联订单) order_no = 关联订单.order_no
        } catch (e) {
          console.error('查询关联订单号失败:', e.message)
        }
        return res.json({ code: 2, message: '卡密已被使用', data: { used: true, card_code: 结果.卡密?.code || '', order_no } });
      }
      if (结果.原因 === '卡密已失效') {
        return res.json({ code: 3, message: '卡密已作废', data: null });
      }
      return res.json({ code: 0, message: 结果.原因, data: null });
    }

    // 检查是洗衣卡密
    if (结果.卡密.business_type !== 'xiyifu') {
      return res.json({ code: 0, message: '此卡密不适用于洗衣服务', data: null });
    }

    // 获取洗衣相关设置
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    return res.json({
      code: 1,
      message: '卡密有效',
      data: {
        card_code: 结果.卡密.code,
        category: 结果.卡密.category,
        product_name: 结果.卡密.service_type || 设置对象.laundry_product_name || '任洗一件',
        product_price: parseInt(设置对象.laundry_product_price) || 0,
        banner_url: 设置对象.laundry_banner_url || '',
        title: 设置对象.laundry_title || '优米拉洗衣服务',
        subtitle1: 设置对象.laundry_subtitle1 || '京东快递免费取送 专业洗护',
        subtitle2: 设置对象.laundry_subtitle2 || '',
        notice: 设置对象.laundry_notice || '',
        service_content: 安全解析JSON(设置对象.laundry_service_content, []),
        popup_config: {
          xi_popup1_enabled: 设置对象.xi_popup1_enabled || '0',
          xi_popup1_title: 设置对象.xi_popup1_title || '温馨提醒',
          xi_popup1_content: 设置对象.xi_popup1_content || '目前订单量大，可能洗护时间延长，请您耐心等待。',
          xi_popup1_icon: 设置对象.xi_popup1_icon || '⚠️',
          xi_popup1_title_color: 设置对象.xi_popup1_title_color || '#1989fa',
          xi_popup1_content_color: 设置对象.xi_popup1_content_color || '#333333',
          xi_popup1_btn_text: 设置对象.xi_popup1_btn_text || '我知道了',
          xi_popup1_btn_color: 设置对象.xi_popup1_btn_color || '#1989fa',
          xi_popup1_btn_size: 设置对象.xi_popup1_btn_size || 'large',
          xi_popup1_auto_close: 设置对象.xi_popup1_auto_close || '0',
          xi_popup1_bg_color: 设置对象.xi_popup1_bg_color || '#ffffff',
          xi_popup2_enabled: 设置对象.xi_popup2_enabled || '0',
          xi_popup2_title: 设置对象.xi_popup2_title || '取件时间说明',
          xi_popup2_content: 设置对象.xi_popup2_content || '选择的取件时间为预计取件时间，实际可能因物流情况有所延误。',
          xi_popup2_icon: 设置对象.xi_popup2_icon || '📦',
          xi_popup2_title_color: 设置对象.xi_popup2_title_color || '#1989fa',
          xi_popup2_content_color: 设置对象.xi_popup2_content_color || '#333333',
          xi_popup2_btn_text: 设置对象.xi_popup2_btn_text || '我知道了',
          xi_popup2_btn_color: 设置对象.xi_popup2_btn_color || '#1989fa',
          xi_popup2_btn_size: 设置对象.xi_popup2_btn_size || 'large',
          xi_popup2_auto_close: 设置对象.xi_popup2_auto_close || '0',
          xi_popup2_bg_color: 设置对象.xi_popup2_bg_color || '#ffffff',
        },
      },
    });
  } catch (错误) {
    console.error('验证洗衣卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取洗衣预约时间段
 * GET /api/xi/time-slots?city=xxx
 * 时间段格式：09:00-10:00，含 label/start/end 三个字段
 */
const 获取洗衣时间表 = async (req, res) => {
  try {
    const { city = '' } = req.query;

    // 查找洗衣时间规则（business_type='xiyifu'）
    let 规则 = null;
    if (city) {
      规则 = await TimeRule.findOne({
        where: {
          business_type: 'xiyifu',
          rule_type: 'city',
          is_active: 1,
          match_value: { [Op.like]: `%${city}%` },
        },
        order: [['sort_order', 'ASC']],
      });
    }
    if (!规则) {
      规则 = await TimeRule.findOne({
        where: { business_type: 'xiyifu', rule_type: 'global', is_active: 1 },
        order: [['sort_order', 'ASC']],
      });
    }
    if (!规则) {
      规则 = await TimeRule.findOne({
        where: { business_type: 'xiyifu', is_active: 1 },
        order: [['sort_order', 'ASC']],
      });
    }

    if (!规则) {
      // 无规则时返回默认时间段
      const 默认时间段 = [
        { label: '09:00-10:00', start: '09:00:00', end: '10:00:00' },
        { label: '10:00-11:00', start: '10:00:00', end: '11:00:00' },
        { label: '11:00-12:00', start: '11:00:00', end: '12:00:00' },
        { label: '14:00-15:00', start: '14:00:00', end: '15:00:00' },
        { label: '15:00-16:00', start: '15:00:00', end: '16:00:00' },
        { label: '16:00-17:00', start: '16:00:00', end: '17:00:00' },
      ];
      return res.json({ code: 1, message: '获取成功（默认时间段）', data: 默认时间段 });
    }

    // 解析时间段（格式：09:00-10:00 或 09:00）
    const 原始时间段 = 安全解析JSON(规则.time_slots, []);
    const 时间段列表 = 原始时间段.map(时间 => {
      if (时间.includes('-')) {
        // 格式：09:00-10:00
        const [开始, 结束] = 时间.split('-');
        return {
          label: 时间,
          start: 开始.trim() + ':00',
          end: 结束.trim() + ':00',
        };
      } else {
        // 格式：09:00（单个时间，结束时间+1小时）
        const [小时, 分钟] = 时间.split(':').map(Number);
        const 结束小时 = String(小时 + 1).padStart(2, '0');
        return {
          label: `${时间}-${结束小时}:${String(分钟).padStart(2, '0')}`,
          start: `${时间}:00`,
          end: `${结束小时}:${String(分钟).padStart(2, '0')}:00`,
        };
      }
    });

    res.json({ code: 1, message: '获取成功', data: 时间段列表 });
  } catch (错误) {
    console.error('获取洗衣时间表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 提交洗衣订单
 * POST /api/xi/orders
 * 支持取件/收件地址分开，自动下单（如配置开启）
 */
const 提交洗衣订单 = async (req, res) => {
  try {
    const {
      card_code,
      name, phone, province, city, district, street, address,
      return_name, return_phone, return_province, return_city,
      return_district, return_address,
      visit_date, visit_time_label, visit_time_start, visit_time_end,
    } = req.body;

    // 基础参数验证
    if (!card_code || !name || !phone || !province || !city || !district || !address) {
      return res.json({ code: 0, message: '请填写完整取件信息' });
    }
    if (!验证手机号(phone)) {
      return res.json({ code: 0, message: '取件手机号格式不正确' });
    }
    if (!visit_date || !visit_time_start || !visit_time_end) {
      return res.json({ code: 0, message: '请选择取件时间' });
    }

    // 验证卡密（必须是洗衣卡密）
    const 卡密验证结果 = await 验证卡密有效性(card_code);
    if (!卡密验证结果.有效) {
      return res.json({ code: 0, message: `卡密无效：${卡密验证结果.原因}` });
    }
    const 卡密 = 卡密验证结果.卡密;
    if (卡密.business_type !== 'xiyifu') {
      return res.json({ code: 0, message: '此卡密不适用于洗衣服务' });
    }

    // 获取设置
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    // 收件地址（若为空则与取件相同）
    const 实际收件姓名 = return_name || name;
    const 实际收件手机 = return_phone || phone;
    const 实际收件省 = return_province || province;
    const 实际收件市 = return_city || city;
    const 实际收件区 = return_district || district;
    const 实际收件地址 = return_address || address;

    // 生成订单号
    const 订单号 = 生成订单号();
    const 完整取件地址 = `${province}${city}${district}${street || ''}${address}`;

    // 创建订单
    const 新订单 = await Order.create({
      order_no: 订单号,
      card_code: 卡密.code,
      name, phone, province, city, district,
      street: street || null,
      address,
      full_address: 完整取件地址,
      return_name: 实际收件姓名,
      return_phone: 实际收件手机,
      return_province: 实际收件省,
      return_city: 实际收件市,
      return_district: 实际收件区,
      return_address: 实际收件地址,
      visit_date,
      visit_time: visit_time_label || `${visit_time_start}-${visit_time_end}`,
      visit_time_start: visit_time_start || null,
      visit_time_end: visit_time_end || null,
      service_type: 卡密.service_type || 设置对象.laundry_product_name || '任洗一件',
      business_type: 'xiyifu',
      status: 0,
      ecommerce_order_no: 卡密.ecommerce_order_no || null,
      created_at: new Date(),
      order_log: JSON.stringify([{
        时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        操作: '客户提交洗衣预约订单',
        状态: 'success',
      }]),
    });

    // 标记卡密为已使用
    await 卡密.update({ status: 1, used_at: new Date(), used_by_order: 新订单.id });

    // [说明] 自动下单开关（laundry_auto_order_enabled=1 时启用）
    // 使用 setImmediate 异步执行，不阻塞用户下单响应
    // 若未启用自动下单，订单停留在 status=0（待处理），需管理员在后台手动触发
    // 执行洗衣下单内部 内部已处理成功/失败的状态更新和日志记录
    if (设置对象.laundry_auto_order_enabled === '1') {
      // 异步触发，不阻塞响应
      setImmediate(async () => {
        try {
          await 执行洗衣下单内部(新订单, 设置对象, visit_time_start, visit_time_end);
        } catch (错误) {
          console.error('自动洗衣下单失败:', 错误.message);
        }
      });
    }

    return res.json({
      code: 1,
      message: '预约成功',
      data: {
        order_no: 订单号,
        name, phone,
        full_address: 完整取件地址,
        visit_date,
        visit_time: visit_time_label || `${visit_time_start}-${visit_time_end}`,
        product_name: 卡密.service_type || 设置对象.laundry_product_name || '任洗一件',
        // 收件地址（供成功页展示）
        return_name: return_name || '',
        return_phone: return_phone || '',
        return_province: return_province || '',
        return_city: return_city || '',
        return_district: return_district || '',
        return_address: return_address || '',
      },
    });
  } catch (错误) {
    console.error('提交洗衣订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 内部执行洗衣下单（推送到鲸蚁）
 * 完整流程：
 * 1. 将订单状态更新为 status=1（推送中），防止重复触发
 * 2. 推送前预热Token：确保内存中有有效Token，避免首次下单因Token缺失失败
 * 3. 构建鲸蚁API所需的完整参数结构（order_info / address_info / back_address_info）
 * 4. 调用 推送预约单 推送到鲸蚁，推送成功后将订单状态更新为 status=1（处理中，等待鲸蚁回调）
 * 5. 推送失败时记录失败原因，将订单状态更新为 status=5（失败），写入操作日志
 * @param {Object} 订单 - Sequelize Order 实例
 * @param {Object} 设置对象 - 系统设置键值对
 * @param {string} 开始时间 - 取件开始时间 HH:mm:ss
 * @param {string} 结束时间 - 取件结束时间 HH:mm:ss
 */
const 执行洗衣下单内部 = async (订单, 设置对象, 开始时间, 结束时间) => {
  // 步骤1：将订单状态置为 status=1（推送中），防止管理员重复触发
  await 订单.update({ status: 1 });

  try {
    // 步骤2：推送前预热Token，确保内存中有有效Token，避免重启后首次下单失败
    await 获取AccessToken();

    const 商品名 = 订单.service_type || 设置对象.laundry_product_name || '任洗一件';
    const 商品价格 = parseInt(设置对象.laundry_product_price) || 0;

    // 步骤3：构建时间字符串，格式必须为 YYYY-MM-DD HH:mm:ss（月日补零）
    // [修复] 使用 en-US locale 配合手动补零，确保格式为 YYYY-MM-DD HH:mm:ss
    // 原代码 zh-CN toLocaleString 会生成 2026-4-5 格式（月日不补零），鲸蚁API会解析失败
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const pad = n => String(n).padStart(2, '0');
    const 现在时间 = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // 步骤4：构建鲸蚁API所需的完整参数结构（order_info / address_info / back_address_info）
    const 鲸蚁参数 = {
      order_info: {
        out_order_no: 订单.order_no,
        out_booking_no: `B${订单.order_no}`,
        day: 订单.visit_date,
        start_time: 开始时间 || '09:00:00',
        end_time: 结束时间 || '10:00:00',
        product_name: 商品名,
        desc: 订单.remark || '',
        // 修复：type 从配置项读取，默认50（微信小程序），鲸蚁API要求此字段为有效平台值
        type: parseInt(设置对象.laundry_order_type) || 50,
        create_time: 现在时间,
        pay_time: 现在时间,
        order_price: 商品价格,
        pay_price: 商品价格,
        item_order: [{ good_name: 商品名, price: 商品价格, quantity: 1 }],
      },
      address_info: {
        contact: 订单.name,
        phone: 订单.phone,
        province: 订单.province,
        city: 订单.city,
        district: 订单.district,
        address: 订单.address,
      },
      back_address_info: {
        contact: 订单.return_name || 订单.name,
        phone: 订单.return_phone || 订单.phone,
        province: 订单.return_province || 订单.province,
        city: 订单.return_city || 订单.city,
        district: 订单.return_district || 订单.district,
        address: 订单.return_address || 订单.address,
      },
    };

    // 步骤5：推送成功后更新订单状态为处理中（status=1），等待鲸蚁回调确认分配
    const 结果 = await 推送预约单(鲸蚁参数);
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `预约单已推送到鲸蚁，鲸蚁订单号：${结果?.id || '(待鲸蚁分配)'}`,
      状态: 'success',
    });

    // 鲸蚁文档说返回 data.id，但实际当前版本可能不返回（官方确认中）
    // 先用 out_order_no 作为本地标识，等鲸蚁回调分配后更新 laundry_order_id
    const 鲸蚁订单号 = 结果?.id || 结果?.orderId || 结果?.order_id || '';
    await 订单.update({
      status: 1,
      laundry_order_id: String(鲸蚁订单号),
      laundry_status: '已提交',  // 鲸蚁回调 status=1（已分配）时 order.status 会更新为 2（服务中）
      order_log: JSON.stringify(现有日志),
    });
  } catch (下单错误) {
    // 步骤6：推送失败，记录失败原因，将订单状态更新为 status=5（失败）
    console.error('洗衣自动下单出错:', 下单错误.message);
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: `鲸蚁下单失败：${下单错误.message}`,
      状态: 'error',
    });
    await 订单.update({
      status: 5,
      fail_reason: 下单错误.message,
      order_log: JSON.stringify(现有日志),
    });
  }
};

/**
 * 查询洗衣订单状态（H5前端用）
 * GET /api/xi/orders/:orderNo/express-routes
 * 无需鉴权，通过订单号查询
 */
const 查询洗衣订单状态 = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const 订单 = await Order.findOne({ where: { order_no: orderNo, business_type: 'xiyifu' } });
    if (!订单) return res.json({ code: 0, message: '订单不存在' });

    const { 安全解析JSON: 解析 } = require('../utils/helpers');
    const { 查询物流轨迹 } = require('../services/laundryApiService');

    const 取件单号 = 订单.express_waybill_code || 订单.express_order_id || null;
    const 回寄单号 = 订单.return_waybill_code || null;

    let pickup_route = null;
    let return_route = null;

    if (取件单号) {
      try {
        pickup_route = await 查询物流轨迹(取件单号);
      } catch (e) {
        console.error('H5查取件物流失败:', e.message);
      }
    }

    if (回寄单号) {
      try {
        return_route = await 查询物流轨迹(回寄单号);
      } catch (e) {
        console.error('H5查回寄物流失败:', e.message);
      }
    }

    const 结果 = {
      order_no: 订单.order_no,
      name: 订单.name,
      service_type: 订单.service_type,
      visit_date: 订单.visit_date,
      visit_time: 订单.visit_time,
      laundry_status: 订单.laundry_status,
      factory_name: 订单.factory_name,
      laundry_images: 解析(订单.laundry_images, []),
      express_order_id: 取件单号,
      return_waybill_code: 回寄单号,
      pickup_route,
      return_route,
    };

    res.json({ code: 1, message: '查询成功', data: 结果 });
  } catch (错误) {
    console.error('查询洗衣订单状态出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 验证洗衣卡密, 获取洗衣时间表, 提交洗衣订单, 执行洗衣下单内部, 查询洗衣订单状态 };
