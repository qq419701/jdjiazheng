// 充值H5前端接口控制器
// 提供给 frontend-cz（充值H5）调用的公开接口
const axios = require('axios');
const { Card, Order, Setting } = require('../models');
const { 验证卡密有效性 } = require('../services/cardService');
const { 安全解析JSON } = require('../utils/helpers');

/**
 * 生成充值订单号
 * 格式：CZ + 年月日 + 6位随机数（如 CZ20260407123456）
 */
const 生成充值订单号 = () => {
  const 日期 = new Date();
  const 年 = 日期.getFullYear();
  const 月 = String(日期.getMonth() + 1).padStart(2, '0');
  const 日 = String(日期.getDate()).padStart(2, '0');
  const 随机数 = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `CZ${年}${月}${日}${随机数}`;
};

/**
 * 验证充值账号格式
 * 根据 topup_account_type 和数据库设置中的正则规则动态验证
 * @param {string} 账号 - 用户输入的充值账号
 * @param {string} 账号类型 - phone/wechat/qq/email/other
 * @param {Object} 设置对象 - 数据库设置键值对
 * @param {Object} 卡密级设置 - 卡密级自定义正则（可选，优先级高于全局设置）
 * @returns {Object} { 有效: boolean, 错误信息: string }
 */
const 验证充值账号格式 = (账号, 账号类型, 设置对象, 卡密级设置 = {}) => {
  if (!账号 || !账号.trim()) {
    return { 有效: false, 错误信息: '充值账号不能为空' };
  }
  const 账号值 = 账号.trim();

  // 卡密级自定义正则（优先级最高）
  if (卡密级设置.topup_account_regex) {
    try {
      const 正则 = new RegExp(卡密级设置.topup_account_regex);
      if (!正则.test(账号值)) {
        return { 有效: false, 错误信息: 卡密级设置.topup_account_error_msg || '账号格式不正确' };
      }
      return { 有效: true, 错误信息: '' };
    } catch {
      // 正则无效，忽略卡密级设置，继续走默认验证
    }
  }

  if (账号类型 === 'phone') {
    // 从数据库读取正则，默认中国大陆手机号
    const 正则字符串 = 设置对象.topup_phone_regex || '^1[3-9]\\d{9}$';
    const 正则 = new RegExp(正则字符串);
    if (!正则.test(账号值)) {
      return { 有效: false, 错误信息: '请输入正确的手机号（11位数字）' };
    }
  } else if (账号类型 === 'wechat') {
    // 支持数字开头（兼容手机号绑定的微信登录）
    const 正则字符串 = 设置对象.topup_wechat_regex || '^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$';
    const 正则 = new RegExp(正则字符串);
    if (!正则.test(账号值)) {
      return { 有效: false, 错误信息: '请输入正确的微信号（6-20位字母/数字/下划线，兼容手机号绑定）' };
    }
  } else if (账号类型 === 'qq') {
    const 正则字符串 = 设置对象.topup_qq_regex || '^[1-9]\\d{4,10}$';
    const 正则 = new RegExp(正则字符串);
    if (!正则.test(账号值)) {
      return { 有效: false, 错误信息: '请输入正确的QQ号（5-11位数字）' };
    }
  } else if (账号类型 === 'email') {
    const 邮箱正则字符串 = 设置对象.topup_email_regex || '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$';
    const 邮箱正则 = new RegExp(邮箱正则字符串);
    if (!邮箱正则.test(账号值)) {
      return { 有效: false, 错误信息: '请输入正确的邮箱地址' };
    }
  } else {
    // other 类型：验证长度
    const 最小长度 = parseInt(设置对象.topup_custom_min_len) || 1;
    const 最大长度 = parseInt(设置对象.topup_custom_max_len) || 50;
    if (账号值.length < 最小长度 || 账号值.length > 最大长度) {
      return { 有效: false, 错误信息: `账号长度需在 ${最小长度}-${最大长度} 字符之间` };
    }
  }

  return { 有效: true, 错误信息: '' };
};

/**
 * 验证IP格式（IPv4或IPv6，防止SSRF攻击）
 * @param {string} ip
 * @returns {boolean}
 */
const 是有效IP = (ip) => {
  if (!ip) return false
  // 验证IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    const 段 = ip.split('.')
    return 段.every(s => parseInt(s) >= 0 && parseInt(s) <= 255)
  }
  // 验证IPv6（简化验证）
  if (/^[0-9a-fA-F:]{2,39}$/.test(ip)) return true
  return false
}

