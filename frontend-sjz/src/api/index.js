// 三角洲H5 API 封装
import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api/sjz',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * 验证三角洲卡密
 * GET /api/sjz/verify-card/:code
 */
export const 验证三角洲卡密API = (code) => api.get(`/verify-card/${code}`)

/**
 * 获取IP归属城市
 * GET /api/sjz/ip-city
 */
export const 获取IP城市API = () => api.get('/ip-city')

/**
 * 上传仓库截图
 * POST /api/sjz/upload
 */
export const 上传截图API = (formData) => api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000,
})

/**
 * 提交三角洲订单
 * POST /api/sjz/orders
 */
export const 提交三角洲订单API = (数据) => api.post('/orders', 数据)
