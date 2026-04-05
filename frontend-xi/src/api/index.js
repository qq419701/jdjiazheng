// 洗衣服H5 API请求封装
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

/**
 * 验证洗衣卡密
 * @param {string} 卡密码 - 卡密字符串
 */
export const 验证洗衣卡密API = (卡密码) => 请求实例.get(`/xi/verify-card/${卡密码}`)

/**
 * 获取洗衣预约时间段
 * @param {string} 城市 - 城市名称
 */
export const 获取洗衣时间表API = (城市) => 请求实例.get('/xi/time-slots', { params: { city: 城市 } })

/**
 * 提交洗衣预约订单
 * @param {Object} 订单数据 - 订单信息
 */
export const 提交洗衣订单API = (订单数据) => 请求实例.post('/xi/orders', 订单数据)

/**
 * 查询行政区划（省市区街道）
 * @param {number} parent_id - 父级ID，0表示省级
 */
export const 查询地区API = (parent_id) => 请求实例.get('/regions', { params: { parent_id } })

/**
 * 查询洗衣订单物流（取件+回寄轨迹）
 * @param {string} 订单号 - 订单编号
 */
export const 查询洗衣物流API = (订单号) => 请求实例.get(`/xi/orders/${订单号}/express-routes`)

export default 请求实例
