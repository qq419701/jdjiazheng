<template>
  <!-- 洗衣卡密管理页面 -->
  <div class="洗衣卡密管理">
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
          <el-button type="success" @click="$router.push('/admin/laundry-cards/generate')">批量生成洗衣卡密</el-button>
        </el-row>

        <el-table :data="批次列表" v-loading="批次加载中" stripe>
          <el-table-column prop="batch_no" label="批次号" width="200" />
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          <el-table-column prop="service_type" label="商品名称" width="120" />
          <el-table-column label="数量" width="70">
            <template #default="{ row }">{{ row.actual_count || row.count }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="生成时间" width="160" />
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="打开批次卡密详情(row)">查看卡密</el-button>
              <el-button size="small" type="primary" @click="复制批次完整链接(row)">复制完整链接</el-button>
              <el-button size="small" type="info" @click="复制批次仅卡密(row)">复制仅卡密</el-button>
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
          <el-table-column label="完整链接" min-width="280">
            <template #default="{ row }">
              <span v-if="站点域名" class="链接文字">{{ 站点域名 }}/xi/{{ row.code }}</span>
              <span v-else class="无域名提示">未配置站点域名</span>
              <el-button
                v-if="站点域名"
                size="small" link type="primary"
                style="margin-left: 4px"
                @click="复制单个链接(row.code)"
              >复制</el-button>
            </template>
          </el-table-column>
          <el-table-column label="批次" width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ 获取批次号(row.batch_id) }}</template>
          </el-table-column>
          <el-table-column prop="service_type" label="商品名称" width="100" />
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
              <el-button v-if="row.status !== 1" size="small" type="danger" @click="删除卡密(row.id)">删除</el-button>
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
        <el-row style="margin-bottom: 12px" :gutter="8">
          <el-col :span="12">
            <el-button type="primary" @click="批量复制完整链接(批次卡密列表)">复制所有完整链接</el-button>
            <el-button @click="批量复制仅卡密(批次卡密列表)">复制仅卡密</el-button>
          </el-col>
        </el-row>
        <div class="批次卡密列表">
          <div v-for="卡密 in 批次卡密列表" :key="卡密.id" class="批次卡密行">
            <span class="批次卡密状态">
              <el-tag :type="['success', 'info', 'danger'][卡密.status]" size="small">
                {{ ['未使用', '已使用', '已失效'][卡密.status] }}
              </el-tag>
            </span>
            <span class="批次卡密链接">
              {{ 站点域名 ? 站点域名 + '/xi/' + 卡密.code : 卡密.code }}
            </span>
            <el-button size="small" link type="primary" @click="复制单个链接(卡密.code)">复制</el-button>
          </div>
        </div>
      </div>
      <el-empty v-else description="该批次暂无卡密" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取洗衣卡密列表API, 删除洗衣卡密API, 获取洗衣批次列表API, 获取洗衣批次卡密API, 获取设置API } from '../api/index'

const copyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(resolve).catch(reject)
      return
    }
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.focus()
    el.select()
    try { document.execCommand('copy') ? resolve() : reject(); document.body.removeChild(el) }
    catch (e) { document.body.removeChild(el); reject(e) }
  })
}

const 统计 = ref({ total: 0, unused: 0, used: 0 })

const 加载统计 = async () => {
  try {
    const [全部, 未用, 已用] = await Promise.all([
      获取洗衣卡密列表API({ page: 1, limit: 1 }),
      获取洗衣卡密列表API({ page: 1, limit: 1, status: '0' }),
      获取洗衣卡密列表API({ page: 1, limit: 1, status: '1' }),
    ])
    统计.value = {
      total: 全部.code === 1 ? 全部.data.total : 0,
      unused: 未用.code === 1 ? 未用.data.total : 0,
      used: 已用.code === 1 ? 已用.data.total : 0,
    }
  } catch {}
}

const 当前标签 = ref('batches')
const 站点域名 = ref('')
const 批次加载中 = ref(false)
const 批次列表 = ref([])
const 显示批次详情 = ref(false)
const 当前批次详情 = ref(null)
const 批次卡密列表 = ref([])
const 卡密加载中 = ref(false)
const 卡密列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 搜索 = ref({ keyword: '', status: '', batch_id: '' })

