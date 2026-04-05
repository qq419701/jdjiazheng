<template>
  <!-- 卡密管理页面（含批次管理和全部卡密两个标签页） -->
  <div class="卡密管理">
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

      <!-- ===== 标签页一：批次管理 ===== -->
      <el-tab-pane label="批次管理" name="batches">
        <el-row justify="end" style="margin-bottom: 16px">
          <el-button type="success" @click="$router.push(`/admin/cards/${业务类型}/generate`)">批量生成卡密</el-button>
        </el-row>

        <el-table :data="批次列表" v-loading="批次加载中" stripe>
          <el-table-column prop="batch_no" label="批次号" width="200" />
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column prop="service_type" label="服务类型" width="100" />
          <el-table-column prop="service_hours" label="时长(小时)" width="90" />
          <el-table-column label="数量" width="70">
            <template #default="{ row }">
              {{ row.actual_count || row.count }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="生成时间" width="160" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="打开批次卡密详情(row)">查看卡密</el-button>
              <el-button size="small" type="primary" @click="复制批次完整链接(row)">复制完整链接</el-button>
              <el-button size="small" type="info" @click="复制批次仅卡密(row)">复制仅卡密</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 标签页二：全部卡密 ===== -->
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
                <el-option
                  v-for="批次 in 批次列表"
                  :key="批次.id"
                  :label="批次.batch_no + (批次.remark ? '（' + 批次.remark + '）' : '')"
                  :value="String(批次.id)"
                />
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
          <el-table-column label="完整链接" min-width="260">
            <template #default="{ row }">
              <span v-if="站点域名" class="链接文字">{{ 站点域名 }}/{{ row.code }}</span>
              <span v-else class="无域名提示">未配置站点域名</span>
              <el-button
                v-if="站点域名"
                size="small"
                link
                type="primary"
                style="margin-left: 4px"
                @click="复制单个链接(row.code)"
              >复制</el-button>
            </template>
          </el-table-column>
          <el-table-column label="批次" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ 获取批次号(row.batch_id) }}
            </template>
          </el-table-column>
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
      </el-tab-pane>
    </el-tabs>

    <!-- 批次卡密详情弹窗 -->
    <el-dialog
      v-model="显示批次详情"
      :title="当前批次详情?.batch_no + (当前批次详情?.remark ? '（' + 当前批次详情?.remark + '）' : '')"
      width="680px"
    >
      <div v-if="批次卡密列表.length > 0">
        <!-- 顶部操作按钮 -->
        <el-row style="margin-bottom: 12px" :gutter="8">
          <el-col :span="12">
            <el-button type="primary" @click="批量复制完整链接(批次卡密列表)">复制所有完整链接</el-button>
            <el-button @click="批量复制仅卡密(批次卡密列表)">复制仅卡密</el-button>
          </el-col>
        </el-row>

        <!-- 卡密列表 -->
        <div class="批次卡密列表">
          <div v-for="卡密 in 批次卡密列表" :key="卡密.id" class="批次卡密行">
            <span class="批次卡密状态">
              <el-tag :type="['success', 'info', 'danger'][卡密.status]" size="small">
                {{ ['未使用', '已使用', '已失效'][卡密.status] }}
              </el-tag>
            </span>
            <span class="批次卡密链接">
              {{ 站点域名 ? 站点域名 + '/' + 卡密.code : 卡密.code }}
            </span>
            <el-button
              size="small"
              link
              type="primary"
              @click="复制单个链接(卡密.code)"
            >复制</el-button>
          </div>
        </div>
      </div>
      <el-empty v-else description="该批次暂无卡密" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取卡密列表API, 删除卡密API, 获取批次列表API, 获取批次卡密API, 获取设置API } from '../api/index'

// 兼容HTTP和HTTPS环境的复制函数
const copyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(resolve).catch(reject)
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      success ? resolve() : reject(new Error('execCommand失败'))
    } catch (e) {
      document.body.removeChild(textarea)
      reject(e)
    }
  })
}

// 当前激活的标签页
const 当前标签 = ref('batches')

// 路由参数：业务类型
const route = useRoute()
const 业务类型 = computed(() => route.params.businessType || 'jiazheng')

// 站点域名（从系统设置读取）
const 站点域名 = ref('')

// ===== 批次相关状态 =====
const 批次加载中 = ref(false)
const 批次列表 = ref([])
const 显示批次详情 = ref(false)
const 当前批次详情 = ref(null)
const 批次卡密列表 = ref([])

// ===== 卡密列表相关状态 =====
const 卡密加载中 = ref(false)
const 卡密列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 搜索 = ref({ keyword: '', status: '', batch_id: '' })

// 根据batch_id查找批次号
const 批次映射 = computed(() => {
  const map = {}
  批次列表.value.forEach(b => { map[b.id] = b.batch_no })
  return map
})
const 获取批次号 = (批次id) => {
  if (!批次id) return '-'
  return 批次映射.value[批次id] || `批次${批次id}`
}

// 加载系统设置（获取站点域名）
const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
    }
  } catch {}
}

// 统计数据
const 统计 = ref({ total: 0, unused: 0, used: 0 })

