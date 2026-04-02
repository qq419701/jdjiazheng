<template>
  <!-- 卡密管理页面 -->
  <div class="卡密管理">
    <!-- 操作栏 -->
    <el-card class="操作栏">
      <el-row justify="space-between" align="middle">
        <el-col :span="16">
          <el-form :inline="true">
            <el-form-item label="卡密">
              <el-input v-model="搜索.keyword" placeholder="搜索卡密" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="搜索.status" clearable placeholder="全部" style="width: 100px">
                <el-option label="未使用" value="0" />
                <el-option label="已使用" value="1" />
                <el-option label="已失效" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="搜索卡密">搜索</el-button>
            </el-form-item>
          </el-form>
        </el-col>
        <el-col :span="8" style="text-align: right">
          <el-button type="success" @click="$router.push('/admin/cards/generate')">批量生成卡密</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 卡密表格 -->
    <el-card>
      <el-table :data="卡密列表" v-loading="加载中" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="卡密" width="180" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="service_type" label="服务类型" width="100" />
        <el-table-column prop="service_hours" label="时长(小时)" width="90" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="['success', 'info', 'danger'][row.status]" size="small">
              {{ ['未使用', '已使用', '已失效'][row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="删除卡密(row.id)" :disabled="row.status === 1">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="当前页"
        :total="总数"
        layout="total, prev, pager, next"
        class="分页器"
        @change="加载卡密"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取卡密列表API, 删除卡密API } from '../api/index'

const 加载中 = ref(false)
const 卡密列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 搜索 = ref({ keyword: '', status: '' })

const 加载卡密 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取卡密列表API({ page: 当前页.value, limit: 20, ...搜索.value })
    if (结果.code === 1) {
      卡密列表.value = 结果.data.list
      总数.value = 结果.data.total
    }
  } finally {
    加载中.value = false
  }
}

const 搜索卡密 = () => {
  当前页.value = 1
  加载卡密()
}

const 删除卡密 = async (id) => {
  await ElMessageBox.confirm('确认删除该卡密？', '提示', { type: 'warning' })
  const 结果 = await 删除卡密API(id)
  if (结果.code === 1) {
    ElMessage.success('删除成功')
    加载卡密()
  }
}

onMounted(() => 加载卡密())
</script>

<style scoped>
.操作栏 { margin-bottom: 16px; }
.分页器 { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
