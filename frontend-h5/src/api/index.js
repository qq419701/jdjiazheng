// API请求封装
import axios from 'axios'

// 创建axios实例
const 请求实例 = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器
请求实例.interceptors.response.use(
  (响应) => 响应.data,
  (错误) => {
    console.error('请求失败:', 错误)
    return Promise.reject(错误)
  }
)

// ===== 接口方法 =====

/**
 * 验证卡密
 * @param {string} 卡密码 - 卡密字符串
 */
export const 验证卡密API = (卡密码) => 请求实例.get(`/verify-card/${卡密码}`)

/**
 * 获取预约时间表
 * @param {string} 城市 - 城市名称
 */
export const 获取时间表API = (城市) => 请求实例.get('/time-slots', { params: { city: 城市 } })

/**
 * 提交预约订单
 * @param {Object} 订单数据 - 订单信息
 */
export const 提交订单API = (订单数据) => 请求实例.post('/orders', 订单数据)

/**
 * 获取公开设置
 */
export const 获取公开设置API = () => 请求实例.get('/settings/public')

/**
 * 查询行政区划（省市区街道）
 * @param {number} parent_id - 父级ID，0表示省级
 */
export const 查询地区API = (parent_id) => 请求实例.get('/regions', { params: { parent_id } })

export default 请求实例
