// 充值H5 API 封装
import axios from 'axios'

// 创建 axios 实例
const 请求实例 = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * 验证充值卡密
 * GET /api/cz/verify-card/:code
 * @param {string} code - 卡密码
 * @returns {Promise} 卡密配置信息
 */
export const 验证充值卡密API = (code) => 请求实例.get(`/cz/verify-card/${code}`)

/**
 * 获取IP归属城市
 * GET /api/cz/ip-city
 * @returns {Promise} 城市信息
 */
export const 获取IP城市API = () => 请求实例.get('/cz/ip-city')

/**
 * 提交充值订单
 * POST /api/cz/orders
 * @param {Object} 数据 - 订单数据
 * @returns {Promise} 订单结果
 */
export const 提交充值订单API = (数据) => 请求实例.post('/cz/orders', 数据)
