<template>
  <!-- 主布局框架 -->
  <div class="布局容器">
    <!-- 左侧导航菜单 -->
    <aside class="侧边栏">
      <div class="系统标志">
        <span class="系统图标">🏠</span>
        <span class="系统名称">京东家政</span>
        <span class="系统副名">代下单系统</span>
      </div>

      <el-menu
        :default-active="当前路由"
        router
        background-color="#1a1a2e"
        text-color="#ffffffaa"
        active-text-color="#ffffff"
        class="侧边菜单"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><List /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/cards">
          <el-icon><Ticket /></el-icon>
          <span>卡密管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/jd-accounts">
          <el-icon><User /></el-icon>
          <span>京东账号</span>
        </el-menu-item>
        <el-menu-item index="/admin/time-rules">
          <el-icon><Clock /></el-icon>
          <span>时间规则</span>
        </el-menu-item>
        <el-menu-item index="/admin/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 右侧主内容区 -->
    <div class="主内容区">
      <!-- 顶部导航栏 -->
      <header class="顶部导航">
        <div class="面包屑">
          <span class="当前页标题">{{ 当前页标题 }}</span>
        </div>
        <div class="用户信息">
          <span class="用户名显示">👤 {{ authStore.username }}</span>
          <el-button type="danger" plain size="small" @click="退出登录">退出登录</el-button>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="页面内容">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { DataAnalysis, List, Ticket, User, Clock, Setting } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 当前路由路径
const 当前路由 = computed(() => route.path)

// 当前页面标题
const 当前页标题 = computed(() => route.meta?.标题 || '京东家政代下单系统')

// 退出登录
const 退出登录 = async () => {
  await ElMessageBox.confirm('确认退出登录吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  }).catch(() => {})

  authStore.退出登录()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.布局容器 {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.侧边栏 {
  width: 220px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.系统标志 {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.系统图标 {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.系统名称 {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.系统副名 {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.侧边菜单 {
  flex: 1;
  border-right: none;
}

/* 主内容区 */
.主内容区 {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}

/* 顶部导航 */
.顶部导航 {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.当前页标题 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.用户信息 {
  display: flex;
  align-items: center;
  gap: 12px;
}

.用户名显示 {
  font-size: 14px;
  color: #666;
}

/* 页面内容 */
.页面内容 {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
