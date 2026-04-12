// 三角洲哈夫币H5前端接口控制器
// 提供给 frontend-sjz（三角洲H5）调用的公开接口
const axios = require('axios');
const { Card, Order, Setting, Product, CardBatch } = require('../models');
const { 验证卡密有效性 } = require('../services/cardService');
const { 安全解析JSON } = require('../utils/helpers');
const qywxService = require('../services/qywxService');

/**
 * 生成三角洲订单号
 * 格式：SJZ + 年月日 + 6位随机数（如 SJZ20260411123456）
 */
const 生成三角洲订单号 = () => {
  const 日期 = new Date();
  const 年 = 日期.getFullYear();
  const 月 = String(日期.getMonth() + 1).padStart(2, '0');
  const 日 = String(日期.getDate()).padStart(2, '0');
  const 随机数 = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `SJZ${年}${月}${日}${随机数}`;
};

/**
 * 验证IP格式（IPv4或IPv6，防止SSRF攻击）
 */
const 是有效IP = (ip) => {
  if (!ip) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    const 段 = ip.split('.');
    return 段.every(s => parseInt(s) >= 0 && parseInt(s) <= 255);
  }
  if (/^[0-9a-fA-F:]{2,39}$/.test(ip)) return true;
  return false;
};

/**
 * 查询IP城市（复用充值逻辑）
 * @param {string} 纯IP
 * @returns {Object|null}
 */
const 查询IP城市数据 = async (纯IP) => {
  try {
    const 响应 = await axios.get(
      `https://whois.pconline.com.cn/ipJson.jsp?ip=${encodeURIComponent(纯IP)}&json=true`,
      { responseType: 'arraybuffer', timeout: 4000 }
    );
    const decoder = new TextDecoder('gbk');
    const decoded = decoder.decode(Buffer.from(响应.data));
    const data = JSON.parse(decoded);
    if (data && data.pro) {
      return { province: data.pro || '', city: data.city || '', full_city: `${data.pro || ''}${data.city || ''}` };
    }
  } catch (e) {
    console.warn('[三角洲] 太平洋IP定位失败，切换备用接口:', e.message);
  }
  try {
    const 响应2 = await axios.get(
      `https://api.vore.top/api/IPdata?ip=${encodeURIComponent(纯IP)}`,
      { timeout: 4000 }
    );
    if (响应2.data?.code === 200 && 响应2.data?.ipdata) {
      const d = 响应2.data.ipdata;
      return { province: d.info1 || '', city: d.info2 || '', full_city: `${d.info1 || ''}${d.info2 || ''}` };
    }
  } catch (e) {
    console.warn('[三角洲] vore.top IP定位也失败:', e.message);
  }
  return null;
};

/**
 * 异步查询IP城市并写入订单
 */
const 异步写入IP城市 = async (订单ID, IP地址) => {
  try {
    const 纯IP = IP地址.replace(/^::ffff:/, '');
    if (!纯IP || 纯IP === '127.0.0.1' || 纯IP === '::1') return;
    if (!是有效IP(纯IP)) return;
    const 城市数据 = await 查询IP城市数据(纯IP);
    if (城市数据) {
      await Order.update(
        { login_province: 城市数据.province, login_city: 城市数据.full_city },
        { where: { id: 订单ID } }
      );
    }
  } catch (错误) {
    console.error('[三角洲] 异步写入IP城市失败:', 错误.message);
  }
};

/**
 * 验证三角洲卡密
 * GET /api/sjz/verify-card/:code
 */
