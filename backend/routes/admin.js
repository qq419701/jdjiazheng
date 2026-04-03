// 后台管理接口路由
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const 配置 = require('../config/config');
const { Admin, Order } = require('../models');
const { 验证Token } = require('../middleware/auth');
const { 获取订单列表, 获取订单详情, 更新订单状态, 触发自动下单 } = require('../controllers/orderController');
const { 获取卡密列表, 生成卡密, 导出卡密, 删除卡密, 获取批次列表, 获取批次卡密 } = require('../controllers/cardController');
const { 获取账号列表, 新增账号, 更新账号, 删除账号, 触发自动登录 } = require('../controllers/jdAccountController');
const { 获取规则列表, 新增规则, 更新规则, 删除规则 } = require('../controllers/timeRuleController');
const { 获取所有设置, 批量更新设置 } = require('../controllers/settingController');

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
router.get('/orders/:id', 验证Token, 获取订单详情);
router.put('/orders/:id/status', 验证Token, 更新订单状态);
router.post('/orders/:id/place-order', 验证Token, 触发自动下单);

// 卡密管理
router.get('/cards', 验证Token, 获取卡密列表);
router.post('/cards/generate', 验证Token, 生成卡密);
router.get('/cards/export', 验证Token, 导出卡密);
router.delete('/cards/:id', 验证Token, 删除卡密);

// 卡密批次管理
router.get('/card-batches', 验证Token, 获取批次列表);
router.get('/card-batches/:id/cards', 验证Token, 获取批次卡密);

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

module.exports = router;
