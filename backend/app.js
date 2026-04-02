// 京东家政预约代下单系统 - 后端主入口
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const 配置 = require('./config/config');
const { 请求日志 } = require('./middleware/logger');

const app = express();

// ===== 中间件配置 =====

// 跨域配置
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

// ===== 静态文件托管 =====
// 后台管理页面（/admin 路径）
app.use('/admin', express.static(path.join(__dirname, '../frontend-admin/dist')));
// 前端H5页面（/ 根路径）
app.use(express.static(path.join(__dirname, '../frontend-h5/dist')));

// ===== API路由 =====
// H5前端接口
app.use('/api', require('./routes/api'));
// 后台管理接口
app.use('/admin/api', require('./routes/admin'));

// ===== 前端路由处理（SPA支持）=====
// 后台管理页面路由
app.get('/admin/*', (req, res) => {
  const adminDist = path.join(__dirname, '../frontend-admin/dist/index.html');
  if (require('fs').existsSync(adminDist)) {
    res.sendFile(adminDist);
  } else {
    res.send('<h1>后台管理页面未构建，请执行 npm run build</h1>');
  }
});

// H5前端路由（卡密链接）
app.get('/link/:code', (req, res) => {
  const h5Dist = path.join(__dirname, '../frontend-h5/dist/index.html');
  if (require('fs').existsSync(h5Dist)) {
    res.sendFile(h5Dist);
  } else {
    res.send('<h1>前端页面未构建，请执行 npm run build</h1>');
  }
});

// ===== 启动服务 =====
const 端口 = 配置.端口;

app.listen(端口, async () => {
  console.log(`\n🚀 京东家政预约代下单系统启动成功`);
  console.log(`📡 服务端口：${端口}`);
  console.log(`🌐 前端H5：http://localhost:${端口}/link/{卡密}`);
  console.log(`🖥️  后台管理：http://localhost:${端口}/admin`);
  console.log(`📋 API文档：http://localhost:${端口}/api\n`);

  // 尝试连接数据库
  try {
    const 数据库连接 = require('./config/database');
    await 数据库连接.authenticate();
    console.log('✅ 数据库连接成功');

    // 自动同步数据库结构
    await 数据库连接.sync({ alter: false });
    console.log('✅ 数据库结构已同步');
  } catch (错误) {
    console.error('❌ 数据库连接失败:', 错误.message);
    console.log('💡 请检查数据库配置（.env文件）并运行：node init/initDB.js');
  }
});

module.exports = app;
