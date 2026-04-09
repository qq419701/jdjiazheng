<template>
  <!-- 主布局框架 -->
  <div class="布局容器">
    <!-- 左侧导航菜单 -->
    <aside class="侧边栏">
      <div class="系统标志">
        <span class="系统图标">🛒</span>
        <span class="系统名称">京东代下单系统</span>
      </div>

      <el-menu
        :default-active="当前路由"
        router
        background-color="#1a1a2e"
        text-color="#ffffffaa"
        active-text-color="#ffffff"
        class="侧边菜单"
      >
        <el-menu-item v-if="authStore.有权限('dashboard')" index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>

        <el-menu-item-group v-if="显示家政分组" title="京东家政">
          <el-menu-item v-if="authStore.有权限('orders')" index="/admin/orders/jiazheng">
            <el-icon><List /></el-icon>
            <span>家政订单管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('cards')" index="/admin/cards/jiazheng">
            <el-icon><Ticket /></el-icon>
            <span>家政卡密管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('jd_accounts')" index="/admin/jd-accounts">
            <el-icon><User /></el-icon>
            <span>京东账号管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('time_rules')" index="/admin/time-rules">
            <el-icon><Clock /></el-icon>
            <span>时间规则</span>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group v-if="显示洗衣分组" title="京东洗衣服">
          <el-menu-item v-if="authStore.有权限('laundry_orders')" index="/admin/laundry-orders">
            <el-icon><List /></el-icon>
            <span>洗衣订单管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('laundry_cards')" index="/admin/laundry-cards">
            <el-icon><Ticket /></el-icon>
            <span>洗衣卡密管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('laundry_time_rules')" index="/admin/laundry-time-rules">
            <el-icon><Clock /></el-icon>
            <span>洗衣时间规则</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('laundry_settings')" index="/admin/laundry-settings">
            <el-icon><Setting /></el-icon>
            <span>洗衣服设置</span>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group v-if="显示充值分组" title="充值业务（预留）">
          <el-menu-item v-if="authStore.有权限('topup_orders')" index="/admin/topup-orders">
            <el-icon><CreditCard /></el-icon>
            <span>充值订单管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('topup_cards')" index="/admin/topup-cards">
            <el-icon><Ticket /></el-icon>
            <span>充值卡密管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('topup_settings')" index="/admin/topup-settings">
            <el-icon><Setting /></el-icon>
            <span>虚拟充值设置</span>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group v-if="显示卡密管理分组" title="卡密管理">
          <el-menu-item v-if="authStore.有权限('card_workbench')" index="/admin/card-workbench">
            <el-icon><Ticket /></el-icon>
            <span>🎫 卡密工作台</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('template_manager')" index="/admin/template-manager">
            <el-icon><Goods /></el-icon>
            <span>📦 套餐管理</span>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group v-if="显示整合预留分组" title="整合预留">
          <el-menu-item v-if="authStore.有权限('order_center')" index="/admin/order-center">
            <el-icon><List /></el-icon>
            <span>📋 订单中心</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('business_settings')" index="/admin/business-settings">
            <el-icon><Setting /></el-icon>
            <span>⚙️ 业务设置</span>
          </el-menu-item>
        </el-menu-item-group>

        <el-menu-item-group v-if="显示系统分组" title="系统管理">
          <el-menu-item v-if="authStore.有权限('regions')" index="/admin/regions">
            <el-icon><MapLocation /></el-icon>
            <span>地区管理</span>
          </el-menu-item>
          <el-menu-item v-if="authStore.有权限('settings')" index="/admin/settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
          <!-- 子账号管理（仅 super/admin 可见） -->
          <el-menu-item v-if="authStore.有权限('sub_accounts')" index="/admin/sub-accounts">
            <el-icon><UserFilled /></el-icon>
            <span>子账号管理</span>
          </el-menu-item>
        </el-menu-item-group>
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
          <span class="用户名显示">👤 {{ authStore.nickname || authStore.username }}</span>
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
import { DataAnalysis, List, Ticket, User, UserFilled, CreditCard, Clock, Setting, MapLocation, Goods } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 当前路由路径
const 当前路由 = computed(() => route.path)

// 当前页面标题
const 当前页标题 = computed(() => route.meta?.标题 || '京东代下单系统')

// 分组可见性：有任意菜单项可见则显示该分组
const 显示家政分组 = computed(() => ['orders', 'cards', 'jd_accounts', 'time_rules'].some(k => authStore.有权限(k)))
const 显示洗衣分组 = computed(() => ['laundry_orders', 'laundry_cards', 'laundry_time_rules', 'laundry_settings'].some(k => authStore.有权限(k)))
const 显示充值分组 = computed(() => ['topup_orders', 'topup_cards', 'topup_settings'].some(k => authStore.有权限(k)))
const 显示卡密管理分组 = computed(() => ['card_workbench', 'template_manager'].some(k => authStore.有权限(k)))
const 显示整合预留分组 = computed(() => ['order_center', 'business_settings'].some(k => authStore.有权限(k)))
const 显示系统分组 = computed(() => ['regions', 'settings', 'sub_accounts'].some(k => authStore.有权限(k)))

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
  overflow-y: auto;
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
  font-size: 15px;
  font-weight: 700;
  color: white;
}

.侧边菜单 {
  flex: 1;
  border-right: none;
}

:deep(.el-menu-item-group__title) {
  color: rgba(255, 255, 255, 0.35) !important;
  font-size: 11px;
  padding-left: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.el-menu-item-group .el-menu-item) {
  padding-left: 24px !important;
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
