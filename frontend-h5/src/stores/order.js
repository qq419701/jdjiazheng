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

    // 地址信息
    姓名: '',
    手机号: '',
    省份: '',
    城市: '',
    区县: '',
    街道: '',
    详细地址: '',

    // 预约时间
    预约日期: '',
    预约时间段: '',

    // 订单结果
    订单号: '',
    预约成功: false,
  }),

  getters: {
    // 是否已填写地址
    已填写地址: (state) => !!(state.姓名 && state.手机号 && state.省份 && state.城市 && state.区县 && state.详细地址),

    // 是否已选择时间
    已选择时间: (state) => !!(state.预约日期 && state.预约时间段),

    // 完整地址（包含街道）
    完整地址: (state) => `${state.省份}${state.城市}${state.区县}${state.街道 ? state.街道 : ''}${state.详细地址}`,

    // 预约时间显示文字
    预约时间显示: (state) => {
      if (!state.预约日期 || !state.预约时间段) return '暂不预约'
      return `${state.预约日期} ${state.预约时间段}`
    },
  },

  actions: {
    // 设置卡密和服务信息
    设置卡密信息(信息) {
      this.卡密 = 信息.card_code || ''
      this.服务类型 = 信息.service_type || '日常保洁'
      this.服务时长 = 信息.service_hours || 2
      this.banner图URL = 信息.banner_url || ''
      this.下单须知 = 信息.notice || ''
      this.服务内容列表 = 信息.service_content || []
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

    // 保存预约时间
    保存预约时间(日期, 时间段) {
      this.预约日期 = 日期
      this.预约时间段 = 时间段
    },

    // 重置订单
    重置() {
      this.$reset()
    },
  },
})
