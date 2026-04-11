// 商品模型（SUP商品管理 / 套餐管理）
const { DataTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

const Product = 数据库连接.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  product_no: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
    comment: '商品编号（如1001、1002），系统自动分配，永久不变',
  },
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品名称',
  },
  business_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'jiazheng',
    comment: '业务类型：jiazheng=家政 xiyifu=洗衣 topup=充值',
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '服务类型（如日常保洁）',
  },
  service_hours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '服务时长（小时），0=不限',
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '成本价（元）',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用',
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注',
  },
  // ===== 充值套餐专用字段 =====
  topup_account_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '充值账号类型：phone/wechat/qq/email/other',
  },
  topup_account_label: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '账号输入框标签（如"手机号"）',
  },
  topup_member_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '充值会员名称（如优酷年卡）',
  },
  topup_member_icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '会员图标URL',
  },
  topup_arrival_time: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '预计到账时间（如24小时内）',
  },
  topup_show_expired: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否显示到期选项：1是 0否',
  },
  topup_steps: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '充值步骤说明',
  },
  topup_account_regex: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '自定义账号验证正则',
  },
  topup_account_error_msg: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '验证失败提示语',
  },
  // ===== 三角洲套餐专用字段 =====
  sjz_hafubi_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: '哈夫币数量' },
  sjz_show_nickname: { type: DataTypes.TINYINT, defaultValue: 1, comment: '要求游戏昵称' },
  sjz_show_insurance: { type: DataTypes.TINYINT, defaultValue: 1, comment: '要求保险格数' },
  sjz_show_is_adult: { type: DataTypes.TINYINT, defaultValue: 0, comment: '要求成年认证' },
  sjz_show_warehouse: { type: DataTypes.TINYINT, defaultValue: 0, comment: '要求仓库截图' },
  sjz_require_phone: { type: DataTypes.TINYINT, defaultValue: 1, comment: '必填手机号' },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间',
  },
}, {
  tableName: 'products',
  timestamps: false,
  comment: '商品/套餐表（SUP商品管理）',
});

module.exports = Product;