const 加载统计 = async () => {
  try {
    const [全部, 未用, 已用] = await Promise.all([
      获取卡密列表API({ page: 1, limit: 1, business_type: 业务类型.value }),
      获取卡密列表API({ page: 1, limit: 1, business_type: 业务类型.value, status: '0' }),
      获取卡密列表API({ page: 1, limit: 1, business_type: 业务类型.value, status: '1' }),
    ])
    统计.value = {
      total: 全部.code === 1 ? 全部.data.total : 0,
      unused: 未用.code === 1 ? 未用.data.total : 0,
      used: 已用.code === 1 ? 已用.data.total : 0,
    }
  } catch {}
}

// 加载批次列表
const 加载批次列表 = async () => {
  批次加载中.value = true
  try {
    const 结果 = await 获取批次列表API({ business_type: 业务类型.value })
    if (结果.code === 1) {
      批次列表.value = 结果.data
    }
  } finally {
    批次加载中.value = false
  }
}

// 加载卡密列表
const 加载卡密 = async () => {
  卡密加载中.value = true
  try {
    const 结果 = await 获取卡密列表API({ page: 当前页.value, limit: 20, ...搜索.value, business_type: 业务类型.value })
    if (结果.code === 1) {
      卡密列表.value = 结果.data.list
      总数.value = 结果.data.total
    }
  } finally {
    卡密加载中.value = false
  }
}

const 搜索卡密 = () => {
  当前页.value = 1
  加载卡密()
}

// 打开批次卡密详情
const 打开批次卡密详情 = async (批次) => {
  当前批次详情.value = 批次
  显示批次详情.value = true
  批次卡密列表.value = []
  try {
    const 结果 = await 获取批次卡密API(批次.id)
    if (结果.code === 1) {
      批次卡密列表.value = 结果.data.卡密列表
    }
  } catch {
    ElMessage.error('获取批次卡密失败')
  }
}

// 复制单个完整链接
const 复制单个链接 = (code) => {
  const 内容 = 站点域名.value ? `${站点域名.value}/${code}` : code
  if (!站点域名.value) {
    ElMessage.warning('请先在系统设置中配置站点域名')
  }
  copyToClipboard(内容)
    .then(() => ElMessage.success('已复制！'))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

// 批量复制完整链接（传入卡密数组）
const 批量复制完整链接 = (卡密数组) => {
  if (!站点域名.value) {
    const 内容 = 卡密数组.map(c => c.code).join('\n')
    copyToClipboard(内容)
      .then(() => ElMessage.warning(`请先在系统设置中配置站点域名，已复制${卡密数组.length}个卡密`))
      .catch(() => ElMessage.error('复制失败，请手动复制'))
    return
  }
  const 内容 = 卡密数组.map(c => `${站点域名.value}/${c.code}`).join('\n')
  copyToClipboard(内容)
    .then(() => ElMessage.success(`已复制${卡密数组.length}条链接`))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

// 批量复制仅卡密
const 批量复制仅卡密 = (卡密数组) => {
  const 内容 = 卡密数组.map(c => c.code).join('\n')
  copyToClipboard(内容)
    .then(() => ElMessage.success(`已复制${卡密数组.length}个卡密`))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

// 复制批次完整链接（需要先获取该批次卡密）
const 复制批次完整链接 = async (批次) => {
  try {
    const 结果 = await 获取批次卡密API(批次.id)
    if (结果.code === 1) {
      批量复制完整链接(结果.data.卡密列表)
    }
  } catch {
    ElMessage.error('获取批次卡密失败')
  }
}

// 复制批次仅卡密
const 复制批次仅卡密 = async (批次) => {
  try {
    const 结果 = await 获取批次卡密API(批次.id)
    if (结果.code === 1) {
      批量复制仅卡密(结果.data.卡密列表)
    }
  } catch {
    ElMessage.error('获取批次卡密失败')
  }
}

// 删除卡密
const 删除卡密 = async (id) => {
  await ElMessageBox.confirm('确认删除该卡密？', '提示', { type: 'warning' })
  const 结果 = await 删除卡密API(id)
  if (结果.code === 1) {
    ElMessage.success('删除成功')
    加载卡密()
  }
}

onMounted(async () => {
  await Promise.all([加载站点域名(), 加载批次列表()])
  加载卡密()
  加载统计()
})

// 业务类型变化时重新加载
watch(业务类型, () => {
  当前页.value = 1
  搜索.value = { keyword: '', status: '', batch_id: '' }
  Promise.all([加载批次列表(), 加载卡密()])
  加载统计()
})
</script>

<style scoped>
.操作栏 { margin-bottom: 16px; }
.分页器 { margin-top: 16px; display: flex; justify-content: flex-end; }

/* 批次卡密详情列表 */
.批次卡密列表 {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
}
.批次卡密行 {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f5f5f5;
  gap: 8px;
}
.批次卡密行:last-child {
  border-bottom: none;
}
.批次卡密状态 {
  flex-shrink: 0;
}
.批次卡密链接 {
  flex: 1;
  font-size: 13px;
  font-family: monospace;
  color: #333;
  word-break: break-all;
}
.链接文字 {
  font-family: monospace;
  font-size: 12px;
  color: #555;
}
.无域名提示 {
  font-size: 12px;
  color: #bbb;
}
</style>
