// 数据库配置文件
require('dotenv').config();
const { Sequelize } = require('sequelize');

// 创建Sequelize实例
const 数据库连接 = new Sequelize(
  process.env.DB_NAME || 'jdjiazheng',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    // 时区设置为上海
    timezone: '+08:00',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      // 使用下划线命名
      underscored: false,
      // 禁用自动添加时间戳（手动管理）
      timestamps: false,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = 数据库连接;
