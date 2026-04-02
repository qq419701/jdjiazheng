// Axios请求封装
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router/index'

// 创建axios实例
const 请求实例 = axios.create({
  baseURL: '/admin/api',
  timeout: 15000,
})

// 请求拦截器：添加Token
请求实例.interceptors.request.use(
  (配置) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      配置.headers.Authorization = `Bearer ${token}`
    }
    return 配置
  },
  (错误) => Promise.reject(错误)
)

// 响应拦截器：处理错误
请求实例.interceptors.response.use(
  (响应) => 响应.data,
  (错误) => {
    if (错误.response?.status === 401) {
      // Token失效，跳转登录页
      localStorage.removeItem('admin_token')
      router.push({ name: 'Login' })
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(错误.response?.data?.message || '请求失败')
    }
    return Promise.reject(错误)
  }
)

export default 请求实例
