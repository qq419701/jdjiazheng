// 阿奇所SUP操作日志模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const SupLog = 数据库连接.define('SupLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  log_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '日志类型：createPurchase/cancelOrder/queryOrder/getList/getTemplate/getAppId/callback',
  },
  order_no: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '阿奇所订单号（对应cards.agiso_order_no）',
  },
  ecommerce_order_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '电商平台订单号（从阿奇索attach字段解析，如 P791381403338389551-00）',
  },
  out_trade_no: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '我方outTradeNo（cards.id字符串）',
  },
  card_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '关联卡密码（便于按卡密搜索日志）',
  },
  product_no: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '商品编号',
  },
  buy_num: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '购买数量',
  },
  user_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '奇所平台userId',
  },
  request_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '请求数据JSON（去掉sign字段）',
  },
  response_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '响应数据JSON',
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应code（200/404/401等）',
  },
  order_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '下单状态：10处理中 20成功 30失败',
  },
  order_cost: {
    type: DataTypes.DECIMAL(14, 4),
    allowNull: true,
    comment: '订单成本（元）',
  },
  cancel_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '撤单状态：20成功 30失败',
  },
  result: {
    type: DataTypes.STRING(20),
    defaultValue: 'unknown',
    comment: '结果：success/fail/pending/unknown',
  },
  error_msg: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误或失败原因',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
}, {
  tableName: 'sup_logs',
  timestamps: false,
  comment: '阿奇所SUP操作日志表',
});

module.exports = SupLog;
