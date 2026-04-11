-- 统一订单状态迁移脚本
-- 将旧的 status 值（5安排中/6预约完成/7预约失败/8退款处理中）迁移到新的统一状态体系（0~6）
-- 执行前请务必备份数据库！
--
-- 新状态定义：
--   0  待处理    客户提交后等待系统处理
--   1  处理中    系统正在自动下单/推送中
--   2  服务中    已成功对接第三方，服务进行中
--   3  已完成    服务全部完成
--   4  已取消    订单取消（含SUP自动撤单）
--   5  失败      自动处理失败，需人工重试
--   6  拒绝退款  SUP平台拒绝撤单，系统已自动返回凭证图片

-- ===== 家政订单状态迁移 =====
-- 旧 status=5（安排中）→ 新 status=2（服务中，已对接京东）
UPDATE orders SET status = 2 WHERE business_type = 'jiazheng' AND status = 5;

-- 旧 status=6（预约完成）→ 新 status=3（已完成）
UPDATE orders SET status = 3 WHERE business_type = 'jiazheng' AND status = 6;

-- 旧 status=7（预约失败）→ 新 status=5（失败）
UPDATE orders SET status = 5 WHERE business_type = 'jiazheng' AND status = 7;

-- 旧 status=8（退款处理中）→ 新 status=4（已取消）
UPDATE orders SET status = 4 WHERE business_type = 'jiazheng' AND status = 8;

-- 旧 status=3（失败）→ 新 status=5（失败，编号变化）
-- 注意：需在上面 status=7→5 迁移之后执行，避免冲突
UPDATE orders SET status = 5 WHERE business_type = 'jiazheng' AND status = 3;

-- ===== 洗衣订单状态迁移 =====
-- 旧 status=6（已送达，由鲸蚁回调写入）→ 新 status=3（已完成）
UPDATE orders SET status = 3 WHERE business_type = 'xiyifu' AND status = 6;

-- 旧 status=8（退款处理中）→ 新 status=4（已取消）
UPDATE orders SET status = 4 WHERE business_type = 'xiyifu' AND status = 8;

-- 旧 status=3（失败）→ 新 status=5（失败，编号变化）
UPDATE orders SET status = 5 WHERE business_type = 'xiyifu' AND status = 3;

-- ===== 充值订单状态迁移 =====
-- 旧 status=8（退款处理中）→ 新 status=4（已取消）
UPDATE orders SET status = 4 WHERE business_type = 'topup' AND status = 8;

-- 旧 status=2（已完成）→ 新 status=3（已完成，充值业务原来没有3）
-- 注意：充值业务用 status=2 表示已完成，迁移到 status=3
UPDATE orders SET status = 3 WHERE business_type = 'topup' AND status = 2;

-- ===== 验证迁移结果 =====
SELECT business_type, status, COUNT(*) AS cnt
FROM orders
GROUP BY business_type, status
ORDER BY business_type, status;
