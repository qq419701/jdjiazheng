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
            <el-option label="安排中" value="5" />
            <el-option label="预约完成" value="6" />
            <el-option label="预约失败" value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="日期范围"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="搜索订单" :icon="Search">搜索</el-button>
          <el-button @click="重置筛选">重置</el-button>
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
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="获取状态类型(row.status)" size="small">{{ 获取状态文字(row.status) }}</el-tag>
            <!-- 失败状态显示查看原因链接 -->
            <span
              v-if="(row.status === 3 || row.status === 7) && row.fail_reason"
              class="查看原因链接"
              @click="查看失败原因(row)"
            >查看原因</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="查看详情(row.id)">详情</el-button>
            <!-- 家政服务操作 -->
            <template v-if="!是洗衣服务">
              <el-button
                v-if="row.status === 0 || row.status === 3 || row.status === 7"
                size="small"
                type="primary"
                @click="触发下单(row.id)"
              >自动下单</el-button>
              <el-button
                v-if="row.status === 0"
                size="small"
                type="warning"
                @click="手动标记状态(row, 5)"
              >安排中</el-button>
              <el-button
                v-if="row.status === 5"
                size="small"
                type="success"
                @click="手动标记状态(row, 6)"
              >完成</el-button>
              <el-button
                v-if="row.status === 0 || row.status === 5"
                size="small"
                type="danger"
                @click="标记预约失败(row)"
              >预约失败</el-button>
              <el-button
                v-if="row.status === 0"
                size="small"
                type="info"
                @click="标记取消(row.id)"
              >取消</el-button>
              <el-button
                v-if="row.status === 3 || row.status === 7"
                size="small"
                type="warning"
                @click="执行重置订单(row.id)"
              >重置</el-button>
            </template>
            <!-- 洗衣服务操作（预留） -->
            <template v-else>
              <el-tooltip content="接口配置后可用" placement="top">
                <span>
                  <el-button size="small" type="primary" disabled>触发洗衣下单</el-button>
                </span>
              </el-tooltip>
              <el-tooltip content="接口配置后可用" placement="top">
                <span>
                  <el-button size="small" type="success" disabled>触发取件</el-button>
                </span>
              </el-tooltip>
            </template>
            <!-- 复制按钮 -->
            <el-button size="small" @click="打开复制面板(row)">复制</el-button>
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

    <!-- 失败原因输入弹窗 -->
    <el-dialog v-model="显示失败原因弹窗" title="填写失败原因" width="400px" :close-on-click-modal="false">
      <el-form :model="失败原因表单">
        <el-form-item label="失败原因">
          <el-input
            v-model="失败原因表单.原因"
            type="textarea"
            rows="4"
            placeholder="请填写失败原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示失败原因弹窗 = false">取消</el-button>
        <el-button type="danger" @click="确认标记失败">确认标记失败</el-button>
      </template>
    </el-dialog>

    <!-- 查看失败原因弹窗 -->
    <el-dialog v-model="显示查看原因弹窗" title="失败原因" width="400px">
      <p style="white-space: pre-wrap; color: #333;">{{ 当前查看原因 }}</p>
      <template #footer>
        <el-button type="primary" @click="显示查看原因弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 复制面板弹窗 -->
    <el-dialog v-model="显示复制面板" title="选择复制内容" width="420px" :close-on-click-modal="false">
      <div class="复制面板">
        <p class="复制说明">勾选需要复制的字段：</p>
        <el-checkbox-group v-model="复制选中字段">
          <div v-for="字段 in 复制字段列表" :key="字段.key" class="复制字段项">
            <el-checkbox :value="字段.key">
              <span>{{ 字段.标签 }}</span>
              <span class="字段值预览">{{ 字段.值 || '（空）' }}</span>
            </el-checkbox>
          </div>
        </el-checkbox-group>
        <div class="复制预览">
          <p class="预览标题">复制预览：</p>
          <pre class="预览内容">{{ 生成复制文本() }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="显示复制面板 = false">取消</el-button>
        <el-button type="primary" @click="确认复制">确认复制</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { 获取订单列表API, 更新订单状态API, 触发自动下单API, 重置订单API } from '../api/index'

const router = useRouter()
const route = useRoute()

// 业务类型（从路由参数读取，默认 jiazheng）
const 业务类型 = computed(() => route.params.businessType || 'jiazheng')
const 是洗衣服务 = computed(() => 业务类型.value === 'xiyifu')

const 加载中 = ref(false)
const 订单列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)

