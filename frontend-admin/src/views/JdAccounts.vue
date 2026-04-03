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

    <!-- 扫码登录弹窗 -->
    <el-dialog
      v-model="显示二维码弹窗"
      title="手机扫码登录京东"
      width="360px"
      :close-on-click-modal="false"
      @close="关闭二维码弹窗"
    >
      <div style="text-align: center; padding: 16px 0;">
        <p style="color: #666; margin-bottom: 12px; font-size: 14px;">
          请用京东 App 扫描下方二维码完成登录
        </p>
        <img
          v-if="二维码图片"
          :src="二维码图片"
          alt="京东扫码登录二维码"
          style="width: 240px; height: auto; border: 1px solid #eee; border-radius: 4px;"
        />
        <p style="color: #999; margin-top: 12px; font-size: 12px;">
          二维码有效期约60秒，若过期请点击"刷新二维码"；后台最多等待120秒
        </p>
        <p v-if="扫码等待提示" style="color: #409eff; font-size: 13px; margin-top: 8px;">
          {{ 扫码等待提示 }}
        </p>
      </div>
      <template #footer>
        <el-button @click="关闭二维码弹窗">取消</el-button>
        <el-button type="primary" @click="重新获取二维码(当前登录账号ID)">刷新二维码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取账号列表API, 新增账号API, 更新账号API, 删除账号API, 触发账号登录API } from '../api/index'

const 加载中 = ref(false)
const 账号列表 = ref([])
const 显示新增弹窗 = ref(false)
const 编辑中ID = ref(null)
const 账号表单 = ref({ nickname: '', username: '', password: '', daily_limit: 20 })

// 扫码登录相关状态
const 显示二维码弹窗 = ref(false)
const 二维码图片 = ref('')
const 扫码等待提示 = ref('等待扫码中...')
const 当前登录账号ID = ref(null)
let 轮询定时器 = null

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

// 启动定时轮询，检测登录是否完成（每5秒刷新账号列表检查cookie_expire变化）
const 启动轮询 = (账号ID) => {
  停止轮询()
  // 记录初始状态，避免 undefined 引起误判
  const 初始账号 = 账号列表.value.find(a => a.id === 账号ID)
  const 初始Cookie过期 = 初始账号 ? (初始账号.cookie_expire || null) : null
  let 检查次数 = 0
  轮询定时器 = setInterval(async () => {
    检查次数++
    const 列表结果 = await 获取账号列表API().catch(() => null)
    if (列表结果 && 列表结果.code === 1) {
      账号列表.value = 列表结果.data
      const 最新账号 = 列表结果.data.find(a => a.id === 账号ID)
      if (
        最新账号 &&
        最新账号.cookie_expire &&
        最新账号.cookie_expire !== 初始Cookie过期 &&
        检查Cookie是否有效(最新账号)
      ) {
        停止轮询()
        显示二维码弹窗.value = false
        ElMessage.success('扫码登录成功！Cookie已保存')
        return
      }
    }
    if (检查次数 >= 24) { // 120秒后停止（24次 × 5秒）
      停止轮询()
      扫码等待提示.value = '等待超时，请重新获取二维码'
    }
  }, 5000)
}

const 停止轮询 = () => {
  if (轮询定时器) {
    clearInterval(轮询定时器)
    轮询定时器 = null
  }
}

const 关闭二维码弹窗 = () => {
  停止轮询()
  显示二维码弹窗.value = false
  二维码图片.value = ''
  扫码等待提示.value = '等待扫码中...'
  当前登录账号ID.value = null
}

const 重新获取二维码 = async (id) => {
  停止轮询()
  二维码图片.value = ''
  扫码等待提示.value = '正在获取新二维码...'
  ElMessage.info('正在刷新二维码，请稍候...')
  const 结果 = await 触发账号登录API(id)
  if (结果.code === 1 && 结果.data && 结果.data.需要扫码) {
    二维码图片.value = 结果.data.二维码
    扫码等待提示.value = '等待扫码中...'
    启动轮询(id)
  } else {
    ElMessage.error(结果.message || '获取二维码失败')
    扫码等待提示.value = '获取失败，请重试'
  }
}

const 触发自动登录 = async (id) => {
  ElMessage.info('正在启动扫码登录，请稍候...')
  当前登录账号ID.value = id
  const 结果 = await 触发账号登录API(id)
  if (结果.code === 1 && 结果.data && 结果.data.需要扫码) {
    二维码图片.value = 结果.data.二维码
    扫码等待提示.value = '等待扫码中...'
    显示二维码弹窗.value = true
    启动轮询(id)
  } else {
    ElMessage[结果.code === 1 ? 'success' : 'error'](结果.message || (结果.code === 1 ? '登录成功' : '登录失败'))
    加载账号()
  }
}

const 删除账号 = async (id) => {
  await ElMessageBox.confirm('确认删除该账号？', '提示', { type: 'warning' })
  await 删除账号API(id)
  ElMessage.success('删除成功')
  加载账号()
}

onMounted(() => 加载账号())
onUnmounted(() => 停止轮询())
</script>

<style scoped>
.操作栏 { margin-bottom: 16px; }
</style>
