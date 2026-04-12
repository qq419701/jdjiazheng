// 后台管理接口路由
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const 配置 = require('../config/config');
const { Admin, Order } = require('../models');
const { 验证Token } = require('../middleware/auth');
const { 获取订单列表, 获取订单详情, 更新订单状态, 触发自动下单, 重置订单, 更新订单备注, 导出订单, 确认退款完成, 手动创建订单, 预分配卡密 } = require('../controllers/orderController');
const { 获取卡密列表, 生成卡密, 导出卡密, 作废卡密, 删除卡密, 获取批次列表, 获取批次卡密, 删除批次, 统一获取卡密列表, 统一获取批次列表, 统一获取卡密统计 } = require('../controllers/cardController');
const { 获取账号列表, 新增账号, 更新账号, 删除账号, 触发自动登录 } = require('../controllers/jdAccountController');
const { 获取规则列表, 新增规则, 更新规则, 删除规则 } = require('../controllers/timeRuleController');
const { 获取所有设置, 批量更新设置 } = require('../controllers/settingController');
const { 获取地区列表, 后台查询地区, 新增地区, 更新地区, 删除地区, 切换地区状态, 获取地区统计, 导入地区CSV } = require('../controllers/regionController');
const multer = require('multer');
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const { 触发洗衣下单, 查询洗衣订单状态, 取消洗衣订单, 获取洗衣订单列表, 获取洗衣订单详情, 修改洗衣订单并同步鲸蚁, 测试洗衣API连接, 获取洗衣Token状态, 查询洗衣物流, 确认洗衣退款完成 } = require('../controllers/laundryController');
const { 获取商品列表: 获取商品列表管理, 新增商品, 更新商品, 删除商品 } = require('../controllers/productController');
const qywxService = require('../services/qywxService');

// ===== 备注图片上传配置 =====
// 图片保存到 backend/uploads/remarks/ 目录，通过 /uploads/remarks/ 静态路径访问
const crypto = require('crypto');
const 上传目录 = path.join(__dirname, '../uploads/remarks');
if (!fs.existsSync(上传目录)) fs.mkdirSync(上传目录, { recursive: true });

const 图片上传 = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 上传目录),
    filename: (req, file, cb) => {
      // 使用 crypto.randomBytes 避免文件名碰撞
      const 扩展名 = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `remark_${crypto.randomBytes(16).toString('hex')}${扩展名}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 单张限5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允许上传图片文件'));
  },
});

// ===== 图形验证码接口（无需鉴权）=====
// 返回 SVG 验证码 base64 和 session key（内存 Map 缓存，有效期2分钟）
const 验证码缓存 = new Map();
// 每5分钟定期清理过期验证码，避免占用内存
setInterval(() => {
  const 现在 = Date.now();
  for (const [k, v] of 验证码缓存) { if (v.expires < 现在) 验证码缓存.delete(k); }
}, 5 * 60 * 1000);

router.get('/captcha', (req, res) => {
  // 生成4位随机字母数字
  const 字符集 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let 验证码文字 = '';
  for (let i = 0; i < 4; i++) 验证码文字 += 字符集[Math.floor(Math.random() * 字符集.length)];
  // 使用 crypto.randomBytes 生成安全的唯一 key
  const key = crypto.randomBytes(16).toString('hex');
  // 缓存2分钟
  验证码缓存.set(key, { text: 验证码文字.toLowerCase(), expires: Date.now() + 2 * 60 * 1000 });
  // 生成 SVG
  const 宽 = 100, 高 = 38;
  const 颜色列表 = ['#e54635','#409eff','#67c23a','#e6a23c','#6c5ce7'];
  let 字符SVG = '';
  for (let i = 0; i < 验证码文字.length; i++) {
    const x = 12 + i * 22 + (Math.random() - 0.5) * 4;
    const y = 26 + (Math.random() - 0.5) * 6;
    const rotate = (Math.random() - 0.5) * 20;
    const color = 颜色列表[Math.floor(Math.random() * 颜色列表.length)];
    字符SVG += `<text x="${x}" y="${y}" fill="${color}" font-size="20" font-family="Arial" font-weight="bold" transform="rotate(${rotate} ${x} ${y})">${验证码文字[i]}</text>`;
  }
  // 干扰线
  let 干扰线 = '';
  for (let i = 0; i < 3; i++) {
    const x1 = Math.random() * 宽, y1 = Math.random() * 高;
    const x2 = Math.random() * 宽, y2 = Math.random() * 高;
    const color = 颜色列表[Math.floor(Math.random() * 颜色列表.length)];
    干扰线 += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
  }
  const svg = `<svg width="${宽}" height="${高}" xmlns="http://www.w3.org/2000/svg"><rect width="${宽}" height="${高}" fill="#f5f7fa" rx="4"/>${干扰线}${字符SVG}</svg>`;
  res.json({ code: 1, data: { key, svg: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` } });
});

// ===== 备注图片上传接口（需鉴权）=====
// POST /admin/api/upload/remark-image
// 返回图片访问 URL（相对路径，前端拼接域名使用）
router.post('/upload/remark-image', 验证Token, 图片上传.single('image'), (req, res) => {
  try {
    if (!req.file) return res.json({ code: 0, message: '未收到图片文件' });
    // 返回可通过 /uploads/remarks/filename 访问的 URL
    const url = `/uploads/remarks/${req.file.filename}`;
    res.json({ code: 1, message: '上传成功', data: { url } });
  } catch (错误) {
    console.error('图片上传出错:', 错误);
    res.status(500).json({ code: -1, message: '上传失败' });
  }
});

