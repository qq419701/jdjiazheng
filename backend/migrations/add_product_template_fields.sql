-- 套餐管理字段扩展迁移（在 products 表新增字段）
-- 执行前请备份数据库
-- 如果字段已存在会报错，可忽略

ALTER TABLE products ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) NULL COMMENT '服务类型';
ALTER TABLE products ADD COLUMN IF NOT EXISTS service_hours INT DEFAULT 0 COMMENT '服务时长（小时），0=不限';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_account_type VARCHAR(20) NULL COMMENT '充值账号类型';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_account_label VARCHAR(100) NULL COMMENT '账号输入标签';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_member_name VARCHAR(100) NULL COMMENT '充值会员名称';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_member_icon VARCHAR(255) NULL COMMENT '会员图标URL';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_arrival_time VARCHAR(50) NULL COMMENT '预计到账时间';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_show_expired TINYINT DEFAULT 0 COMMENT '是否显示到期选项';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_steps TEXT NULL COMMENT '充值步骤说明';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_account_regex VARCHAR(200) NULL COMMENT '自定义账号验证正则';
ALTER TABLE products ADD COLUMN IF NOT EXISTS topup_account_error_msg VARCHAR(100) NULL COMMENT '验证失败提示语';
