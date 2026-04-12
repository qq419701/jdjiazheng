// 认证状态管理
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 账号ID
    id: parseInt(localStorage.getItem('admin_id'), 10) || 0,
    // Token
    token: localStorage.getItem('admin_token') || '',
    // 用户名
    username: localStorage.getItem('admin_username') || '',
    // 昵称
    nickname: localStorage.getItem('admin_nickname') || '',
    // 角色
    role: localStorage.getItem('admin_role') || '',
    // 权限列表（仅 sub 角色有效，super/admin 为空数组表示全部权限）
    permissions: JSON.parse(localStorage.getItem('admin_permissions') || '[]'),
    // 供货商绑定的批次ID列表（仅 vendor 角色有效）
    vendor_batch_ids: JSON.parse(localStorage.getItem('admin_vendor_batch_ids') || '[]'),
  }),

  getters: {
    // 是否已登录
    已登录: (state) => !!state.token,
    // 是否超级管理员
    是超管: (state) => state.role === 'super',
    // 是否供货商角色
    是供货商: (state) => state.role === 'vendor',
    // 是否有某模块权限（super/admin 角色全部放行，vendor 角色只有 order_center）
    有权限: (state) => (模块Key) => {
      if (state.role === 'super' || state.role === 'admin') return true
      if (state.role === 'vendor') return 模块Key === 'order_center'
      return state.permissions.includes(模块Key)
    },
  },

  actions: {
    // 保存登录信息
    保存登录信息(数据) {
      this.id = 数据.id || 0
      this.token = 数据.token
      this.username = 数据.username
      this.nickname = 数据.nickname || 数据.username
      this.role = 数据.role
      this.permissions = 数据.permissions || []
      this.vendor_batch_ids = 数据.vendor_batch_ids || []
      // 持久化到localStorage
      localStorage.setItem('admin_id', 数据.id || 0)
      localStorage.setItem('admin_token', 数据.token)
      localStorage.setItem('admin_username', 数据.username)
      localStorage.setItem('admin_nickname', 数据.nickname || 数据.username)
      localStorage.setItem('admin_role', 数据.role)
      localStorage.setItem('admin_permissions', JSON.stringify(数据.permissions || []))
      localStorage.setItem('admin_vendor_batch_ids', JSON.stringify(数据.vendor_batch_ids || []))
    },

    // 退出登录
    退出登录() {
      this.id = 0
      this.token = ''
      this.username = ''
      this.nickname = ''
      this.role = ''
      this.permissions = []
      this.vendor_batch_ids = []
      localStorage.removeItem('admin_id')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      localStorage.removeItem('admin_nickname')
      localStorage.removeItem('admin_role')
      localStorage.removeItem('admin_permissions')
      localStorage.removeItem('admin_vendor_batch_ids')
    },

    // 仅刷新权限相关字段（不更新token），用于路由守卫实时同步权限
    刷新权限(数据) {
      if (!数据) return
      this.id = 数据.id || this.id
      this.nickname = 数据.nickname || this.nickname
      this.role = 数据.role || this.role
      this.permissions = 数据.permissions || []
      this.vendor_batch_ids = 数据.vendor_batch_ids || []
      localStorage.setItem('admin_id', 数据.id || this.id)
      localStorage.setItem('admin_nickname', 数据.nickname || this.nickname)
      localStorage.setItem('admin_role', 数据.role || this.role)
      localStorage.setItem('admin_permissions', JSON.stringify(数据.permissions || []))
      localStorage.setItem('admin_vendor_batch_ids', JSON.stringify(数据.vendor_batch_ids || []))
    },
  },
})
