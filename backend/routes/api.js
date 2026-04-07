// 前端H5接口路由
const express = require('express');
const router = express.Router();
const { 验证卡密, 获取时间表, 提交订单, 获取公开设置 } = require('../controllers/apiController');
const { 查询地区 } = require('../controllers/regionController');

// 验证卡密
router.get('/verify-card/:code', 验证卡密);

// 获取预约时间表
router.get('/time-slots', 获取时间表);

// 提交预约订单
router.post('/orders', 提交订单);

// 获取公开设置（banner图等）
router.get('/settings/public', 获取公开设置);

// 查询行政区划（省市区街道，无需鉴权）
router.get('/regions', 查询地区);

const { 验证洗衣卡密, 获取洗衣时间表, 提交洗衣订单, 查询洗衣订单状态 } = require('../controllers/laundryApiController');
const { 接收鲸蚁回调 } = require('../controllers/laundryController');
const { 验证充值卡密, 获取IP城市, 提交充值订单 } = require('../controllers/topupApiController');

// 洗衣H5接口
router.get('/xi/verify-card/:code', 验证洗衣卡密);
router.get('/xi/time-slots', 获取洗衣时间表);
router.post('/xi/orders', 提交洗衣订单);

// 洗衣H5订单状态查询（通过订单号查询，无需鉴权）
router.get('/xi/orders/:orderNo/express-routes', 查询洗衣订单状态);

// 鲸蚁回调（无需鉴权）
router.post('/laundry/callback', 接收鲸蚁回调);

// ===== 充值H5接口 =====
// 验证充值卡密
router.get('/cz/verify-card/:code', 验证充值卡密);
// 获取IP归属城市（后端代理，解决HTTPS混合内容问题）
router.get('/cz/ip-city', 获取IP城市);
// 提交充值订单
router.post('/cz/orders', 提交充值订单);

module.exports = router;
