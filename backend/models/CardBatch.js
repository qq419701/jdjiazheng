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
    comment: '业务类型：jiazheng=京东家政 xiyifu=京东洗衣服 topup=会员充值',
  },
  // 充值专用字段（business_type='topup' 时使用）
  topup_account_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '充值账号类型',
  },
  topup_account_label: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '账号输入标签',
  },
  topup_member_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '充值会员名称',
  },
  topup_member_icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '会员图标URL',
  },
  topup_arrival_time: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '预计到账时间',
  },
  topup_show_expired: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否显示到期选项',
  },
  topup_steps: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '充值步骤说明',
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
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联商品ID',
  },
  // ===== 三角洲套餐字段 =====
  sjz_hafubi_amount: { type: DataTypes.STRING(50), allowNull: true, comment: '哈夫币数量（文本，如1000万）' },
  sjz_show_nickname: { type: DataTypes.TINYINT, defaultValue: 1, comment: '要求游戏昵称' },
  sjz_show_insurance: { type: DataTypes.TINYINT, defaultValue: 1, comment: '要求保险格数' },
  sjz_insurance_options: { type: DataTypes.STRING(50), defaultValue: '0,1,2,3,4,5,6', comment: '保险格数选项（逗号分隔）' },
  sjz_show_is_adult: { type: DataTypes.TINYINT, defaultValue: 0, comment: '要求成年认证' },
  sjz_adult_options: { type: DataTypes.STRING(100), defaultValue: '已成年,未成年', comment: '成年认证选项（逗号分隔）' },
  sjz_show_warehouse: { type: DataTypes.TINYINT, defaultValue: 0, comment: '要求仓库截图' },
  sjz_require_phone: { type: DataTypes.TINYINT, defaultValue: 1, comment: '必填手机号' },
  sjz_show_login_method: { type: DataTypes.TINYINT, defaultValue: 0, comment: '要求上号方式' },
  sjz_login_method_options: { type: DataTypes.STRING(100), defaultValue: '扫码', comment: '上号方式选项（逗号分隔）' },
  sjz_show_region: { type: DataTypes.TINYINT, defaultValue: 0, comment: '要求区/系统' },
  sjz_region_options: { type: DataTypes.STRING(200), defaultValue: 'VX,QQ', comment: '区/系统选项（逗号分隔，空=自由填写）' },
  sjz_region_is_input: { type: DataTypes.TINYINT, defaultValue: 0, comment: '区/系统是否为输入框：1=输入框 0=单选按钮' },
  sjz_field_order: { type: DataTypes.STRING(200), defaultValue: '', comment: '三角洲字段显示顺序（逗号分隔字段key）' },
}, {
  tableName: 'card_batches',
  timestamps: false,
  comment: '卡密批次表',
});

module.exports = CardBatch;
