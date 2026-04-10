-- 创建阿奇所SUP操作日志表
-- 执行：mysql -u用户名 -p 数据库名 < create_sup_logs_table.sql

CREATE TABLE IF NOT EXISTS `sup_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `log_type` VARCHAR(30) NOT NULL COMMENT '日志类型',
  `order_no` VARCHAR(64) NULL COMMENT '阿奇所订单号',
  `out_trade_no` VARCHAR(64) NULL COMMENT '我方outTradeNo',
  `product_no` VARCHAR(20) NULL COMMENT '商品编号',
  `buy_num` INT NULL COMMENT '购买数量',
  `user_id` VARCHAR(50) NULL COMMENT '奇所平台userId',
  `request_data` TEXT NULL COMMENT '请求数据JSON',
  `response_data` TEXT NULL COMMENT '响应数据JSON',
  `status_code` INT NULL COMMENT '响应code',
  `order_status` INT NULL COMMENT '下单状态',
  `order_cost` DECIMAL(14,4) NULL COMMENT '订单成本',
  `cancel_status` INT NULL COMMENT '撤单状态',
  `result` VARCHAR(20) DEFAULT 'unknown' COMMENT '结果',
  `error_msg` TEXT NULL COMMENT '错误信息',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_out_trade_no` (`out_trade_no`),
  INDEX `idx_log_type` (`log_type`),
  INDEX `idx_result` (`result`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='阿奇所SUP操作日志表';
