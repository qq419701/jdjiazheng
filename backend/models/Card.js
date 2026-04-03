// 卡密模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const Card = 数据库连接.define('Card', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  code: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    comment: '卡密码（16位大写字母+数字）',
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: '日常保洁',
    comment: '服务分类',
  },
  service_type: {
    type: DataTypes.STRING(50),
    defaultValue: '日常保洁',
    comment: '服务类型',
  },
  service_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    comment: '服务时长（小时）',
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0未使用 1已使用 2已失效',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建人管理员ID',
  },
  used_by_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '使用该卡密的订单ID',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
  batch_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '所属批次ID',
  },
  expired_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间',
  },
  business_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'jiazheng',
    comment: '业务类型：jiazheng=京东家政 xiyifu=京东洗衣服',
  },
}, {
  tableName: 'cards',
  timestamps: false,
  comment: '卡密表',
});

module.exports = Card;