/**
 * 查询IP城市（主接口：太平洋PConline，备用：vore.top）
 * 注意：pconline 返回 GBK 编码，使用 Node.js 内置 TextDecoder 解码
 * @param {string} 纯IP - 已清洗的IPv4地址
 * @returns {Object|null} { province, city, full_city } 或 null（查询失败）
 */
const 查询IP城市数据 = async (纯IP) => {
  // 主接口：太平洋PConline（国内稳定，无需Key）
  // 该接口返回 GBK 编码，必须以 arraybuffer 方式读取后用 TextDecoder('gbk') 解码
  try {
    const 响应 = await axios.get(
      `https://whois.pconline.com.cn/ipJson.jsp?ip=${encodeURIComponent(纯IP)}&json=true`,
      { responseType: 'arraybuffer', timeout: 4000 }
    );
    const decoder = new TextDecoder('gbk');
    const decoded = decoder.decode(Buffer.from(响应.data));
    const data = JSON.parse(decoded);
    if (data && data.pro) {
      return {
        province: data.pro || '',
        city: data.city || '',
        full_city: `${data.pro || ''}${data.city || ''}`,
      };
    }
  } catch (e) {
    console.warn('[充值] 太平洋IP定位失败，切换备用接口:', e.message);
  }

  // 备用接口：vore.top（国内托管，无需Key，UTF-8编码）
  try {
    const 响应2 = await axios.get(
      `https://api.vore.top/api/IPdata?ip=${encodeURIComponent(纯IP)}`,
      { timeout: 4000 }
    );
    if (响应2.data?.code === 200 && 响应2.data?.ipdata) {
      const d = 响应2.data.ipdata;
      return {
        province: d.info1 || '',
        city: d.info2 || '',
        full_city: `${d.info1 || ''}${d.info2 || ''}`,
      };
    }
  } catch (e) {
    console.warn('[充值] vore.top IP定位也失败:', e.message);
  }

  return null;
};

/**
 * 异步查询IP城市并写入订单
 * @param {number} 订单ID - 订单ID
 * @param {string} IP地址 - 用户IP
 */
const 异步写入IP城市 = async (订单ID, IP地址) => {
  try {
    const 纯IP = IP地址.replace(/^::ffff:/, '');
    if (!纯IP || 纯IP === '127.0.0.1' || 纯IP === '::1') return;
    // 验证IP格式，防止SSRF攻击
    if (!是有效IP(纯IP)) return;

    const 城市数据 = await 查询IP城市数据(纯IP);
    if (城市数据) {
      await Order.update(
        {
          login_province: 城市数据.province,
          login_city: 城市数据.full_city,
        },
        { where: { id: 订单ID } }
      );
    }
  } catch (错误) {
    // 异步查询失败不影响主流程
    console.error('[充值] 异步写入IP城市失败:', 错误.message);
  }
};

/**
 * 验证充值卡密
 * GET /api/cz/verify-card/:code
 * 验证成功返回卡密配置信息（会员名、账号类型、到账时间、是否显示到期选项等）
 */