// 日期范围（[开始日期, 结束日期]）
const 日期范围 = ref([])

const 搜索条件 = ref({
  keyword: '',
  city: '',
  status: '',
})

// ===== 失败原因弹窗 =====
const 显示失败原因弹窗 = ref(false)
const 失败原因表单 = ref({ 原因: '' })
// 待标记失败的订单信息
const 待失败订单 = ref(null)

// ===== 查看原因弹窗 =====
const 显示查看原因弹窗 = ref(false)
const 当前查看原因 = ref('')

// ===== 复制面板 =====
const 显示复制面板 = ref(false)
const 当前复制行 = ref(null)
const 复制选中字段 = ref(['姓名', '手机号', '地址'])
const 复制字段列表 = ref([])

// 获取状态样式（包含新增状态5安排中 6预约完成 7预约失败）
const 获取状态类型 = (status) => {
  const 映射 = { 0: 'info', 1: 'primary', 2: 'success', 3: 'danger', 4: 'warning', 5: 'primary', 6: 'success', 7: 'danger' }
  return 映射[status] || 'info'
}

// 获取状态文字（包含新增状态）
const 获取状态文字 = (status) => {
  const 映射 = { 0: '待处理', 1: '下单中', 2: '已下单', 3: '失败', 4: '已取消', 5: '安排中', 6: '预约完成', 7: '预约失败' }
  return 映射[status] || '未知'
}

