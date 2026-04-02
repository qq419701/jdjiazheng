// 模型入口文件，统一导出所有模型
const 数据库连接 = require('../config/database');
const Card = require('./Card');
const Order = require('./Order');
const JdAccount = require('./JdAccount');
const TimeRule = require('./TimeRule');
const Admin = require('./Admin');
const Setting = require('./Setting');

// 导出所有模型和数据库连接
module.exports = {
  数据库连接,
  Card,
  Order,
  JdAccount,
  TimeRule,
  Admin,
  Setting,
};
