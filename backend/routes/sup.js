// 奇所SUP系统路由
// 所有路由前缀：/agisoAcprSupplierApi
// 匿名接口：/app/getAppId 不需要签名验证
// 其他接口：统一走 验证奇所签名 中间件

const express = require('express');
const router = express.Router();
const { 验证奇所签名 } = require('../middleware/agisoSign');
const {
  获取应用ID,
  获取商品列表,
  获取商品模板,
  卡密下单,
  查询订单,
  撤销订单,
} = require('../controllers/supController');

// ===== 应用API =====

// 获取应用ID（匿名接口，无需签名验证）
router.post('/agisoAcprSupplierApi/app/getAppId', 获取应用ID);

// ===== 商品API =====

// 获取商品分页列表
router.post('/agisoAcprSupplierApi/product/getList', 验证奇所签名, 获取商品列表);

// 获取商品模板
router.post('/agisoAcprSupplierApi/product/getTemplate', 验证奇所签名, 获取商品模板);

// ===== 订单API =====

// 卡密下单（核心接口）
router.post('/agisoAcprSupplierApi/order/cardOrder', 验证奇所签名, 卡密下单);

// 订单查询
router.post('/agisoAcprSupplierApi/order/queryOrder', 验证奇所签名, 查询订单);

// 撤单（退款核心接口）
router.post('/agisoAcprSupplierApi/order/cancelOrder', 验证奇所签名, 撤销订单);

module.exports = router;
