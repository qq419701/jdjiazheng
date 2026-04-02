// 路由配置
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    // 主页（服务信息展示）- 通过卡密访问
    path: '/link/:code',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    // 填写地址页
    path: '/address',
    name: 'Address',
    component: () => import('../views/Address.vue'),
  },
  {
    // 确认订单页
    path: '/confirm',
    name: 'Confirm',
    component: () => import('../views/Confirm.vue'),
  },
  {
    // 预约成功页
    path: '/success',
    name: 'Success',
    component: () => import('../views/Success.vue'),
  },
  {
    // 卡密无效页
    path: '/invalid',
    name: 'Invalid',
    component: () => import('../views/Invalid.vue'),
  },
  {
    // 默认重定向到无效页
    path: '/:pathMatch(.*)*',
    redirect: '/invalid',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