const 验证三角洲卡密 = async (req, res) => {
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

    if (结果.卡密.business_type !== 'sjz') {
      return res.json({ code: 0, message: '此卡密不适用于三角洲服务', data: null });
    }

    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    const 卡密 = 结果.卡密;

    // 查找关联套餐，用套餐字段覆盖卡密字段（保证套餐编辑后立即生效）
    let 套餐 = null;
    try {
      if (卡密.product_id) {
        套餐 = await Product.findByPk(卡密.product_id);
      } else if (卡密.batch_id) {
        const 批次 = await CardBatch.findOne({ where: { id: 卡密.batch_id } });
        if (批次 && 批次.product_id) {
          套餐 = await Product.findByPk(批次.product_id);
        }
      }
    } catch (e) {
      console.warn('[三角洲] 查找关联套餐失败（不影响主流程）:', e.message);
    }

    // 套餐字段优先覆盖卡密字段
    const 配置 = {};
    const sjz字段列表 = [
      'sjz_hafubi_amount', 'sjz_show_nickname', 'sjz_show_insurance', 'sjz_insurance_options',
      'sjz_show_is_adult', 'sjz_adult_options', 'sjz_show_warehouse', 'sjz_require_phone',
      'sjz_show_login_method', 'sjz_login_method_options',
      'sjz_show_region', 'sjz_region_options', 'sjz_region_is_input', 'sjz_field_order',
    ];
    for (const 字段 of sjz字段列表) {
      // 套餐有值则优先用套餐的，否则用卡密的
      if (套餐 && 套餐[字段] !== null && 套餐[字段] !== undefined) {
        配置[字段] = 套餐[字段];
      } else {
        配置[字段] = 卡密[字段];
      }
    }

    return res.json({
      code: 1,
      message: '卡密有效',
      data: {
        card_code: 卡密.code,
        // 套餐配置（套餐字段优先，回退到卡密字段）
        sjz_hafubi_amount: 配置.sjz_hafubi_amount || null,
        sjz_show_nickname: 配置.sjz_show_nickname != null ? 配置.sjz_show_nickname : 1,
        sjz_show_insurance: 配置.sjz_show_insurance != null ? 配置.sjz_show_insurance : 1,
        sjz_insurance_options: 配置.sjz_insurance_options || '0,1,2,3,4,5,6',
        sjz_show_is_adult: 配置.sjz_show_is_adult != null ? 配置.sjz_show_is_adult : 0,
        sjz_adult_options: 配置.sjz_adult_options || '已成年,未成年',
        sjz_show_warehouse: 配置.sjz_show_warehouse != null ? 配置.sjz_show_warehouse : 0,
        sjz_require_phone: 配置.sjz_require_phone != null ? 配置.sjz_require_phone : 1,
        sjz_show_login_method: 配置.sjz_show_login_method != null ? 配置.sjz_show_login_method : 0,
        sjz_login_method_options: 配置.sjz_login_method_options || '扫码',
        sjz_show_region: 配置.sjz_show_region != null ? 配置.sjz_show_region : 0,
        sjz_region_options: 配置.sjz_region_options || 'VX,QQ',
        sjz_region_is_input: 配置.sjz_region_is_input != null ? 配置.sjz_region_is_input : 0,
        sjz_field_order: 配置.sjz_field_order || '',
        // 全局配置
        banner_url: 设置对象.sjz_banner_url || '',
        title: 设置对象.sjz_title || '三角洲哈夫币服务',
        subtitle: 设置对象.sjz_subtitle || '追缴包赔 · 手游端游均可 · 安全有保障',
        notice: 设置对象.sjz_notice || '',
        service_content: 安全解析JSON(设置对象.sjz_service_content, []),
        // 企业微信模式
        qywx_enabled: 设置对象.qywx_enabled || '0',
        qywx_add_friend_mode: 设置对象.qywx_add_friend_mode || 'link',
        // 弹窗配置
        popup_config: {
          sjz_popup1_enabled: 设置对象.sjz_popup1_enabled || '0',
          sjz_popup1_title: 设置对象.sjz_popup1_title || '注意事项',
          sjz_popup1_content: 设置对象.sjz_popup1_content || '请确保填写信息准确，服务开始后不支持退款。',
          sjz_popup1_icon: 设置对象.sjz_popup1_icon || '⚔️',
          sjz_popup1_auto_close: 设置对象.sjz_popup1_auto_close || '0',
          sjz_popup1_btn_text: 设置对象.sjz_popup1_btn_text || '我知道了',
          // popup2 字段
          sjz_popup2_enabled: 设置对象.sjz_popup2_enabled || '0',
          sjz_popup2_title: 设置对象.sjz_popup2_title || '信息确认',
          sjz_popup2_content: 设置对象.sjz_popup2_content || '请再次确认您填写的信息是否正确。',
          sjz_popup2_btn_text: 设置对象.sjz_popup2_btn_text || '确认提交',
          sjz_popup2_auto_close: 设置对象.sjz_popup2_auto_close || '0',
        },
        // 成功页文字配置
        success_config: {
          sjz_success_title: 设置对象.sjz_success_title || '✅ 下单成功！',
          sjz_success_subtitle: 设置对象.sjz_success_subtitle || '我们已收到您的服务订单',
          sjz_success_next_title: 设置对象.sjz_success_next_title || '🎮 下一步：添加专属客服',
          sjz_success_next_subtitle: 设置对象.sjz_success_next_subtitle || '添加企业微信后第一时间安排哈夫币充值服务',
          sjz_success_no_qywx_text: 设置对象.sjz_success_no_qywx_text || '📞 客服会主动联系您\n请保持手机畅通，耐心等待联系',
          sjz_success_guarantee_title: 设置对象.sjz_success_guarantee_title || '🛡️ 服务保障',
          sjz_success_guarantee_items: 安全解析JSON(设置对象.sjz_success_guarantee_items, ['✅ 追缴包赔', '✅ 手游端游均可', '✅ 24小时客服', '✅ 安全有保障']),
          sjz_link_btn_text: 设置对象.sjz_link_btn_text || '💬 点击添加专属客服',
        },
      },
    });
  } catch (错误) {
    console.error('[三角洲] 验证卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取IP归属城市（后端代理）
 * GET /api/sjz/ip-city
 */
const 获取IP城市 = async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || req.ip || '';
    const 纯IP = ip.replace(/^::ffff:/, '');
    if (!纯IP || 纯IP === '127.0.0.1' || 纯IP === '::1') {
      return res.json({ code: 1, data: { ip: 纯IP, province: '本地', city: '本地', full_city: '本地开发环境' } });
    }
    if (!是有效IP(纯IP)) {
      return res.json({ code: 0, message: 'IP格式无效' });
    }
    try {
      const 响应 = await axios.get(
        `https://whois.pconline.com.cn/ipJson.jsp?ip=${encodeURIComponent(纯IP)}&json=true`,
        { responseType: 'arraybuffer', timeout: 4000 }
      );
      const decoder = new TextDecoder('gbk');
      const decoded = decoder.decode(Buffer.from(响应.data));
      const data = JSON.parse(decoded);
      if (data && data.pro) {
        return res.json({ code: 1, data: { ip: 纯IP, province: data.pro || '', city: data.city || '', full_city: `${data.pro || ''}${data.city || ''}` } });
      }
    } catch (e) {
      console.warn('[三角洲] 太平洋IP定位失败:', e.message);
    }
    try {
      const 响应2 = await axios.get(
        `https://api.vore.top/api/IPdata?ip=${encodeURIComponent(纯IP)}`,
        { timeout: 4000 }
      );
      if (响应2.data?.code === 200 && 响应2.data?.ipdata) {
        const d = 响应2.data.ipdata;
        return res.json({ code: 1, data: { ip: 纯IP, province: d.info1 || '', city: d.info2 || '', full_city: `${d.info1 || ''}${d.info2 || ''}` } });
      }
    } catch (e) {
      console.warn('[三角洲] vore.top IP定位也失败:', e.message);
    }
    return res.json({ code: 0, message: 'IP定位服务暂不可用' });
  } catch (错误) {
    console.error('[三角洲] IP定位出错:', 错误.message);
    return res.json({ code: 0, message: 'IP定位服务暂不可用' });
  }
};

