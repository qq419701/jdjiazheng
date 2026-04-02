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
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('../views/Orders.vue'),
        meta: { 标题: '订单管理' },
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('../views/OrderDetail.vue'),
        meta: { 标题: '订单详情' },
      },
      {
        path: 'cards',
        name: 'Cards',
        component: () => import('../views/Cards.vue'),
        meta: { 标题: '卡密管理' },
      },
      {
        path: 'cards/generate',
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
