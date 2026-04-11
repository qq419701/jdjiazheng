// 后台管理API接口
import 请求实例 from '../utils/request'
import axios from 'axios'

// ===== 认证 =====
export const 登录API = (数据) => 请求实例.post('/login', 数据)
// 获取当前登录账号最新权限（用于路由守卫实时刷新）
export const 获取当前权限API = () => 请求实例.get('/auth/me')

// ===== 数据看板 =====
export const 获取看板数据API = () => 请求实例.get('/dashboard')

// ===== 订单管理 =====
export const 获取订单列表API = (参数) => 请求实例.get('/orders', { params: 参数 })
export const 获取订单详情API = (id) => 请求实例.get(`/orders/${id}`)
export const 更新订单状态API = (id, 数据) => 请求实例.put(`/orders/${id}/status`, 数据)
// 更新备注：支持文字备注 + 图片数组（remark_images JSON字符串）
export const 更新订单备注API = (id, 备注, 图片列表 = []) => 请求实例.put(`/orders/${id}/remark`, {
  remark: 备注,
  remark_images: JSON.stringify(图片列表),
})
export const 触发自动下单API = (id) => 请求实例.post(`/orders/${id}/place-order`)
export const 重置订单API = (id) => 请求实例.post(`/orders/${id}/reset`)
// 导出家政订单为CSV（携带当前筛选条件，返回Blob文件流）
export const 导出家政订单API = (参数) => 请求实例.get('/orders/export', { params: 参数, responseType: 'blob' })

