// 企业微信服务
// 处理三角洲业务的企业微信联系方式生成、备注、欢迎语、建群等操作
const axios = require('axios');
const crypto = require('crypto');
const { Setting } = require('../models');

// ===== AccessToken 内存缓存（7000秒有效期）=====
let 缓存Token = null;
let 缓存过期时间 = 0;

/**
 * 从 Setting 表读取企业微信配置
 * @returns {Object} 配置键值对
 */
const 获取QyWxSettings = async () => {
  const 设置列表 = await Setting.findAll();
  const 设置对象 = {};
  设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });
  return 设置对象;
};

/**
 * 获取企业微信 AccessToken（带7000秒内存缓存）
 * @returns {string} access_token
 */
const 获取AccessToken = async () => {
  const 当前时间 = Date.now();
  if (缓存Token && 当前时间 < 缓存过期时间) {
    return 缓存Token;
  }
  const 配置 = await 获取QyWxSettings();
  const corpid = 配置.qywx_corpid;
  const secret = 配置.qywx_secret;
  if (!corpid || !secret) {
    throw new Error('企业微信未配置 corpid 或 secret');
  }
  const 响应 = await axios.get(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(corpid)}&corpsecret=${encodeURIComponent(secret)}`,
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    throw new Error(`企业微信获取Token失败: ${响应.data.errmsg}`);
  }
  缓存Token = 响应.data.access_token;
  // 企业微信 Token 有效期7200秒，缓存7000秒确保安全
  缓存过期时间 = 当前时间 + 7000 * 1000;
  return 缓存Token;
};

/**
 * 轮询分配员工（round_robin 或 first 模式）
 * @param {string} user_ids_str 逗号分隔的员工userid
 * @param {string} assign_mode round_robin/first
 * @param {string} 订单号 用于round_robin取模
 * @returns {string} 员工userid
 */
const 分配员工 = (user_ids_str, assign_mode, 订单号) => {
  const ids = (user_ids_str || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!ids.length) return '';
  if (assign_mode === 'first') return ids[0];
  // round_robin：用订单号最后几位数字取模
  const 数字部分 = (订单号 || '').replace(/\D/g, '').slice(-6) || '0';
  const 索引 = parseInt(数字部分) % ids.length;
  return ids[索引];
};

/**
 * 生成专属联系方式
 * 调用 /externalcontact/add_contact_way，返回 {config_id, qr_code, link, assigned_user}
 * @param {string} 订单号
 * @returns {Object} { config_id, qr_code, link, assigned_user }
 */
const 生成专属联系方式 = async (订单号) => {
  const 配置 = await 获取QyWxSettings();
  const token = await 获取AccessToken();
  const 员工ID = 分配员工(配置.qywx_user_ids, 配置.qywx_user_assign_mode, 订单号);
  if (!员工ID) {
    throw new Error('企业微信未配置员工UserID');
  }

  const 模式 = 配置.qywx_add_friend_mode || 'link';
  // type=1 单人，type=2 多人；state格式：SJZ_订单号_员工ID
  const state = `SJZ_${订单号}_${员工ID}`;

  const 请求体 = {
    type: 1,
    scene: 2,  // 2=小程序/网页，1=配置页面
    style: 1,
    remark: `三角洲订单${订单号}`,
    skip_verify: true,
    state,
    user: [员工ID],
    is_temp: true,  // 临时联系方式
    expires_in: 7 * 24 * 3600,  // 7天有效
    chat_type: 'single',
  };

  const 响应 = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/add_contact_way?access_token=${token}`,
    请求体,
    { timeout: 8000 }
  );

  if (响应.data.errcode !== 0) {
    throw new Error(`生成联系方式失败: ${响应.data.errmsg}`);
  }

  return {
    config_id: 响应.data.config_id || '',
    qr_code: 响应.data.qr_code || '',
    link: 响应.data.link || '',
    assigned_user: 员工ID,
  };
};

/**
 * 自动备注客户
 * @param {string} 员工userid
 * @param {string} external_userid 客户外部userid
 * @param {string} 备注内容
 */
