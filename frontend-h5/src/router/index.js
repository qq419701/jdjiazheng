// 路由配置
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    // 主页（服务信息展示）- 通过卡密访问，例如 /TJR93VDP9Q3Q9984
    path: '/:code',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    // 填写地址页，例如 /TJR93VDP9Q3Q9984/address
    path: '/:code/address',
    name: 'Address',
    component: () => import('../views/Address.vue'),
  },
  {
    // 选择上门时间页，例如 /TJR93VDP9Q3Q9984/timeslot
    path: '/:code/timeslot',
    name: 'TimeSlot',
    component: () => import('../views/TimeSlot.vue'),
  },
  {
    // 确认订单页，例如 /TJR93VDP9Q3Q9984/confirm
    path: '/:code/confirm',
    name: 'Confirm',
    component: () => import('../views/Confirm.vue'),
  },
  {
    // 预约成功页，例如 /TJR93VDP9Q3Q9984/success
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
  history: createWebHistory(),
  routes,
})

export default router