// ===== 备注图片上传 =====
// POST /admin/api/upload/remark-image，返回 { code:1, data: { url: '/uploads/remarks/xxx.jpg' } }
export const 上传备注图片API = (formData) => 请求实例.post('/upload/remark-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// ===== 卡密管理 =====
export const 获取卡密列表API = (参数) => 请求实例.get('/cards', { params: 参数 })
export const 生成卡密API = (数据) => 请求实例.post('/cards/generate', 数据)
// 修复：改为axios blob下载，原URL方式无法携带认证Token；同时后端已修复缺少business_type过滤的Bug
export const 导出卡密API = (参数) => 请求实例.get('/cards/export', { params: 参数, responseType: 'blob' })
export const 删除卡密API = (id) => 请求实例.delete(`/cards/${id}`)
// 作废家政卡密（将未使用的卡密标记为已失效，不可逆）
export const 作废卡密API = (id) => 请求实例.put(`/cards/${id}/invalidate`)

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
// 导出洗衣订单为CSV（携带当前筛选条件，返回Blob文件流）
export const 导出洗衣订单API = (参数) => 请求实例.get('/laundry-orders/export', { params: 参数, responseType: 'blob' })

// ===== 订单管理页卡密搜索（用于卡密作废功能）=====
// 按卡密码搜索家政卡密（精确/模糊匹配，返回卡密状态及关联订单号）
export const 订单页搜索家政卡密API = (keyword) => 请求实例.get('/orders/search-card', { params: { keyword } })
// 按卡密码搜索洗衣卡密（精确/模糊匹配，返回卡密状态及关联订单号）
export const 订单页搜索洗衣卡密API = (keyword) => 请求实例.get('/laundry-orders/search-card', { params: { keyword } })

// ===== 洗衣卡密管理 =====
export const 获取洗衣卡密列表API = (参数) => 请求实例.get('/laundry-cards', { params: 参数 })
export const 生成洗衣卡密API = (数据) => 请求实例.post('/laundry-cards/generate', 数据)
export const 删除洗衣卡密API = (id) => 请求实例.delete(`/laundry-cards/${id}`)
// 作废洗衣卡密（将未使用的洗衣卡密标记为已失效，不可逆）
export const 作废洗衣卡密API = (id) => 请求实例.put(`/laundry-cards/${id}/invalidate`)
export const 获取洗衣批次列表API = () => 请求实例.get('/laundry-card-batches')
export const 获取洗衣批次卡密API = (id) => 请求实例.get(`/laundry-card-batches/${id}/cards`)
export const 删除批次API = (id) => 请求实例.delete(`/card-batches/${id}`)
export const 删除洗衣批次API = (id) => 请求实例.delete(`/laundry-card-batches/${id}`)

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

// ===== 图形验证码 =====
export const 获取验证码API = () => 请求实例.get('/captcha')

// ===== 子账号管理 =====
export const 获取子账号列表API = () => 请求实例.get('/sub-accounts')
export const 新增子账号API = (数据) => 请求实例.post('/sub-accounts', 数据)
export const 更新子账号API = (id, 数据) => 请求实例.put(`/sub-accounts/${id}`, 数据)
export const 重置子账号密码API = (id, 数据) => 请求实例.put(`/sub-accounts/${id}/password`, 数据)
export const 删除子账号API = (id) => 请求实例.delete(`/sub-accounts/${id}`)
export const 修改自己密码API = (数据) => 请求实例.put('/sub-accounts/self/password', 数据)

// ===== 商品管理（SUP商品管理）=====
export const 获取商品列表API = (参数) => 请求实例.get('/products', { params: 参数 })
export const 新增商品API = (数据) => 请求实例.post('/products', 数据)
export const 更新商品API = (id, 数据) => 请求实例.put(`/products/${id}`, 数据)
export const 删除商品API = (id) => 请求实例.delete(`/products/${id}`)

// ===== 退款处理 =====
export const 申请退款API = (id) => 请求实例.put(`/orders/${id}/status`, { status: 4 })
export const 确认退款完成API = (id) => 请求实例.post(`/orders/${id}/confirm-refund`)
export const 申请洗衣退款API = (id) => 请求实例.put(`/laundry-orders/${id}/status`, { status: 4 })
export const 确认洗衣退款完成API = (id) => 请求实例.post(`/laundry-orders/${id}/confirm-refund`)

// ===== 充值订单管理 =====
export const 获取充值订单列表API = (参数) => 请求实例.get('/topup-orders', { params: 参数 })
export const 获取充值订单详情API = (id) => 请求实例.get(`/topup-orders/${id}`)
export const 更新充值订单状态API = (id, 数据) => 请求实例.put(`/topup-orders/${id}/status`, 数据)
export const 更新充值订单备注API = (id, 数据) => 请求实例.put(`/topup-orders/${id}/remark`, 数据)
export const 导出充值订单API = (参数) => 请求实例.get('/topup-orders/export', { params: 参数, responseType: 'blob' })
export const 申请充值退款API = (id) => 请求实例.put(`/topup-orders/${id}/status`, { status: 4 })
export const 确认充值退款完成API = (id) => 请求实例.post(`/topup-orders/${id}/confirm-refund`)
export const 订单页搜索充值卡密API = (keyword) => 请求实例.get('/topup-orders/search-card', { params: { keyword } })

// ===== 充值卡密管理 =====
export const 获取充值卡密列表API = (参数) => 请求实例.get('/topup-cards', { params: 参数 })
export const 生成充值卡密API = (数据) => 请求实例.post('/topup-cards/generate', 数据)
export const 删除充值卡密API = (id) => 请求实例.delete(`/topup-cards/${id}`)
export const 作废充值卡密API = (id) => 请求实例.put(`/topup-cards/${id}/invalidate`)
export const 获取充值批次列表API = () => 请求实例.get('/topup-card-batches')
export const 获取充值批次卡密API = (id) => 请求实例.get(`/topup-card-batches/${id}/cards`)
export const 删除充值批次API = (id) => 请求实例.delete(`/topup-card-batches/${id}`)
export const 获取充值预览卡密API = () => 请求实例.get('/topup-cards/preview-card')

// ===== 统一卡密中心 =====
export const 统一获取卡密列表API = (参数) => 请求实例.get('/unified-cards', { params: 参数 })
export const 统一获取批次列表API = (参数) => 请求实例.get('/unified-batches', { params: 参数 })
export const 统一获取卡密统计API = () => 请求实例.get('/unified-stats')

// ===== 套餐管理（新）=====
export const 获取套餐列表API = (参数) => 请求实例.get('/products', { params: { ...参数, include_stock: 1 } })
export const 新增套餐API = (数据) => 请求实例.post('/products', 数据)
export const 更新套餐API = (id, 数据) => 请求实例.put(`/products/${id}`, 数据)
export const 删除套餐API = (id) => 请求实例.delete(`/products/${id}`)

// ===== 卡密工作台（新）=====
export const 套餐生成卡密API = (数据) => 请求实例.post('/card-templates/generate', 数据)

// ===== 订单中心 =====
export const 获取订单角标数量API = () => 请求实例.get('/order-center/badge-counts')

// ===== 阿奇所SUP日志 =====
export const 获取SUP日志列表API = (参数) => 请求实例.get('/sup-logs', { params: 参数 })
export const 获取SUP日志统计API = () => 请求实例.get('/sup-logs/stats')
