// 时间规则模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const TimeRule = 数据库连接.define('TimeRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  rule_type: {
    type: DataTypes.ENUM('city', 'tier', 'global'),
    allowNull: false,
    comment: '规则类型：city城市精确匹配 tier地区等级匹配 global全局默认',
  },
  rule_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '规则名称',
  },
  match_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '匹配值（城市名逗号分隔）',
  },
  locked_days: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    comment: '锁定天数（前N天显示已约满）',
  },
  time_slots: {
    type: DataTypes.TEXT,
    defaultValue: '["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"]',
    comment: '可选时间段（JSON数组）',
  },
  work_days: {
    type: DataTypes.TEXT,
    defaultValue: '[1,2,3,4,5,6,7]',
    comment: '工作日（JSON数组，1=周一，7=周日）',
  },
  max_days: {
    type: DataTypes.INTEGER,
    defaultValue: 14,
    comment: '最远可预约天数',
  },
  is_active: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否启用：1启用 0禁用',
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 99,
    comment: '排序（数值越小优先级越高）',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
}, {
  tableName: 'time_rules',
  timestamps: false,
  comment: '时间规则表',
});

module.exports = TimeRule;