/**
 * 上传截图
 * POST /api/sjz/upload（multer 已在路由中配置）
 */
const 上传截图 = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ code: 0, message: '未收到图片文件' });
    }
    const urls = req.files.map(f => `/uploads/sjz/${f.filename}`);
    return res.json({ code: 1, message: '上传成功', data: { urls } });
  } catch (错误) {
    console.error('[三角洲] 上传截图出错:', 错误);
    res.status(500).json({ code: -1, message: '上传失败' });
  }
};

/**
 * 提交三角洲订单
 * POST /api/sjz/orders
 */
const 提交三角洲订单 = async (req, res) => {
  try {
    const {
      card_code,
      phone,
      sjz_game_nickname,
      sjz_insurance_slots,
      sjz_is_adult,
      sjz_warehouse_images,  // 数组或JSON字符串
      sjz_login_method,      // 用户选择的上号方式
      sjz_region,            // 用户选择或填写的区/系统
    } = req.body;

    if (!card_code) {
      return res.json({ code: 0, message: '卡密不能为空' });
    }

    // 验证卡密
    const 卡密验证结果 = await 验证卡密有效性(card_code);
    if (!卡密验证结果.有效) {
      if (卡密验证结果.原因 === '卡密已被使用') {
        return res.json({ code: 2, message: '卡密已被使用' });
      }
      return res.json({ code: 0, message: `卡密无效：${卡密验证结果.原因}` });
    }
    const 卡密 = 卡密验证结果.卡密;
    if (卡密.business_type !== 'sjz') {
      return res.json({ code: 0, message: '此卡密不适用于三角洲服务' });
    }

    // 验证手机号（若 sjz_require_phone !== 0）
    const 需要手机号 = 卡密.sjz_require_phone != null ? 卡密.sjz_require_phone : 1;
    if (需要手机号 !== 0) {
      if (!phone || !phone.trim()) {
        return res.json({ code: 0, message: '手机号不能为空' });
      }
      if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
        return res.json({ code: 0, message: '请输入正确的手机号（11位）' });
      }
    }

    // 获取用户IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.connection?.remoteAddress
      || req.ip || '';
    const 纯IP = ip.replace(/^::ffff:/, '');

    // 生成订单号
    const 订单号 = 生成三角洲订单号();

    // 处理仓库截图
    let 仓库截图JSON = null;
    if (sjz_warehouse_images) {
      if (Array.isArray(sjz_warehouse_images)) {
        仓库截图JSON = JSON.stringify(sjz_warehouse_images);
      } else if (typeof sjz_warehouse_images === 'string') {
        仓库截图JSON = sjz_warehouse_images;
      }
    }

    // 创建订单
    const 新订单 = await Order.create({
      order_no: 订单号,
      card_code: 卡密.code,
      name: sjz_game_nickname || '玩家',
      phone: (phone || '').trim() || '00000000000',
      business_type: 'sjz',
      status: 0,
      sjz_game_nickname: sjz_game_nickname || null,
      sjz_insurance_slots: sjz_insurance_slots != null ? parseInt(sjz_insurance_slots) : null,
      sjz_is_adult: sjz_is_adult != null ? parseInt(sjz_is_adult) : -1,
      sjz_warehouse_images: 仓库截图JSON,
      sjz_hafubi_amount: 卡密.sjz_hafubi_amount || null,
      sjz_login_method: sjz_login_method || null,
      sjz_region: sjz_region || null,
      login_ip: 纯IP || '',
      ecommerce_order_no: 卡密.ecommerce_order_no || null,
      created_at: new Date(),
      order_log: JSON.stringify([{
        时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        操作: '客户提交三角洲订单',
        状态: 'success',
      }]),
    });

    // 标记卡密为已使用
    await 卡密.update({ status: 1, used_at: new Date(), used_by_order: 新订单.id });

    // 异步写入IP城市
    if (纯IP && 纯IP !== '127.0.0.1' && 纯IP !== '::1') {
      setImmediate(() => 异步写入IP城市(新订单.id, 纯IP));
    }

    // 获取设置
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    let qywx_qrcode_url = null;
    let qywx_link = null;

    // 若 qywx_enabled === '1'：生成企业微信专属联系方式
    if (设置对象.qywx_enabled === '1') {
      try {
        const 企微结果 = await qywxService.生成专属联系方式(订单号);
        qywx_qrcode_url = 企微结果.qr_code || null;
        qywx_link = 企微结果.link || null;
        await 新订单.update({
          status: 1,
          qywx_config_id: 企微结果.config_id || null,
          qywx_qrcode_url,
          qywx_link,
          qywx_assigned_user: 企微结果.assigned_user || null,
        });
      } catch (企微错误) {
        // 企业微信失败不影响订单创建，仅记录日志
        console.error('[三角洲] 生成企业微信联系方式失败（不影响订单）:', 企微错误.message);
      }
    }

    return res.json({
      code: 1,
      message: '三角洲订单提交成功',
      data: {
        order_no: 订单号,
        sjz_hafubi_amount: 卡密.sjz_hafubi_amount || null,
        qywx_qrcode_url,
        qywx_link,
        qywx_add_friend_mode: 设置对象.qywx_add_friend_mode || 'link',
      },
    });
  } catch (错误) {
    console.error('[三角洲] 提交订单出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 企业微信回调验证（GET，返回 echostr）
 * GET /api/sjz/qywx-callback
 */
const 企业微信回调验证 = async (req, res) => {
  try {
    const { msg_signature, timestamp, nonce, echostr } = req.query;
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });
    const token = 设置对象.qywx_token || '';
    const 签名 = qywxService.验证回调签名(token, timestamp, nonce, echostr || '');
    if (签名 === msg_signature) {
      return res.send(echostr);
    }
    res.status(403).send('签名验证失败');
  } catch (错误) {
    console.error('[三角洲] 企业微信回调验证出错:', 错误);
    res.status(500).send('server error');
  }
};

