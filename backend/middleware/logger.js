// 日志中间件
const fs = require('fs');
const path = require('path');

/**
 * 请求日志中间件
 * 记录所有API请求的基本信息
 */
const 请求日志 = (req, res, next) => {
  const 开始时间 = Date.now();
  const 时间字符串 = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  // 请求完成后记录
  res.on('finish', () => {
    const 耗时 = Date.now() - 开始时间;
    const 日志内容 = `[${时间字符串}] ${req.method} ${req.originalUrl} ${res.statusCode} ${耗时}ms\n`;
    
    // 控制台输出
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(日志内容);
    }
  });
  
  next();
};

module.exports = { 请求日志 };
