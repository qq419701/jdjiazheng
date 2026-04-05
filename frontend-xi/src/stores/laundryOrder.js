// 洗衣订单状态管理（Pinia）
import { defineStore } from 'pinia'

export const useLaundryOrderStore = defineStore('laundryOrder', {
  state: () => ({
    // 卡密信息
    卡密: '',
    商品名称: '任洗一件',
    商品价格: 0,
    banner图URL: '',
    下单须知: '',
    服务内容列表: [],

    // 取件地址
    取件姓名: '',
    取件手机: '',
    取件省份: '',
    取件城市: '',
    取件区县: '',
    取件街道: '',
    取件详细地址: '',

    // 收件地址（默认与取件相同）
    收件与取件相同: true,
    收件姓名: '',
    收件手机: '',
    收件省份: '',
    收件城市: '',
    收件区县: '',
    收件街道: '',
    收件详细地址: '',

    // 预约取件时间
    取件日期: '',
    取件时间标签: '',   // 如：09:00-10:00
    取件时间开始: '',   // 如：09:00:00
    取件时间结束: '',   // 如：10:00:00

    // 订单结果
    订单号: '',
  }),

  getters: {
    // 是否已填写取件地址
    已填写地址: (state) => !!(
      state.取件姓名 && state.取件手机 &&
      state.取件省份 && state.取件城市 && state.取件区县 &&
      state.取件详细地址
    ),

    // 是否已选择取件时间
    已选择时间: (state) => !!(state.取件日期 && state.取件时间标签),

    // 完整取件地址
    完整取件地址: (state) => `${state.取件省份}${state.取件城市}${state.取件区县}${state.取件街道 || ''}${state.取件详细地址}`,

    // 完整收件地址
    完整收件地址: (state) => {
      if (state.收件与取件相同) {
        return `${state.取件省份}${state.取件城市}${state.取件区县}${state.取件街道 || ''}${state.取件详细地址}`
      }
      return `${state.收件省份}${state.收件城市}${state.收件区县}${state.收件街道 || ''}${state.收件详细地址}`
    },

    // 取件时间显示
    取件时间显示: (state) => {
      if (!state.取件日期 || !state.取件时间标签) return '暂未选择'
      return `${state.取件日期} ${state.取件时间标签}`
    },

    // 实际收件姓名（与取件相同时用取件信息）
    实际收件姓名: (state) => state.收件与取件相同 ? state.取件姓名 : state.收件姓名,
    实际收件手机: (state) => state.收件与取件相同 ? state.取件手机 : state.收件手机,
    实际收件省份: (state) => state.收件与取件相同 ? state.取件省份 : state.收件省份,
    实际收件城市: (state) => state.收件与取件相同 ? state.取件城市 : state.收件城市,
    实际收件区县: (state) => state.收件与取件相同 ? state.取件区县 : state.收件区县,
    实际收件详细地址: (state) => state.收件与取件相同 ? state.取件详细地址 : state.收件详细地址,
  },

  actions: {
    // 设置卡密和商品信息
    设置卡密信息(信息) {
      this.卡密 = 信息.card_code || ''
      this.商品名称 = 信息.product_name || '任洗一件'
      this.商品价格 = 信息.product_price || 0
      this.banner图URL = 信息.banner_url || ''
      this.下单须知 = 信息.notice || ''
      this.服务内容列表 = 信息.service_content || []
    },

    // 保存取件地址
    保存取件地址(地址信息) {
      this.取件姓名 = 地址信息.姓名
      this.取件手机 = 地址信息.手机号
      this.取件省份 = 地址信息.省份
      this.取件城市 = 地址信息.城市
      this.取件区县 = 地址信息.区县
      this.取件街道 = 地址信息.街道 || ''
      this.取件详细地址 = 地址信息.详细地址
    },

    // 保存收件地址
    保存收件地址(地址信息) {
      this.收件姓名 = 地址信息.姓名
      this.收件手机 = 地址信息.手机号
      this.收件省份 = 地址信息.省份
      this.收件城市 = 地址信息.城市
      this.收件区县 = 地址信息.区县
      this.收件街道 = 地址信息.街道 || ''
      this.收件详细地址 = 地址信息.详细地址
    },

    // 保存取件时间
    保存取件时间(日期, 时间标签, 时间开始, 时间结束) {
      this.取件日期 = 日期
      this.取件时间标签 = 时间标签
      this.取件时间开始 = 时间开始
      this.取件时间结束 = 时间结束
    },

    // 重置
    重置() {
      this.$reset()
    },
  },
})
