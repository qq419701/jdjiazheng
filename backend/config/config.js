// 全局配置文件
require('dotenv').config();

const 配置 = {
  // 服务端口
  端口: process.env.PORT || 5500,
  // JWT密钥（生产环境必须通过环境变量设置，否则使用开发临时密钥并打印警告）
  JWT密钥: (() => {
    if (!process.env.JWT_SECRET) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ 生产环境必须设置 JWT_SECRET 环境变量！');
        process.exit(1);
      }
      console.warn('⚠️  警告：未设置JWT_SECRET，使用开发临时密钥，请勿用于生产环境');
      return 'jdjiazheng_dev_secret_do_not_use_in_production';
    }
    return process.env.JWT_SECRET;
  })(),
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
