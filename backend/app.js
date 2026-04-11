// 京东家政预约代下单系统 - 后端主入口
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const 配置 = require('./config/config');
const { 请求日志 } = require('./middleware/logger');

const app = express();

// ===== 中间件配置 =====

// 修复：开启信任代理，解决 Nginx 反向代理下 express-rate-limit 报
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR 错误的问题
app.set('trust proxy', 1);

// 跨域配置（H5页面需要跨域访问）
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(请求日志);

// ===== 接口限流配置 =====

// 登录接口限流：每IP每15分钟最多10次
const 登录限流 = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 10,
  message: { code: -1, message: '登录尝试过于频繁，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 卡密验证限流：每IP每分钟最多30次
const 卡密限流 = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30,
  message: { code: -1, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 提交订单限流：每IP每分钟最多5次
const 订单限流 = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { code: -1, message: '提交过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 后台管理API通用限流：每IP每分钟最多120次（避免多接口同时加载触发限流）
const 管理API限流 = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { code: -1, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 页面访问限流：每IP每分钟最多120次
const 页面限流 = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== 静态文件托管 =====
// 后台管理静态文件（/admin 路径）
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
// 洗衣H5静态文件（/xi 路径）
app.use('/xi', express.static(path.join(__dirname, 'public/xi')));
// 充值H5静态文件（/cz 路径）
app.use('/cz', express.static(path.join(__dirname, 'public/cz')));
// 京东家政H5（/jz 路径，新格式卡密链接：域名/jz/{卡密}）
app.use('/jz', express.static(path.join(__dirname, 'public/h5')));
// 备注图片上传目录（/uploads/remarks/ 路径，供前端直接访问）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 前端H5静态文件（/ 根路径）
app.use(express.static(path.join(__dirname, 'public/h5')));

// ===== API路由 =====
const apiRouter = require('./routes/api');
const adminRouter = require('./routes/admin');

// 奇所SUP接口（供奇所平台调用，不需要JWT，有独立签名验证）
// 注意：SUP接口不做限流，让奇所平台自由调用
const supRouter = require('./routes/sup');
app.use('/', supRouter);

// auth/me 独立高频限流：每IP每分钟最多300次（路由守卫高频调用，不应被通用限流卡住）
const authMe限流 = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { code: -1, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 后台管理接口（登录接口独立限流 + 所有管理接口通用限流）
// 注意：/admin/api 必须在 /api 之前注册，避免路由冲突
// auth/me 使用独立宽松限流，单独注册在通用限流之前（含路由处理器，确保请求不再继续走通用限流）
app.use('/admin/api/auth/me', authMe限流, adminRouter);
app.use('/admin/api/login', 登录限流);
app.use('/admin/api', 管理API限流, adminRouter);

// H5前端接口（应用卡密验证和订单限流）
app.use('/api/verify-card', 卡密限流);
app.use('/api/orders', 订单限流);
app.use('/api/xi/verify-card', 卡密限流);
app.use('/api/xi/orders', 订单限流);
// 充值H5接口限流
app.use('/api/cz/verify-card', 卡密限流);
app.use('/api/cz/orders', 订单限流);
app.use('/api', apiRouter);

// ===== 前端路由处理（SPA支持）===== 
// 后台管理页面路由兜底（/admin/* 返回后台首页）
app.get('/admin/*', 页面限流, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// 洗衣H5路由兜底（/xi/* 返回洗衣H5首页）
app.get('/xi/*', 页面限流, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/xi/index.html'));
});

// 充值H5路由兜底（/cz/* 返回充值H5首页）
app.get('/cz/*', 页面限流, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/cz/index.html'));
});

// 家政H5新路径路由兜底（/jz/{卡密} 格式，新版卡密链接）
app.get('/jz/*', 页面限流, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/h5/index.html'));
});

// H5前端路由兜底（所有非 /api /admin 路径均返回H5首页）
// 路由格式：/{卡密}  例如 /TJR93VDP9Q3Q9984
app.get('*', 页面限流, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/h5/index.html'));
});

// ===== 启动服务 =====
const 端口 = 配置.端口;

app.listen(端口, async () => {
  console.log(`\n🚀 京东家政预约代下单系统启动成功`);
  console.log(`📡 服务端口：${端口}`);
  console.log(`🏠 家政H5：http://localhost:${端口}/jz/{卡密}`);
  console.log(`🧺 洗衣H5：http://localhost:${端口}/xi/{卡密}`);
  console.log(`💳 充值H5：http://localhost:${端口}/cz/{卡密}`);
  console.log(`🖥️  后台管理：http://localhost:${端口}/admin`);
  console.log(`📋 后端接口：http://localhost:${端口}/api`);
  console.log(`🔗 SUP接口：http://localhost:${端口}/agisoAcprSupplierApi/...\n`);

  // 尝试连接数据库
  try {
    const 数据库连接 = require('./config/database');
    await 数据库连接.authenticate();
    console.log('✅ 数据库���接成功');

    // 自动同步数据库结构（仅创建不存在的表，不修改已有表）
    await 数据库连接.sync({ alter: true });
    console.log('✅ 数据库结构已同步');

    // 从数据库恢复洗衣API Token缓存到内存
    try {
      const { 恢复Token缓存 } = require('./services/laundryApiService');
      await 恢复Token缓存();
      console.log('✅ 洗衣API Token缓存已从数据库恢复');
    } catch (e) {
      console.log('ℹ️  洗衣API Token缓存恢复跳过（首次运行或未配置）');
    }
  } catch (错误) {
    console.error('❌ 数据库连接失败:', 错误.message);
    console.log('💡 请检查数据库配置（.env文件）并运行：node init/initDB.js');
  }
});

module.exports = app;