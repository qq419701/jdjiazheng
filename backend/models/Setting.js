// 系统配置模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const Setting = 数据库连接.define('Setting', {
  key_name: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    comment: '配置键名',
  },
  key_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '配置值',
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '配置描述',
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间',
  },
}, {
  tableName: 'settings',
  timestamps: false,
  comment: '系统配置表',
});

module.exports = Setting;