const 批次映射 = computed(() => {
  const map = {}
  批次列表.value.forEach(b => { map[b.id] = b.batch_no })
  return map
})
const 获取批次号 = (批次id) => 批次映射.value[批次id] || '-'

const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) 站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
  } catch {}
}

const 加载批次列表 = async () => {
  批次加载中.value = true
  try {
    const 结果 = await 获取洗衣批次列表API()
    if (结果.code === 1) 批次列表.value = 结果.data
  } finally { 批次加载中.value = false }
}

const 加载卡密 = async () => {
  卡密加载中.value = true
  try {
    const 结果 = await 获取洗衣卡密列表API({ page: 当前页.value, limit: 20, ...搜索.value })
    if (结果.code === 1) {
      卡密列表.value = 结果.data.list
      总数.value = 结果.data.total
    }
  } finally { 卡密加载中.value = false }
}

const 搜索卡密 = () => { 当前页.value = 1; 加载卡密() }

const 打开批次卡密详情 = async (批次) => {
  当前批次详情.value = 批次
  显示批次详情.value = true
  批次卡密列表.value = []
  try {
    const 结果 = await 获取洗衣批次卡密API(批次.id)
    if (结果.code === 1) 批次卡密列表.value = 结果.data.卡密列表
  } catch { ElMessage.error('获取失败') }
}

const 复制单个链接 = async (code) => {
  const 链接 = 站点域名.value ? `${站点域名.value}/xi/${code}` : code
  try { await copyToClipboard(链接); ElMessage.success('已复制') }
  catch { ElMessage.error('复制失败') }
}

const 复制批次完整链接 = async (批次) => {
  try {
    const 结果 = await 获取洗衣批次卡密API(批次.id)
    if (结果.code === 1) {
      const 链接列表 = 结果.data.卡密列表.map(c => 站点域名.value ? `${站点域名.value}/xi/${c.code}` : c.code)
      await copyToClipboard(链接列表.join('\n'))
      ElMessage.success(`已复制${链接列表.length}个链接`)
    }
  } catch { ElMessage.error('复制失败') }
}

const 复制批次仅卡密 = async (批次) => {
  try {
    const 结果 = await 获取洗衣批次卡密API(批次.id)
    if (结果.code === 1) {
      const 卡密文本 = 结果.data.卡密列表.map(c => c.code).join('\n')
      await copyToClipboard(卡密文本)
      ElMessage.success(`已复制${结果.data.卡密列表.length}个卡密`)
    }
  } catch { ElMessage.error('复制失败') }
}

const 批量复制完整链接 = async (列表) => {
  const 链接列表 = 列表.map(c => 站点域名.value ? `${站点域名.value}/xi/${c.code}` : c.code)
  try { await copyToClipboard(链接列表.join('\n')); ElMessage.success(`已复制${链接列表.length}个链接`) }
  catch { ElMessage.error('复制失败') }
}

const 批量复制仅卡密 = async (列表) => {
  const 文本 = 列表.map(c => c.code).join('\n')
  try { await copyToClipboard(文本); ElMessage.success(`已复制${列表.length}个卡密`) }
  catch { ElMessage.error('复制失败') }
}

const 删除卡密 = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该卡密？', '提示', { type: 'warning' })
    const 结果 = await 删除洗衣卡密API(id)
    if (结果.code === 1) { ElMessage.success('删除成功'); 加载卡密() }
    else ElMessage.error(结果.message || '删除失败')
  } catch {}
}

onMounted(() => { 加载站点域名(); 加载批次列表(); 加载卡密(); 加载统计() })
</script>

<style scoped>
.操作栏 { margin-bottom: 16px; }
.分页器 { margin-top: 16px; justify-content: center; }
.链接文字 { font-size: 12px; color: #409eff; }
.无域名提示 { font-size: 12px; color: #ccc; }
.批次卡密列表 { max-height: 400px; overflow-y: auto; }
.批次卡密行 { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
.批次卡密链接 { flex: 1; font-family: monospace; color: #333; word-break: break-all; }
</style>
