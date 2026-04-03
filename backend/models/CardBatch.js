// 卡密批次模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const CardBatch = 数据库连接.define('CardBatch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  batch_no: {
    type: DataTypes.STRING(30),
    unique: true,
    comment: '批次号',
  },
  category: {
    type: DataTypes.STRING(50),
    comment: '服务分类',
  },
  service_type: {
    type: DataTypes.STRING(50),
    comment: '服务类型',
  },
  service_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    comment: '服务时长（小时）',
  },
  count: {
    type: DataTypes.INTEGER,
    comment: '生成数量',
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建人管理员ID',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
  business_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'jiazheng',
    comment: '业务类型：jiazheng=京东家政 xiyifu=京东洗衣服',
  },
}, {
  tableName: 'card_batches',
  timestamps: false,
  comment: '卡密批次表',
});

module.exports = CardBatch;
