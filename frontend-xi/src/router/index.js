// 洗衣H5路由配置（history base='/xi'）
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    // 主页（通过卡密访问，例如 /xi/G4G3VJX937V78589）
    path: '/:code',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    // 填写地址页（取件+收件）
    path: '/:code/address',
    name: 'Address',
    component: () => import('../views/Address.vue'),
  },
  {
    // 选择取件时间
    path: '/:code/timeslot',
    name: 'TimeSlot',
    component: () => import('../views/TimeSlot.vue'),
  },
  {
    // 确认订单
    path: '/:code/confirm',
    name: 'Confirm',
    component: () => import('../views/Confirm.vue'),
  },
  {
    // 预约成功
    path: '/:code/success',
    name: 'Success',
    component: () => import('../views/Success.vue'),
  },
  {
    // 卡密无效
    path: '/invalid',
    name: 'Invalid',
    component: () => import('../views/Invalid.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/xi'),
  routes,
})

export default router
