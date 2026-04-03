// 后台管理API接口
import 请求实例 from '../utils/request'

// ===== 认证 =====
export const 登录API = (数据) => 请求实例.post('/login', 数据)

// ===== 数据看板 =====
export const 获取看板数据API = () => 请求实例.get('/dashboard')

// ===== 订单管理 =====
export const 获取订单列表API = (参数) => 请求实例.get('/orders', { params: 参数 })
export const 获取订单详情API = (id) => 请求实例.get(`/orders/${id}`)
export const 更新订单状态API = (id, 数据) => 请求实例.put(`/orders/${id}/status`, 数据)
export const 触发自动下单API = (id) => 请求实例.post(`/orders/${id}/place-order`)
export const 重置订单API = (id) => 请求实例.post(`/orders/${id}/reset`)

// ===== 卡密管理 =====
export const 获取卡密列表API = (参数) => 请求实例.get('/cards', { params: 参数 })
export const 生成卡密API = (数据) => 请求实例.post('/cards/generate', 数据)
export const 导出卡密API = (参数) => `/admin/api/cards/export?${new URLSearchParams(参数)}`
export const 删除卡密API = (id) => 请求实例.delete(`/cards/${id}`)

// ===== 卡密批次管理 =====
export const 获取批次列表API = () => 请求实例.get('/card-batches')
export const 获取批次卡密API = (id) => 请求实例.get(`/card-batches/${id}/cards`)

// ===== 京东账号 =====
export const 获取账号列表API = () => 请求实例.get('/jd-accounts')
export const 新增账号API = (数据) => 请求实例.post('/jd-accounts', 数据)
export const 更新账号API = (id, 数据) => 请求实例.put(`/jd-accounts/${id}`, 数据)
export const 删除账号API = (id) => 请求实例.delete(`/jd-accounts/${id}`)
export const 触发账号登录API = (id) => 请求实例.post(`/jd-accounts/${id}/login`)

// ===== 时间规则 =====
export const 获取规则列表API = () => 请求实例.get('/time-rules')
export const 新增规则API = (数据) => 请求实例.post('/time-rules', 数据)
export const 更新规则API = (id, 数据) => 请求实例.put(`/time-rules/${id}`, 数据)
export const 删除规则API = (id) => 请求实例.delete(`/time-rules/${id}`)

// ===== 系统设置 =====
export const 获取设置API = () => 请求实例.get('/settings')
export const 保存设置API = (数据) => 请求实例.put('/settings', 数据)

// ===== 地区管理 =====
export const 获取地区列表API = (参数) => 请求实例.get('/regions', { params: 参数 })
export const 新增地区API = (数据) => 请求实例.post('/regions', 数据)
export const 更新地区API = (id, 数据) => 请求实例.put(`/regions/${id}`, 数据)
export const 删除地区API = (id) => 请求实例.delete(`/regions/${id}`)

// 地区数据统计
export const 获取地区统计API = () => 请求实例.get('/regions/stats')

// ===== 洗衣服务（预留）=====
export const 触发洗衣下单API = (id) => 请求实例.post(`/laundry/orders/${id}/place-order`)
export const 查询洗衣订单状态API = (id) => 请求实例.get(`/laundry/orders/${id}/status`)
export const 触发快递取件API = (id) => 请求实例.post(`/laundry/orders/${id}/express-pickup`)
export const 查询快递状态API = (id) => 请求实例.get(`/laundry/orders/${id}/express-status`)
