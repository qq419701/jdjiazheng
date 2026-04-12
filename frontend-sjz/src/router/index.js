// 三角洲H5路由配置（history base='/sjz'）
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    // 三角洲主页（通过卡密访问）
    path: '/:code',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    // 下单成功页
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
  history: createWebHistory('/sjz'),
  routes,
})

export default router
