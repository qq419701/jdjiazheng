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
    comment: '状态：0待处理 1处理中 2服务中 3已完成 4已取消 5失败 6拒绝退款(SUP拒绝撤单)',
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
    comment: '备注（文字部分）',
  },
  remark_images: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注图片JSON数组（管理员上传的图片URL列表）',
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
    comment: '业务类型：jiazheng=京东家政 xiyifu=京东洗衣服 topup=会员充值',
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
  // 取件时间段（结构化，方便传给鲸蚁API）
  visit_time_start: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '取件开始时间 如09:00:00',
  },
  visit_time_end: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '取件结束时间 如10:00:00',
  },
  // 鲸蚁工厂信息（鲸蚁回调状态1时写入）
  factory_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '洗衣工厂名称',
  },
  factory_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '洗衣工厂代码',
  },
  // 快递信息
  return_waybill_code: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '回寄快递单号（状态5回寄时写入）',
  },
  express_routes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '物流路由JSON（查询后缓存，含pickup/return两段）',
  },
  express_waybill_code: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '快递API主动创建的快递单号（区别于鲸蚁回调写入的 express_order_id）',
  },
  // 充值专用字段（business_type='topup' 时使用）
  topup_account: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '用户填写的充值账号（手机号/微信号/QQ号/邮箱等）',
  },
  topup_account_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '充值账号类型（来自卡密配置）',
  },
  topup_member_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '充值会员名称（来自卡密配置，如：优酷年卡）',
  },
  topup_arrival_time: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '预计到账时间（来自卡密配置）',
  },
  topup_is_expired: {
    type: DataTypes.TINYINT,
    defaultValue: -1,
    comment: '会员是否已到期：-1=未填写/不适用 0=未到期 1=已到期',
  },
  login_city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '用户登录城市（通过IP定位获取，如：广东省东莞市）',
  },
  login_province: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '用户登录省份',
  },
  login_ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '用户提交订单时的IP地址',
  },
  ecommerce_order_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '电商平台订单号（从卡密的ecommerce_order_no自动带入，如小红书单号P791381403338389551）',
  },
  // ===== 三角洲专用字段 =====
  sjz_game_nickname: { type: DataTypes.STRING(100), allowNull: true, comment: '游戏昵称' },
  sjz_insurance_slots: { type: DataTypes.TINYINT, allowNull: true, comment: '保险格数(0-6)' },
  sjz_is_adult: { type: DataTypes.TINYINT, defaultValue: -1, comment: '是否成年:1是0否-1未填' },
  sjz_warehouse_images: { type: DataTypes.TEXT, allowNull: true, comment: '仓库截图URL JSON数组' },
  sjz_hafubi_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: '哈夫币数量' },
  // ===== 企业微信字段 =====
  qywx_config_id: { type: DataTypes.STRING(100), allowNull: true, comment: '企业微信联系我config_id' },
  qywx_qrcode_url: { type: DataTypes.TEXT, allowNull: true, comment: '专属二维码URL' },
  qywx_link: { type: DataTypes.TEXT, allowNull: true, comment: '专属跳转链接' },
  qywx_assigned_user: { type: DataTypes.STRING(50), allowNull: true, comment: '分配员工userid' },
  qywx_external_userid: { type: DataTypes.STRING(100), allowNull: true, comment: '客户enterprise外部userid' },
  qywx_group_chat_id: { type: DataTypes.STRING(100), allowNull: true, comment: '客户群ID' },
  qywx_add_friend_at: { type: DataTypes.DATE, allowNull: true, comment: '加好友时间' },
  qywx_group_created_at: { type: DataTypes.DATE, allowNull: true, comment: '建群时间' },
}, {
  tableName: 'orders',
  timestamps: false,
  comment: '订单表',
});

module.exports = Order;
