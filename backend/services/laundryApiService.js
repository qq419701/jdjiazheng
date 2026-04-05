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
    outToken: 配置.laundry_out_token || '',
  };
};

/**
 * 判断HTTP错误是否为Token过期
 */
const 是Token过期错误 = (错误) => {
  if (错误.response?.status === 401) return true;
  const responseData = 错误.response?.data;
  if (responseData) {
    const code = responseData.code;
    if (code === 401 || code === 40001) return true;
    const msg = (responseData.message || '').toLowerCase();
    if (msg.includes('token') && (msg.includes('expired') || msg.includes('invalid') || msg.includes('过期'))) return true;
  }
  return false;
};

/**
 * 判断API响应体是否表明Token过期
 */
const 是响应Token过期 = (响应数据) => {
  const code = 响应数据.code;
  if (code === 401 || code === 40001) return true;
  const msg = (响应数据.message || '').toLowerCase();
  return msg.includes('token') && (msg.includes('expired') || msg.includes('invalid') || msg.includes('过期'));
};

/**
 * 清空Token缓存（强制下次重新获取）
 */
const 清空Token缓存 = () => {
  缓存Token = null;
  缓存TenantId = null;
  Token过期时间 = 0;
};


const 获取AccessToken = async (强制刷新 = false) => {
  const 当前时间 = Date.now();

  // 内存为空时，先尝试从数据库恢复
  if (!缓存Token && !强制刷新) {
    try {
      const 设置列表 = await Setting.findAll();
      const 配置 = {};
      设置列表.forEach(s => { 配置[s.key_name] = s.key_value; });
      const dbToken = 配置.laundry_access_token;
      const dbExpireAt = parseInt(配置.laundry_token_expire_at || '0');
      const dbTenantId = 配置.laundry_tenant_id;
      if (dbToken && dbExpireAt > 当前时间 + 5 * 60 * 1000) {
        缓存Token = dbToken;
        Token过期时间 = dbExpireAt;
        缓存TenantId = dbTenantId || null;
        console.log('✅ 从数据库恢复鲸蚁API Token，剩余有效时间:', Math.round((dbExpireAt - 当前时间) / 60000), '分钟');
      }
    } catch (dbErr) {
      console.warn('从数据库读取Token失败:', dbErr.message);
    }
  }

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

    缓存Token = 响应.data.data.access_token || 响应.data.data.accessToken;
    缓存TenantId = 响应.data.data.tenantId;
    // 2小时有效期
    Token过期时间 = 当前时间 + 2 * 60 * 60 * 1000;

    // 保存 tenantId、token、过期时间 到 Setting 表（持久化）
    try {
      const 过期时间字符串 = new Date(Token过期时间).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      await Setting.upsert({ key_name: 'laundry_tenant_id', key_value: String(缓存TenantId) });
      await Setting.upsert({ key_name: 'laundry_access_token', key_value: String(缓存Token) });
      await Setting.upsert({ key_name: 'laundry_token_expire_at', key_value: String(Token过期时间) });
      await Setting.upsert({ key_name: 'laundry_token_valid', key_value: '1' });
      await Setting.upsert({ key_name: 'laundry_token_expires', key_value: 过期时间字符串 });
    } catch (保存错误) {
      console.error('保存Token到设置表出错:', 保存错误.message);
    }

    console.log('✅ 鲸蚁API Token获取成功，tenantId:', 缓存TenantId);
    return { token: 缓存Token, tenantId: 缓存TenantId };
  } catch (错误) {
    console.error('获取鲸蚁API Token出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 从数据库恢复Token缓存到内存（服务启动时调用）
 */
const 恢复Token缓存 = async () => {
  await 获取AccessToken();
};

/**
 * 获取Token状态（供前端查询）
 */
const 获取Token状态 = async () => {
  const 设置列表 = await Setting.findAll();
  const cfg = {};
  设置列表.forEach(s => { cfg[s.key_name] = s.key_value; });
  const expireAt = parseInt(cfg.laundry_token_expire_at || '0');
  const now = Date.now();
  return {
    status: expireAt > now ? 'valid' : 'expired',
    expireAt,
    tenantId: cfg.laundry_tenant_id || '',
    remainMs: Math.max(0, expireAt - now),
  };
};

/**
 * 获取带鉴权请求头的axios实例
 * out-token 优先使用配置中的固定值，回退到动态 access_token
 */
const 获取请求头 = async () => {
  const { token, tenantId } = await 获取AccessToken();
  const { outToken } = await 读取API配置();
  return {
    'out-token': outToken || token,
    'tenant-id': tenantId,
    'Content-Type': 'application/json',
  };
};

/**
 * 推送预约单到鲸蚁（下单）
 * @param {Object} 订单数据 - 包含订单信息、取件地址、收件地址
 * @param {boolean} 已重试 - 内部重试标记，避免无限循环
 */
const 推送预约单 = async (订单数据, 已重试 = false) => {
  const { api地址, appId } = await 读取API配置();
  const 请求头 = await 获取请求头();

  try {
    const 响应 = await axios.post(
      `${api地址}/api/out/booking`,
      { app_id: appId, ...订单数据 },
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      if (!已重试 && 是响应Token过期(响应.data)) {
        清空Token缓存();
        await 获取AccessToken(true);
        return await 推送预约单(订单数据, true);
      }
      throw new Error(`推送预约单失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 鲸蚁预约单推送成功，鲸蚁订单号:', 响应.data.data?.id);
    return 响应.data.data;
  } catch (错误) {
    if (!已重试 && 是Token过期错误(错误)) {
      清空Token缓存();
      await 获取AccessToken(true);
      return await 推送预约单(订单数据, true);
    }
    console.error('推送预约单到鲸蚁出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 同步订单状态到鲸蚁
 * @param {string} out_order_no - 我方订单号
 * @param {string} out_booking_no - 我方预约号（B+订单号）
 * @param {number} status - -1已取消, 10已完成
 * @param {boolean} 已重试 - 内部重试标记
 */
const 同步订单状态 = async (out_order_no, out_booking_no, status, 已重试 = false) => {
  const { api地址, appId } = await 读取API配置();
  const 请求头 = await 获取请求头();

  try {
    const 响应 = await axios.post(
      `${api地址}/api/out/sync-status`,
      { app_id: appId, out_order_no, out_booking_no, status },
      { headers: 请求头, timeout: 10000 }
    );

    if (响应.data.code !== 0) {
      if (!已重试 && 是响应Token过期(响应.data)) {
        清空Token缓存();
        await 获取AccessToken(true);
        return await 同步订单状态(out_order_no, out_booking_no, status, true);
      }
      throw new Error(`同步状态失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 同步订单状态到鲸蚁成功:', out_order_no, status);
    return 响应.data.data;
  } catch (错误) {
    if (!已重试 && 是Token过期错误(错误)) {
      清空Token缓存();
      await 获取AccessToken(true);
      return await 同步订单状态(out_order_no, out_booking_no, status, true);
    }
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
 * @param {boolean} 已重试 - 内部重试标记
 */
const 修改预约单 = async (out_order_no, out_booking_no, visit_date, visit_start, visit_end, 取件地址, 收件地址, 已重试 = false) => {
  const { api地址 } = await 读取API配置();
  const 请求头 = await 获取请求头();

  // 修复：根据鲸蚁API文档，/api/out/update-booking 的 app_id 字段已弃用，不传
  // 订单字段放在 order_info 对象内，取件/收件地址分别用 address_info/back_address_info
  try {
    const 请求体 = {
      order_info: {
        out_order_no,
        out_booking_no,
        day: visit_date,
        start_time: visit_start,
        end_time: visit_end,
      },
    };
    if (取件地址) 请求体.address_info = 取件地址;
    if (收件地址) 请求体.back_address_info = 收件地址;

    const 响应 = await axios.post(
      `${api地址}/api/out/update-booking`,
      请求体,
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      if (!已重试 && 是响应Token过期(响应.data)) {
        清空Token缓存();
        await 获取AccessToken(true);
        return await 修改预约单(out_order_no, out_booking_no, visit_date, visit_start, visit_end, 取件地址, 收件地址, true);
      }
      throw new Error(`修改预约单失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 修改预约单成功:', out_order_no);
    return 响应.data.data;
  } catch (错误) {
    if (!已重试 && 是Token过期错误(错误)) {
      清空Token缓存();
      await 获取AccessToken(true);
      return await 修改预约单(out_order_no, out_booking_no, visit_date, visit_start, visit_end, 取件地址, 收件地址, true);
    }
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

module.exports = { 获取AccessToken, 恢复Token缓存, 获取Token状态, 推送预约单, 同步订单状态, 修改预约单, 测试API连接 };
