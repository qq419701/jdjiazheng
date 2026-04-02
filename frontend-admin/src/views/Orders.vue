<template>
  <!-- 订单管理页面 -->
  <div class="订单管理">
    <!-- 搜索筛选 -->
    <el-card class="搜索卡片">
      <el-form :inline="true" :model="搜索条件">
        <el-form-item label="关键词">
          <el-input v-model="搜索条件.keyword" placeholder="订单号/姓名/手机号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="搜索条件.city" placeholder="城市" clearable style="width: 100px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="搜索条件.status" clearable placeholder="全部状态" style="width: 120px">
            <el-option label="待处理" value="0" />
            <el-option label="下单中" value="1" />
            <el-option label="已下单" value="2" />
            <el-option label="失败" value="3" />
            <el-option label="已取消" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="搜索订单" :icon="Search">搜索</el-button>
          <el-button @click="重置搜索">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单表格 -->
    <el-card>
      <el-table :data="订单列表" v-loading="加载中" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="city" label="城市" width="80" />
        <el-table-column label="预约时间" width="150">
          <template #default="{ row }">{{ row.visit_date }} {{ row.visit_time }}</template>
        </el-table-column>
        <el-table-column prop="card_code" label="卡密" width="160" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="获取状态类型(row.status)" size="small">{{ 获取状态文字(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="查看详情(row.id)">详情</el-button>
            <el-button
              v-if="row.status === 0 || row.status === 3"
              size="small"
              type="primary"
              @click="触发下单(row.id)"
            >自动下单</el-button>
            <el-button
              v-if="row.status === 0"
              size="small"
              type="danger"
              @click="标记取消(row.id)"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="当前页"
        v-model:page-size="每页数量"
        :total="总数"
        layout="total, prev, pager, next"
        class="分页器"
        @change="加载订单"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { 获取订单列表API, 更新订单状态API, 触发自动下单API } from '../api/index'

const router = useRouter()

const 加载中 = ref(false)
const 订单列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)

const 搜索条件 = ref({
  keyword: '',
  city: '',
  status: '',
})

// 获取状态样式
const 获取状态类型 = (status) => {
  const 映射 = { 0: 'info', 1: 'primary', 2: 'success', 3: 'danger', 4: 'warning' }
  return 映射[status] || 'info'
}

// 获取状态文字
const 获取状态文字 = (status) => {
  const 映射 = { 0: '待处理', 1: '下单中', 2: '已下单', 3: '失败', 4: '已取消' }
  return 映射[status] || '未知'
}

// 加载订单列表
const 加载订单 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取订单列表API({
      page: 当前页.value,
      limit: 每页数量.value,
      ...搜索条件.value,
    })
    if (结果.code === 1) {
      订单列表.value = 结果.data.list
      总数.value = 结果.data.total
    }
  } finally {
    加载中.value = false
  }
}

// 搜索
const 搜索订单 = () => {
  当前页.value = 1
  加载订单()
}

// 重置搜索
const 重置搜索 = () => {
  搜索条件.value = { keyword: '', city: '', status: '' }
  搜索订单()
}

// 查看详情
const 查看详情 = (id) => router.push(`/admin/orders/${id}`)

// 触发自动下单
const 触发下单 = async (id) => {
  try {
    const 结果 = await 触发自动下单API(id)
    if (结果.code === 1) {
      ElMessage.success(结果.message)
      加载订单()
    }
  } catch {}
}

// 标记取消
const 标记取消 = async (id) => {
  await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' })
  await 更新订单状态API(id, { status: 4 })
  ElMessage.success('已取消')
  加载订单()
}

onMounted(() => 加载订单())
</script>

<style scoped>
.搜索卡片 { margin-bottom: 16px; }
.分页器 { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
