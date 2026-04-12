/**
 * 业务模块开关 Pinia Store
 * ============================================================
 * 从后端接口 /admin/api/settings 获取业务开关状态
 * 由 Layout.vue 在登录后调用 加载业务开关() 初始化
 *
 * 各业务开关来源：
 *   后端 backend/.env 中的 BUSINESS_*_ENABLED 环境变量
 *   → 后端 config/business.js 读取
 *   → GET /admin/api/settings 接口返回
 *   → 本 Store 解析并提供给所有组件使用
 * ============================================================
 */
import { defineStore } from 'pinia'
import { 获取设置API } from '../api/index'

export const useModuleStore = defineStore('module', {
  state: () => ({
    /** 🏠 家政业务是否开启 */
    家政: true,
    /** 🧺 洗衣业务是否开启 */
    洗衣: true,
    /** 💳 充值业务是否开启 */
    充值: true,
    /** ⚔️ 三角洲业务是否开启 */
    三角洲: true,
    /** 是否已加载完成 */
    已加载: false,
  }),

  getters: {
    /**
     * 获取已开启的业务列表（供卡密工作台、统计卡片等使用）
     * 返回格式：[{ type: 'jiazheng', label: '🏠 家政' }, ...]
     */
    已开启业务列表: (state) => {
      const 全部业务 = [
        { type: 'jiazheng', label: '🏠 家政',  开关: state.家政 },
        { type: 'xiyifu',  label: '🧺 洗衣',  开关: state.洗衣 },
        { type: 'topup',   label: '💳 充值',  开关: state.充值 },
        { type: 'sjz',     label: '⚔️ 三角洲', 开关: state.三角洲 },
      ]
      return 全部业务.filter(b => b.开关)
    },
  },

  actions: {
    /**
     * 从后端接口加载业务开关状态
     * 在 Layout.vue 的 onMounted 中调用
     * 未配置或接口异常时默认全部开启（保守策略，防止误关业务）
     */
    async 加载业务开关() {
      try {
        const res = await 获取设置API()
        if (res?.code === 1 && res.data) {
          const d = res.data
          // 后端传来 '1' 为开启，'0' 为关闭；未传时默认 true（开启）
          this.家政   = d.business_jiazheng_enabled !== '0'
          this.洗衣   = d.business_xiyifu_enabled   !== '0'
          this.充值   = d.business_topup_enabled     !== '0'
          this.三角洲 = d.business_sjz_enabled       !== '0'
        }
      } catch {
        // 接口异常时保持默认值（全部开启），不影响正常使用
      } finally {
        this.已加载 = true
      }
    },
  },
})
