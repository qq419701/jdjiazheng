// 管理员模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const Admin = 数据库连接.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: '管理员用户名',
  },
  password: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '密码（bcrypt加密）',
  },
  role: {
    type: DataTypes.ENUM('super', 'admin'),
    defaultValue: 'admin',
    comment: '角色：super超级管理员 admin普通管理员',
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
}, {
  tableName: 'admins',
  timestamps: false,
  comment: '管理员表',
});

module.exports = Admin;
