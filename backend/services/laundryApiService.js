// 鲸蚁生活洗护API服务
const axios = require('axios');
const { Setting } = require('../models');

// 内存缓存 token（2小时有效期，提前5分钟刷新）
let 缓存Token = null;
let 缓存TenantId = null;
let Token过期时间 = 0;

/**
 * 读取洗衣API配置
 */
const 读取API配置 = async () => {
  const 设置列表 = await Setting.findAll();
  const 配置 = {};
  设置列表.forEach(s => { 配置[s.key_name] = s.key_value; });
  return {
    api地址: 配置.laundry_api_url || '',
    appId: 配置.laundry_app_id || '',
    appSecret: 配置.laundry_app_secret || '',
  };
};

/**
 * 获取或刷新 AccessToken（内存缓存，提前5分钟刷新）
 */
const 获取AccessToken = async (强制刷新 = false) => {
  const 当前时间 = Date.now();
  // 如果缓存有效且不强制刷新，直接返回
  if (!强制刷新 && 缓存Token && 当前时间 < Token过期时间 - 5 * 60 * 1000) {
    return { token: 缓存Token, tenantId: 缓存TenantId };
  }

  const { api地址, appId, appSecret } = await 读取API配置();
  if (!api地址 || !appId || !appSecret) {
    throw new Error('洗衣API配置不完整，请在系统设置中填写 API地址/AppID/AppSecret');
  }

  try {
    const 响应 = await axios.post(`${api地址}/api/oauth/token`, {
      app_id: appId,
      app_secret: appSecret,
    }, { timeout: 10000 });

    if (响应.data.code !== 0) {
      throw new Error(`获取Token失败：${JSON.stringify(响应.data)}`);
    }

    缓存Token = 响应.data.data.access_token;
    缓存TenantId = 响应.data.data.tenantId;
    // 2小时有效期
    Token过期时间 = 当前时间 + 2 * 60 * 60 * 1000;

    // 保存 tenantId 到 Setting 表
    try {
      await Setting.upsert({ key_name: 'laundry_tenant_id', key_value: String(缓存TenantId) });
    } catch (保存错误) {
      console.error('保存tenantId到设置表出错:', 保存错误.message);
    }

    console.log('✅ 鲸蚁API Token获取成功，tenantId:', 缓存TenantId);
    return { token: 缓存Token, tenantId: 缓存TenantId };
  } catch (错误) {
    console.error('获取鲸蚁API Token出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 获取带鉴权请求头的axios实例
 */
const 获取请求头 = async () => {
  const { token, tenantId } = await 获取AccessToken();
  return {
    'out-token': token,
    'tenant-id': tenantId,
    'Content-Type': 'application/json',
  };
};

/**
 * 推送预约单到鲸蚁（下单）
 * @param {Object} 订单数据 - 包含订单信息、取件地址、收件地址
 */
const 推送预约单 = async (订单数据) => {
  const { api地址, appId } = await 读取API配置();
  const 请求头 = await 获取请求头();

  try {
    const 响应 = await axios.post(
      `${api地址}/api/out/booking`,
      { app_id: appId, ...订单数据 },
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      throw new Error(`推送预约单失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 鲸蚁预约单推送成功，鲸蚁订单号:', 响应.data.data?.id);
    return 响应.data.data;
  } catch (错误) {
    console.error('推送预约单到鲸蚁出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 同步订单状态到鲸蚁
 * @param {string} out_order_no - 我方订单号
 * @param {string} out_booking_no - 我方预约号（B+订单号）
 * @param {number} status - -1已取消, 10已完成
 */
const 同步订单状态 = async (out_order_no, out_booking_no, status) => {
  const { api地址, appId } = await 读取API配置();
  const 请求头 = await 获取请求头();

  try {
    const 响应 = await axios.post(
      `${api地址}/api/out/sync-status`,
      { app_id: appId, out_order_no, out_booking_no, status },
      { headers: 请求头, timeout: 10000 }
    );

    if (响应.data.code !== 0) {
      throw new Error(`同步状态失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 同步订单状态到鲸蚁成功:', out_order_no, status);
    return 响应.data.data;
  } catch (错误) {
    console.error('同步订单状态到鲸蚁出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 修改预约单（管理员修改订单后同步到鲸蚁）
 * POST /api/out/update-booking
 * @param {string} out_order_no - 我方订单号
 * @param {string} out_booking_no - 我方预约号（B+订单号）
 * @param {string} visit_date - 新预约日期 YYYY-MM-DD
 * @param {string} visit_start - 新取件开始时间 HH:mm:ss
 * @param {string} visit_end - 新取件结束时间 HH:mm:ss
 * @param {Object} 取件地址 - 取件地址信息
 * @param {Object} 收件地址 - 收件地址信息
 */
const 修改预约单 = async (out_order_no, out_booking_no, visit_date, visit_start, visit_end, 取件地址, 收件地址) => {
  const { api地址, appId } = await 读取API配置();
  const 请求头 = await 获取请求头();

  try {
    const 请求体 = {
      app_id: appId,
      out_order_no,
      out_booking_no,
      day: visit_date,
      start_time: visit_start,
      end_time: visit_end,
    };
    if (取件地址) 请求体.address_info = 取件地址;
    if (收件地址) 请求体.back_address_info = 收件地址;

    const 响应 = await axios.post(
      `${api地址}/api/out/update-booking`,
      请求体,
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      throw new Error(`修改预约单失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 修改预约单成功:', out_order_no);
    return 响应.data.data;
  } catch (错误) {
    console.error('修改预约单到鲸蚁出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 测试API连接（强制刷新Token验证配置是否正确）
 */
const 测试API连接 = async () => {
  return await 获取AccessToken(true);
};

module.exports = { 获取AccessToken, 推送预约单, 同步订单状态, 修改预约单, 测试API连接 };
