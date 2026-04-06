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
        redirect: '/admin/orders/jiazheng',
      },
      {
        path: 'cards',
        redirect: '/admin/cards/jiazheng',
      },
      // 订单管理（带业务类型参数）
      {
        path: 'orders/:businessType',
        name: 'Orders',
        component: () => import('../views/Orders.vue'),
        meta: { 标题: '订单管理', 权限Key: 'orders' },
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
      {
        path: 'time-rules',
        name: 'TimeRules',
        component: () => import('../views/TimeRules.vue'),
        meta: { 标题: '时间规则管理', 权限Key: 'time_rules' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { 标题: '系统设置', 权限Key: 'settings' },
      },
      {
        path: 'regions',
        name: 'Regions',
        component: () => import('../views/Regions.vue'),
        meta: { 标题: '地区管理', 权限Key: 'regions' },
      },
      {
        path: 'laundry-orders',
        name: 'LaundryOrders',
        component: () => import('../views/LaundryOrders.vue'),
        meta: { 标题: '洗衣订单管理', 权限Key: 'laundry_orders' },
      },
      {
        path: 'laundry-cards',
        name: 'LaundryCards',
        component: () => import('../views/LaundryCards.vue'),
        meta: { 标题: '洗衣卡密管理', 权限Key: 'laundry_cards' },
      },
      {
        path: 'laundry-cards/generate',
        name: 'LaundryCardGenerate',
        component: () => import('../views/LaundryCardGenerate.vue'),
        meta: { 标题: '批量生成洗衣卡密', 权限Key: 'laundry_cards' },
      },
      {
        path: 'laundry-time-rules',
        name: 'LaundryTimeRules',
        component: () => import('../views/LaundryTimeRules.vue'),
        meta: { 标题: '洗衣时间规则', 权限Key: 'laundry_time_rules' },
      },
      {
        path: 'laundry-settings',
        name: 'LaundrySettings',
        component: () => import('../views/LaundrySettings.vue'),
        meta: { 标题: '洗衣设置', 权限Key: 'laundry_settings' },
      },
      // ===== 充值业务（预留占位页面）=====
      {
        path: 'topup-orders',
        name: 'TopupOrders',
        component: () => import('../views/TopupOrders.vue'),
        meta: { 标题: '充值订单管理', 权限Key: 'topup_orders' },
      },
      {
        path: 'topup-cards',
        name: 'TopupCards',
        component: () => import('../views/TopupCards.vue'),
        meta: { 标题: '充值卡密管理', 权限Key: 'topup_cards' },
      },
      {
        path: 'topup-settings',
        name: 'TopupSettings',
        component: () => import('../views/TopupSettings.vue'),
        meta: { 标题: '虚拟充值设置', 权限Key: 'topup_settings' },
      },
      // ===== 子账号管理 =====
      {
        path: 'sub-accounts',
        name: 'SubAccounts',
        component: () => import('../views/SubAccounts.vue'),
        meta: { 标题: '子账号管理', 权限Key: 'sub_accounts' },
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

// 路由守卫：未登录跳转登录页，已登录但无权限跳转首页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.无需登录) {
    next()
  } else if (!token) {
    next({ name: 'Login' })
  } else {
    // 权限判断：仅当路由定义了 权限Key 且角色为 sub 时检查
    const role = localStorage.getItem('admin_role')
    const 权限Key = to.meta?.权限Key
    if (权限Key && role === 'sub') {
      const permissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]')
      if (!permissions.includes(权限Key)) {
        // 无权限时跳转到看板（如果看板也无权限，跳登录）
        next({ name: 'Dashboard' })
        return
      }
    }
    next()
  }
})

export default router
