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

module.exports = router;
