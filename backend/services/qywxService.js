// 企业微信服务
// 处理三角洲业务的企业微信联系方式生成、备注、欢迎语、建群等操作
const axios = require('axios');
const crypto = require('crypto');
const { Setting } = require('../models');

/**
 * 安全截断字符串（防止超过企业微信30字符限制）
 * 企业微信按字符数不是字节数计算，中文算1个字符
 * @param {string} 内容
 * @param {number} 最大长度 默认30
 * @returns {string}
 */
const 安全截断 = (内容, 最大长度 = 30) => {
  if (!内容) return 内容;
  let 长度 = 0;
  let 结果 = '';
  for (const 字符 of 内容) {
    长度 += 1;
    if (长度 > 最大长度) break;
    结果 += 字符;
  }
  return 结果;
};

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
  // state格式（修复超30字符BUG）：S{订单号后12位}E{员工索引}
  // 例：S260412123456E0 = 15字符 ✅ 远小于30字符限制
  const ids = (配置.qywx_user_ids || '').split(',').map(s => s.trim()).filter(Boolean);
  const 员工索引 = ids.indexOf(员工ID);
  const state = `S${订单号.slice(-12)}E${员工索引 >= 0 ? 员工索引 : 0}`;

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
 * 发送欢迎语（支持附带入群链接卡片）
 * @param {string} welcome_code 企业微信回调中携带的 WelcomeCode
 * @param {string} 文字内容
 * @param {string|null} 附件链接 可选，入群链接URL，传入后附带link卡片
 */
const 发送欢迎语 = async (welcome_code, 文字内容, 附件链接 = null) => {
  const token = await 获取AccessToken();
  const body = {
    welcome_code,
    text: { content: 文字内容 },
  };
  if (附件链接) {
    body.attachments = [{
      msgtype: 'link',
      link: {
        title: '📌 点击加入专属服务群',
        picurl: '',
        desc: '点击进入您的三角洲哈夫币专属服务群',
        url: 附件链接,
      },
    }];
  }
  const 响应 = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/send_welcome_msg?access_token=${token}`,
    body,
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    console.warn('[企业微信] 发送欢迎语失败:', 响应.data.errmsg);
  }
};

/**
 * 创建外部客户群（使用 externalcontact/groupchat/create）
 * 客户+员工都在群内，客户可以进入
 * @param {string} 群名称
 * @param {string} 群主userid 内部员工userid
 * @param {Array<string>} 员工列表 内部员工userid列表
 * @param {string} external_userid 客户外部userid
 * @returns {string} chat_id
 */
const 创建外部客户群 = async (群名称, 群主, 员工列表, external_userid) => {
  const token = await 获取AccessToken();
  const 响应 = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/create?access_token=${token}`,
    {
      chat: {
        name: 群名称,
        owner: 群主,
        userlist: 员工列表,
        memberlist: [{ userid: external_userid }],
      },
    },
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    throw new Error(`创建外部客户群失败: ${响应.data.errmsg}`);
  }
  return 响应.data.chat_id;
};

/**
 * 更新客户群名称（兼容新旧两种群格式）
 * 旧格式（sjz_开头）：使用 appchat/update
 * 新格式（外部客户群）：使用 externalcontact/groupchat/update
 * @param {string} chat_id 群ID
 * @param {string} 新群名称
 */
const 更新客户群名称 = async (chat_id, 新群名称) => {
  const token = await 获取AccessToken();
  if (chat_id.startsWith('sjz_')) {
    // 旧格式：内部应用群
    const 响应 = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/appchat/update?access_token=${token}`,
      { chatid: chat_id, name: 新群名称 },
      { timeout: 8000 }
    );
    if (响应.data.errcode !== 0) {
      console.warn('[企业微信] 更新内部群名称失败:', 响应.data.errmsg);
    }
  } else {
    // 新格式：外部客户群
    const 响应 = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/update?access_token=${token}`,
      { chat_id, name: 新群名称 },
      { timeout: 8000 }
    );
    if (响应.data.errcode !== 0) {
      console.warn('[企业微信] 更新外部客户群名称失败:', 响应.data.errmsg);
    }
  }
};

/**
 * 向客户群发送消息（兼容新旧两种群格式）
 * 旧格式（sjz_开头）：使用 appchat/send
 * 新格式（外部客户群）：使用 externalcontact/groupchat/send（若企业微信支持）
 * 注意：目前企业微信官方暂无直接发外部客户群消息的开放API，
 * 此处对旧群通过 appchat/send 发送；新群记录日志并跳过（需后续等官方接口开放）
 * @param {string} chat_id 群ID
 * @param {string} 文字内容
 */
const 发送群消息 = async (chat_id, 文字内容) => {
  const token = await 获取AccessToken();
  if (chat_id.startsWith('sjz_')) {
    // 旧格式：内部应用群，使用 appchat/send
    const 响应 = await axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/appchat/send?access_token=${token}`,
      {
        chatid: chat_id,
        msgtype: 'text',
        text: { content: 文字内容 },
        safe: 0,
      },
      { timeout: 8000 }
    );
    if (响应.data.errcode !== 0) {
      console.warn('[企业微信] 发送内部群消息失败:', 响应.data.errmsg);
    }
  } else {
    // 新格式外部客户群：官方暂无直接发消息API，仅记录日志
    console.log('[企业微信] 外部客户群消息（记录备用）:', chat_id, 文字内容);
  }
};

/**
 * 获取外部客户群详情
 * @param {string} chat_id 群ID
 * @returns {Object} 群详情
 */
const 获取客户群详情 = async (chat_id) => {
  const token = await 获取AccessToken();
  const 响应 = await axios.get(
    `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/get?access_token=${token}&chat_id=${encodeURIComponent(chat_id)}&need_name=1`,
    { timeout: 8000 }
  );
  if (响应.data.errcode !== 0) {
    throw new Error(`获取客户群详情失败: ${响应.data.errmsg}`);
  }
  return 响应.data.group_chat || {};
};

/**
 * 更新群信息（重命名群）- 兼容旧代码调用，内部转发到 更新客户群名称
 * @deprecated 请使用 更新客户群名称
 * @param {string} chatid 群ID
 * @param {string} 新群名称
 */
const 更新群信息 = async (chatid, 新群名称) => {
  return 更新客户群名称(chatid, 新群名称);
};

/**
 * 创建客户群（旧API，仅内部群，客户不在群内）- 兼容旧代码
 * @deprecated 请使用 创建外部客户群
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
  创建外部客户群,
  创建客户群,       // 兼容旧代码（内部群，客户不在群内）
  更新客户群名称,
  更新群信息,       // 兼容旧代码，内部转发到 更新客户群名称
  发送群消息,
  获取客户群详情,
  渲染模板,
  安全截断,
  验证回调签名,
  分配员工,
};
