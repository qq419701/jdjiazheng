// 充值订单 Pinia 状态管理
import { defineStore } from 'pinia'

export const useTopupOrderStore = defineStore('topupOrder', {
  state: () => ({
    // 卡密配置信息（从后端接口返回）
    卡密: '',
    账号类型: 'phone',            // phone/wechat/qq/email/other
    账号标签: '请输入手机号',      // 输入框前端显示标签
    会员名称: '',                  // 如：优酷年卡
    会员图标: '',                  // 会员图标URL
    到账时间: '',                  // 如：1-6小时
    显示到期选项: 0,               // 0=不显示 1=显示
    充值步骤: '',                  // 充值步骤说明
    banner图URL: '',
    主标题: '各类会员充值',
    副标题1: '专业充值  特惠价格  安全有保障',
    副标题2: '快速到账  全程客服  值得信赖',
    下单须知: '',
    服务内容列表: [],

    // 用户填写的充值表单数据
    充值账号: '',          // 用户输入的账号
    会员是否到期: null,    // null=未选 0=未到期 1=已到期

    // 登录城市（IP定位获取）
    登录城市: '',
    登录省份: '',
    城市加载状态: 'loading',  // loading/success/failed

    // 订单结果（提交成功后保存）
    订单号: '',
    提交成功数据: null,

    // 弹窗1配置（首页弹窗）
    cz_popup1_enabled: '0',
    cz_popup1_title: '安全提醒',
    cz_popup1_content: '务必确保充值账号准确，虚拟商品充错账号不支持退换货。',
    cz_popup1_icon: '⚠️',
    cz_popup1_title_color: '#667eea',
    cz_popup1_content_color: '#333333',
    cz_popup1_btn_text: '我知道了',
    cz_popup1_btn_color: '#667eea',
    cz_popup1_btn_size: 'large',
    cz_popup1_auto_close: '0',
    cz_popup1_bg_color: '#ffffff',
    // 弹窗2配置（账号验证通过后弹窗）
    cz_popup2_enabled: '0',
    cz_popup2_title: '账号确认',
    cz_popup2_content: '请再次确认您的充值账号是否正确，虚拟商品一旦充值成功无法退款。',
    cz_popup2_icon: '🔒',
    cz_popup2_title_color: '#667eea',
    cz_popup2_content_color: '#333333',
    cz_popup2_btn_text: '我已确认',
    cz_popup2_btn_color: '#667eea',
    cz_popup2_btn_size: 'large',
    cz_popup2_auto_close: '0',
    cz_popup2_bg_color: '#ffffff',
  }),

  getters: {
    // 账号类型中文标签
    账号类型中文: (state) => {
      const 类型映射 = {
        phone: '手机号',
        wechat: '微信号',
        qq: 'QQ号',
        email: '邮箱',
        other: '账号',
      }
      return 类型映射[state.账号类型] || '账号'
    },

    // 城市显示文字
    城市显示: (state) => {
      if (state.城市加载状态 === 'loading') return '城市获取中...'
      if (state.城市加载状态 === 'failed') return '未获取到城市'
      return state.登录城市 || '未获取到城市'
    },
  },

  actions: {
    // 设置卡密配置信息
    设置卡密信息(信息) {
      this.卡密 = 信息.card_code || ''
      this.账号类型 = 信息.topup_account_type || 'phone'
      this.账号标签 = 信息.topup_account_label || '请输入手机号'
      this.会员名称 = 信息.topup_member_name || ''
      this.会员图标 = 信息.topup_member_icon || ''
      this.到账时间 = 信息.topup_arrival_time || ''
      this.显示到期选项 = 信息.topup_show_expired || 0
      this.充值步骤 = 信息.topup_steps || ''
      this.banner图URL = 信息.banner_url || ''
      this.主标题 = 信息.title || '各类会员充值'
      this.副标题1 = 信息.subtitle1 || '专业充值  特惠价格  安全有保障'
      this.副标题2 = 信息.subtitle2 || '快速到账  全程客服  值得信赖'
      this.下单须知 = 信息.notice || ''
      this.服务内容列表 = 信息.service_content || []
      // 读取弹窗配置
      const pc = 信息.popup_config || {}
      this.cz_popup1_enabled = pc.cz_popup1_enabled || '0'
      this.cz_popup1_title = pc.cz_popup1_title || '安全提醒'
      this.cz_popup1_content = pc.cz_popup1_content || '务必确保充值账号准确，虚拟商品充错账号不支持退换货。'
      this.cz_popup1_icon = pc.cz_popup1_icon || '⚠️'
      this.cz_popup1_title_color = pc.cz_popup1_title_color || '#667eea'
      this.cz_popup1_content_color = pc.cz_popup1_content_color || '#333333'
      this.cz_popup1_btn_text = pc.cz_popup1_btn_text || '我知道了'
      this.cz_popup1_btn_color = pc.cz_popup1_btn_color || '#667eea'
      this.cz_popup1_btn_size = pc.cz_popup1_btn_size || 'large'
      this.cz_popup1_auto_close = pc.cz_popup1_auto_close || '0'
      this.cz_popup1_bg_color = pc.cz_popup1_bg_color || '#ffffff'
      this.cz_popup2_enabled = pc.cz_popup2_enabled || '0'
      this.cz_popup2_title = pc.cz_popup2_title || '账号确认'
      this.cz_popup2_content = pc.cz_popup2_content || '请再次确认您的充值账号是否正确，虚拟商品一旦充值成功无法退款。'
      this.cz_popup2_icon = pc.cz_popup2_icon || '🔒'
      this.cz_popup2_title_color = pc.cz_popup2_title_color || '#667eea'
      this.cz_popup2_content_color = pc.cz_popup2_content_color || '#333333'
      this.cz_popup2_btn_text = pc.cz_popup2_btn_text || '我已确认'
      this.cz_popup2_btn_color = pc.cz_popup2_btn_color || '#667eea'
      this.cz_popup2_btn_size = pc.cz_popup2_btn_size || 'large'
      this.cz_popup2_auto_close = pc.cz_popup2_auto_close || '0'
      this.cz_popup2_bg_color = pc.cz_popup2_bg_color || '#ffffff'
    },

    // 设置登录城市
    设置登录城市(省份, 城市) {
      this.登录省份 = 省份 || ''
      this.登录城市 = `${省份 || ''}${城市 || ''}`
      this.城市加载状态 = 'success'
    },

    // 设置城市加载失败
    设置城市失败() {
      this.城市加载状态 = 'failed'
    },

    // 保存订单结果
    保存订单结果(数据) {
      this.订单号 = 数据.order_no || ''
      this.提交成功数据 = 数据
    },

    // 重置
    重置() {
      this.$reset()
    },
  },
})
