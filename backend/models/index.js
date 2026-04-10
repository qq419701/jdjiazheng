// 模型入口文件，统一导出所有模型
const 数据库连接 = require('../config/database');
const Card = require('./Card');
const CardBatch = require('./CardBatch');
const Order = require('./Order');
const JdAccount = require('./JdAccount');
const TimeRule = require('./TimeRule');
const Admin = require('./Admin');
const Setting = require('./Setting');
const Region = require('./Region');
const Product = require('./Product');
const SupLog = require('./SupLog');

// 建立批次与卡密的关联关系
CardBatch.hasMany(Card, { foreignKey: 'batch_id', as: '卡密列表' });
Card.belongsTo(CardBatch, { foreignKey: 'batch_id', as: '批次' });

// 建立商品与卡密/批次的关联关系
Product.hasMany(Card, { foreignKey: 'product_id', as: '卡密列表' });
Card.belongsTo(Product, { foreignKey: 'product_id', as: '商品' });
Product.hasMany(CardBatch, { foreignKey: 'product_id', as: '批次列表' });
CardBatch.belongsTo(Product, { foreignKey: 'product_id', as: '商品' });

// 导出所有模型和数据库连接
module.exports = {
  数据库连接,
  Card,
  CardBatch,
  Order,
  JdAccount,
  TimeRule,
  Admin,
  Setting,
  Region,
  Product,
  SupLog,
};
