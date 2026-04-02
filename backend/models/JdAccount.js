// 京东账号模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const JdAccount = 数据库连接.define('JdAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  nickname: {
    type: DataTypes.STRING(100),
    comment: '备注名称',
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '京东账号（手机号）',
  },
  password: {
    type: DataTypes.STRING(200),
    comment: '京东密码（加密存储）',
  },
  cookie: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '登录Cookie（JSON格式）',
  },
  cookie_expire: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Cookie过期时间',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '账号状态：1正常 0异常',
  },
  is_busy: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否使用中：0空闲 1使用中',
  },
  last_used: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后使用时间',
  },
  use_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '今日使用次数',
  },
  daily_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    comment: '每日下单限制',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
}, {
  tableName: 'jd_accounts',
  timestamps: false,
  comment: '京东账号池表',
});

module.exports = JdAccount;
