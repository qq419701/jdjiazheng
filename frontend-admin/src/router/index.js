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
        meta: { 标题: '数据看板' },
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
        meta: { 标题: '订单管理' },
      },
      {
        path: 'orders/:businessType/:id',
        name: 'OrderDetail',
        component: () => import('../views/OrderDetail.vue'),
        meta: { 标题: '订单详情' },
      },
      // 卡密管理（带业务类型参数）
      {
        path: 'cards/:businessType',
        name: 'Cards',
        component: () => import('../views/Cards.vue'),
        meta: { 标题: '卡密管理' },
      },
      {
        path: 'cards/:businessType/generate',
        name: 'CardGenerate',
        component: () => import('../views/CardGenerate.vue'),
        meta: { 标题: '批量生成卡密' },
      },
      {
        path: 'jd-accounts',
        name: 'JdAccounts',
        component: () => import('../views/JdAccounts.vue'),
        meta: { 标题: '京东账号管理' },
      },
      {
        path: 'time-rules',
        name: 'TimeRules',
        component: () => import('../views/TimeRules.vue'),
        meta: { 标题: '时间规则管理' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { 标题: '系统设置' },
      },
      {
        path: 'regions',
        name: 'Regions',
        component: () => import('../views/Regions.vue'),
        meta: { 标题: '地区管理' },
      },
      {
        path: 'laundry-orders',
        name: 'LaundryOrders',
        component: () => import('../views/LaundryOrders.vue'),
        meta: { 标题: '洗衣订单管理' },
      },
      {
        path: 'laundry-cards',
        name: 'LaundryCards',
        component: () => import('../views/LaundryCards.vue'),
        meta: { 标题: '洗衣卡密管理' },
      },
      {
        path: 'laundry-cards/generate',
        name: 'LaundryCardGenerate',
        component: () => import('../views/LaundryCardGenerate.vue'),
        meta: { 标题: '批量生成洗衣卡密' },
      },
      {
        path: 'laundry-time-rules',
        name: 'LaundryTimeRules',
        component: () => import('../views/LaundryTimeRules.vue'),
        meta: { 标题: '洗衣时间规则' },
      },
      {
        path: 'laundry-settings',
        name: 'LaundrySettings',
        component: () => import('../views/LaundrySettings.vue'),
        meta: { 标题: '洗衣设置' },
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

// 路由守卫：未登录跳转登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.无需登录) {
    next()
  } else if (!token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