const 验证充值卡密 = async (req, res) => {
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
      return res.json({ code: 0, message: 结果.原因, data: null });
    }

    // 检查是充值卡密
    if (结果.卡密.business_type !== 'topup') {
      return res.json({ code: 0, message: '此卡密不适用于充值服务', data: null });
    }

    // 获取充值相关设置
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    const 卡密 = 结果.卡密;

    return res.json({
      code: 1,
      message: '卡密有效',
      data: {
        card_code: 卡密.code,
        topup_account_type: 卡密.topup_account_type || 'phone',
        topup_account_label: 卡密.topup_account_label || '请输入手机号',
        topup_member_name: 卡密.topup_member_name || '',
        topup_member_icon: 卡密.topup_member_icon || '',
        topup_arrival_time: 卡密.topup_arrival_time || '',
        topup_show_expired: 卡密.topup_show_expired || 0,
        topup_steps: 卡密.topup_steps || '',
        // 从设置中读取前端展示配置
        banner_url: 设置对象.topup_banner_url || '',
        title: 设置对象.topup_title || '各类会员充值',
        subtitle1: 设置对象.topup_subtitle1 || '专业充值  特惠价格  安全有保障',
        subtitle2: 设置对象.topup_subtitle2 || '快速到账  全程客服  值得信赖',
        notice: 设置对象.topup_notice || '',
        service_content: 安全解析JSON(设置对象.topup_service_content, []),
        popup_config: {
          cz_popup1_enabled: 设置对象.cz_popup1_enabled || '0',
          cz_popup1_title: 设置对象.cz_popup1_title || '安全提醒',
          cz_popup1_content: 设置对象.cz_popup1_content || '务必确保充值账号准确，虚拟商品充错账号不支持退换货。',
          cz_popup1_icon: 设置对象.cz_popup1_icon || '⚠️',
          cz_popup1_title_color: 设置对象.cz_popup1_title_color || '#667eea',
          cz_popup1_content_color: 设置对象.cz_popup1_content_color || '#333333',
          cz_popup1_btn_text: 设置对象.cz_popup1_btn_text || '我知道了',
          cz_popup1_btn_color: 设置对象.cz_popup1_btn_color || '#667eea',
          cz_popup1_btn_size: 设置对象.cz_popup1_btn_size || 'large',
          cz_popup1_auto_close: 设置对象.cz_popup1_auto_close || '0',
          cz_popup1_bg_color: 设置对象.cz_popup1_bg_color || '#ffffff',
          cz_popup2_enabled: 设置对象.cz_popup2_enabled || '0',
          cz_popup2_title: 设置对象.cz_popup2_title || '账号确认',
          cz_popup2_content: 设置对象.cz_popup2_content || '请再次确认您的充值账号是否正确，虚拟商品一旦充值成功无法退款。',
          cz_popup2_icon: 设置对象.cz_popup2_icon || '🔒',
          cz_popup2_title_color: 设置对象.cz_popup2_title_color || '#667eea',
          cz_popup2_content_color: 设置对象.cz_popup2_content_color || '#333333',
          cz_popup2_btn_text: 设置对象.cz_popup2_btn_text || '我已确认',
          cz_popup2_btn_color: 设置对象.cz_popup2_btn_color || '#667eea',
          cz_popup2_btn_size: 设置对象.cz_popup2_btn_size || 'large',
          cz_popup2_auto_close: 设置对象.cz_popup2_auto_close || '0',
          cz_popup2_bg_color: 设置对象.cz_popup2_bg_color || '#ffffff',
        },
      },
    });
  } catch (错误) {
    console.error('[充值] 验证卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取IP归属城市（后端代理，解决HTTPS混合内容问题）
 * GET /api/cz/ip-city
 * 主接口：太平洋PConline，备用：vore.top，都失败才返回失败
 */
const 获取IP城市 = async (req, res) => {
  try {
    // 1. 获取真实IP（支持 Nginx 反代）
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || req.ip || '';

    // 清理IPv6前缀（::ffff:x.x.x.x → x.x.x.x）
    const 纯IP = ip.replace(/^::ffff:/, '');

    // 2. 本地IP直接返回（开发环境）
    if (!纯IP || 纯IP === '127.0.0.1' || 纯IP === '::1') {
      return res.json({ code: 1, data: { ip: 纯IP, province: '本地', city: '本地', full_city: '本地开发环境' } });
    }

    // 验证IP格式，防止SSRF攻击
    if (!是有效IP(纯IP)) {
      return res.json({ code: 0, message: 'IP格式无效' });
    }

    // 3. 主接口：太平洋PConline（国内稳定，无需Key）
    // 该接口返回 GBK 编码，使用 responseType:'arraybuffer' + TextDecoder('gbk') 解码防止乱码
    try {
      const 响应 = await axios.get(
        `https://whois.pconline.com.cn/ipJson.jsp?ip=${encodeURIComponent(纯IP)}&json=true`,
        { responseType: 'arraybuffer', timeout: 4000 }
      );
      const decoder = new TextDecoder('gbk');
      const decoded = decoder.decode(Buffer.from(响应.data));
      const data = JSON.parse(decoded);
      if (data && data.pro) {
        return res.json({
          code: 1,
          data: {
            ip: 纯IP,
            province: data.pro || '',
            city: data.city || '',
            full_city: `${data.pro || ''}${data.city || ''}`,
          },
        });
      }
    } catch (e) {
      console.warn('[充值] 太平洋IP定位失败，切换备用接口:', e.message);
    }

    // 4. 备用接口：vore.top（国内托管，无需Key）
    try {
      const 响应2 = await axios.get(
        `https://api.vore.top/api/IPdata?ip=${encodeURIComponent(纯IP)}`,
        { timeout: 4000 }
      );
      if (响应2.data?.code === 200 && 响应2.data?.ipdata) {
        const d = 响应2.data.ipdata;
        return res.json({
          code: 1,
          data: {
            ip: 纯IP,
            province: d.info1 || '',
            city: d.info2 || '',
            full_city: `${d.info1 || ''}${d.info2 || ''}`,
          },
        });
      }
    } catch (e) {
      console.warn('[充值] vore.top IP定位也失败:', e.message);
    }

    return res.json({ code: 0, message: 'IP定位服务暂不可用' });
  } catch (错误) {
    console.error('[充值] IP定位出错:', 错误.message);
    return res.json({ code: 0, message: 'IP定位服务暂不可用' });
  }
};

/**
 * 提交充值订单
 * POST /api/cz/orders
 * 收集：充值账号、会员是否到期（可选）、登录城市（IP自动获取）
 */
const 提交充值订单 = async (req, res) => {
  try {
    const {
      card_code,
      topup_account,
      topup_is_expired,  // 可选：-1=不适用 0=未到期 1=已到期
    } = req.body;

    if (!card_code) {
      return res.json({ code: 0, message: '卡密不能为空' });
    }
    if (!topup_account || !topup_account.trim()) {
      return res.json({ code: 0, message: '充值账号不能为空' });
    }

    // 验证卡密（必须是充值卡密）
    const 卡密验证结果 = await 验证卡密有效性(card_code);
    if (!卡密验证结果.有效) {
      if (卡密验证结果.原因 === '卡密已被使用') {
        return res.json({ code: 2, message: '卡密已被使用' });
      }
      return res.json({ code: 0, message: `卡密无效：${卡密验证结果.原因}` });
    }
    const 卡密 = 卡密验证结果.卡密;
    if (卡密.business_type !== 'topup') {
      return res.json({ code: 0, message: '此卡密不适用于充值服务' });
    }

    // 获取设置（用于账号格式验证）
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    // 验证充值账号格式（优先使用卡密级自定义正则）
    const 账号验证结果 = 验证充值账号格式(
      topup_account.trim(),
      卡密.topup_account_type || 'other',
      设置对象,
      { topup_account_regex: 卡密.topup_account_regex, topup_account_error_msg: 卡密.topup_account_error_msg }
    );
    if (!账号验证结果.有效) {
      return res.json({ code: 0, message: 账号验证结果.错误信息 });
    }

    // 如果设置了显示到期选项，验证用户是否已选择
    if (卡密.topup_show_expired === 1 && (topup_is_expired === undefined || topup_is_expired === null || topup_is_expired === '')) {
      return res.json({ code: 0, message: '请选择会员是否已到期' });
    }

    // 获取用户IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || req.ip || '';
    const 纯IP = ip.replace(/^::ffff:/, '');

    // 生成充值订单号
    const 订单号 = 生成充值订单号();

    // 解析到期状态
    let 到期状态 = -1;
    if (topup_is_expired !== undefined && topup_is_expired !== null && topup_is_expired !== '') {
      到期状态 = parseInt(topup_is_expired);
      if (isNaN(到期状态)) 到期状态 = -1;
    }

    // 创建订单（充值订单不需要姓名/地址等字段，使用最小必填）
    const 新订单 = await Order.create({
      order_no: 订单号,
      card_code: 卡密.code,
      name: '充值用户',     // 充值不需要真实姓名
      phone: topup_account.trim().startsWith('1') && /^\d{11}$/.test(topup_account.trim()) ? topup_account.trim() : '00000000000',
      business_type: 'topup',
      status: 0,           // 待处理
      topup_account: topup_account.trim(),
      topup_account_type: 卡密.topup_account_type || '',
      topup_member_name: 卡密.topup_member_name || '',
      topup_arrival_time: 卡密.topup_arrival_time || '',
      topup_is_expired: 到期状态,
      login_ip: 纯IP || '',
      created_at: new Date(),
      order_log: JSON.stringify([{
        时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        操作: '客户提交充值订单',
        状态: 'success',
      }]),
    });

    // 标记卡密为已使用
    await 卡密.update({ status: 1, used_by_order: 新订单.id });

    // 异步查询IP城市（不阻塞订单创建，后台写入）
    if (纯IP && 纯IP !== '127.0.0.1' && 纯IP !== '::1') {
      setImmediate(() => 异步写入IP城市(新订单.id, 纯IP));
    }

    return res.json({
      code: 1,
      message: '充值订单提交成功',
      data: {
        order_no: 订单号,
        topup_account: topup_account.trim(),
        topup_member_name: 卡密.topup_member_name || '',
        topup_arrival_time: 卡密.topup_arrival_time || '',
        topup_account_type: 卡密.topup_account_type || '',
      },
    });
  } catch (错误) {
    console.error('[充值] 提交充值订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 验证充值卡密, 获取IP城市, 提交充值订单 };
