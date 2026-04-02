// 认证状态管理
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Token
    token: localStorage.getItem('admin_token') || '',
    // 用户名
    username: localStorage.getItem('admin_username') || '',
    // 角色
    role: localStorage.getItem('admin_role') || '',
  }),

  getters: {
    // 是否已登录
    已登录: (state) => !!state.token,
  },

  actions: {
    // 保存登录信息
    保存登录信息(数据) {
      this.token = 数据.token
      this.username = 数据.username
      this.role = 数据.role
      // 持久化到localStorage
      localStorage.setItem('admin_token', 数据.token)
      localStorage.setItem('admin_username', 数据.username)
      localStorage.setItem('admin_role', 数据.role)
    },

    // 退出登录
    退出登录() {
      this.token = ''
      this.username = ''
      this.role = ''
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      localStorage.removeItem('admin_role')
    },
  },
})