// ===== 登录接口（无需鉴权）=====
router.post('/login', async (req, res) => {
  try {
    const { username, password, captcha_key, captcha_text } = req.body;
    if (!username || !password) {
      return res.json({ code: 0, message: '请输入用户名和密码' });
    }

    // 验证图形验证码（有 captcha_key 时才验证）
    if (captcha_key) {
      const 缓存 = 验证码缓存.get(captcha_key);
      if (!缓存 || Date.now() > 缓存.expires) {
        return res.json({ code: 0, message: '验证码已过期，请刷新重试' });
      }
      if (!captcha_text || captcha_text.toLowerCase() !== 缓存.text) {
        验证码缓存.delete(captcha_key);
        return res.json({ code: 0, message: '验证码错误' });
      }
      验证码缓存.delete(captcha_key);
    }

    const 管理员 = await Admin.findOne({ where: { username } });
    if (!管理员) {
      return res.json({ code: 0, message: '用户名或密码错误' });
    }

    // 检查账号是否启用
    if (管理员.is_active === 0) {
      return res.json({ code: 0, message: '账号已被禁用，请联系管理员' });
    }

    const 密码正确 = await bcrypt.compare(password, 管理员.password);
    if (!密码正确) {
      return res.json({ code: 0, message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await 管理员.update({ last_login: new Date() });

    // 解析权限
    let permissions = [];
    try { permissions = JSON.parse(管理员.permissions || '[]') } catch {}

    // vendor角色：解析绑定批次ID列表
    let vendor_batch_ids = [];
    let vendor_business_types = [];
    if (管理员.role === 'vendor') {
      try { vendor_batch_ids = JSON.parse(管理员.vendor_batch_ids || '[]'); } catch {}
      vendor_business_types = (管理员.vendor_business_types || '').split(',').filter(Boolean);
    }

    // 生成JWT（包含权限信息）
    const token = jwt.sign(
      { id: 管理员.id, username: 管理员.username, role: 管理员.role, permissions },
      配置.JWT密钥,
      { expiresIn: 配置.JWT过期时间 }
    );

    res.json({
      code: 1,
      message: '登录成功',
      data: {
        token,
        username: 管理员.username,
        nickname: 管理员.nickname || 管理员.username,
        role: 管理员.role,
        permissions,
        vendor_batch_ids,        // 供货商绑定批次ID列表（非vendor角色为空数组）
        vendor_business_types,   // 供货商可见业务类型（非vendor角色为空数组）
      },
    });
  } catch (错误) {
    console.error('登录出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 以下接口需要JWT鉴权 =====

// 数据看板
router.get('/dashboard', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Card, JdAccount } = require('../models');

    const 今天开始 = new Date();
    今天开始.setHours(0, 0, 0, 0);

    const [总订单数, 今日新增, 待处理数, 已下单数, 总卡密数] = await Promise.all([
      Order.count(),
      Order.count({ where: { created_at: { [Op.gte]: 今天开始 } } }),
      Order.count({ where: { status: 0 } }),
      Order.count({ where: { status: 2 } }),
      Card.count(),
    ]);

    const 成功率 = 总订单数 > 0 ? Math.round((已下单数 / 总订单数) * 100) : 0;

    // 近7天订单统计
    const 七天前 = new Date();
    七天前.setDate(七天前.getDate() - 6);
    七天前.setHours(0, 0, 0, 0);

    const 近七天订单 = await Order.findAll({
      where: { created_at: { [Op.gte]: 七天前 } },
      attributes: ['created_at', 'status'],
    });

    // 按日期分组统计
    const 日期统计 = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(七天前);
      d.setDate(七天前.getDate() + i);
      const 键 = d.toISOString().split('T')[0];
      日期统计[键] = 0;
    }
    近七天订单.forEach(订单 => {
      const 键 = new Date(订单.created_at).toISOString().split('T')[0];
      if (日期统计[键] !== undefined) 日期统计[键]++;
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        总订单数,
        今日新增,
        待处理数,
        成功率,
        近七天: Object.entries(日期统计).map(([日期, 数量]) => ({ 日期, 数量 })),
        状态分布: [
          { 名称: '待处理', 数量: await Order.count({ where: { status: 0 } }) },
          { 名称: '下单中', 数量: await Order.count({ where: { status: 1 } }) },
          { 名称: '已下单', 数量: await Order.count({ where: { status: 2 } }) },
          { 名称: '失败', 数量: await Order.count({ where: { status: 3 } }) },
          { 名称: '已取消', 数量: await Order.count({ where: { status: 4 } }) },
        ],
      },
    });
  } catch (错误) {
    console.error('获取看板数据出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 订单管理
router.get('/orders', 验证Token, 获取订单列表);
// 导出家政订单为CSV（必须在 /orders/:id 之前注册，防止被参数路由拦截）
router.get('/orders/export', 验证Token, async (req, res) => {
  // 强制业务类型为家政
  req.query.business_type = 'jiazheng';
  return 导出订单(req, res);
});
// 手动创建订单（必须在 /orders/:id 之前注册，防止被参数路由拦截）
router.post('/orders/manual-create', 验证Token, 手动创建订单);
// 预分配卡密（让前端提前看到将要使用的卡密；必须在 /orders/:id 之前注册）
router.get('/orders/pre-allocate-card', 验证Token, 预分配卡密);
// 订单管理页搜索家政卡密（按卡密码或手机号查找，用于卡密作废功能；必须在 /orders/:id 之前注册）
router.get('/orders/search-card', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Card } = require('../models');
    const keyword = (req.query.keyword || '').trim();
    if (!keyword) return res.json({ code: 0, message: '请输入卡密码或手机号' });

    const 卡密列表 = await Card.findAll({
      where: {
        business_type: 'jiazheng',
        code: { [Op.like]: `%${keyword}%` },
      },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    // 查询关联订单号
    const 结果 = await Promise.all(卡密列表.map(async (卡密) => {
      let order_no = null;
      try {
        const 订单 = await Order.findOne({
          where: { card_code: 卡密.code },
          order: [['created_at', 'DESC']],
          attributes: ['order_no'],
        });
        if (订单) order_no = 订单.order_no;
      } catch {}
      return {
        id: 卡密.id,
        code: 卡密.code,
        status: 卡密.status,
        service_type: 卡密.service_type,
        created_at: 卡密.created_at,
        order_no,
      };
    }));

    res.json({ code: 1, message: '获取成功', data: 结果 });
  } catch (错误) {
    console.error('搜索家政卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});
router.get('/orders/:id', 验证Token, 获取订单详情);
router.put('/orders/:id/status', 验证Token, 更新订单状态);
router.put('/orders/:id/remark', 验证Token, 更新订单备注); // 快速更新备注接口
router.post('/orders/:id/place-order', 验证Token, 触发自动下单);
router.post('/orders/:id/reset', 验证Token, 重置订单);
router.post('/orders/:id/confirm-refund', 验证Token, 确认退款完成);

// 卡密管理（强制 business_type='jiazheng'，避免历史混入的洗衣卡密显示）
router.get('/cards', 验证Token, async (req, res) => {
  req.query.business_type = 'jiazheng';
  return 获取卡密列表(req, res);
});
router.post('/cards/generate', 验证Token, 生成卡密);
router.get('/cards/export', 验证Token, 导出卡密);
router.get('/cards/jiazheng/preview-card', 验证Token, async (req, res) => {
  try {
    const { Card } = require('../models');
    const 卡密 = await Card.findOne({
      where: { status: 0, business_type: 'jiazheng' },
      order: [['created_at', 'DESC']],
    });
    if (!卡密) return res.json({ code: 0, message: '暂无可用家政卡密，请先生成卡密', data: null });
    res.json({ code: 1, message: 'ok', data: { code: 卡密.code } });
  } catch (错误) {
    console.error('获取家政预览卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});
router.delete('/cards/:id', 验证Token, 删除卡密);
// 作废卡密（将未使用的家政卡密标记为已失效，不可逆操作）
router.put('/cards/:id/invalidate', 验证Token, 作废卡密);

// 卡密批次管理（强制 business_type='jiazheng'，避免历史混入的洗衣批次显示）
router.get('/card-batches', 验证Token, async (req, res) => {
  req.query.business_type = 'jiazheng';
  return 获取批次列表(req, res);
});
router.get('/card-batches/:id/cards', 验证Token, 获取批次卡密);
router.delete('/card-batches/:id', 验证Token, 删除批次);

// 京东账号管理
router.get('/jd-accounts', 验证Token, 获取账号列表);
router.post('/jd-accounts', 验证Token, 新增账号);
router.put('/jd-accounts/:id', 验证Token, 更新账号);
router.delete('/jd-accounts/:id', 验证Token, 删除账号);
router.post('/jd-accounts/:id/login', 验证Token, 触发自动登录);

// 时间规则管理
router.get('/time-rules', 验证Token, 获取规则列表);
router.post('/time-rules', 验证Token, 新增规则);
router.put('/time-rules/:id', 验证Token, 更新规则);
router.delete('/time-rules/:id', 验证Token, 删除规则);

// 公开接口：获取登录页所需的站点配置（无需鉴权，供登录页加载标题）
router.get('/public/site-config', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Setting } = require('../models');
    const 列表 = await Setting.findAll({
      where: { key_name: { [Op.in]: ['admin_site_title', 'admin_site_name'] } },
    });
    const 配置 = {};
    列表.forEach(s => { 配置[s.key_name] = s.key_value; });
    res.json({
      code: 1,
      data: {
        admin_site_title: 配置.admin_site_title || '京东家政代下单系统',
        admin_site_name: 配置.admin_site_name || '京东代下单系统',
      },
    });
  } catch (错误) {
    console.error('[public/site-config] 获取站点配置出错:', 错误);
    res.json({ code: 1, data: { admin_site_title: '京东家政代下单系统', admin_site_name: '京东代下单系统' } });
  }
});

// 系统设置
router.get('/settings', 验证Token, 获取所有设置);
router.put('/settings', 验证Token, 批量更新设置);

// ===== 商品管理（SUP商品管理）=====
router.get('/products', 验证Token, 获取商品列表管理);
router.post('/products', 验证Token, 新增商品);
router.put('/products/:id', 验证Token, 更新商品);
router.delete('/products/:id', 验证Token, 删除商品);

// 地区管理（后台）
router.get('/regions/stats', 验证Token, 获取地区统计);
router.post('/regions/import-csv', 验证Token, csvUpload.single('file'), 导入地区CSV);
router.get('/regions', 验证Token, 获取地区列表);
router.get('/regions/list', 验证Token, 后台查询地区);
router.post('/regions', 验证Token, 新增地区);
router.put('/regions/:id', 验证Token, 更新地区);
router.delete('/regions/:id', 验证Token, 删除地区);
router.put('/regions/:id/toggle', 验证Token, 切换地区状态);

// ===== 洗衣订单管理（独立路由，强制 business_type='xiyifu'）=====

// 导出洗衣订单为CSV（必须在 /laundry-orders/:id 之前注册，防止被参数路由拦截）
router.get('/laundry-orders/export', 验证Token, async (req, res) => {
  req.query.business_type = 'xiyifu';
  return 导出订单(req, res);
});

// 订单管理页搜索洗衣卡密（按卡密码查找，用于卡密作废功能；必须在 /laundry-orders/:id 之前注册）
router.get('/laundry-orders/search-card', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Card } = require('../models');
    const keyword = (req.query.keyword || '').trim();
    if (!keyword) return res.json({ code: 0, message: '请输入卡密码或手机号' });

    const 卡密列表 = await Card.findAll({
      where: {
        business_type: 'xiyifu',
        code: { [Op.like]: `%${keyword}%` },
      },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    // 查询关联订单号
    const 结果 = await Promise.all(卡密列表.map(async (卡密) => {
      let order_no = null;
      try {
        const 订单 = await Order.findOne({
          where: { card_code: 卡密.code },
          order: [['created_at', 'DESC']],
          attributes: ['order_no'],
        });
        if (订单) order_no = 订单.order_no;
      } catch {}
      return {
        id: 卡密.id,
        code: 卡密.code,
        status: 卡密.status,
        service_type: 卡密.service_type,
        created_at: 卡密.created_at,
        order_no,
      };
    }));

    res.json({ code: 1, message: '获取成功', data: 结果 });
  } catch (错误) {
    console.error('搜索洗衣卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 获取洗衣订单列表（带筛选分页）
router.get('/laundry-orders', 验证Token, 获取洗衣订单列表);

// 查询洗衣订单物流轨迹（注意：必须在 /:id 路由之前注册，防止被拦截）
router.get('/laundry-orders/:id/express-routes', 验证Token, 查询洗衣物流);

// 获取洗衣订单详情（含所有洗衣专用字段）
router.get('/laundry-orders/:id', 验证Token, 获取洗衣订单详情);

// 修改洗衣订单信息并同步到鲸蚁（如已下单）
router.put('/laundry-orders/:id', 验证Token, 修改洗衣订单并同步鲸蚁);

router.put('/laundry-orders/:id/status', 验证Token, 更新订单状态);
router.put('/laundry-orders/:id/remark', 验证Token, 更新订单备注);
router.post('/laundry-orders/:id/reset', 验证Token, 重置订单);
router.post('/laundry-orders/:id/confirm-refund', 验证Token, 确认洗衣退款完成);

// 触发洗衣下单（推送到鲸蚁API）
router.post('/laundry-orders/:id/place-order', 验证Token, 触发洗衣下单);

// 查询洗衣订单状态
router.get('/laundry-orders/:id/status', 验证Token, 查询洗衣订单状态);

// 取消洗衣订单
router.post('/laundry-orders/:id/cancel', 验证Token, 取消洗衣订单);

// ===== 洗衣卡密管理（独立路由，强制 business_type='xiyifu'）=====
router.get('/laundry-cards', 验证Token, async (req, res) => {
  req.query.business_type = 'xiyifu';
  return 获取卡密列表(req, res);
});
router.post('/laundry-cards/generate', 验证Token, async (req, res) => {
  req.body.business_type = 'xiyifu';
  return 生成卡密(req, res);
});
router.delete('/laundry-cards/:id', 验证Token, 删除卡密);
// 作废洗衣卡密（将未使用的洗衣卡密标记为已失效，不可逆操作）
router.put('/laundry-cards/:id/invalidate', 验证Token, 作废卡密);
// 洗衣卡密导出TXT（强制 business_type='xiyifu'）
router.get('/laundry-cards/export', 验证Token, async (req, res) => {
  req.query.business_type = 'xiyifu';
  return 导出卡密(req, res);
});

router.get('/laundry-cards/preview-card', 验证Token, async (req, res) => {
  try {
    const { Card } = require('../models');
    const 卡密 = await Card.findOne({
      where: { status: 0, business_type: 'xiyifu' },
      order: [['created_at', 'DESC']],
    });
    if (!卡密) return res.json({ code: 0, message: '暂无可用洗衣卡密，请先生成卡密', data: null });
    res.json({ code: 1, message: 'ok', data: { code: 卡密.code } });
  } catch (错误) {
    console.error('获取洗衣预览卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

router.get('/laundry-card-batches', 验证Token, async (req, res) => {
  // 只返回洗衣卡密批次
  const { CardBatch, Card } = require('../models');
  try {
    const 批次列表 = await CardBatch.findAll({
      where: { business_type: 'xiyifu' },
      order: [['created_at', 'DESC']],
    });
    const 批次数据 = await Promise.all(批次列表.map(async (批次) => {
      const [实际数量, 已用数量, 未用数量] = await Promise.all([
        Card.count({ where: { batch_id: 批次.id } }),
        Card.count({ where: { batch_id: 批次.id, status: 1 } }),
        Card.count({ where: { batch_id: 批次.id, status: 0 } }),
      ]);
      return { ...批次.toJSON(), actual_count: 实际数量, used_count: 已用数量, unused_count: 未用数量 };
    }));
    res.json({ code: 1, message: '获取成功', data: 批次数据 });
  } catch (e) { res.status(500).json({ code: -1, message: '服务器错误' }); }
});
router.get('/laundry-card-batches/:id/cards', 验证Token, 获取批次卡密);
router.delete('/laundry-card-batches/:id', 验证Token, 删除批次);

// ===== 洗衣时间规则（独立路由，强制 business_type='xiyifu'）=====
router.get('/laundry-time-rules', 验证Token, async (req, res) => {
  req.query.business_type = 'xiyifu';
  return 获取规则列表(req, res);
});
router.post('/laundry-time-rules', 验证Token, async (req, res) => {
  req.body.business_type = 'xiyifu';
  return 新增规则(req, res);
});
router.put('/laundry-time-rules/:id', 验证Token, 更新规则);
router.delete('/laundry-time-rules/:id', 验证Token, 删除规则);

// 测试洗衣API连接
router.post('/laundry/test-connection', 验证Token, 测试洗衣API连接);

// 获取洗衣Token状态
router.get('/laundry/token-status', 验证Token, 获取洗衣Token状态);

// [已删除] 旧版路由，功能已迁移至 /laundry-orders/:id/place-order
// router.post('/laundry/orders/:id/place-order', 验证Token, 触发洗衣下单);
router.get('/laundry/orders/:id/status', 验证Token, 查询洗衣订单状态);

// ===== 当前登录账号信息（用于前端权限实时刷新）=====

/**
 * 获取当前登录账号的最新权限信息
 * GET /admin/api/auth/me
 * 前端路由守卫在每次跳转时调用此接口，确保权限始终与数据库同步
 * 若账号已被禁用，返回 code:0 通知前端跳转登录页
 */
router.get('/auth/me', 验证Token, async (req, res) => {
  try {
    // 从JWT解码数据中取用户id，查询最新账号信息
    const 账号 = await Admin.findByPk(req.管理员.id, {
      attributes: ['id', 'username', 'nickname', 'role', 'permissions', 'vendor_batch_ids', 'vendor_business_types', 'is_active'],
    });
    if (!账号) {
      return res.json({ code: 0, message: '账号不存在' });
    }
    // 账号已被禁用，通知前端强制退出
    if (账号.is_active === 0) {
      return res.json({ code: 0, message: '账号已被禁用' });
    }
    // 解析权限列表（JSON字符串 → 数组）
    let 权限列表 = [];
    try {
      权限列表 = JSON.parse(账号.permissions || '[]');
    } catch {
      权限列表 = [];
    }
    // vendor角色：解析绑定批次ID列表和可见业务类型
    let vendor_batch_ids = [];
    let vendor_business_types = [];
    if (账号.role === 'vendor') {
      try { vendor_batch_ids = JSON.parse(账号.vendor_batch_ids || '[]'); } catch {}
      vendor_business_types = (账号.vendor_business_types || '').split(',').filter(Boolean);
    }
    res.json({
      code: 1,
      message: '获取成功',
      data: {
        permissions: 权限列表,
        role: 账号.role,
        nickname: 账号.nickname || 账号.username,
        username: 账号.username,
        vendor_batch_ids,
        vendor_business_types,
      },
    });
  } catch (错误) {
    console.error('获取当前权限出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 子账号管理（仅 super 角色可操作）=====

// 权限验证中间件：仅允许 super 角色
const 仅超管 = (req, res, next) => {
  if (req.管理员?.role !== 'super') {
    return res.json({ code: 0, message: '权限不足，仅超级管理员可操作' });
  }
  next();
};

// 获取子账号列表（包含 admin/sub/vendor 角色）
router.get('/sub-accounts', 验证Token, 仅超管, async (req, res) => {
  try {
    const 列表 = await Admin.findAll({
      where: { role: ['admin', 'sub', 'vendor'] },
      attributes: ['id', 'username', 'nickname', 'role', 'permissions', 'vendor_batch_ids', 'vendor_business_types', 'is_active', 'last_login', 'remark', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    res.json({ code: 1, message: 'ok', data: 列表 });
  } catch (错误) {
    console.error('获取子账号列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 新增子账号（支持 admin/sub/vendor 角色）
router.post('/sub-accounts', 验证Token, 仅超管, async (req, res) => {
  try {
    const { username, password, nickname, role = 'sub', permissions = [], remark, vendor_batch_ids, vendor_business_types } = req.body;
    if (!username || !password) return res.json({ code: 0, message: '用户名和密码不能为空' });
    if (password.length < 6) return res.json({ code: 0, message: '密码至少6位' });
    const 已存在 = await Admin.findOne({ where: { username } });
    if (已存在) return res.json({ code: 0, message: '用户名已存在' });
    const 加密密码 = await bcrypt.hash(password, 10);
    // 允许的角色：admin/sub/vendor（super角色不允许通过此接口创建）
    const 合法角色 = ['admin', 'sub', 'vendor'].includes(role) ? role : 'sub';
    const 创建数据 = {
      username,
      password: 加密密码,
      nickname: nickname || username,
      role: 合法角色,
      is_active: 1,
      remark: remark || null,
      created_at: new Date(),
    };
    // vendor角色不需要 permissions，其他角色保存权限列表
    if (合法角色 !== 'vendor') {
      创建数据.permissions = JSON.stringify(permissions);
    }
    // vendor角色：保存绑定批次ID（JSON数组）和可见业务类型（逗号分隔）
    if (合法角色 === 'vendor') {
      创建数据.vendor_batch_ids = JSON.stringify(
        Array.isArray(vendor_batch_ids) ? vendor_batch_ids : []
      );
      创建数据.vendor_business_types = Array.isArray(vendor_business_types)
        ? vendor_business_types.join(',')
        : (vendor_business_types || '');
    }
    const 新账号 = await Admin.create(创建数据);
    res.json({ code: 1, message: '子账号创建成功', data: { id: 新账号.id, username: 新账号.username } });
  } catch (错误) {
    console.error('新增子账号出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 修改子账号（权限/状态/昵称，不含密码；支持 vendor 角色的批次绑定更新）
router.put('/sub-accounts/:id', 验证Token, 仅超管, async (req, res) => {
  try {
    const 账号 = await Admin.findByPk(req.params.id);
    if (!账号 || 账号.role === 'super') return res.json({ code: 0, message: '账号不存在或无法修改' });
    const { nickname, permissions, is_active, role, remark, vendor_batch_ids, vendor_business_types } = req.body;
    const 更新 = {};
    if (nickname !== undefined) 更新.nickname = nickname;
    if (is_active !== undefined) 更新.is_active = is_active ? 1 : 0;
    if (remark !== undefined) 更新.remark = remark || null;
    // 允许修改为 admin/sub/vendor 角色（不允许改为 super）
    if (role !== undefined && ['admin', 'sub', 'vendor'].includes(role)) {
      更新.role = role;
    }
    // vendor角色更新批次绑定和业务类型；非vendor角色更新permissions
    const 目标角色 = 更新.role || 账号.role;
    if (目标角色 === 'vendor') {
      if (vendor_batch_ids !== undefined) {
        更新.vendor_batch_ids = JSON.stringify(
          Array.isArray(vendor_batch_ids) ? vendor_batch_ids : []
        );
      }
      if (vendor_business_types !== undefined) {
        更新.vendor_business_types = Array.isArray(vendor_business_types)
          ? vendor_business_types.join(',')
          : (vendor_business_types || '');
      }
    } else {
      if (permissions !== undefined) 更新.permissions = JSON.stringify(permissions);
    }
    await 账号.update(更新);
    res.json({ code: 1, message: '更新成功' });
  } catch (错误) {
    console.error('修改子账号出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 重置子账号密码
router.put('/sub-accounts/:id/password', 验证Token, 仅超管, async (req, res) => {
  try {
    const 账号 = await Admin.findByPk(req.params.id);
    if (!账号 || 账号.role === 'super') return res.json({ code: 0, message: '账号不存在或无法修改' });
    const { password } = req.body;
    if (!password || password.length < 6) return res.json({ code: 0, message: '密码至少6位' });
    await 账号.update({ password: await bcrypt.hash(password, 10) });
    res.json({ code: 1, message: '密码重置成功' });
  } catch (错误) {
    console.error('重置密码出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 修改自己密码（无需超管权限）
router.put('/sub-accounts/self/password', 验证Token, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.json({ code: 0, message: '新密码至少6位' });
    const 账号 = await Admin.findByPk(req.管理员.id);
    if (!账号) return res.json({ code: 0, message: '账号不存在' });
    const 旧密码正确 = await bcrypt.compare(old_password, 账号.password);
    if (!旧密码正确) return res.json({ code: 0, message: '原密码错误' });
    await 账号.update({ password: await bcrypt.hash(new_password, 10) });
    res.json({ code: 1, message: '密码修改成功' });
  } catch (错误) {
    console.error('修改密码出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 删除子账号
router.delete('/sub-accounts/:id', 验证Token, 仅超管, async (req, res) => {
  try {
    const 账号 = await Admin.findByPk(req.params.id);
    if (!账号 || 账号.role === 'super') return res.json({ code: 0, message: '账号不存在或无法删除' });
    await 账号.destroy();
    res.json({ code: 1, message: '删除成功' });
  } catch (错误) {
    console.error('删除子账号出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 获取供货商列表（用于套餐管理的供货商下拉选择）=====
// GET /admin/api/vendors
// 返回所有角色为 vendor 的账号，字段：id/username/nickname
router.get('/vendors', 验证Token, async (req, res) => {
  try {
    const 列表 = await Admin.findAll({
      where: { role: 'vendor', is_active: 1 },
      attributes: ['id', 'username', 'nickname'],
      order: [['id', 'ASC']],
    });
    res.json({ code: 1, message: 'ok', data: 列表 });
  } catch (错误) {
    console.error('获取供货商列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 充值订单管理 =====

// 导出充值订单CSV（必须在 /:id 之前注册）
router.get('/topup-orders/export', 验证Token, async (req, res) => {
  req.query.business_type = 'topup';
  return 导出订单(req, res);
});

// 充值订单页搜索卡密（按卡密码查找，用于卡密作废功能；必须在 /:id 之前注册）
router.get('/topup-orders/search-card', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Card } = require('../models');
    const keyword = (req.query.keyword || '').trim();
    if (!keyword) return res.json({ code: 0, message: '请输入卡密码' });

    const 卡密列表 = await Card.findAll({
      where: {
        business_type: 'topup',
        code: { [Op.like]: `%${keyword}%` },
      },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const 结果 = await Promise.all(卡密列表.map(async (卡密) => {
      let order_no = null;
      try {
        const 订单 = await Order.findOne({
          where: { card_code: 卡密.code },
          order: [['created_at', 'DESC']],
          attributes: ['order_no'],
        });
        if (订单) order_no = 订单.order_no;
      } catch {}
      return {
        id: 卡密.id,
        code: 卡密.code,
        status: 卡密.status,
        topup_member_name: 卡密.topup_member_name,
        created_at: 卡密.created_at,
        order_no,
      };
    }));

    res.json({ code: 1, message: '获取成功', data: 结果 });
  } catch (错误) {
    console.error('[充值] 搜索充值卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 充值订单列表（强制 business_type='topup'）
router.get('/topup-orders', 验证Token, async (req, res) => {
  req.query.business_type = 'topup';
  return 获取订单列表(req, res);
});

// 充值订单详情
router.get('/topup-orders/:id', 验证Token, 获取订单详情);

// 更新充值订单状态
router.put('/topup-orders/:id/status', 验证Token, 更新订单状态);

// 更新充值订单备注
router.put('/topup-orders/:id/remark', 验证Token, 更新订单备注);

// 申请退款（status=8 退款处理中）
router.post('/topup-orders/:id/confirm-refund', 验证Token, async (req, res) => {
  // 充值退款完成：订单状态改为已取消(4)，卡密状态改为已失效(2)
  try {
    const 订单 = await Order.findOne({ where: { id: req.params.id, business_type: 'topup' } });
    if (!订单) return res.json({ code: 0, message: '充值订单不存在' });

    // 作废对应卡密
    if (订单.card_code) {
      const { Card } = require('../models');
      await Card.update({ status: 2, invalidated_at: new Date() }, { where: { code: 订单.card_code } });
    }

    // 更新订单状态为已取消
    const { 安全解析JSON } = require('../utils/helpers');
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: '退款完成，卡密已作废',
      状态: 'success',
    });
    await 订单.update({ status: 4, order_log: JSON.stringify(现有日志) });

    res.json({ code: 1, message: '退款完成，卡密已作废' });
  } catch (错误) {
    console.error('[充值] 确认退款出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 充值卡密管理 =====

// 充值卡密列表（强制 business_type='topup'）
router.get('/topup-cards', 验证Token, async (req, res) => {
  req.query.business_type = 'topup';
  return 获取卡密列表(req, res);
});

// 生成充值卡密（包含所有充值配置信息）
router.post('/topup-cards/generate', 验证Token, async (req, res) => {
  try {
    const {
      count = 1,
      remark = '',
      expired_at = null,
      topup_account_type = 'phone',
      topup_account_label = '请输入手机号',
      topup_member_name = '',
      topup_member_icon = '',
      topup_arrival_time = '',
      topup_show_expired = 0,
      topup_steps = '',
      topup_account_regex = '',
      topup_account_error_msg = '',
    } = req.body;

    const { CardBatch, Card } = require('../models');
    const { 生成卡密: 生成卡密码 } = require('../utils/helpers');

    // 限制数量
    const 实际数量 = Math.min(parseInt(count) || 1, 1000);

    // 生成批次号（时间戳+随机数，防止并发时碰撞）
    const 批次号 = `CZB${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // 创建批次（存储充值配置）
    const 批次 = await CardBatch.create({
      batch_no: 批次号,
      count: 实际数量,
      remark: remark || '',
      business_type: 'topup',
      created_by: req.管理员?.id || null,
      created_at: new Date(),
      topup_account_type,
      topup_account_label,
      topup_member_name,
      topup_member_icon,
      topup_arrival_time,
      topup_show_expired: parseInt(topup_show_expired) || 0,
      topup_steps,
      topup_account_regex: topup_account_regex || null,
      topup_account_error_msg: topup_account_error_msg || null,
    });

    // 获取已有卡密集合，避免重复
    const 现有卡密 = await Card.findAll({ attributes: ['code'] });
    const 已有卡密集合 = new Set(现有卡密.map(c => c.code));

    const 新卡密列表 = [];
    let 生成数量 = 0;
    let 尝试次数 = 0;
    const 最大尝试 = 实际数量 * 10;

    while (生成数量 < 实际数量 && 尝试次数 < 最大尝试) {
      尝试次数++;
      const 新卡密码 = 生成卡密码(16);
      if (!已有卡密集合.has(新卡密码)) {
        已有卡密集合.add(新卡密码);
        新卡密列表.push({
          code: 新卡密码,
          category: '会员充值',
          service_type: topup_member_name || '会员充值',
          remark: remark || '',
          status: 0,
          created_by: req.管理员?.id || null,
          batch_id: 批次.id,
          expired_at: expired_at || null,
          created_at: new Date(),
          business_type: 'topup',
          topup_account_type,
          topup_account_label,
          topup_member_name,
          topup_member_icon,
          topup_arrival_time,
          topup_show_expired: parseInt(topup_show_expired) || 0,
          topup_steps,
          topup_account_regex: topup_account_regex || null,
          topup_account_error_msg: topup_account_error_msg || null,
        });
        生成数量++;
      }
    }

    const 插入结果 = await Card.bulkCreate(新卡密列表);
    const 卡密列表 = 插入结果.map(c => c.code);

    res.json({
      code: 1,
      message: `成功生成 ${卡密列表.length} 个充值卡密`,
      data: {
        batch_no: 批次号,
        batch_id: 批次.id,
        codes: 卡密列表,
        count: 卡密列表.length,
      },
    });
  } catch (错误) {
    console.error('[充值] 生成充值卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 获取充值预览卡密（用于后台预览充值前端）
router.get('/topup-cards/preview-card', 验证Token, async (req, res) => {
  try {
    const { Card } = require('../models');
    const 卡密 = await Card.findOne({
      where: { status: 0, business_type: 'topup' },
      order: [['created_at', 'DESC']],
    });
    if (!卡密) return res.json({ code: 0, message: '暂无可用充值卡密，请先生成卡密', data: null });
    res.json({ code: 1, message: 'ok', data: { code: 卡密.code } });
  } catch (错误) {
    console.error('[充值] 获取充值预览卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 删除充值卡密
router.delete('/topup-cards/:id', 验证Token, 删除卡密);

// 作废充值卡密（将未使用的充值卡密标记为已失效，不可逆操作）
router.put('/topup-cards/:id/invalidate', 验证Token, 作废卡密);

// 充值卡密批次列表（只返回充值批次）
router.get('/topup-card-batches', 验证Token, async (req, res) => {
  const { CardBatch, Card } = require('../models');
  try {
    const 批次列表 = await CardBatch.findAll({
      where: { business_type: 'topup' },
      order: [['created_at', 'DESC']],
    });
    const 批次数据 = await Promise.all(批次列表.map(async (批次) => {
      const [实际数量, 已用数量, 未用数量] = await Promise.all([
        Card.count({ where: { batch_id: 批次.id } }),
        Card.count({ where: { batch_id: 批次.id, status: 1 } }),
        Card.count({ where: { batch_id: 批次.id, status: 0 } }),
      ]);
      return { ...批次.toJSON(), actual_count: 实际数量, used_count: 已用数量, unused_count: 未用数量 };
    }));
    res.json({ code: 1, message: '获取成功', data: 批次数据 });
  } catch (e) {
    console.error('[充值] 获取充值批次出错:', e);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

router.get('/topup-card-batches/:id/cards', 验证Token, 获取批次卡密);
router.delete('/topup-card-batches/:id', 验证Token, 删除批次);

// ===== 统一卡密中心接口 =====
router.get('/unified-cards', 验证Token, 统一获取卡密列表);
router.get('/unified-batches', 验证Token, 统一获取批次列表);
router.get('/unified-stats', 验证Token, 统一获取卡密统计);

// 更新批次绑定的供货商（PUT /admin/api/unified-batches/:id/vendor）
router.put('/unified-batches/:id/vendor', 验证Token, async (req, res) => {
  try {
    const { CardBatch } = require('../models');
    const 批次 = await CardBatch.findByPk(req.params.id);
    if (!批次) return res.json({ code: 0, message: '批次不存在' });
    // vendor_id 为 null 时取消绑定，为具体ID时绑定供货商
    const vendor_id = req.body.vendor_id ?? null;
    await 批次.update({ vendor_id });
    res.json({ code: 1, message: vendor_id ? '供货商绑定成功' : '已取消供货商绑定' });
  } catch (错误) {
    console.error('绑定批次供货商出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 卡密工作台：选套餐生成卡密 =====
router.post('/card-templates/generate', 验证Token, async (req, res) => {
  try {
    const { template_id, count = 1, remark = '', expired_at = null } = req.body;
    if (!template_id) return res.json({ code: 0, message: '请选择套餐' });

    const { Product, CardBatch, Card } = require('../models');
    const { 生成卡密: 生成卡密码 } = require('../utils/helpers');

    // 查套餐
    const 套餐 = await Product.findOne({ where: { id: template_id, status: 1 } });
    if (!套餐) return res.json({ code: 0, message: '套餐不存在或已禁用' });

    const 实际数量 = Math.min(parseInt(count) || 1, 5000);

    // 生成批次号
    const 批次号 = `TPL${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // 创建批次记录
    const 批次 = await CardBatch.create({
      batch_no: 批次号,
      category: 套餐.product_name,
      service_type: 套餐.service_type || 套餐.product_name,
      service_hours: 套餐.service_hours || 0,
      count: 实际数量,
      remark: remark || '',
      business_type: 套餐.business_type,
      created_by: req.管理员?.id || null,
      created_at: new Date(),
      product_id: 套餐.id,
      topup_account_type: 套餐.topup_account_type || null,
      topup_account_label: 套餐.topup_account_label || null,
      topup_member_name: 套餐.topup_member_name || null,
      topup_member_icon: 套餐.topup_member_icon || null,
      topup_arrival_time: 套餐.topup_arrival_time || null,
      topup_show_expired: 套餐.topup_show_expired || 0,
      topup_steps: 套餐.topup_steps || null,
      topup_account_regex: 套餐.topup_account_regex || null,
      topup_account_error_msg: 套餐.topup_account_error_msg || null,
      // 三角洲套餐字段
      sjz_hafubi_amount: 套餐.sjz_hafubi_amount || null,
      sjz_show_nickname: 套餐.sjz_show_nickname != null ? 套餐.sjz_show_nickname : 1,
      sjz_show_insurance: 套餐.sjz_show_insurance != null ? 套餐.sjz_show_insurance : 1,
      sjz_insurance_options: 套餐.sjz_insurance_options || '0,1,2,3,4,5,6',
      sjz_show_is_adult: 套餐.sjz_show_is_adult != null ? 套餐.sjz_show_is_adult : 0,
      sjz_adult_options: 套餐.sjz_adult_options || '已成年,未成年',
      sjz_show_warehouse: 套餐.sjz_show_warehouse != null ? 套餐.sjz_show_warehouse : 0,
      sjz_require_phone: 套餐.sjz_require_phone != null ? 套餐.sjz_require_phone : 1,
      sjz_show_login_method: 套餐.sjz_show_login_method != null ? 套餐.sjz_show_login_method : 0,
      sjz_login_method_options: 套餐.sjz_login_method_options || '扫码',
      sjz_show_region: 套餐.sjz_show_region != null ? 套餐.sjz_show_region : 0,
      sjz_region_options: 套餐.sjz_region_options || 'VX,QQ',
      sjz_region_is_input: 套餐.sjz_region_is_input != null ? 套餐.sjz_region_is_input : 0,
      sjz_field_order: 套餐.sjz_field_order || '',
    });

    // 生成卡密（去重，按业务类型加前缀 JZ/XY/CZ/SJZ）
    const 现有卡密 = await Card.findAll({ attributes: ['code'] });
    const 已有集合 = new Set(现有卡密.map(c => c.code));

    const 前缀Map = { jiazheng: 'JZ', xiyifu: 'XY', topup: 'CZ', sjz: 'SJZ' };
    const 业务前缀 = 前缀Map[套餐.business_type] || '';

    const 新卡密列表 = [];
    let n = 0, tries = 0;
    while (n < 实际数量 && tries < 实际数量 * 10) {
      tries++;
      const 码 = 生成卡密码(16, 业务前缀);
      if (!已有集合.has(码)) {
        已有集合.add(码);
        新卡密列表.push({
          code: 码,
          category: 套餐.product_name,
          service_type: 套餐.service_type || 套餐.product_name,
          service_hours: 套餐.service_hours || 0,
          remark: remark || '',
          status: 0,
          created_by: req.管理员?.id || null,
          batch_id: 批次.id,
          expired_at: expired_at || null,
          created_at: new Date(),
          business_type: 套餐.business_type,
          product_id: 套餐.id,
          topup_account_type: 套餐.topup_account_type || null,
          topup_account_label: 套餐.topup_account_label || null,
          topup_member_name: 套餐.topup_member_name || null,
          topup_member_icon: 套餐.topup_member_icon || null,
          topup_arrival_time: 套餐.topup_arrival_time || null,
          topup_show_expired: 套餐.topup_show_expired || 0,
          topup_steps: 套餐.topup_steps || null,
          topup_account_regex: 套餐.topup_account_regex || null,
          topup_account_error_msg: 套餐.topup_account_error_msg || null,
          // 三角洲套餐字段
          sjz_hafubi_amount: 套餐.sjz_hafubi_amount || null,
          sjz_show_nickname: 套餐.sjz_show_nickname != null ? 套餐.sjz_show_nickname : 1,
          sjz_show_insurance: 套餐.sjz_show_insurance != null ? 套餐.sjz_show_insurance : 1,
          sjz_insurance_options: 套餐.sjz_insurance_options || '0,1,2,3,4,5,6',
          sjz_show_is_adult: 套餐.sjz_show_is_adult != null ? 套餐.sjz_show_is_adult : 0,
          sjz_adult_options: 套餐.sjz_adult_options || '已成年,未成年',
          sjz_show_warehouse: 套餐.sjz_show_warehouse != null ? 套餐.sjz_show_warehouse : 0,
          sjz_require_phone: 套餐.sjz_require_phone != null ? 套餐.sjz_require_phone : 1,
          sjz_show_login_method: 套餐.sjz_show_login_method != null ? 套餐.sjz_show_login_method : 0,
          sjz_login_method_options: 套餐.sjz_login_method_options || '扫码',
          sjz_show_region: 套餐.sjz_show_region != null ? 套餐.sjz_show_region : 0,
          sjz_region_options: 套餐.sjz_region_options || 'VX,QQ',
          sjz_region_is_input: 套餐.sjz_region_is_input != null ? 套餐.sjz_region_is_input : 0,
          sjz_field_order: 套餐.sjz_field_order || '',
        });
        n++;
      }
    }

    await Card.bulkCreate(新卡密列表);

    res.json({
      code: 1,
      message: `成功生成 ${新卡密列表.length} 个卡密`,
      data: {
        batch_no: 批次号,
        batch_id: 批次.id,
        codes: 新卡密列表.map(c => c.code),
        count: 新卡密列表.length,
        template_name: 套餐.product_name,
        business_type: 套餐.business_type,
      },
    });
  } catch (错误) {
    console.error('卡密工作台生成卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 订单中心：角标数量接口 =====
// GET /admin/api/order-center/badge-counts
// 返回三业务待处理订单数，用于Tab角标显示
router.get('/order-center/badge-counts', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const [jz, xi, tp, sjz] = await Promise.all([
      Order.count({ where: { business_type: 'jiazheng', status: 0 } }),
      Order.count({ where: { business_type: 'xiyifu', status: 0 } }),
      Order.count({ where: { business_type: 'topup', status: 0 } }),
      Order.count({ where: { business_type: 'sjz', status: 0 } }),
    ]);
    res.json({ code: 1, data: { jiazheng: jz, xiyifu: xi, topup: tp, sjz } });
  } catch (错误) {
    console.error('获取订单角标数量出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 阿奇所SUP日志管理 =====

// 获取SUP日志列表（分页+筛选）
router.get('/sup-logs', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { SupLog } = require('../models');
    const {
      page = 1,
      pageSize = 20,
      log_type,
      result,
      order_no,
      ecommerce_order_no,
      card_code,
      start_date,
      end_date,
    } = req.query;

    const 条件 = {};
    if (log_type) 条件.log_type = log_type;
    if (result) 条件.result = result;
    if (order_no) 条件.order_no = { [Op.like]: `%${order_no}%` };
    if (ecommerce_order_no) 条件.ecommerce_order_no = { [Op.like]: `%${ecommerce_order_no}%` };
    if (card_code) 条件.card_code = { [Op.like]: `%${card_code.toUpperCase()}%` };
    if (start_date || end_date) {
      条件.created_at = {};
      // 使用 YYYY-MM-DD 格式安全解析日期，防止非法日期字符串导致查询异常
      if (start_date && /^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
        const [y, m, d] = start_date.split('-').map(Number);
        条件.created_at[Op.gte] = new Date(y, m - 1, d, 0, 0, 0);
      }
      if (end_date && /^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
        const [y, m, d] = end_date.split('-').map(Number);
        条件.created_at[Op.lte] = new Date(y, m - 1, d, 23, 59, 59);
      }
    }

    const { count, rows } = await SupLog.findAndCountAll({
      where: 条件,
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        items: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (错误) {
    console.error('获取SUP日志列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 获取SUP日志统计（今日+累计）
router.get('/sup-logs/stats', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { SupLog } = require('../models');

    const 今天开始 = new Date();
    今天开始.setHours(0, 0, 0, 0);

    const [
      今日总数, 今日成功,
      今日下单, 今日撤单, 今日查单,
      今日下单成功, 今日撤单成功,
      累计总数, 累计成功,
      累计下单, 累计撤单,
    ] = await Promise.all([
      SupLog.count({ where: { created_at: { [Op.gte]: 今天开始 } } }),
      SupLog.count({ where: { created_at: { [Op.gte]: 今天开始 }, result: 'success' } }),
      SupLog.count({ where: { created_at: { [Op.gte]: 今天开始 }, log_type: 'createPurchase' } }),
      SupLog.count({ where: { created_at: { [Op.gte]: 今天开始 }, log_type: 'cancelOrder' } }),
      SupLog.count({ where: { created_at: { [Op.gte]: 今天开始 }, log_type: 'queryOrder' } }),
      SupLog.count({ where: { created_at: { [Op.gte]: 今天开始 }, log_type: 'createPurchase', result: 'success' } }),
      SupLog.count({ where: { created_at: { [Op.gte]: 今天开始 }, log_type: 'cancelOrder', result: 'success' } }),
      SupLog.count(),
      SupLog.count({ where: { result: 'success' } }),
      SupLog.count({ where: { log_type: 'createPurchase' } }),
      SupLog.count({ where: { log_type: 'cancelOrder' } }),
    ]);

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        // 今日统计
        todayTotal: 今日总数,
        todaySuccess: 今日成功,
        todayPurchase: 今日下单,
        todayCancel: 今日撤单,
        todayQuery: 今日查单,
        todayPurchaseSuccess: 今日下单成功,
        todayCancelSuccess: 今日撤单成功,
        todaySuccessRate: 今日总数 > 0 ? Math.round((今日成功 / 今日总数) * 100) : 0,
        // 累计统计
        totalAll: 累计总数,
        totalSuccess: 累计成功,
        totalPurchase: 累计下单,
        totalCancel: 累计撤单,
        totalSuccessRate: 累计总数 > 0 ? Math.round((累计成功 / 累计总数) * 100) : 0,
      },
    });
  } catch (错误) {
    console.error('获取SUP日志统计出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 三角洲订单管理 =====

// 导出三角洲订单CSV（必须在 /:id 之前注册）
router.get('/sjz-orders/export', 验证Token, async (req, res) => {
  req.query.business_type = 'sjz';
  return 导出订单(req, res);
});

// 三角洲订单页搜索卡密（必须在 /:id 之前注册）
router.get('/sjz-orders/search-card', 验证Token, async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { Card } = require('../models');
    const keyword = (req.query.keyword || '').trim();
    if (!keyword) return res.json({ code: 0, message: '请输入卡密码' });

    const 卡密列表 = await Card.findAll({
      where: {
        business_type: 'sjz',
        code: { [Op.like]: `%${keyword}%` },
      },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const 结果 = await Promise.all(卡密列表.map(async (卡密) => {
      let order_no = null;
      try {
        const 订单 = await Order.findOne({
          where: { card_code: 卡密.code },
          order: [['created_at', 'DESC']],
          attributes: ['order_no'],
        });
        if (订单) order_no = 订单.order_no;
      } catch {}
      return {
        id: 卡密.id,
        code: 卡密.code,
        status: 卡密.status,
        service_type: 卡密.sjz_hafubi_amount ? `${卡密.sjz_hafubi_amount}哈夫币` : '-',
        created_at: 卡密.created_at,
        order_no,
      };
    }));

    res.json({ code: 1, message: '获取成功', data: 结果 });
  } catch (错误) {
    console.error('[三角洲] 搜索卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 三角洲订单列表（强制 business_type='sjz'）
router.get('/sjz-orders', 验证Token, async (req, res) => {
  req.query.business_type = 'sjz';
  return 获取订单列表(req, res);
});

// 三角洲订单详情
router.get('/sjz-orders/:id', 验证Token, 获取订单详情);

// 更新三角洲订单状态
router.put('/sjz-orders/:id/status', 验证Token, 更新订单状态);

// 更新三角洲订单备注
router.put('/sjz-orders/:id/remark', 验证Token, 更新订单备注);

// 重置三角洲订单
router.post('/sjz-orders/:id/reset', 验证Token, 重置订单);

// 三角洲订单退款
router.post('/sjz-orders/:id/confirm-refund', 验证Token, async (req, res) => {
  try {
    const 订单 = await Order.findOne({ where: { id: req.params.id, business_type: 'sjz' } });
    if (!订单) return res.json({ code: 0, message: '三角洲订单不存在' });

    if (订单.card_code) {
      const { Card } = require('../models');
      await Card.update({ status: 2, invalidated_at: new Date() }, { where: { code: 订单.card_code } });
    }

    const { 安全解析JSON } = require('../utils/helpers');
    const 现有日志 = 安全解析JSON(订单.order_log, []);
    现有日志.push({
      时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      操作: '退款完成，卡密已作废',
      状态: 'success',
    });
    await 订单.update({ status: 6, order_log: JSON.stringify(现有日志) });

    res.json({ code: 1, message: '退款完成，卡密已作废' });

    // ===== 退款后异步更新企业微信：客户备注 + 群名称 =====
    setImmediate(async () => {
      try {
        const { Setting } = require('../models');
        const 设置列表 = await Setting.findAll();
        const 设置对象 = {};
        设置列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });

        if (设置对象.qywx_enabled !== '1') return;

        const 额外参数 = { status_text: '已退款', refund_reason: req.body?.refund_reason || '退款' };

        // 退款后更新客户备注
        const 退款备注模板 = 设置对象.qywx_refund_remark_template || '';
        if (退款备注模板 && 订单.qywx_assigned_user && 订单.qywx_external_userid) {
          const 备注内容 = qywxService.渲染模板(退款备注模板, 订单, 额外参数);
          if (备注内容) {
            await qywxService.自动备注客户(订单.qywx_assigned_user, 订单.qywx_external_userid, 备注内容).catch(e => {
              console.warn('[三角洲] 退款后更新客户备注失败:', e.message);
            });
          }
        }

        // 退款后更新群名称
        const 退款群名称模板 = 设置对象.qywx_refund_group_name_template || '';
        if (退款群名称模板 && 订单.qywx_group_chat_id) {
          const 新群名称 = qywxService.渲染模板(退款群名称模板, 订单, 额外参数);
          if (新群名称) {
            await qywxService.更新群信息(订单.qywx_group_chat_id, 新群名称).catch(e => {
              console.warn('[三角洲] 退款后更新群名称失败:', e.message);
            });
          }
        }
      } catch (企微错误) {
        console.error('[三角洲] 退款后企业微信更新出错（不影响退款结果）:', 企微错误.message);
      }
    });
  } catch (错误) {
    console.error('[三角洲] 确认退款出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// ===== 三角洲卡密管理 =====

// 三角洲卡密列表
router.get('/sjz-cards', 验证Token, async (req, res) => {
  req.query.business_type = 'sjz';
  return 获取卡密列表(req, res);
});

// 生成三角洲卡密
router.post('/sjz-cards/generate', 验证Token, async (req, res) => {
  try {
    const {
      count = 1,
      remark = '',
      expired_at = null,
      sjz_hafubi_amount = null,
      sjz_show_nickname = 1,
      sjz_show_insurance = 1,
      sjz_insurance_options = '0,1,2,3,4,5,6',
      sjz_show_is_adult = 0,
      sjz_adult_options = '已成年,未成年',
      sjz_show_warehouse = 0,
      sjz_require_phone = 1,
      sjz_show_login_method = 0,
      sjz_login_method_options = '扫码',
      sjz_show_region = 0,
      sjz_region_options = 'VX,QQ',
      sjz_region_is_input = 0,
      sjz_field_order = '',
    } = req.body;
    const { CardBatch, Card: CardModel } = require('../models');
    const { 生成卡密: 生成卡密码 } = require('../utils/helpers');

    const 实际数量 = Math.min(parseInt(count) || 1, 5000);
    const 批次号 = `SJZ${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const 批次 = await CardBatch.create({
      batch_no: 批次号,
      category: '三角洲哈夫币',
      service_type: sjz_hafubi_amount ? `${sjz_hafubi_amount}哈夫币` : '三角洲服务',
      service_hours: 0,
      count: 实际数量,
      remark: remark || '',
      business_type: 'sjz',
      created_by: req.管理员?.id || null,
      created_at: new Date(),
      sjz_hafubi_amount: sjz_hafubi_amount || null,
      sjz_show_nickname,
      sjz_show_insurance,
      sjz_insurance_options,
      sjz_show_is_adult,
      sjz_adult_options,
      sjz_show_warehouse,
      sjz_require_phone,
      sjz_show_login_method,
      sjz_login_method_options,
      sjz_show_region,
      sjz_region_options,
      sjz_region_is_input,
      sjz_field_order,
    });

    const 现有卡密 = await CardModel.findAll({ attributes: ['code'] });
    const 已有集合 = new Set(现有卡密.map(c => c.code));

    const 新卡密列表 = [];
    let n = 0, tries = 0;
    while (n < 实际数量 && tries < 实际数量 * 10) {
      tries++;
      const 码 = 生成卡密码(16, 'SJZ');
      if (!已有集合.has(码)) {
        已有集合.add(码);
        新卡密列表.push({
          code: 码,
          category: '三角洲哈夫币',
          service_type: sjz_hafubi_amount ? `${sjz_hafubi_amount}哈夫币` : '三角洲服务',
          service_hours: 0,
          remark: remark || '',
          status: 0,
          created_by: req.管理员?.id || null,
          batch_id: 批次.id,
          expired_at: expired_at || null,
          created_at: new Date(),
          business_type: 'sjz',
          sjz_hafubi_amount: sjz_hafubi_amount || null,
          sjz_show_nickname,
          sjz_show_insurance,
          sjz_insurance_options,
          sjz_show_is_adult,
          sjz_adult_options,
          sjz_show_warehouse,
          sjz_require_phone,
          sjz_show_login_method,
          sjz_login_method_options,
          sjz_show_region,
          sjz_region_options,
          sjz_region_is_input,
          sjz_field_order,
        });
        n++;
      }
    }

    await CardModel.bulkCreate(新卡密列表);

    res.json({
      code: 1,
      message: `成功生成 ${新卡密列表.length} 个三角洲卡密`,
      data: {
        batch_no: 批次号,
        batch_id: 批次.id,
        codes: 新卡密列表.map(c => c.code),
        count: 新卡密列表.length,
      },
    });
  } catch (错误) {
    console.error('[三角洲] 生成卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 获取三角洲预览卡密
router.get('/sjz-cards/preview-card', 验证Token, async (req, res) => {
  try {
    const { Card: CardModel } = require('../models');
    const 卡密 = await CardModel.findOne({
      where: { status: 0, business_type: 'sjz' },
      order: [['created_at', 'DESC']],
    });
    if (!卡密) return res.json({ code: 0, message: '暂无可用三角洲卡密，请先生成卡密', data: null });
    res.json({ code: 1, message: 'ok', data: { code: 卡密.code } });
  } catch (错误) {
    console.error('[三角洲] 获取预览卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

// 删除三角洲卡密
router.delete('/sjz-cards/:id', 验证Token, 删除卡密);

// 作废三角洲卡密
router.put('/sjz-cards/:id/invalidate', 验证Token, 作废卡密);

// 导出三角洲卡密CSV（必须在 /:id 之前注册）
router.get('/sjz-cards/export', 验证Token, async (req, res) => {
  req.query.business_type = 'sjz';
  return 导出卡密(req, res);
});

// 三角洲批次列表
router.get('/sjz-card-batches', 验证Token, async (req, res) => {
  const { CardBatch, Card: CardModel } = require('../models');
  try {
    const 批次列表 = await CardBatch.findAll({
      where: { business_type: 'sjz' },
      order: [['created_at', 'DESC']],
    });
    const 批次数据 = await Promise.all(批次列表.map(async (批次) => {
      const [实际数量, 已用数量, 未用数量] = await Promise.all([
        CardModel.count({ where: { batch_id: 批次.id } }),
        CardModel.count({ where: { batch_id: 批次.id, status: 1 } }),
        CardModel.count({ where: { batch_id: 批次.id, status: 0 } }),
      ]);
      return { ...批次.toJSON(), actual_count: 实际数量, used_count: 已用数量, unused_count: 未用数量 };
    }));
    res.json({ code: 1, message: '获取成功', data: 批次数据 });
  } catch (e) {
    console.error('[三角洲] 获取批次出错:', e);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
});

router.get('/sjz-card-batches/:id/cards', 验证Token, 获取批次卡密);
router.delete('/sjz-card-batches/:id', 验证Token, 删除批次);

module.exports = router;