/**
 * 企业微信回调事件（POST，处理加好友事件）
 * POST /api/sjz/qywx-callback
 */
const 企业微信回调事件 = async (req, res) => {
  // 先立即响应
  res.send('');

  try {
    const xml内容 = req.body || '';
    if (!xml内容 || typeof xml内容 !== 'string') return;

    // 简单解析XML（不引入xml2js避免依赖，手动提取关键字段）
    const 取XML值 = (xml, 标签) => {
      const 匹配 = xml.match(new RegExp(`<${标签}><!\\[CDATA\\[([^\\]]*?)\\]\\]></${标签}>|<${标签}>([^<]*?)</${标签}>`));
      return 匹配 ? (匹配[1] || 匹配[2] || '') : '';
    };

    const 事件类型 = 取XML值(xml内容, 'Event');
    if (事件类型 !== 'add_external_contact') return;

    const 员工userid = 取XML值(xml内容, 'UserID');
    const external_userid = 取XML值(xml内容, 'ExternalUserID');
    const welcome_code = 取XML值(xml内容, 'WelcomeCode');
    const state = 取XML值(xml内容, 'State');

    // state格式：SJZ_订单号_员工ID
    if (!state.startsWith('SJZ_')) return;
    const 部分 = state.split('_');
    if (部分.length < 3) return;
    const 订单号 = 部分[1];

    // 查找订单
    const 订单 = await Order.findOne({ where: { order_no: 订单号, business_type: 'sjz' } });
    if (!订单) {
      console.warn('[三角洲] 企业微信回调：未找到订单', 订单号);
      return;
    }

    // 获取设置
    const 设置列表 = await Setting.findAll();
    const 设置对象 = {};
    设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

    // 并行：备注 + 欢迎语
    const 备注模板 = 设置对象.qywx_remark_template || '';
    const 欢迎模板 = 设置对象.qywx_welcome_template || '';
    const 备注内容 = qywxService.渲染模板(备注模板, 订单);
    const 欢迎内容 = qywxService.渲染模板(欢迎模板, 订单);

    await Promise.allSettled([
      备注内容 ? qywxService.自动备注客户(员工userid, external_userid, 备注内容) : Promise.resolve(),
      welcome_code && 欢迎内容 ? qywxService.发送欢迎语(welcome_code, 欢迎内容) : Promise.resolve(),
    ]);

    // 更新订单状态 → 2（已加好友）
    const 更新数据 = {
      status: 2,
      qywx_external_userid: external_userid,
      qywx_add_friend_at: new Date(),
    };
    await 订单.update(更新数据);

    // 若 auto_group=1：创建客户群，建群后同步备注群
    if (设置对象.qywx_auto_group === '1') {
      try {
        const 群名称模板 = 设置对象.qywx_group_name_template || '三角洲服务_{order_no}';
        const 群名称 = qywxService.渲染模板(群名称模板, 订单);
        const 群主 = 员工userid;
        const 员工列表 = [员工userid];
        const chatid = await qywxService.创建客户群(群名称, 群主, 员工列表);
        await 订单.update({ status: 3, qywx_group_chat_id: chatid, qywx_group_created_at: new Date() });

        // 建群成功后：若配置了加好友群备注模板，异步更新群名称（二次确认名称正确）
        const 群备注模板 = 设置对象.qywx_group_remark_template || '';
        if (群备注模板) {
          const 最新订单 = await Order.findOne({ where: { order_no: 订单号, business_type: 'sjz' } });
          const 群备注名称 = qywxService.渲染模板(群备注模板, 最新订单 || 订单);
          if (群备注名称) {
            qywxService.更新群信息(chatid, 群备注名称).catch(e => {
              console.warn('[三角洲] 更新群备注名称失败（不影响主流程）:', e.message);
            });
          }
        }
      } catch (建群错误) {
        console.error('[三角洲] 自动建群失败（不影响主流程）:', 建群错误.message);
      }
    }
  } catch (错误) {
    console.error('[三角洲] 处理企业微信回调事件出错:', 错误);
  }
};

module.exports = { 验证三角洲卡密, 获取IP城市, 上传截图, 提交三角洲订单, 企业微信回调验证, 企业微信回调事件 };
