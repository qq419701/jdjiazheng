// 鲸蚁快递API服务（独立凭证，独立Token缓存）
// 注意：快递API返回的Token字段是 accessToken（驼峰），而非 access_token
const axios = require('axios');
const { Setting } = require('../models');

// 内存缓存快递Token（2小时有效，提前5分钟刷新）
let 缓存快递Token = null;
let 缓存快递TenantId = null;
let 快递Token过期时间 = 0;

/**
 * 读取快递API配置（从Setting表读取）
 * 配置项：express_api_url / express_app_id / express_app_secret / express_type
 */
const 读取快递API配置 = async () => {
  const 设置列表 = await Setting.findAll();
  const 配置 = {};
  设置列表.forEach(s => { 配置[s.key_name] = s.key_value; });
  return {
    api地址: 配置.express_api_url || '',
    appId: 配置.express_app_id || '',
    appSecret: 配置.express_app_secret || '',
    快递类型: 配置.express_type || '20',
  };
};

/**
 * 获取或刷新快递AccessToken（内存缓存，提前5分钟刷新）
 * @param {boolean} 强制刷新 - 是否强制重新获取Token
 * 注意：快递API返回的token字段名是 accessToken（驼峰），与订单API的 access_token 不同
 */
const 获取快递AccessToken = async (强制刷新 = false) => {
  const 当前时间 = Date.now();
  // 如果缓存有效且不强制刷新，直接返回
  if (!强制刷新 && 缓存快递Token && 当前时间 < 快递Token过期时间 - 5 * 60 * 1000) {
    return { token: 缓存快递Token, tenantId: 缓存快递TenantId };
  }

  const { api地址, appId, appSecret } = await 读取快递API配置();
  if (!api地址 || !appId || !appSecret) {
    throw new Error('快递API配置不完整，请在系统设置中填写 快递API地址/AppID/AppSecret');
  }

  try {
    const 响应 = await axios.post(`${api地址}/api/oauth/token`, {
      app_id: appId,
      app_secret: appSecret,
    }, { timeout: 10000 });

    if (响应.data.code !== 0) {
      throw new Error(`获取快递Token失败：${JSON.stringify(响应.data)}`);
    }

    // 快递API返回的是 accessToken（驼峰），区别于洗衣订单API的 access_token
    缓存快递Token = 响应.data.data.accessToken || 响应.data.data.access_token;
    缓存快递TenantId = 响应.data.data.tenantId;
    // 2小时有效期
    快递Token过期时间 = 当前时间 + 2 * 60 * 60 * 1000;

    console.log('✅ 快递API Token获取成功，tenantId:', 缓存快递TenantId);
    return { token: 缓存快递Token, tenantId: 缓存快递TenantId };
  } catch (错误) {
    console.error('获取快递API Token出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 获取快递API请求头（含 out-token 和 tenant-id）
 */
const 获取快递请求头 = async () => {
  const { token, tenantId } = await 获取快递AccessToken();
  return {
    'out-token': token,
    'tenant-id': tenantId,
    'Content-Type': 'application/json',
  };
};

/**
 * 查询物流路由（取件/回寄快递轨迹）
 * GET /api/get-route-by-waybill-code/:waybillCode（快递API独立系统路径，无 out-express 前缀）
 * @param {string} waybillCode - 快递单号
 * @returns {Object} 含快递员姓名/电话/路由列表
 */
const 查询物流路由 = async (waybillCode) => {
  if (!waybillCode) throw new Error('快递单号不能为空');
  const { api地址 } = await 读取快递API配置();
  if (!api地址) throw new Error('快递API地址未配置');

  const 请求头 = await 获取快递请求头();
  try {
    const 响应 = await axios.get(
      `${api地址}/api/get-route-by-waybill-code/${encodeURIComponent(waybillCode)}`,
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      throw new Error(`查询物流路由失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 查询物流路由成功:', waybillCode);
    return 响应.data.data;
  } catch (错误) {
    // Token过期时尝试刷新重试
    if (错误.response?.status === 401 || (错误.message && 错误.message.includes('401'))) {
      console.log('快递Token过期，尝试刷新...');
      缓存快递Token = null;
      快递Token过期时间 = 0;
      const 新请求头 = await 获取快递请求头();
      const 重试响应 = await axios.get(
        `${api地址}/api/get-route-by-waybill-code/${encodeURIComponent(waybillCode)}`,
        { headers: 新请求头, timeout: 15000 }
      );
      if (重试响应.data.code !== 0) {
        throw new Error(`查询物流路由失败：${JSON.stringify(重试响应.data)}`);
      }
      return 重试响应.data.data;
    }
    console.error('查询物流路由出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 创建快递单（取件快递）
 * POST /api/out-express
 * @param {Object} 快递数据 - 含 pickupStartTime/expressType/type/goodsTypeText/cargoes/remark
 * @returns {Object} 含 waybillCode 等快递单信息
 */
const 创建快递 = async (快递数据) => {
  const { api地址, 快递类型 } = await 读取快递API配置();
  if (!api地址) throw new Error('快递API地址未配置');

  const 请求头 = await 获取快递请求头();
  try {
    const 请求体 = {
      expressType: parseInt(快递类型) || 20, // 默认20=京东快递
      type: 10,                               // 10=取件
      ...快递数据,
    };
    const 响应 = await axios.post(
      `${api地址}/api/out-express`,
      请求体,
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      throw new Error(`创建快递失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 创建快递成功，快递单号:', 响应.data.data?.waybillCode);
    return 响应.data.data;
  } catch (错误) {
    console.error('创建快递出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 取消快递
 * GET /api/out-express/cancel/:waybillCode
 * @param {string} waybillCode - 要取消的快递单号
 */
const 取消快递 = async (waybillCode) => {
  if (!waybillCode) throw new Error('快递单号不能为空');
  const { api地址 } = await 读取快递API配置();
  if (!api地址) throw new Error('快递API地址未配置');

  const 请求头 = await 获取快递请求头();
  try {
    const 响应 = await axios.get(
      `${api地址}/api/out-express/cancel/${encodeURIComponent(waybillCode)}`,
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      throw new Error(`取消快递失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 取消快递成功:', waybillCode);
    return 响应.data.data;
  } catch (错误) {
    console.error('取消快递出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 打印面单
 * POST /api/out-express/print-waybill/
 * @param {string} waybillCode - 快递单号
 * @returns {Object} 面单打印数据（如PDF URL或base64）
 */
const 打印面单 = async (waybillCode) => {
  if (!waybillCode) throw new Error('快递单号不能为空');
  const { api地址 } = await 读取快递API配置();
  if (!api地址) throw new Error('快递API地址未配置');

  const 请求头 = await 获取快递请求头();
  try {
    const 响应 = await axios.post(
      `${api地址}/api/out-express/print-waybill/`,
      { waybillCode },
      { headers: 请求头, timeout: 15000 }
    );

    if (响应.data.code !== 0) {
      throw new Error(`打印面单失败：${JSON.stringify(响应.data)}`);
    }

    console.log('✅ 打印面单成功:', waybillCode);
    return 响应.data.data;
  } catch (错误) {
    console.error('打印面单出错:', 错误.message);
    throw 错误;
  }
};

/**
 * 测试快递API连接（强制刷新Token）
 */
const 测试快递API连接 = async () => {
  return await 获取快递AccessToken(true);
};

module.exports = { 读取快递API配置, 获取快递AccessToken, 查询物流路由, 创建快递, 取消快递, 打印面单, 测试快递API连接 };
