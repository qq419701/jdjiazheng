// 后台管理API接口
import 请求实例 from '../utils/request'
import axios from 'axios'

// ===== 认证 =====
export const 登录API = (数据) => 请求实例.post('/login', 数据)

// ===== 数据看板 =====
export const 获取看板数据API = () => 请求实例.get('/dashboard')

// ===== 订单管理 =====
export const 获取订单列表API = (参数) => 请求实例.get('/orders', { params: 参数 })
export const 获取订单详情API = (id) => 请求实例.get(`/orders/${id}`)
export const 更新订单状态API = (id, 数据) => 请求实例.put(`/orders/${id}/status`, 数据)
export const 更新订单备注API = (id, 备注) => 请求实例.put(`/orders/${id}/remark`, { remark: 备注 }) // 快速更新备注
export const 触发自动下单API = (id) => 请求实例.post(`/orders/${id}/place-order`)
export const 重置订单API = (id) => 请求实例.post(`/orders/${id}/reset`)

// ===== 卡密管理 =====
export const 获取卡密列表API = (参数) => 请求实例.get('/cards', { params: 参数 })
export const 生成卡密API = (数据) => 请求实例.post('/cards/generate', 数据)
export const 导出卡密API = (参数) => `/admin/api/cards/export?${new URLSearchParams(参数)}`
export const 删除卡密API = (id) => 请求实例.delete(`/cards/${id}`)

// ===== 卡密批次管理 =====
export const 获取批次列表API = (params = {}) => 请求实例.get('/card-batches', { params })
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
// [已删除] 触发洗衣下单API - 指向旧路径 /laundry/orders/:id/place-order，功能已迁移至 触发洗衣API下单
export const 查询洗衣订单状态API = (id) => 请求实例.get(`/laundry/orders/${id}/status`)

// ===== 洗衣订单管理 =====
export const 获取洗衣订单列表API = (参数) => 请求实例.get('/laundry-orders', { params: 参数 })
export const 获取洗衣订单详情API = (id) => 请求实例.get(`/laundry-orders/${id}`)
export const 更新洗衣订单状态API = (id, 数据) => 请求实例.put(`/laundry-orders/${id}/status`, 数据)
export const 更新洗衣订单备注API = (id, 数据) => 请求实例.put(`/laundry-orders/${id}/remark`, 数据)
export const 重置洗衣订单API = (id) => 请求实例.post(`/laundry-orders/${id}/reset`)
export const 触发洗衣API下单 = (id) => 请求实例.post(`/laundry-orders/${id}/place-order`)
export const 取消洗衣订单API = (id) => 请求实例.post(`/laundry-orders/${id}/cancel`)
export const 修改洗衣订单API = (id, 数据) => 请求实例.put(`/laundry-orders/${id}`, 数据)
// 查询洗衣物流轨迹（调用鲸蚁物流接口实时返回轨迹节点）
export const 查询洗衣物流API = (id) => 请求实例.get(`/laundry-orders/${id}/express-routes`)

// ===== 洗衣卡密管理 =====
export const 获取洗衣卡密列表API = (参数) => 请求实例.get('/laundry-cards', { params: 参数 })
export const 生成洗衣卡密API = (数据) => 请求实例.post('/laundry-cards/generate', 数据)
export const 删除洗衣卡密API = (id) => 请求实例.delete(`/laundry-cards/${id}`)
export const 获取洗衣批次列表API = () => 请求实例.get('/laundry-card-batches')
export const 获取洗衣批次卡密API = (id) => 请求实例.get(`/laundry-card-batches/${id}/cards`)

// ===== 洗衣时间段（调用公开接口，不需要鉴权）=====
// 修复：使用 axios 直接请求 /api/xi/time-slots，不走 /admin/api 前缀
export const 获取洗衣时间段API = (params) => axios.get('/api/xi/time-slots', { params }).then(r => r.data)

// ===== 洗衣时间规则 =====
export const 获取洗衣时间规则API = () => 请求实例.get('/laundry-time-rules')
export const 新增洗衣时间规则API = (数据) => 请求实例.post('/laundry-time-rules', 数据)
export const 更新洗衣时间规则API = (id, 数据) => 请求实例.put(`/laundry-time-rules/${id}`, 数据)
export const 删除洗衣时间规则API = (id) => 请求实例.delete(`/laundry-time-rules/${id}`)

// ===== 洗衣连接测试 =====
export const 测试洗衣API连接 = () => 请求实例.post('/laundry/test-connection')

// ===== 预览卡密 =====
export const 获取家政预览卡密API = () => 请求实例.get('/cards/jiazheng/preview-card')
export const 获取洗衣预览卡密API = () => 请求实例.get('/laundry-cards/preview-card')
