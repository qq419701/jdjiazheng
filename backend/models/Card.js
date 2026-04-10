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
  used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '卡密使用时间（客户提交订单时记录）',
  },
  invalidated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '卡密作废时间（手动作废或SUP撤单时记录）',
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
    comment: '业务类型：jiazheng=京东家政 xiyifu=京东洗衣服 topup=会员充值',
  },
  // 充值专用字段（business_type='topup' 时使用）
  topup_account_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '充值账号类型：phone=手机号 wechat=微信号 qq=QQ号 email=邮箱 other=其他',
  },
  topup_account_label: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '充值账号输入框前端显示标签，如：请输入手机号、请输入微信号',
  },
  topup_member_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '充值会员名称，如：优酷年卡、爱奇艺季卡、腾讯视频月卡',
  },
  topup_member_icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '会员图标URL（可选，显示在Banner区域）',
  },
  topup_arrival_time: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '预计到账时间，如：1-6小时、24小时内、即时到账',
  },
  topup_show_expired: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否显示"会员是否到期"选项：0=不显示 1=显示（有些会员不需要此选项）',
  },
  topup_steps: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '充值步骤说明，如：①填写充值账号 ②等待客服联系 ③充值成功（显示在前端）',
  },
  topup_account_regex: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '批次级自定义账号验证正则（覆盖全局设置正则，为空则使用全局）',
  },
  topup_account_error_msg: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '自定义验证失败提示语（如：请输入正确的游戏账号）',
  },
  agiso_order_no: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '奇所平台订单号（用于撤单和查单）',
  },
  ecommerce_order_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '电商平台订单号（从阿奇索attach字段解析，如 P791381403338389551-00）',
  },
  sup_status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: 'SUP发货状态：0未发货 1已发货 2已撤单',
  },
  sup_product_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'SUP商品编号（下单时的productNo）',
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联商品ID',
  },
}, {
  tableName: 'cards',
  timestamps: false,
  comment: '卡密表',
});

module.exports = Card;
