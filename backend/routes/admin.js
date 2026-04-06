// 后台管理接口路由
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const 配置 = require('../config/config');
const { Admin, Order } = require('../models');
const { 验证Token } = require('../middleware/auth');
const { 获取订单列表, 获取订单详情, 更新订单状态, 触发自动下单, 重置订单, 更新订单备注, 导出订单 } = require('../controllers/orderController');
const { 获取卡密列表, 生成卡密, 导出卡密, 作废卡密, 删除卡密, 获取批次列表, 获取批次卡密, 删除批次 } = require('../controllers/cardController');
const { 获取账号列表, 新增账号, 更新账号, 删除账号, 触发自动登录 } = require('../controllers/jdAccountController');
const { 获取规则列表, 新增规则, 更新规则, 删除规则 } = require('../controllers/timeRuleController');
const { 获取所有设置, 批量更新设置 } = require('../controllers/settingController');
const { 获取地区列表, 后台查询地区, 新增地区, 更新地区, 删除地区, 切换地区状态, 获取地区统计, 导入地区CSV } = require('../controllers/regionController');
const multer = require('multer');
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const { 触发洗衣下单, 查询洗衣订单状态, 取消洗衣订单, 获取洗衣订单列表, 获取洗衣订单详情, 修改洗衣订单并同步鲸蚁, 测试洗衣API连接, 获取洗衣Token状态, 查询洗衣物流 } = require('../controllers/laundryController');

// ===== 登录接口（无需鉴权）=====
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 0, message: '请输入用户名和密码' });
    }

    const 管理员 = await Admin.findOne({ where: { username } });
    if (!管理员) {
      return res.json({ code: 0, message: '用户名或密码错误' });
    }

    const 密码正确 = await bcrypt.compare(password, 管理员.password);
    if (!密码正确) {
      return res.json({ code: 0, message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    await 管理员.update({ last_login: new Date() });

    // 生成JWT
    const token = jwt.sign(
      { id: 管理员.id, username: 管理员.username, role: 管理员.role },
      配置.JWT密钥,
      { expiresIn: 配置.JWT过期时间 }
    );

    res.json({
      code: 1,
      message: '登录成功',
      data: { token, username: 管理员.username, role: 管理员.role },
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
router.get('/orders/:id', 验证Token, 获取订单详情);
router.put('/orders/:id/status', 验证Token, 更新订单状态);
router.put('/orders/:id/remark', 验证Token, 更新订单备注); // 快速更新备注接口
router.post('/orders/:id/place-order', 验证Token, 触发自动下单);
router.post('/orders/:id/reset', 验证Token, 重置订单);

// 卡密管理
router.get('/cards', 验证Token, 获取卡密列表);
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

// 卡密批次管理
router.get('/card-batches', 验证Token, 获取批次列表);
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

// 系统设置
router.get('/settings', 验证Token, 获取所有设置);
router.put('/settings', 验证Token, 批量更新设置);

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

module.exports = router;
