// 订单模型
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const Order = 数据库连接.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  order_no: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
    comment: '订单编号（唯一）',
  },
  card_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '使用的卡密',
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '客户姓名',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '客户手机号',
  },
  province: {
    type: DataTypes.STRING(50),
    comment: '省',
  },
  city: {
    type: DataTypes.STRING(50),
    comment: '市',
  },
  district: {
    type: DataTypes.STRING(50),
    comment: '区/县',
  },
  address: {
    type: DataTypes.TEXT,
    comment: '详细地址',
  },
  full_address: {
    type: DataTypes.TEXT,
    comment: '完整地址（省市区+详细地址）',
  },
  visit_date: {
    type: DataTypes.STRING(20),
    comment: '预约上门日期',
  },
  visit_time: {
    type: DataTypes.STRING(20),
    comment: '预约上门时间段',
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
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0待处理 1下单中 2已下单 3失败 4已取消 5安排中 6预约完成 7预约失败',
  },
  jd_order_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '京东订单号',
  },
  jd_account_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '使用的京东账号ID',
  },
  auto_order: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '下单方式：0手动 1自动',
  },
  fail_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '失败原因',
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作管理员ID',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
  ordered_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下单成功时间',
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注',
  },
  street: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '街道/镇',
  },
  order_log: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作日志（JSON格式）',
  },
  business_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'jiazheng',
    comment: '业务类型：jiazheng=京东家政 xiyifu=京东洗衣服',
  },
  laundry_order_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '洗衣订单API返回的订单ID（洗衣服务专用）',
  },
  express_order_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '快递API返回的快递单号（洗衣服务专用）',
  },
  express_company: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '快递公司（洗衣服务专用）',
  },
  laundry_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '洗衣订单状态（洗衣服务专用）',
  },
  visit_times: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '多备选预约时间（JSON数组格式：[{date:"2024-01-19",time:"09:00",priority:1},...]）',
  },
  return_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '收件人姓名（洗衣专用）',
  },
  return_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '收件人手机（洗衣专用）',
  },
  return_province: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '收件省（洗衣专用）',
  },
  return_city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '收件市（洗衣专用）',
  },
  return_district: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '收件区（洗衣专用）',
  },
  return_address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '收件详细地址（洗衣专用）',
  },
  laundry_images: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '预检图片JSON（洗衣专用）',
  },
}, {
  tableName: 'orders',
  timestamps: false,
  comment: '订单表',
});

module.exports = Order;
