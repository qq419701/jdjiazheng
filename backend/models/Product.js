// 商品模型（SUP商品管理）
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const Product = 数据库连接.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  product_no: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    comment: '商品编号（如1001、1002），系统自动分配，永久不变',
  },
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品名称',
  },
  business_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'jiazheng',
    comment: '业务类型：jiazheng=家政 xiyifu=洗衣 topup=充值',
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '服务类型（如日常保洁）',
  },
  service_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '服务时长（小时），洗衣类填0',
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '成本价（元）',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用',
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
}, {
  tableName: 'products',
  timestamps: false,
  comment: '商品表（SUP商品管理）',
});

module.exports = Product;