const 自动备注客户 = async (员工userid, external_userid, 备注内容) => {
  const token = await 获取AccessToken();
  const 响应 = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/remark?access_token=${token}`,
    {
      userid: 员工userid,
      external_userid,
      remark: 备注内容,
    },
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    console.warn('[企业微信] 备注客户失败:', 响应.data.errmsg);
  }
};

/**
 * 发送欢迎语
 * @param {string} welcome_code 企业微信回调中携带的 WelcomeCode
 * @param {string} 文字内容
 */
const 发送欢迎语 = async (welcome_code, 文字内容) => {
  const token = await 获取AccessToken();
  const 响应 = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/send_welcome_msg?access_token=${token}`,
    {
      welcome_code,
      text: { content: 文字内容 },
    },
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    console.warn('[企业微信] 发送欢迎语失败:', 响应.data.errmsg);
  }
};

/**
 * 创建客户群
 * @param {string} 群名称
 * @param {string} 群主userid
 * @param {Array<string>} 员工列表
 * @returns {string} chatid
 */
const 创建客户群 = async (群名称, 群主, 员工列表) => {
  const token = await 获取AccessToken();
  const chatid = `sjz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const 响应 = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/appchat/create?access_token=${token}`,
    {
      name: 群名称,
      owner: 群主,
      userlist: 员工列表,
      chatid,
    },
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    throw new Error(`创建客户群失败: ${响应.data.errmsg}`);
  }
  return chatid;
};

/**
 * 更新客户群信息（重命名群）
 * 调用 /appchat/update，支持修改群名称
 * @param {string} chatid 群ID
 * @param {string} 新群名称
 */
const 更新群信息 = async (chatid, 新群名称) => {
  const token = await 获取AccessToken();
  const 响应 = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/appchat/update?access_token=${token}`,
    { chatid, name: 新群名称 },
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    console.warn('[企业微信] 更新群信息失败:', 响应.data.errmsg);
  }
};

/**
 * 渲染模板（替换占位变量）
 * 支持变量：
 *   {order_no}     — 订单号
 *   {date}         — 当前日期（如 2026/4/11）
 *   {product_name} — 套餐名称（哈夫币数量 或 service_type）
 *   {player_name}  — 游戏昵称
 *   {phone}        — 手机号
 *   {insurance}    — 保险格数（如 3格）
 *   {status_text}  — 当前状态文字（退款/撤单等场景传入）
 *   {refund_reason}— 退款原因（退款场景传入）
 * @param {string} 模板
 * @param {Object} 订单
 * @param {Object} [额外参数] - 可选，{ status_text, refund_reason }
 * @returns {string} 渲染后文本
 */
const 渲染模板 = (模板, 订单, 额外参数 = {}) => {
  if (!模板) return '';
  const 今日 = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
  return 模板
    .replace(/\{order_no\}/g, 订单.order_no || '')
    .replace(/\{date\}/g, 今日)
    .replace(/\{product_name\}/g, 订单.sjz_hafubi_amount ? `${订单.sjz_hafubi_amount}哈夫币` : (订单.service_type || ''))
    .replace(/\{player_name\}/g, 订单.sjz_game_nickname || '')
    .replace(/\{phone\}/g, 订单.phone || '')
    .replace(/\{insurance\}/g, 订单.sjz_insurance_slots != null ? `${订单.sjz_insurance_slots}格` : '')
    .replace(/\{status_text\}/g, 额外参数.status_text || '')
    .replace(/\{refund_reason\}/g, 额外参数.refund_reason || '退款');
};

/**
 * 验证企业微信回调签名（SHA1）
 * @param {string} token 回调Token
 * @param {string} timestamp
 * @param {string} nonce
 * @param {string} echostr
 * @returns {boolean}
 */
const 验证回调签名 = (token, timestamp, nonce, echostr) => {
  const arr = [token, timestamp, nonce, echostr].sort();
  const str = arr.join('');
  return crypto.createHash('sha1').update(str).digest('hex');
};

module.exports = {
  获取QyWxSettings,
  获取AccessToken,
  生成专属联系方式,
  自动备注客户,
  发送欢迎语,
  创建客户群,
  更新群信息,
  渲染模板,
  验证回调签名,
  分配员工,
};