// 加载订单列表
const 加载订单 = async () => {
  加载中.value = true
  try {
    // 处理日期范围参数
    const 查询参数 = {
      page: 当前页.value,
      limit: 每页数量.value,
      ...搜索条件.value,
      business_type: 业务类型.value,
    }
    if (日期范围.value && 日期范围.value.length === 2) {
      查询参数.date_start = 日期范围.value[0]
      查询参数.date_end = 日期范围.value[1]
    }

    const 结果 = await 获取订单列表API(查询参数)
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

// 重置筛选条件
const 重置筛选 = () => {
  搜索条件.value = { keyword: '', city: '', status: '' }
  日期范围.value = []
  搜索订单()
}

// 查看详情（使用带 businessType 参数的路由）
const 查看详情 = (id) => router.push(`/admin/orders/${业务类型.value}/${id}`)

// 业务类型切换时重新加载
watch(业务类型, () => {
  当前页.value = 1
  搜索条件.value = { keyword: '', city: '', status: '' }
  日期范围.value = []
  加载订单()
})

// 触发自动下单
const 触发下单 = async (id) => {
  try {
    const 结果 = await 触发自动下单API(id)
    if (结果.code === 1) {
      ElMessage.success(结果.message)
      加载订单()
    } else {
      ElMessage.warning(结果.message)
    }
  } catch {}
}

// 手动标记状态（安排中/预约完成等无需填写原因）
const 手动标记状态 = async (行, 状态) => {
  try {
    await 更新订单状态API(行.id, { status: 状态 })
    ElMessage.success(`已更新为：${获取状态文字(状态)}`)
    加载订单()
  } catch {}
}

// 标记预约失败（弹窗填写原因）
const 标记预约失败 = (行) => {
  待失败订单.value = { id: 行.id, status: 7 }
  失败原因表单.value.原因 = ''
  显示失败原因弹窗.value = true
}

// 确认标记失败（提交失败原因）
const 确认标记失败 = async () => {
  if (!待失败订单.value) return
  try {
    await 更新订单状态API(待失败订单.value.id, {
      status: 待失败订单.value.status,
      fail_reason: 失败原因表单.value.原因 || '',
    })
    ElMessage.success('已标记为预约失败')
    显示失败原因弹窗.value = false
    加载订单()
  } catch {
    ElMessage.error('操作失败，请重试')
  }
}

// 查看失败原因
const 查看失败原因 = (行) => {
  当前查看原因.value = 行.fail_reason || '（未填写原因）'
  显示查看原因弹窗.value = true
}

// 标记取消
const 标记取消 = async (id) => {
  try {
    await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' })
    await 更新订单状态API(id, { status: 4 })
    ElMessage.success('已取消')
    加载订单()
  } catch {}
}

// 执行重置订单（失败→待处理）
const 执行重置订单 = async (id) => {
  try {
    await ElMessageBox.confirm('确认重置该订单为待处理状态？重置后可重新下单。', '提示', { type: 'warning' })
    const 结果 = await 重置订单API(id)
    if (结果.code === 1) {
      ElMessage.success('订单已重置为待处理')
      加载订单()
    } else {
      ElMessage.warning(结果.message)
    }
  } catch {}
}

// 打开复制面板
const 打开复制面板 = (行) => {
  当前复制行.value = 行
  // 构建完整地址（包含街道）
  const 完整地址 = [行.province, 行.city, 行.district, 行.street, 行.address].filter(Boolean).join(' ')
  // 构建字段列表（默认勾选：姓名、手机号、地址）
  复制字段列表.value = [
    { key: '姓名', 标签: '姓名', 值: 行.name },
    { key: '手机号', 标签: '手机号', 值: 行.phone },
    { key: '地址', 标签: '完整地址', 值: 完整地址 },
    { key: '订单号', 标签: '订单号', 值: 行.order_no },
    { key: '卡密', 标签: '卡密', 值: 行.card_code },
    { key: '预约时间', 标签: '预约时间', 值: `${行.visit_date || ''} ${行.visit_time || ''}`.trim() },
    { key: '服务类型', 标签: '服务类型', 值: 行.service_type },
    { key: '备注', 标签: '备注', 值: 行.remark },
  ]
  复制选中字段.value = ['姓名', '手机号', '地址']
  显示复制面板.value = true
}

// 生成复制文本
const 生成复制文本 = () => {
  if (!当前复制行.value) return ''
  const 标签映射 = {
    姓名: '姓名', 手机号: '手机', 地址: '地址',
    订单号: '订单号', 卡密: '卡密', 预约时间: '预约时间',
    服务类型: '服务类型', 备注: '备注',
  }
  return 复制字段列表.value
    .filter(字段 => 复制选中字段.value.includes(字段.key) && 字段.值)
    .map(字段 => `${标签映射[字段.key] || 字段.key}：${字段.值}`)
    .join('\n')
}

// 确认复制到剪贴板
const 确认复制 = async () => {
  const 文本 = 生成复制文本()
  if (!文本) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  try {
    await navigator.clipboard.writeText(文本)
    ElMessage.success('已复制到剪贴板')
    显示复制面板.value = false
  } catch {
    // 降级方案
    const 临时输入框 = document.createElement('textarea')
    临时输入框.value = 文本
    document.body.appendChild(临时输入框)
    临时输入框.select()
    document.execCommand('copy')
    document.body.removeChild(临时输入框)
    ElMessage.success('已复制到剪贴板')
    显示复制面板.value = false
  }
}

onMounted(() => 加载订单())
</script>

<style scoped>
.搜索卡片 { margin-bottom: 16px; }
.分页器 { margin-top: 16px; display: flex; justify-content: flex-end; }

/* 查看原因链接样式 */
.查看原因链接 {
  margin-left: 6px;
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}
.查看原因链接:hover { color: #66b1ff; }

/* 复制面板样式 */
.复制面板 { padding: 0 4px; }
.复制说明 { color: #666; margin-bottom: 12px; font-size: 14px; }
.复制字段项 { margin-bottom: 10px; }
.字段值预览 {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}
.复制预览 { margin-top: 16px; border-top: 1px solid #eee; padding-top: 12px; }
.预览标题 { color: #666; font-size: 13px; margin-bottom: 8px; }
.预览内容 {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 13px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  min-height: 60px;
  font-family: inherit;
}
</style>
