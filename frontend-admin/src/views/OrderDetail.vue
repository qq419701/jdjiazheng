<template>
  <!-- 订单详情页 -->
  <div class="订单详情页">
    <el-button @click="返回" :icon="ArrowLeft" style="margin-bottom: 16px">返回列表</el-button>

    <el-row :gutter="16">
      <!-- 左侧：客户信息 + 状态 -->
      <el-col :span="16">
        <!-- 客户信息 -->
        <el-card class="详情卡片">
          <template #header><span>客户信息</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">{{ 订单.order_no }}</el-descriptions-item>
            <el-descriptions-item label="卡密">{{ 订单.card_code }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ 订单.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ 订单.phone }}</el-descriptions-item>
            <el-descriptions-item label="服务地址" :span="2">{{ 订单.full_address }}</el-descriptions-item>
            <el-descriptions-item label="预约日期">{{ 订单.visit_date }}</el-descriptions-item>
            <el-descriptions-item label="预约时间">{{ 订单.visit_time }}</el-descriptions-item>
            <el-descriptions-item label="服务类型">{{ 订单.service_type }}</el-descriptions-item>
            <el-descriptions-item label="服务时长">{{ 订单.service_hours }}小时</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 下单状态 -->
        <el-card class="详情卡片">
          <template #header><span>下单状态</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="状态">
              <el-tag :type="获取状态类型(订单.status)">{{ 获取状态文字(订单.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单方式">{{ 订单.auto_order ? '自动下单' : '手动下单' }}</el-descriptions-item>
            <el-descriptions-item label="京东订单号">{{ 订单.jd_order_id || '暂无' }}</el-descriptions-item>
            <el-descriptions-item label="使用账号ID">{{ 订单.jd_account_id || '暂无' }}</el-descriptions-item>
            <el-descriptions-item v-if="订单.fail_reason" label="失败原因" :span="2">
              <span style="color: #F56C6C">{{ 订单.fail_reason }}</span>
            </el-descriptions-item>
          </el-descriptions>

          <!-- 操作按钮 -->
          <div class="操作按钮区" v-if="订单.status === 0 || 订单.status === 3">
            <el-button type="primary" :loading="下单中" @click="触发自动下单">
              🤖 一键自动下单
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：操作日志 -->
      <el-col :span="8">
        <el-card class="详情卡片">
          <template #header><span>操作日志</span></template>
          <el-timeline v-if="日志列表.length > 0">
            <el-timeline-item
              v-for="(日志, 索引) in 日志列表"
              :key="索引"
              :type="获取日志类型(日志.状态)"
              :timestamp="日志.时间"
              placement="top"
            >
              {{ 日志.操作 }}
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无操作日志" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { 获取订单详情API, 触发自动下单API } from '../api/index'

const route = useRoute()
const router = useRouter()

const 订单 = ref({})
const 日志列表 = ref([])
const 下单中 = ref(false)

const 获取状态类型 = (status) => ({ 0: 'info', 1: 'primary', 2: 'success', 3: 'danger', 4: 'warning' }[status] || 'info')
const 获取状态文字 = (status) => ({ 0: '待处理', 1: '下单中', 2: '已下单', 3: '失败', 4: '已取消' }[status] || '未知')
const 获取日志类型 = (状态) => ({ success: 'success', error: 'danger', info: 'primary' }[状态] || 'primary')

const 加载详情 = async () => {
  const 结果 = await 获取订单详情API(route.params.id)
  if (结果.code === 1) {
    订单.value = 结果.data
    日志列表.value = Array.isArray(结果.data.order_log) ? 结果.data.order_log : []
  }
}

const 触发自动下单 = async () => {
  下单中.value = true
  try {
    const 结果 = await 触发自动下单API(route.params.id)
    ElMessage.success(结果.message)
    setTimeout(加载详情, 2000)
  } finally {
    下单中.value = false
  }
}

const 返回 = () => router.push('/admin/orders')

onMounted(() => 加载详情())
</script>

<style scoped>
.详情卡片 { margin-bottom: 16px; }
.操作按钮区 { margin-top: 16px; }
</style>
