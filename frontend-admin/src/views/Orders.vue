<template>
  <!-- 订单管理页面 -->
  <div class="订单管理">
    <!-- 一键打开家政前端 -->
    <el-card class="顶部操作栏" style="margin-bottom: 12px">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
        <el-button type="primary" size="large" @click="打开家政前端">
          🌐 预览家政前端页面
        </el-button>
        <span v-if="预览链接" style="font-size:13px; color:#409eff">
          {{ 预览链接 }}
          <el-button link @click="复制预览链接">复制</el-button>
        </span>
        <span style="font-size:12px; color:#999">自动使用一个未使用的演示卡密打开前端</span>
        <el-button type="danger" plain size="large" @click="打开卡密作废弹窗">
          🚫 卡密作废
        </el-button>
      </div>
    </el-card>

    <!-- 卡密作废弹窗 -->
    <el-dialog v-model="显示卡密作废弹窗" title="🚫 卡密作废" width="760px" :close-on-click-modal="false">
      <div style="margin-bottom:12px; display:flex; gap:8px">
        <el-input
          v-model="卡密搜索关键词"
          placeholder="输入卡密码（支持模糊匹配）"
          clearable
          style="flex:1"
          @keyup.enter="搜索卡密"
        />
        <el-button type="primary" @click="搜索卡密" :loading="卡密搜索中">搜索</el-button>
      </div>
      <el-table :data="卡密搜索结果" v-loading="卡密搜索中" stripe empty-text="暂无数据，请输入卡密码搜索">
        <el-table-column prop="code" label="卡密码" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'primary' : row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 0 ? '未使用' : row.status === 1 ? '已使用' : '已失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="service_type" label="服务类型" width="120" />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-' }}</template>
        </el-table-column>
        <el-table-column label="关联订单号" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-tooltip :content="row.status === 1 ? '已使用的卡密不可作废' : row.status === 2 ? '已失效的卡密不可再次作废' : ''" :disabled="row.status === 0">
              <span>
                <el-button
                  type="danger"
                  plain
                  size="small"
                  :disabled="row.status !== 0"
                  @click="确认作废卡密(row)"
                >作废</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="显示卡密作废弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 搜索筛选 -->
    <el-card class="搜索卡片">
      <el-form :inline="true" :model="搜索条件">
        <el-form-item label="关键词">
          <!-- placeholder 更新为包含"备注"的提示 -->
          <el-input v-model="搜索条件.keyword" placeholder="订单号/姓名/手机号/备注" clearable style="width: 200px" />
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
          <!-- 导出当前筛选条件下的订单为CSV文件 -->
          <el-button type="success" @click="导出订单" :loading="导出中">导出CSV</el-button>
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
        <!-- 预约时间列：有多选时间则分行显示，否则显示单次时间 -->
        <el-table-column label="预约时间" width="180">
          <template #default="{ row }">
            <template v-if="解析多选时间(row.visit_times).length > 0">
              <div
                v-for="(项, 索引) in 解析多选时间(row.visit_times)"
                :key="索引"
                class="多选时间行"
                :class="索引 === 0 ? '优先时间' : '备选时间'"
              >
                <span class="优先级图标">{{ ['🥇','🥈','🥉'][索引] || `${索引+1}.` }}</span>
                {{ 项.date }} {{ 项.time }}
                <span v-if="索引 === 0" class="优先标签">优先</span>
                <span v-else class="备选标签">备选</span>
              </div>
            </template>
            <template v-else>
              {{ row.visit_date }} {{ row.visit_time }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="card_code" label="卡密" width="160" />
        <!-- 备注列：显示摘要（最多20字），有备注时显示📝图标 -->
        <el-table-column label="备注" width="140">
          <template #default="{ row }">
            <span v-if="row.remark" class="备注摘要">
              <span class="备注图标">📝</span>
              {{ row.remark.length > 20 ? row.remark.substring(0, 20) + '…' : row.remark }}
            </span>
            <span v-else class="无备注">-</span>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="查看详情(row.id)">详情</el-button>
            <!-- 备注快速编辑按钮 -->
            <el-button size="small" type="info" plain @click="打开备注弹窗(row)">备注</el-button>
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

    <!-- 快速编辑备注弹窗 -->
    <el-dialog v-model="显示备注弹窗" title="编辑备注" width="460px" :close-on-click-modal="false">
      <div class="备注弹窗内容">
        <!-- 快捷标签区 -->
        <p class="快捷标签标题">快捷追加：</p>
        <div class="快捷标签列表">
          <el-tag
            v-for="标签 in 快捷备注标签"
            :key="标签"
            class="快捷标签"
            type="info"
            effect="plain"
            style="cursor: pointer; margin: 4px"
            @click="追加快捷标签(标签)"
          >{{ 标签 }}</el-tag>
        </div>
        <!-- 备注输入框 -->
        <el-input
          v-model="备注表单.内容"
          type="textarea"
          :rows="4"
          placeholder="请输入备注内容（点击上方标签可快速追加）"
          style="margin-top: 12px"
        />
      </div>
      <template #footer>
        <el-button @click="显示备注弹窗 = false">取消</el-button>
        <el-button @click="清空备注">清空</el-button>
        <el-button type="primary" :loading="备注保存中" @click="保存备注">保存备注</el-button>
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
import { 获取订单列表API, 更新订单状态API, 触发自动下单API, 重置订单API, 更新订单备注API, 获取设置API, 获取家政预览卡密API, 导出家政订单API, 订单页搜索家政卡密API, 作废卡密API } from '../api/index'

const router = useRouter()
const route = useRoute()

// 站点域名
const 站点域名 = ref('')
const 预览链接 = ref('')

// 打开家政前端（获取一个未使用的家政卡密）
const 打开家政前端 = async () => {
  try {
    const 结果 = await 获取家政预览卡密API()
    if (结果.code === 1 && 结果.data?.code) {
      const 链接 = `${站点域名.value || ''}/${结果.data.code}`
      预览链接.value = 链接
      window.open(链接, '_blank')
    } else {
      ElMessage.warning(结果.message || '请先生成家政卡密')
    }
  } catch {
    ElMessage.error('获取预览卡密失败，请重试')
  }
}

// 复制预览链接
const 复制预览链接 = async () => {
  if (!预览链接.value) return
  try {
    await navigator.clipboard.writeText(预览链接.value)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// 业务类型（从路由参数读取，默认 jiazheng）
const 业务类型 = computed(() => route.params.businessType || 'jiazheng')
const 是洗衣服务 = computed(() => 业务类型.value === 'xiyifu')

const 加载中 = ref(false)
const 导出中 = ref(false)  // 导出订单时的loading状态
const 订单列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)

// 卡密作废弹窗
const 显示卡密作废弹窗 = ref(false)
const 卡密搜索关键词 = ref('')
const 卡密搜索结果 = ref([])
const 卡密搜索中 = ref(false)

const 打开卡密作废弹窗 = () => {
  卡密搜索关键词.value = ''
  卡密搜索结果.value = []
  显示卡密作废弹窗.value = true
}

const 搜索卡密 = async () => {
  if (!卡密搜索关键词.value.trim()) {
    ElMessage.warning('请输入卡密码')
    return
  }
  卡密搜索中.value = true
  try {
    const 结果 = await 订单页搜索家政卡密API(卡密搜索关键词.value.trim())
    if (结果.code === 1) {
      卡密搜索结果.value = 结果.data || []
      if (卡密搜索结果.value.length === 0) ElMessage.info('未找到匹配的卡密')
    } else {
      ElMessage.warning(结果.message || '搜索失败')
    }
  } catch {
    ElMessage.error('搜索卡密失败，请重试')
  } finally {
    卡密搜索中.value = false
  }
}

const 确认作废卡密 = async (行) => {
  try {
    await ElMessageBox.confirm(
      `确定要作废卡密 ${行.code} 吗？作废后客户将无法使用该卡密，且操作不可逆。`,
      '确认作废',
      { confirmButtonText: '确认作废', cancelButtonText: '取消', type: 'warning' }
    )
    const 结果 = await 作废卡密API(行.id)
    if (结果.code === 1) {
      ElMessage.success(`卡密 ${行.code} 已作废`)
      卡密搜索结果.value = []
      加载订单()
    } else {
      ElMessage.warning(结果.message || '作废失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('作废失败，请重试')
  }
}

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

// ===== 快速备注弹窗 =====
const 显示备注弹窗 = ref(false)      // 控制备注弹窗显示
const 当前备注订单 = ref(null)        // 当前正在编辑备注的订单
const 备注保存中 = ref(false)         // 备注保存中标志
const 备注表单 = ref({ 内容: '' })   // 备注输入内容

// 快捷备注标签列表（点击一键追加）
const 快捷备注标签 = ['已联系客户', '需改期', '客户催单', '特殊要求', '已安排师傅', '客户已确认']

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

/**
 * 解析多选时间JSON字符串为数组
 * @param {string} visitTimes - JSON字符串
 * @returns {Array} 时间数组（排序后）
 */
const 解析多选时间 = (visitTimes) => {
  if (!visitTimes) return []
  try {
    const 列表 = JSON.parse(visitTimes)
    if (!Array.isArray(列表) || 列表.length === 0) return []
    // 按优先级排序
    return [...列表].sort((a, b) => (a.priority || 0) - (b.priority || 0))
  } catch {
    return []
  }
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

/**
 * 导出订单为CSV文件（携带当前所有筛选条件）
 * 通过axios携带Token认证后触发浏览器下载
 */
const 导出订单 = async () => {
  导出中.value = true
  try {
    // 构建与加载列表相同的查询参数（不包含分页）
    const 查询参数 = { ...搜索条件.value }
    if (日期范围.value && 日期范围.value.length === 2) {
      查询参数.date_start = 日期范围.value[0]
      查询参数.date_end = 日期范围.value[1]
    }
    const blob = await 导出家政订单API(查询参数)
    // 创建临时下载链接触发浏览器下载
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8' }))
    const 链接 = document.createElement('a')
    链接.href = url
    链接.setAttribute('download', `家政订单_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`)
    document.body.appendChild(链接)
    链接.click()
    document.body.removeChild(链接)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败，请重试')
  } finally {
    导出中.value = false
  }
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

/**
 * 打开快速备注弹窗
 * @param {Object} 行 - 订单数据行
 */
const 打开备注弹窗 = (行) => {
  当前备注订单.value = 行
  备注表单.value.内容 = 行.remark || ''
  显示备注弹窗.value = true
}

/**
 * 快捷标签追加到备注内容
 * 使用中文分号（；）作为分隔符，与用户可能输入的英文分号区分
 * @param {string} 标签文字 - 快捷标签文字
 */
const 追加快捷标签 = (标签文字) => {
  const 当前内容 = 备注表单.value.内容
  // 已有内容时用分号分隔，否则直接填入
  备注表单.value.内容 = 当前内容 ? `${当前内容}；${标签文字}` : 标签文字
}

// 清空备注输入
const 清空备注 = () => {
  备注表单.value.内容 = ''
}

// 保存备注（调用API）
const 保存备注 = async () => {
  if (!当前备注订单.value) return
  备注保存中.value = true
  try {
    const 结果 = await 更新订单备注API(当前备注订单.value.id, 备注表单.value.内容)
    if (结果.code === 1) {
      ElMessage.success('备注保存成功')
      显示备注弹窗.value = false
      加载订单() // 刷新列表，更新备注列显示
    } else {
      ElMessage.warning(结果.message)
    }
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    备注保存中.value = false
  }
}

// 打开复制面板
const 打开复制面板 = (行) => {
  当前复制行.value = 行
  // 构建完整地址（包含街道）
  const 完整地址 = [行.province, 行.city, 行.district, 行.street, 行.address].filter(Boolean).join(' ')
  // 构建预约时间显示文字（有多选则显示第一优先时间）
  const 多选列表 = 解析多选时间(行.visit_times)
  const 预约时间文字 = 多选列表.length > 0
    ? `${多选列表[0].date} ${多选列表[0].time}（优先）`
    : `${行.visit_date || ''} ${行.visit_time || ''}`.trim()
  // 构建字段列表（默认勾选：姓名、手机号、地址）
  复制字段列表.value = [
    { key: '姓名', 标签: '姓名', 值: 行.name },
    { key: '手机号', 标签: '手机号', 值: 行.phone },
    { key: '地址', 标签: '完整地址', 值: 完整地址 },
    { key: '订单号', 标签: '订单号', 值: 行.order_no },
    { key: '卡密', 标签: '卡密', 值: 行.card_code },
    { key: '预约时间', 标签: '预约时间', 值: 预约时间文字 },
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

onMounted(() => {
  获取设置API().then(结果 => {
    if (结果.code === 1) 站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
  }).catch(() => {})
  加载订单()
})
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

/* 备注摘要列样式 */
.备注摘要 {
  font-size: 12px;
  color: #555;
  display: flex;
  align-items: flex-start;
  gap: 2px;
  word-break: break-all;
  line-height: 1.4;
}
.备注图标 { flex-shrink: 0; }
.无备注 { color: #ccc; font-size: 12px; }

/* 多选时间行样式 */
.多选时间行 {
  font-size: 12px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 3px;
}
.优先时间 { color: #e54635; font-weight: 500; }
.备选时间 { color: #999; }
.优先级图标 { font-size: 14px; }
.优先标签 {
  font-size: 10px;
  background: #fff0ee;
  color: #e54635;
  border-radius: 3px;
  padding: 0 4px;
  flex-shrink: 0;
}
.备选标签 {
  font-size: 10px;
  background: #f5f5f5;
  color: #999;
  border-radius: 3px;
  padding: 0 4px;
  flex-shrink: 0;
}

/* 备注弹窗内容 */
.备注弹窗内容 { padding: 0 4px; }
.快捷标签标题 { color: #666; font-size: 13px; margin-bottom: 6px; }
.快捷标签列表 { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
.快捷标签:hover { background: #ecf5ff; border-color: #409eff; }

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
