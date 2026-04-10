// 路由配置（带路由守卫）
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    // 登录页（不需要鉴权）
    path: '/admin/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { 无需登录: true },
  },
  {
    // 主布局（需要登录）
    path: '/admin',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { 标题: '数据看板', 权限Key: 'dashboard' },
      },
      // 旧路径重定向，保持兼容
      {
        path: 'orders',
        redirect: '/admin/order-center',
      },
      {
        path: 'orders/:businessType',
        redirect: '/admin/order-center',
      },
      {
        path: 'cards',
        redirect: '/admin/cards/jiazheng',
      },
      {
        path: 'laundry-orders',
        redirect: '/admin/order-center',
      },
      {
        path: 'topup-orders',
        redirect: '/admin/order-center',
      },
      {
        path: 'settings',
        redirect: '/admin/business-settings',
      },
      {
        path: 'laundry-settings',
        redirect: '/admin/business-settings',
      },
      {
        path: 'topup-settings',
        redirect: '/admin/business-settings',
      },
      {
        path: 'time-rules',
        redirect: '/admin/business-settings',
      },
      {
        path: 'laundry-time-rules',
        redirect: '/admin/business-settings',
      },
      {
        path: 'orders/:businessType/:id',
        name: 'OrderDetail',
        component: () => import('../views/OrderDetail.vue'),
        meta: { 标题: '订单详情', 权限Key: 'orders' },
      },
      // 卡密管理（带业务类型参数）
      {
        path: 'cards/:businessType',
        name: 'Cards',
        component: () => import('../views/Cards.vue'),
        meta: { 标题: '卡密管理', 权限Key: 'cards' },
      },
      {
        path: 'cards/:businessType/generate',
        name: 'CardGenerate',
        component: () => import('../views/CardGenerate.vue'),
        meta: { 标题: '批量生成卡密', 权限Key: 'cards' },
      },
      {
        path: 'jd-accounts',
        name: 'JdAccounts',
        component: () => import('../views/JdAccounts.vue'),
        meta: { 标题: '京东账号管理', 权限Key: 'jd_accounts' },
      },
      // ===== [已废弃] 以下为旧独立业务卡密路由，已被统一卡密工作台替代，暂不删除保留备查 =====
      // [已废弃]
      // {
      //   // 充值卡密生成页（必须在 topup-cards 之前注册，防止被拦截）
      //   path: 'topup-cards/generate',
      //   name: 'TopupCardGenerate',
      //   component: () => import('../views/TopupCardGenerate.vue'),
      //   meta: { 标题: '生成充值卡密', 权限Key: 'topup_cards' },
      // },
      // [已废弃]
      // {
      //   path: 'topup-cards',
      //   name: 'TopupCards',
      //   component: () => import('../views/TopupCards.vue'),
      //   meta: { 标题: '充值卡密管理', 权限Key: 'topup_cards' },
      // },
      // [已废弃] ===== 旧洗衣卡密路由 =====
      // [已废弃]
      // {
      //   path: 'laundry-cards',
      //   name: 'LaundryCards',
      //   component: () => import('../views/LaundryCards.vue'),
      //   meta: { 标题: '洗衣卡密管理', 权限Key: 'laundry_cards' },
      // },
      // [已废弃]
      // {
      //   path: 'laundry-cards/generate',
      //   name: 'LaundryCardGenerate',
      //   component: () => import('../views/LaundryCardGenerate.vue'),
      //   meta: { 标题: '批量生成洗衣卡密', 权限Key: 'laundry_cards' },
      // },
      // ===== [已废弃] 以上为旧独立业务卡密路由，暂不删除保留备查 =====
      // ===== 地区管理 =====
      {
        path: 'regions',
        name: 'Regions',
        component: () => import('../views/Regions.vue'),
        meta: { 标题: '地区管理', 权限Key: 'regions' },
      },
      // ===== 子账号管理 =====
      {
        path: 'sub-accounts',
        name: 'SubAccounts',
        component: () => import('../views/SubAccounts.vue'),
        meta: { 标题: '子账号管理', 权限Key: 'sub_accounts' },
      },
      // ===== 卡密工作台（新）=====
      {
        path: 'card-workbench',
        name: 'CardWorkbench',
        component: () => import('../views/CardWorkbench.vue'),
        meta: { 标题: '卡密工作台', 权限Key: 'card_workbench' },
      },
      // ===== 套餐管理（新，替代商品管理）=====
      {
        path: 'template-manager',
        name: 'TemplateManager',
        component: () => import('../views/TemplateManager.vue'),
        meta: { 标题: '套餐管理', 权限Key: 'template_manager' },
      },
      // ===== 订单中心（预留）=====
      {
        path: 'order-center',
        name: 'OrderCenter',
        component: () => import('../views/OrderCenter.vue'),
        meta: { 标题: '订单中心', 权限Key: 'order_center' },
      },
      // ===== 阿奇所SUP日志 =====
      {
        path: 'sup-logs',
        name: 'SupLogs',
        component: () => import('../views/SupLogs.vue'),
        meta: { 标题: '阿奇所SUP日志', 权限Key: 'sup_logs' },
      },
      // ===== 业务设置（预留）=====
      {
        path: 'business-settings',
        name: 'BusinessSettings',
        component: () => import('../views/BusinessSettings.vue'),
        meta: { 标题: '业务设置', 权限Key: 'business_settings' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/admin',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 权限刷新请求标记，防止同一时刻多次路由跳转触发并发请求
let 权限刷新中 = false

// 路由守卫：未登录跳转登录页，已登录但无权限跳转首页
// 对已登录用户（有token且非登录页），在后台异步刷新最新权限（不阻塞路由跳转）
// 若账号被禁用则在刷新完成后主动跳转登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.无需登录) {
    // 登录页等无需鉴权的页面直接放行
    next()
    return
  }
  if (!token) {
    next({ name: 'Login' })
    return
  }

  // 权限判断：仅当路由定义了 权限Key 且角色为 sub 时检查（使用当前缓存权限，不阻塞跳转）
  const role = localStorage.getItem('admin_role')
  const 权限Key = to.meta?.权限Key
  if (权限Key && role === 'sub') {
    const permissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]')
    if (!permissions.includes(权限Key)) {
      // 无权限时：找第一个有权限的路由，避免死循环（例如子账号没有 dashboard 权限时的无限重定向）
      const 有权限的路由 = [
        { key: 'order_center', name: 'OrderCenter' },
        { key: 'card_workbench', name: 'CardWorkbench' },
        { key: 'template_manager', name: 'TemplateManager' },
        { key: 'business_settings', name: 'BusinessSettings' },
        { key: 'sup_logs', name: 'SupLogs' },
        { key: 'regions', name: 'Regions' },
        { key: 'jd_accounts', name: 'JdAccounts' },
        { key: 'sub_accounts', name: 'SubAccounts' },
        { key: 'dashboard', name: 'Dashboard' },
      ]
      const 目标路由 = 有权限的路由.find(r => permissions.includes(r.key))
      if (目标路由 && to.name !== 目标路由.name) {
        next({ name: 目标路由.name })
      } else if (!目标路由) {
        // 没有任何权限，跳回登录页
        next({ name: 'Login' })
      } else {
        // 已在目标页，放行避免死循环
        next()
      }
      return
    }
  }

  // 先放行路由，后台异步刷新权限（非阻塞，不卡住导航）
  next()

  // 防并发：若已有权限刷新请求在途中，跳过此次（避免频繁跳转时多个并发请求互相覆盖）
  if (权限刷新中) return
  权限刷新中 = true

  // 已登录：在后台异步刷新最新权限（防止管理员修改权限后子账号未感知）
  import('../api/index.js').then(({ 获取当前权限API }) => {
    获取当前权限API().then(响应 => {
      const 结果 = 响应.data
      if (!结果 || 结果.code === 0) {
        // 账号被禁用或token失效，清空认证状态并跳转登录页
        import('../stores/auth.js').then(({ useAuthStore }) => {
          useAuthStore().退出登录()
          router.push({ name: 'Login' })
        })
        return
      }
      // 用最新数据刷新权限（不更新token）
      import('../stores/auth.js').then(({ useAuthStore }) => {
        useAuthStore().刷新权限(结果.data)
      })
    }).catch(() => {
      // 接口异常（网络错误、token过期等），不阻断导航，使用缓存中的权限继续
    }).finally(() => {
      权限刷新中 = false
    })
  }).catch(() => {
    // 模块导入失败时忽略，不阻断导航
    权限刷新中 = false
  })
})

export default router
