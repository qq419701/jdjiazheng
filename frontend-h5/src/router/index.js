// 路由配置
// 注意：前端构建 base 已设为 /jz，支持 域名/jz/{卡密} 格式的新版卡密链接
// 旧的 域名/{卡密} 格式由 backend 的通配兜底路由继续支持（也返回同一套 h5 index.html）
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    // 主页（服务信息展示）- 通过卡密访问，例如 /jz/TJR93VDP9Q3Q9984
    path: '/:code',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    // 填写地址页，例如 /jz/TJR93VDP9Q3Q9984/address
    path: '/:code/address',
    name: 'Address',
    component: () => import('../views/Address.vue'),
  },
  {
    // 选择上门时间页，例如 /jz/TJR93VDP9Q3Q9984/timeslot
    path: '/:code/timeslot',
    name: 'TimeSlot',
    component: () => import('../views/TimeSlot.vue'),
  },
  {
    // 确认订单页，例如 /jz/TJR93VDP9Q3Q9984/confirm
    path: '/:code/confirm',
    name: 'Confirm',
    component: () => import('../views/Confirm.vue'),
  },
  {
    // 预约成功页，例如 /jz/TJR93VDP9Q3Q9984/success
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
  history: createWebHistory('/jz'),
  routes,
})

export default router
