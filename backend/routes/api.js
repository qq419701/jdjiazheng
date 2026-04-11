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

// ===== 三角洲H5接口 =====
const sjzController = require('../controllers/sjzApiController');
const multer = require('multer');
const sjz上传目录 = require('path').join(__dirname, '../uploads/sjz');
if (!require('fs').existsSync(sjz上传目录)) require('fs').mkdirSync(sjz上传目录, { recursive: true });
const sjz截图上传 = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, sjz上传目录),
    filename: (req, file, cb) => {
      const ext = require('path').extname(file.originalname) || '.jpg';
      cb(null, `sjz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => { file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('只支持图片')); },
});
router.get('/sjz/verify-card/:code', sjzController.验证三角洲卡密);
router.get('/sjz/ip-city', sjzController.获取IP城市);
router.post('/sjz/upload', sjz截图上传.array('files', 5), sjzController.上传截图);
router.post('/sjz/orders', sjzController.提交三角洲订单);
router.get('/sjz/qywx-callback', sjzController.企业微信回调验证);
router.post('/sjz/qywx-callback', require('express').text({ type: 'text/xml' }), sjzController.企业微信回调事件);

module.exports = router;
