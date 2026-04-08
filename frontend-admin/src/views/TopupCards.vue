<template>
  <!-- 充值卡密管理页面 -->
  <div class="充值卡密管理">

    <!-- 统计卡片 -->
    <el-row :gutter="12" style="margin-bottom: 16px">
      <el-col :span="8">
        <el-statistic title="总卡密" :value="统计.total" />
      </el-col>
      <el-col :span="8">
        <el-statistic title="未使用" :value="统计.unused" />
      </el-col>
      <el-col :span="8">
        <el-statistic title="已使用" :value="统计.used" />
      </el-col>
    </el-row>

    <el-tabs v-model="当前标签" type="border-card">

      <!-- ===== 批次管理 ===== -->
      <el-tab-pane label="批次管理" name="batches">
        <el-row justify="end" style="margin-bottom: 16px">
          <el-button type="success" @click="$router.push('/admin/topup-cards/generate')">批量生成充值卡密</el-button>
        </el-row>

        <el-table :data="批次列表" v-loading="批次加载中" stripe>
          <el-table-column prop="batch_no" label="批次号" width="200" />
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          <el-table-column label="充值会员" width="120">
            <template #default="{ row }">{{ row.topup_member_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="账号类型" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.topup_account_type" size="small" type="info">{{ 账号类型中文(row.topup_account_type) }}</el-tag>
              <span v-else class="无值">-</span>
            </template>
          </el-table-column>
          <el-table-column label="到账时间" width="100">
            <template #default="{ row }">{{ row.topup_arrival_time || '-' }}</template>
          </el-table-column>
          <el-table-column label="数量" width="70">
            <template #default="{ row }">{{ row.actual_count || row.count }}</template>
          </el-table-column>
          <el-table-column label="使用情况" width="130">
            <template #default="{ row }">
              <span style="color: #67c23a">已用 {{ row.used_count || 0 }}</span>
              <span style="color: #999; margin: 0 4px">/</span>
              <span style="color: #409eff">未用 {{ row.unused_count || 0 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生成时间" width="150">
            <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="430" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="打开批次卡密详情(row)">查看卡密</el-button>
              <el-button size="small" type="primary" @click="复制批次完整链接(row)">复制完整链接</el-button>
              <el-button size="small" type="info" @click="复制批次仅卡密(row)">复制仅卡密</el-button>
              <el-button size="small" type="success" @click="导出批次TXT(row)">导出TXT</el-button>
              <el-button size="small" type="danger" @click="删除批次(row.id, row.used_count)">删除批次</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 全部卡密 ===== -->
      <el-tab-pane label="全部卡密" name="cards">
        <el-card class="操作栏">
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
            <el-form-item label="批次">
              <el-select v-model="搜索.batch_id" clearable placeholder="全部批次" style="width: 180px">
                <el-option v-for="批次 in 批次列表" :key="批次.id" :label="批次.batch_no + (批次.remark ? '（' + 批次.remark + '）' : '')" :value="String(批次.id)" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="搜索卡密">搜索</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-table :data="卡密列表" v-loading="卡密加载中" stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="code" label="卡密" width="180" />
          <el-table-column label="完整链接" min-width="280">
            <template #default="{ row }">
              <span v-if="站点域名" class="链接文字">{{ 站点域名 }}/cz/{{ row.code }}</span>
              <span v-else class="无域名提示">未配置站点域名</span>
              <el-button v-if="站点域名" size="small" link type="primary" style="margin-left: 4px" @click="复制单个链接(row.code)">复制</el-button>
            </template>
          </el-table-column>
          <el-table-column label="批次" width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ 获取批次号(row.batch_id) }}</template>
          </el-table-column>
          <el-table-column label="充值会员" width="120">
            <template #default="{ row }">{{ row.topup_member_name || row.service_type || '-' }}</template>
          </el-table-column>
          <el-table-column label="账号类型" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.topup_account_type" size="small" type="info">{{ 账号类型中文(row.topup_account_type) }}</el-tag>
              <span v-else class="无值">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="['success', 'info', 'danger'][row.status]" size="small">
                {{ ['未使用', '已使用', '已失效'][row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="145">
            <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="warning" :disabled="row.status !== 0" @click="作废单张卡密(row)">作废</el-button>
              <el-button size="small" type="danger" @click="删除单张卡密(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 批次卡密详情弹窗 -->
    <el-dialog v-model="显示批次详情" :title="`批次详情：${当前批次?.batch_no}`" width="800px">
      <div v-if="当前批次" style="margin-bottom:16px">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="充值会员">{{ 当前批次.topup_member_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="账号类型">{{ 账号类型中文(当前批次.topup_account_type) }}</el-descriptions-item>
          <el-descriptions-item label="账号标签">{{ 当前批次.topup_account_label || '-' }}</el-descriptions-item>
          <el-descriptions-item label="到账时间">{{ 当前批次.topup_arrival_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="显示到期选项">{{ 当前批次.topup_show_expired ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="充值步骤" :span="2">{{ 当前批次.topup_steps || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-table :data="批次卡密详情列表" v-loading="批次详情加载中" stripe>
        <el-table-column prop="code" label="卡密" width="180" />
        <el-table-column label="完整链接" min-width="260">
          <template #default="{ row }">
            <span v-if="站点域名" class="链接文字">{{ 站点域名 }}/cz/{{ row.code }}</span>
            <el-button v-if="站点域名" size="small" link type="primary" @click="复制单个链接(row.code)">复制</el-button>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="['success', 'info', 'danger'][row.status]" size="small">
              {{ ['未使用', '已使用', '已失效'][row.status] }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="复制批次完整链接(当前批次)">复制所有完整链接</el-button>
        <el-button @click="复制批次仅卡密(当前批次)">复制仅卡密</el-button>
        <el-button @click="显示批次详情 = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  获取充值卡密列表API, 删除充值卡密API, 作废充值卡密API,
  获取充值批次列表API, 获取充值批次卡密API, 删除充值批次API,
  获取设置API,
} from '../api/index'

// 格式化北京时间
const 格式化北京时间 = (isoStr) => {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return fmt.format(d).replace(', ', ' ')
}

const 账号类型中文 = (类型) => {
  const 映射 = { phone: '手机号', wechat: '微信号', qq: 'QQ号', email: '邮箱', other: '其他' }
  return 映射[类型] || 类型 || '-'
}

const 站点域名 = ref('')
const 当前标签 = ref('batches')
const 批次加载中 = ref(false)
const 卡密加载中 = ref(false)
const 批次列表 = ref([])
const 卡密列表 = ref([])
const 搜索 = ref({ keyword: '', status: '', batch_id: '' })
const 显示批次详情 = ref(false)
const 当前批次 = ref(null)
const 批次卡密详情列表 = ref([])
const 批次详情加载中 = ref(false)

// 统计数据
const 统计 = computed(() => {
  const total = 批次列表.value.reduce((sum, b) => sum + (b.actual_count || 0), 0)
  const used = 批次列表.value.reduce((sum, b) => sum + (b.used_count || 0), 0)
  const unused = 批次列表.value.reduce((sum, b) => sum + (b.unused_count || 0), 0)
  return { total, used, unused }
})

onMounted(async () => {
  await 加载站点域名()
  await Promise.all([加载批次(), 加载卡密()])
})

const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) 站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
  } catch {}
}

const 加载批次 = async () => {
  批次加载中.value = true
  try {
    const 结果 = await 获取充值批次列表API()
    if (结果.code === 1) 批次列表.value = 结果.data || []
  } catch { ElMessage.error('加载批次失败') } finally { 批次加载中.value = false }
}

const 加载卡密 = async () => {
  卡密加载中.value = true
  try {
    const 参数 = { keyword: 搜索.value.keyword, status: 搜索.value.status, batch_id: 搜索.value.batch_id, limit: 200 }
    const 结果 = await 获取充值卡密列表API(参数)
    if (结果.code === 1) {
      // 兼容两种返回格式：数组 或 { rows, list }
      卡密列表.value = Array.isArray(结果.data) ? 结果.data : (结果.data?.rows || 结果.data?.list || [])
    }
  } catch { ElMessage.error('加载卡密失败') } finally { 卡密加载中.value = false }
}

const 搜索卡密 = () => 加载卡密()

const 获取批次号 = (batchId) => {
  const 批次 = 批次列表.value.find(b => b.id === batchId)
  return 批次 ? 批次.batch_no : '-'
}

// 批次详情
const 打开批次卡密详情 = async (批次) => {
  当前批次.value = 批次
  显示批次详情.value = true
  批次详情加载中.value = true
  try {
    const 结果 = await 获取充值批次卡密API(批次.id)
    if (结果.code === 1) 批次卡密详情列表.value = 结果.data || []
  } catch { ElMessage.error('加载卡密详情失败') } finally { 批次详情加载中.value = false }
}

// 复制
const 复制单个链接 = (code) => {
  if (!站点域名.value) {
    ElMessage.warning('请先在系统设置中配置站点域名')
    return
  }
  const 链接 = `${站点域名.value}/cz/${code}`
  navigator.clipboard.writeText(链接).then(() => ElMessage.success('复制成功')).catch(() => ElMessage.error('复制失败'))
}

const 复制批次完整链接 = async (批次) => {
  let 卡密列表数据 = 批次卡密详情列表.value
  if (!卡密列表数据.length || 当前批次.value?.id !== 批次.id) {
    try {
      const 结果 = await 获取充值批次卡密API(批次.id)
      if (结果.code === 1) 卡密列表数据 = 结果.data || []
    } catch {}
  }
  const 链接列表 = 卡密列表数据.map(c => `${站点域名.value}/cz/${c.code}`).join('\n')
  navigator.clipboard.writeText(链接列表).then(() => ElMessage.success(`已复制 ${卡密列表数据.length} 个链接`)).catch(() => ElMessage.error('复制失败'))
}

const 复制批次仅卡密 = async (批次) => {
  let 卡密列表数据 = 批次卡密详情列表.value
  if (!卡密列表数据.length || 当前批次.value?.id !== 批次.id) {
    try {
      const 结果 = await 获取充值批次卡密API(批次.id)
      if (结果.code === 1) 卡密列表数据 = 结果.data || []
    } catch {}
  }
  const 只卡密 = 卡密列表数据.map(c => c.code).join('\n')
  navigator.clipboard.writeText(只卡密).then(() => ElMessage.success(`已复制 ${卡密列表数据.length} 个卡密`)).catch(() => ElMessage.error('复制失败'))
}

// 导出批次TXT
const 导出批次TXT = async (批次) => {
  let 卡密列表数据 = 批次卡密详情列表.value
  if (!卡密列表数据.length || 当前批次.value?.id !== 批次.id) {
    try {
      const 结果 = await 获取充值批次卡密API(批次.id)
      if (结果.code === 1) 卡密列表数据 = 结果.data || []
    } catch {}
  }
  const 内容 = 站点域名.value
    ? 卡密列表数据.map(c => `${站点域名.value}/cz/${c.code}`).join('\n')
    : 卡密列表数据.map(c => c.code).join('\n')
  const blob = new Blob([内容], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${批次.batch_no}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${卡密列表数据.length} 个${站点域名.value ? '链接' : '卡密'}`)
}

// 删除批次
const 删除批次 = async (id, 已用数) => {
  if (已用数 > 0) {
    await ElMessageBox.alert(`此批次有 ${已用数} 个卡密已被使用，删除后将同时删除这些卡密记录（订单不受影响）。`, '注意', { confirmButtonText: '我知道了', type: 'warning' })
  }
  try {
    await ElMessageBox.confirm('确认删除此批次及所有卡密？', '确认删除', { type: 'danger' })
    const 结果 = await 删除充值批次API(id)
    if (结果.code === 1) { ElMessage.success('删除成功'); 加载批次(); 加载卡密() }
    else ElMessage.warning(结果.message)
  } catch {}
}

// 作废单张卡密
const 作废单张卡密 = async (行) => {
  try {
    await ElMessageBox.confirm(`确认作废卡密 ${行.code} ？此操作不可逆。`, '作废确认', { type: 'warning' })
    const 结果 = await 作废充值卡密API(行.id)
    if (结果.code === 1) { ElMessage.success('卡密已作废'); 加载卡密() }
    else ElMessage.warning(结果.message)
  } catch {}
}

// 删除单张卡密
const 删除单张卡密 = async (行) => {
  try {
    await ElMessageBox.confirm(`确认删除卡密 ${行.code} ？`, '确认删除', { type: 'danger' })
    const 结果 = await 删除充值卡密API(行.id)
    if (结果.code === 1) { ElMessage.success('删除成功'); 加载卡密() }
    else ElMessage.warning(结果.message)
  } catch {}
}
</script>

<style scoped>
.充值卡密管理 { padding: 0; }
.操作栏 { margin-bottom: 12px; }
.无值 { color: #bbb; font-size: 12px; }
.链接文字 { font-size: 12px; color: #666; font-family: monospace; }
.无域名提示 { color: #f56c6c; font-size: 12px; }
</style>

