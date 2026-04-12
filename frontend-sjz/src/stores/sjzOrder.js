// 三角洲订单 Pinia 状态管理
import { defineStore } from 'pinia'

export const useSjzOrderStore = defineStore('sjzOrder', {
  state: () => ({
    // 卡密配置信息
    卡密: '',
    套餐名称: '',
    哈夫币数量: null,

    // 套餐控制字段
    需要手机号: true,
    需要游戏昵称: true,
    需要保险格数: true,
    保险格选项: [0, 1, 2, 3, 4, 5, 6],
    需要成年认证: false,
    成年选项: ['已成年', '未成年'],
    需要仓库截图: false,
    需要上号方式: false,
    上号方式选项: ['扫码'],
    需要区系统: false,
    区系统选项: ['VX', 'QQ'],
    区系统是输入框: false,
    字段顺序: [],

    // 全局配置
    banner图URL: '',
    主标题: '三角洲哈夫币服务',
    副标题: '追缴包赔 · 手游端游均可 · 安全有保障',
    下单须知: '',
    服务内容列表: [],

    // 企业微信配置
    qywx_enabled: '0',
    qywx_add_friend_mode: 'link',

    // 登录城市（IP定位获取）
    登录城市: '',
    登录省份: '',
    城市加载状态: 'loading',  // loading/success/failed

    // 订单结果（提交成功后保存）
    订单号: '',
    qywx_qrcode_url: null,
    qywx_link: null,
    提交成功数据: null,

    // 弹窗1配置（首页弹窗）
    sjz_popup1_enabled: '0',
    sjz_popup1_title: '注意事项',
    sjz_popup1_content: '请确保填写信息准确，服务开始后不支持退款。',
    sjz_popup1_icon: '⚔️',
    sjz_popup1_auto_close: '0',
    sjz_popup1_btn_text: '我知道了',

    // 成功页文字配置
    sjz_success_title: '✅ 下单成功！',
    sjz_success_subtitle: '我们已收到您的服务订单',
    sjz_success_next_title: '🎮 下一步：添加专属客服',
    sjz_success_next_subtitle: '添加企业微信后第一时间安排哈夫币充值服务',
    sjz_success_no_qywx_text: '📞 客服会主动联系您\n请保持手机畅通，耐心等待联系',
    sjz_success_guarantee_title: '🛡️ 服务保障',
    sjz_success_guarantee_items: ['✅ 追缴包赔', '✅ 手游端游均可', '✅ 24小时客服', '✅ 安全有保障'],
    sjz_link_btn_text: '💬 点击添加专属客服',
  }),

  getters: {
    // 城市显示文字
    城市显示: (state) => {
      if (state.城市加载状态 === 'loading') return '定位中...'
      if (state.城市加载状态 === 'failed') return '未获取到城市'
      return state.登录城市 || '未获取到城市'
    },
  },

  actions: {
    // 设置卡密配置信息
    设置卡密信息(信息) {
      this.卡密 = 信息.card_code || ''
      this.哈夫币数量 = 信息.sjz_hafubi_amount || null
      this.需要手机号 = 信息.sjz_require_phone !== 0
      this.需要游戏昵称 = !!信息.sjz_show_nickname
      this.需要保险格数 = !!信息.sjz_show_insurance
      // 解析保险格选项
      const 保险格原始 = 信息.sjz_insurance_options || '0,1,2,3,4,5,6'
      this.保险格选项 = [...new Set(
        保险格原始.split(',')
          .map(s => parseInt(s.trim()))
          .filter(n => !isNaN(n) && n >= 0 && n <= 99)
      )]
      this.需要成年认证 = !!信息.sjz_show_is_adult
      // 解析成年选项
      const 成年原始 = 信息.sjz_adult_options || '已成年,未成年'
      this.成年选项 = 成年原始.split(',').map(s => s.trim()).filter(s => s)
      this.需要仓库截图 = !!信息.sjz_show_warehouse
      this.需要上号方式 = !!信息.sjz_show_login_method
      // 解析上号方式选项
      const 上号原始 = 信息.sjz_login_method_options || '扫码'
      this.上号方式选项 = 上号原始.split(',').map(s => s.trim()).filter(s => s)
      this.需要区系统 = !!信息.sjz_show_region
      const 区系统原始 = 信息.sjz_region_options || 'VX,QQ'
      this.区系统选项 = 区系统原始.split(',').map(s => s.trim()).filter(s => s)
      this.区系统是输入框 = !!信息.sjz_region_is_input
      this.字段顺序 = 信息.sjz_field_order
        ? 信息.sjz_field_order.split(',').map(s => s.trim()).filter(s => s)
        : ['nickname', 'insurance', 'adult', 'login_method', 'region', 'warehouse', 'phone']
      this.banner图URL = 信息.banner_url || ''
      this.主标题 = 信息.title || '三角洲哈夫币服务'
      this.副标题 = 信息.subtitle || '追缴包赔 · 手游端游均可 · 安全有保障'
      this.下单须知 = 信息.notice || ''
      this.服务内容列表 = 信息.service_content || []
      this.qywx_enabled = 信息.qywx_enabled || '0'
      this.qywx_add_friend_mode = 信息.qywx_add_friend_mode || 'link'
      // 弹窗配置
      const pc = 信息.popup_config || {}
      this.sjz_popup1_enabled = pc.sjz_popup1_enabled || '0'
      this.sjz_popup1_title = pc.sjz_popup1_title || '注意事项'
      this.sjz_popup1_content = pc.sjz_popup1_content || '请确保填写信息准确，服务开始后不支持退款。'
      this.sjz_popup1_icon = pc.sjz_popup1_icon || '⚔️'
      this.sjz_popup1_auto_close = pc.sjz_popup1_auto_close || '0'
      this.sjz_popup1_btn_text = pc.sjz_popup1_btn_text || '我知道了'
      // 成功页文字配置
      const sc = 信息.success_config || {}
      this.sjz_success_title = sc.sjz_success_title || '✅ 下单成功！'
      this.sjz_success_subtitle = sc.sjz_success_subtitle || '我们已收到您的服务订单'
      this.sjz_success_next_title = sc.sjz_success_next_title || '🎮 下一步：添加专属客服'
      this.sjz_success_next_subtitle = sc.sjz_success_next_subtitle || '添加企业微信后第一时间安排哈夫币充值服务'
      this.sjz_success_no_qywx_text = sc.sjz_success_no_qywx_text || '📞 客服会主动联系您\n请保持手机畅通，耐心等待联系'
      this.sjz_success_guarantee_title = sc.sjz_success_guarantee_title || '🛡️ 服务保障'
      this.sjz_success_guarantee_items = Array.isArray(sc.sjz_success_guarantee_items)
        ? sc.sjz_success_guarantee_items
        : ['✅ 追缴包赔', '✅ 手游端游均可', '✅ 24小时客服', '✅ 安全有保障']
      this.sjz_link_btn_text = sc.sjz_link_btn_text || '💬 点击添加专属客服'
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
      this.qywx_qrcode_url = 数据.qywx_qrcode_url || null
      this.qywx_link = 数据.qywx_link || null
      this.qywx_add_friend_mode = 数据.qywx_add_friend_mode || this.qywx_add_friend_mode
      this.提交成功数据 = 数据
      // 保存到 sessionStorage 防止页面刷新丢失
      try {
        sessionStorage.setItem('sjz_order_result', JSON.stringify({
          订单号: this.订单号,
          qywx_qrcode_url: this.qywx_qrcode_url,
          qywx_link: this.qywx_link,
          qywx_add_friend_mode: this.qywx_add_friend_mode,
          哈夫币数量: this.哈夫币数量,
          // 成功页配置也缓存
          sjz_success_title: this.sjz_success_title,
          sjz_success_subtitle: this.sjz_success_subtitle,
          sjz_success_next_title: this.sjz_success_next_title,
          sjz_success_next_subtitle: this.sjz_success_next_subtitle,
          sjz_success_no_qywx_text: this.sjz_success_no_qywx_text,
          sjz_success_guarantee_title: this.sjz_success_guarantee_title,
          sjz_success_guarantee_items: this.sjz_success_guarantee_items,
          sjz_link_btn_text: this.sjz_link_btn_text,
        }))
      } catch {}
    },

    // 从 sessionStorage 恢复订单结果
    从缓存恢复() {
      try {
        const cached = sessionStorage.getItem('sjz_order_result')
        if (cached) {
          const data = JSON.parse(cached)
          this.订单号 = data.订单号 || ''
          this.qywx_qrcode_url = data.qywx_qrcode_url || null
          this.qywx_link = data.qywx_link || null
          this.qywx_add_friend_mode = data.qywx_add_friend_mode || 'link'
          this.哈夫币数量 = data.哈夫币数量 || null
          if (data.sjz_success_title) this.sjz_success_title = data.sjz_success_title
          if (data.sjz_success_subtitle) this.sjz_success_subtitle = data.sjz_success_subtitle
          if (data.sjz_success_next_title) this.sjz_success_next_title = data.sjz_success_next_title
          if (data.sjz_success_next_subtitle) this.sjz_success_next_subtitle = data.sjz_success_next_subtitle
          if (data.sjz_success_no_qywx_text) this.sjz_success_no_qywx_text = data.sjz_success_no_qywx_text
          if (data.sjz_success_guarantee_title) this.sjz_success_guarantee_title = data.sjz_success_guarantee_title
          if (data.sjz_success_guarantee_items) this.sjz_success_guarantee_items = data.sjz_success_guarantee_items
          if (data.sjz_link_btn_text) this.sjz_link_btn_text = data.sjz_link_btn_text
        }
      } catch {}
    },

    // 重置
    重置() {
      this.$reset()
    },
  },
})
