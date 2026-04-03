// 行政区划模型（省市区街道四级）
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const Region = 数据库连接.define('Region', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '名称',
  },
  parent_id: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '父级ID，0为省级',
  },
  level: {
    type: DataTypes.TINYINT,
    comment: '级别：1省 2市 3区 4街道',
  },
  is_enabled: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否启用：1启用 0禁用（后台可控制）',
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序',
  },
}, {
  tableName: 'regions',
  timestamps: false,
  comment: '行政区划表',
});

module.exports = Region;
