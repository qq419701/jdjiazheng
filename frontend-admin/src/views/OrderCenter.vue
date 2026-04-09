<template>
  <!-- 订单中心（预留占位页） -->
  <div class="订单中心容器">
    <div class="页面标题">
      <h2>📋 订单中心</h2>
      <p class="副标题">未来将整合三业务订单，支持统一搜索、统一退款操作</p>
    </div>

    <el-tabs v-model="当前Tab" type="border-card">
      <el-tab-pane label="🏠 家政订单" name="jiazheng">
        <div class="占位内容">
          <el-icon class="占位图标"><Clock /></el-icon>
          <p class="占位文字">该板块即将整合完成，现有订单管理请使用侧边栏对应菜单</p>
          <el-button type="primary" @click="$router.push('/admin/orders/jiazheng')">
            前往家政订单管理
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="🧺 洗衣订单" name="xiyifu">
        <div class="占位内容">
          <el-icon class="占位图标"><Clock /></el-icon>
          <p class="占位文字">该板块即将整合完成，现有订单管理请使用侧边栏对应菜单</p>
          <el-button type="primary" @click="$router.push('/admin/laundry-orders')">
            前往洗衣订单管理
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="💳 充值订单" name="topup">
        <div class="占位内容">
          <el-icon class="占位图标"><Clock /></el-icon>
          <p class="占位文字">该板块即将整合完成，现有订单管理请使用侧边栏对应菜单</p>
          <el-button type="primary" @click="$router.push('/admin/topup-orders')">
            前往充值订单管理
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Clock } from '@element-plus/icons-vue'

const 当前Tab = ref('jiazheng')
</script>

<style scoped>
.订单中心容器 {
  padding: 0;
}

.页面标题 {
  margin-bottom: 20px;
}

.页面标题 h2 {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 6px 0;
}

.副标题 {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.占位内容 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.占位图标 {
  font-size: 48px;
  color: #c0c4cc;
}

.占位文字 {
  font-size: 15px;
  color: #909399;
  margin: 0;
  text-align: center;
}
</style>
