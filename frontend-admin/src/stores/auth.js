// 认证状态管理
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
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
  }),

  getters: {
    // 是否已登录
    已登录: (state) => !!state.token,
    // 是否超级管理员
    是超管: (state) => state.role === 'super',
    // 是否有某模块权限（super/admin 角色全部放行）
    有权限: (state) => (模块Key) => {
      if (state.role === 'super' || state.role === 'admin') return true
      return state.permissions.includes(模块Key)
    },
  },

  actions: {
    // 保存登录信息
    保存登录信息(数据) {
      this.token = 数据.token
      this.username = 数据.username
      this.nickname = 数据.nickname || 数据.username
      this.role = 数据.role
      this.permissions = 数据.permissions || []
      // 持久化到localStorage
      localStorage.setItem('admin_token', 数据.token)
      localStorage.setItem('admin_username', 数据.username)
      localStorage.setItem('admin_nickname', 数据.nickname || 数据.username)
      localStorage.setItem('admin_role', 数据.role)
      localStorage.setItem('admin_permissions', JSON.stringify(数据.permissions || []))
    },

    // 退出登录
    退出登录() {
      this.token = ''
      this.username = ''
      this.nickname = ''
      this.role = ''
      this.permissions = []
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      localStorage.removeItem('admin_nickname')
      localStorage.removeItem('admin_role')
      localStorage.removeItem('admin_permissions')
    },
  },
})
