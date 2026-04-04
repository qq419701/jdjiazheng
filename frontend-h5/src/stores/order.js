// 订单状态管理（Pinia）
import { defineStore } from 'pinia'

export const useOrderStore = defineStore('order', {
  state: () => ({
    // 卡密信息
    卡密: '',
    服务类型: '日常保洁',
    服务时长: 2,
    banner图URL: '',
    下单须知: '',
    服务内容列表: [],

    // 多备选时间设置（从系统设置接口读取）
    多选时间已启用: false,    // 是否开启多选时间功能
    多选时间最多: 3,          // 最多可选几个备选时间
    多选时间最少: 1,          // 至少需选几个
    多选时间提示: '',         // 顶部提示文字

    // 地址信息
    姓名: '',
    手机号: '',
    省份: '',
    城市: '',
    区县: '',
    街道: '',
    详细地址: '',

    // 预约时间（单选，向下兼容）
    预约日期: '',
    预约时间段: '',

    // 多备选时间列表（多选模式专用）
    多选时间列表: [],   // [{date, time, priority}]

    // 订单结果
    订单号: '',
    预约成功: false,
  }),

  getters: {
    // 是否已填写地址
    已填写地址: (state) => !!(state.姓名 && state.手机号 && state.省份 && state.城市 && state.区县 && state.详细地址),

    // 是否已选择时间
    已选择时间: (state) => {
      if (state.多选时间已启用 && state.多选时间最少 > 1) {
        // 多选模式且要求至少多个：检查多选列表
        return state.多选时间列表.length >= state.多选时间最少
      }
      // 单选模式或多选但至少1个：满足有预约日期即可
      return !!(state.预约日期 && state.预约时间段)
    },

    // 完整地址（包含街道）
    完整地址: (state) => `${state.省份}${state.城市}${state.区县}${state.街道 ? state.街道 : ''}${state.详细地址}`,

    // 预约时间显示文字（支持多选和单选两种格式）
    预约时间显示: (state) => {
      if (!state.预约日期 || !state.预约时间段) return '暂不预约'
      if (state.多选时间已启用 && state.多选时间列表.length > 1) {
        // 多选模式：显示已选数量和第一优先时间
        return `已选${state.多选时间列表.length}个备选时间（优先：${state.预约日期} ${state.预约时间段}）`
      }
      return `${state.预约日期} ${state.预约时间段}`
    },
  },

  actions: {
    // 设置卡密和服务信息（同时读取多选时间设置）
    设置卡密信息(信息) {
      this.卡密 = 信息.card_code || ''
      this.服务类型 = 信息.service_type || '日常保洁'
      this.服务时长 = 信息.service_hours || 2
      this.banner图URL = 信息.banner_url || ''
      this.下单须知 = 信息.notice || ''
      this.服务内容列表 = 信息.service_content || []
      // 读取多选时间设置
      this.多选时间已启用 = 信息.multi_time_enabled === '1'
      this.多选时间最多 = parseInt(信息.multi_time_max_count) || 3
      this.多选时间最少 = parseInt(信息.multi_time_min_count) || 1
      this.多选时间提示 = 信息.multi_time_tip || ''
    },

    // 保存地址信息（包含街道字段）
    保存地址(地址信息) {
      this.姓名 = 地址信息.姓名
      this.手机号 = 地址信息.手机号
      this.省份 = 地址信息.省份
      this.城市 = 地址信息.城市
      this.区县 = 地址信息.区县
      this.街道 = 地址信息.街道 || ''
      this.详细地址 = 地址信息.详细地址
    },

    // 保存预约时间（单选，向下兼容）
    保存预约时间(日期, 时间段) {
      this.预约日期 = 日期
      this.预约时间段 = 时间段
    },

    /**
     * 保存多选时间列表
     * @param {Array} 多选列表 - [{date, time, priority}]
     */
    保存多选时间(多选列表) {
      this.多选时间列表 = 多选列表 || []
      // 同步第一优先时间到兼容字段（向下兼容）
      if (多选列表 && 多选列表.length > 0) {
        const 第一优先 = [...多选列表].sort((a, b) => (a.priority || 0) - (b.priority || 0))[0]
        this.预约日期 = 第一优先.date
        this.预约时间段 = 第一优先.time
      }
    },

    // 重置订单
    重置() {
      this.$reset()
    },
  },
})
