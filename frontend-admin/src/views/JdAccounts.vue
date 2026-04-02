<template>
  <!-- 京东账号管理页面 -->
  <div class="账号管理">
    <!-- 顶部操作 -->
    <el-card class="操作栏">
      <el-row justify="space-between" align="middle">
        <span style="font-size: 14px; color: #666">共 {{ 账号列表.length }} 个账号</span>
        <el-button type="primary" @click="显示新增弹窗 = true">+ 添加账号</el-button>
      </el-row>
    </el-card>

    <!-- 账号表格 -->
    <el-card>
      <el-table :data="账号列表" v-loading="加载中" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="nickname" label="备注名" width="120" />
        <el-table-column prop="username" label="账号" width="150" />
        <el-table-column label="账号状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Cookie状态" width="100">
          <template #default="{ row }">
            <el-tag :type="检查Cookie是否有效(row) ? 'success' : 'warning'" size="small">
              {{ 检查Cookie是否有效(row) ? '有效' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_busy ? 'warning' : 'success'" size="small">
              {{ row.is_busy ? '使用中' : '空闲' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="use_count" label="今日次数" width="90" />
        <el-table-column prop="daily_limit" label="日限制" width="80" />
        <el-table-column prop="last_used" label="最后使用" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="触发自动登录(row.id)">自动登录</el-button>
            <el-button size="small" @click="编辑账号(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="删除账号(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="显示新增弹窗" :title="编辑中ID ? '编辑账号' : '添加京东账号'" width="400px">
      <el-form :model="账号表单" label-width="80px">
        <el-form-item label="备注名">
          <el-input v-model="账号表单.nickname" placeholder="如：买家号1" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="账号表单.username" placeholder="京东账号（手机号）" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="账号表单.password" type="password" placeholder="京东密码" show-password />
        </el-form-item>
        <el-form-item label="日限制">
          <el-input-number v-model="账号表单.daily_limit" :min="1" :max="100" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">单日最大下单次数</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示新增弹窗 = false">取消</el-button>
        <el-button type="primary" @click="保存账号">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取账号列表API, 新增账号API, 更新账号API, 删除账号API, 触发账号登录API } from '../api/index'

const 加载中 = ref(false)
const 账号列表 = ref([])
const 显示新增弹窗 = ref(false)
const 编辑中ID = ref(null)
const 账号表单 = ref({ nickname: '', username: '', password: '', daily_limit: 20 })

// 检查Cookie是否有效
const 检查Cookie是否有效 = (账号) => {
  if (!账号.cookie || !账号.cookie_expire) return false
  return new Date(账号.cookie_expire) > new Date()
}

const 加载账号 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取账号列表API()
    if (结果.code === 1) 账号列表.value = 结果.data
  } finally {
    加载中.value = false
  }
}

const 编辑账号 = (账号) => {
  编辑中ID.value = 账号.id
  账号表单.value = { nickname: 账号.nickname, username: 账号.username, password: '', daily_limit: 账号.daily_limit }
  显示新增弹窗.value = true
}

const 保存账号 = async () => {
  if (!账号表单.value.username) return ElMessage.error('请输入账号')
  if (编辑中ID.value) {
    await 更新账号API(编辑中ID.value, 账号表单.value)
  } else {
    await 新增账号API(账号表单.value)
  }
  ElMessage.success('保存成功')
  显示新增弹窗.value = false
  编辑中ID.value = null
  加载账号()
}

const 触发自动登录 = async (id) => {
  ElMessage.info('正在启动自动登录，请稍候...')
  const 结果 = await 触发账号登录API(id)
  ElMessage[结果.code === 1 ? 'success' : 'error'](结果.message || (结果.code === 1 ? '登录成功' : '登录失败'))
  加载账号()
}

const 删除账号 = async (id) => {
  await ElMessageBox.confirm('确认删除该账号？', '提示', { type: 'warning' })
  await 删除账号API(id)
  ElMessage.success('删除成功')
  加载账号()
}

onMounted(() => 加载账号())
</script>

<style scoped>
.操作栏 { margin-bottom: 16px; }
</style>
