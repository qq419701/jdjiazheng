// 充值H5路由配置（history base='/cz'）
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    // 充值主页（通过卡密访问，如 /cz/ABCD1234EFGH5678）
    path: '/:code',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    // 充值成功页
    path: '/:code/success',
    name: 'Success',
    component: () => import('../views/Success.vue'),
  },
  {
    // 卡密无效页
    path: '/invalid',
    name: 'Invalid',
    component: () => import('../views/Invalid.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/cz'),
  routes,
})

export default router
