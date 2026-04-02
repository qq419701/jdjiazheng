// 全局配置文件
require('dotenv').config();

const 配置 = {
  // 服务端口
  端口: process.env.PORT || 5500,
  // JWT密钥
  JWT密钥: process.env.JWT_SECRET || 'jdjiazheng_default_secret_2024',
  // JWT过期时间
  JWT过期时间: '7d',
  // 环境
  环境: process.env.NODE_ENV || 'development',
  // Puppeteer配置
  Puppeteer: {
    无头模式: process.env.PUPPETEER_HEADLESS !== 'false',
    超时时间: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
  },
  // 卡密长度
  卡密长度: 16,
  // 自动下单最大重试次数
  最大重试次数: 3,
};

module.exports = 配置;
