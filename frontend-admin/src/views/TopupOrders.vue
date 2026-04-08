<template>
  <!-- 充值订单管理页面 -->
  <div class="充值订单管理">

    <!-- 顶部操作栏 -->
    <el-card class="顶部操作栏" style="margin-bottom: 12px">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
        <el-button type="primary" size="large" @click="打开充值前端">
          🌐 预览充值前端页面
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
        <el-input v-model="卡密搜索关键词" placeholder="输入卡密码（支持模糊匹配）" clearable style="flex:1" @keyup.enter="搜索卡密" />
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
        <el-table-column prop="topup_member_name" label="充值会员" width="120" />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.created_at ? 格式化北京时间(row.created_at) : '-' }}</template>
        </el-table-column>
        <el-table-column label="关联订单号" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-tooltip :content="row.status === 1 ? '已使用的卡密不可作废' : row.status === 2 ? '已失效的卡密不可再次作废' : ''" :disabled="row.status === 0">
              <span>
                <el-button type="danger" plain size="small" :disabled="row.status !== 0" @click="确认作废卡密(row)">作废</el-button>
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
          <el-input v-model="搜索条件.keyword" placeholder="订单号/充值账号/卡密码/备注" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="搜索条件.city" placeholder="城市" clearable style="width: 100px" />
        </el-form-item>
        <el-form-item label="充值会员">
          <el-input v-model="搜索条件.member_name" placeholder="如：优酷年卡" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="搜索条件.status" clearable placeholder="全部状态" style="width: 120px">
            <el-option label="待处理" value="0" />
            <el-option label="已完成" value="2" />
            <el-option label="退款处理中" value="8" />
            <el-option label="已取消" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker v-model="日期范围" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="搜索订单">搜索</el-button>
          <el-button @click="重置筛选">重置</el-button>
          <el-button type="success" @click="导出订单" :loading="导出中">导出CSV</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单表格 -->
    <el-card>
      <el-table :data="订单列表" v-loading="加载中" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="创建时间" width="145">
          <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="充值账号" width="130">
          <template #default="{ row }">
            <el-tooltip v-if="row.topup_account" :content="row.topup_account" placement="top">
              <span class="账号脱敏">{{ 脱敏账号(row.topup_account, row.topup_account_type) }}</span>
            </el-tooltip>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="账号类型" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.topup_account_type" size="small" type="info">{{ 账号类型中文(row.topup_account_type) }}</el-tag>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="充值会员" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.topup_member_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="登录城市" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.login_city">{{ row.login_city }}</span>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="预计到账" width="100">
          <template #default="{ row }">{{ row.topup_arrival_time || '-' }}</template>
        </el-table-column>
        <el-table-column label="会员到期" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.topup_is_expired === 1" type="danger" size="small">已到期</el-tag>
            <el-tag v-else-if="row.topup_is_expired === 0" type="success" size="small">未到期</el-tag>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="card_code" label="卡密" width="160" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="获取状态类型(row.status)" size="small">{{ 获取状态文字(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" width="155">
          <template #default="{ row }">
            <template v-if="row.remark || (row.remark_images && JSON.parse(row.remark_images || '[]').length)">
              <el-popover v-if="解析备注图片(row.remark_images).length" placement="right" trigger="hover" width="320" :show-after="200">
                <template #reference>
                  <span class="备注摘要">
                    <span>📝🖼️</span>
                    <span v-if="row.remark">{{ row.remark.length > 10 ? row.remark.substring(0, 10) + '…' : row.remark }}</span>
                    <span v-else class="图片备注标签">{{ 解析备注图片(row.remark_images).length }}张图</span>
                  </span>
                </template>
                <div class="备注图片预览">
                  <div v-if="row.remark" class="备注预览文字">{{ row.remark }}</div>
                  <el-image v-for="(图片, 索引) in 解析备注图片(row.remark_images)" :key="索引" :src="图片" style="width:90px;height:90px;object-fit:cover;border-radius:4px;margin:4px" :preview-src-list="解析备注图片(row.remark_images)" :initial-index="索引" fit="cover" />
                </div>
              </el-popover>
              <span v-else-if="row.remark" class="备注摘要">
                <span>📝</span>
                {{ row.remark.length > 15 ? row.remark.substring(0, 15) + '…' : row.remark }}
              </span>
            </template>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="查看详情(row.id)">详情</el-button>
            <el-button size="small" type="info" plain @click="打开备注弹窗(row)">备注</el-button>
            <el-button v-if="row.status === 0" size="small" type="success" plain @click="标记完成(row)">标记完成</el-button>
            <el-button v-if="row.status !== 4 && row.status !== 8" size="small" type="warning" plain @click="申请退款(row)">申请退款</el-button>
            <el-button v-if="row.status === 8" size="small" type="danger" @click="确认退款完成(row)">确认退款完成</el-button>
            <el-button size="small" @click="复制订单信息(row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="当前页" v-model:page-size="每页数量" :total="总数" layout="total, prev, pager, next" class="分页器" @change="加载订单" />
    </el-card>

    <!-- 备注编辑弹窗 -->
    <el-dialog v-model="显示备注弹窗" title="编辑备注" width="520px" :close-on-click-modal="false">
      <div class="备注弹窗内容">
        <p class="快捷标签标题">快捷追加：</p>
        <div class="快捷标签列表">
          <el-tag v-for="标签 in 快捷备注标签" :key="标签" class="快捷标签" type="info" effect="plain" style="cursor: pointer; margin: 4px" @click="追加快捷标签(标签)">{{ 标签 }}</el-tag>
        </div>
        <el-input v-model="备注文本" type="textarea" :rows="3" placeholder="请输入备注内容（点击上方标签可快速追加）" style="margin-top: 12px" />
        <div class="备注图片区">
          <p class="快捷标签标题" style="margin-top:12px">备注图片（可选）：</p>
          <div v-if="备注图片列表.length" class="已上传图片列表">
            <div v-for="(图片, 索引) in 备注图片列表" :key="索引" class="已上传图片项">
              <el-image :src="图片" style="width:80px;height:80px;object-fit:cover;border-radius:4px" fit="cover" :preview-src-list="备注图片列表" :initial-index="索引" />
              <el-button class="删除图片按钮" type="danger" size="small" circle plain @click="删除备注图片(索引)">✕</el-button>
            </div>
          </div>
          <div class="图片上传区" :class="{ '拖拽悬停': 拖拽中 }" @dragover.prevent="拖拽中 = true" @dragleave.prevent="拖拽中 = false" @drop.prevent="处理拖拽上传" @paste.capture="处理粘贴上传">
            <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" multiple :on-change="处理文件选择上传">
              <div class="上传提示">
                <span>📷 点击选择 / 拖拽 / 粘贴图片</span>
                <span v-if="图片上传中" class="上传进度">上传中…</span>
              </div>
            </el-upload>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="显示备注弹窗 = false">取消</el-button>
        <el-button @click="清空备注">清空</el-button>
        <el-button type="primary" :loading="备注保存中" @click="保存备注">保存备注</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="显示详情弹窗" title="充值订单详情" width="700px">
      <template v-if="当前详情">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ 当前详情.order_no }}</el-descriptions-item>
          <el-descriptions-item label="卡密">{{ 当前详情.card_code }}</el-descriptions-item>
          <el-descriptions-item label="充值账号">{{ 当前详情.topup_account || '-' }}</el-descriptions-item>
          <el-descriptions-item label="账号类型">{{ 账号类型中文(当前详情.topup_account_type) }}</el-descriptions-item>
          <el-descriptions-item label="充值会员">{{ 当前详情.topup_member_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计到账时间">{{ 当前详情.topup_arrival_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="会员是否到期">
            <el-tag v-if="当前详情.topup_is_expired === 1" type="danger" size="small">已到期</el-tag>
            <el-tag v-else-if="当前详情.topup_is_expired === 0" type="success" size="small">未到期</el-tag>
            <span v-else class="无值">-（未填写/不适用）</span>
          </el-descriptions-item>
          <el-descriptions-item label="登录城市">{{ 当前详情.login_city || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录IP">{{ 当前详情.login_ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="获取状态类型(当前详情.status)" size="small">{{ 获取状态文字(当前详情.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ 格式化北京时间(当前详情.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ 当前详情.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 操作日志 -->
        <div v-if="当前详情.order_log?.length > 0" style="margin-top: 16px">
          <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px">操作日志</div>
          <el-timeline>
            <el-timeline-item
              v-for="(日志, 索引) in 当前详情.order_log"
              :key="索引"
              :type="日志.状态 === 'success' ? 'success' : (日志.状态 === 'error' ? 'danger' : 'primary')"
              :timestamp="日志.时间"
              placement="top"
            >{{ 日志.操作 }}</el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <template #footer>
        <el-button type="primary" @click="显示详情弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  获取充值订单列表API, 获取充值订单详情API,
  更新充值订单备注API, 上传备注图片API, 导出充值订单API,
  获取设置API, 获取充值预览卡密API,
  订单页搜索充值卡密API, 作废充值卡密API,
  更新充值订单状态API, 申请充值退款API, 确认充值退款完成API,
} from '../api/index'

// 格式化北京时间 YYYY-MM-DD HH:mm
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

// 解析备注图片
const 解析备注图片 = (imagesJson) => {
  if (!imagesJson) return []
  try { return JSON.parse(imagesJson) } catch { return [] }
}

// 账号类型转中文
const 账号类型中文 = (类型) => {
  const 映射 = { phone: '手机号', wechat: '微信号', qq: 'QQ号', email: '邮箱', other: '其他' }
  return 映射[类型] || 类型 || '-'
}

// 账号脱敏显示
const 脱敏账号 = (账号, 类型) => {
  if (!账号) return '-'
  if (类型 === 'phone' && 账号.length === 11) return `${账号.slice(0, 3)}****${账号.slice(7)}`
  if (账号.length > 6) return `${账号.slice(0, 3)}****${账号.slice(-2)}`
  return 账号
}

// 状态工具
const 获取状态类型 = (status) => {
  const 映射 = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'danger', 4: 'info', 8: 'warning' }
  return 映射[status] || 'info'
}
const 获取状态文字 = (status) => {
  const 映射 = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '失败', 4: '已取消', 8: '退款处理中' }
  return 映射[status] ?? `状态${status}`
}

// 站点域名
const 站点域名 = ref('')
const 预览链接 = ref('')

// 搜索
const 搜索条件 = ref({ keyword: '', city: '', member_name: '', status: '' })
const 日期范围 = ref(null)
const 加载中 = ref(false)
const 导出中 = ref(false)
const 订单列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)

// 卡密作废弹窗
const 显示卡密作废弹窗 = ref(false)
const 卡密搜索关键词 = ref('')
const 卡密搜索结果 = ref([])
const 卡密搜索中 = ref(false)

// 备注弹窗
const 显示备注弹窗 = ref(false)
const 备注文本 = ref('')
const 当前备注订单 = ref(null)
const 备注保存中 = ref(false)
const 备注图片列表 = ref([])
const 图片上传中 = ref(false)
const 拖拽中 = ref(false)

// 详情弹窗
const 显示详情弹窗 = ref(false)
const 当前详情 = ref(null)

// 充值订单专用快捷备注标签
const 快捷备注标签 = ['已联系客户', '充值成功', '充值失败', '账号有误', '会员未到期', '已退款', '客户催单']

onMounted(async () => {
  await 加载站点域名()
  await 加载订单()
})

const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) 站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
  } catch {}
}

const 加载订单 = async () => {
  加载中.value = true
  try {
    const 参数 = {
      page: 当前页.value,
      limit: 每页数量.value,
      keyword: 搜索条件.value.keyword,
      city: 搜索条件.value.city,
      status: 搜索条件.value.status,
    }
    if (日期范围.value?.length === 2) {
      参数.date_start = 日期范围.value[0]
      参数.date_end = 日期范围.value[1]
    }
    const 结果 = await 获取充值订单列表API(参数)
    if (结果.code === 1) {
      // 对包含order_log的数据进行解析
      订单列表.value = (结果.data.list || 结果.data.rows || []).map(订单 => ({
        ...订单,
        order_log: 安全解析JSON(订单.order_log, []),
      }))
      总数.value = 结果.data.total || 结果.data.count || 0
    }
  } catch {
    ElMessage.error('加载订单失败')
  } finally {
    加载中.value = false
  }
}

const 安全解析JSON = (str, 默认值) => {
  if (!str) return 默认值
  try { return JSON.parse(str) } catch { return 默认值 }
}

const 搜索订单 = () => {
  当前页.value = 1
  加载订单()
}

const 重置筛选 = () => {
  搜索条件.value = { keyword: '', city: '', member_name: '', status: '' }
  日期范围.value = null
  当前页.value = 1
  加载订单()
}

// 打开充值前端预览
const 打开卡密作废弹窗 = () => {
  卡密搜索关键词.value = ''
  卡密搜索结果.value = []
  显示卡密作废弹窗.value = true
}

const 打开充值前端 = async () => {
  try {
    const 结果 = await 获取充值预览卡密API()
    if (结果.code !== 1 || !结果.data?.code) {
      ElMessage.warning(结果.message || '暂无可用充值卡密')
      return
    }
    const 链接 = `${站点域名.value || ''}/cz/${结果.data.code}`
    预览链接.value = 链接
    window.open(链接, '_blank')
  } catch {
    ElMessage.error('获取预览卡密失败')
  }
}

const 复制预览链接 = () => {
  navigator.clipboard.writeText(预览链接.value).then(() => ElMessage.success('复制成功')).catch(() => ElMessage.error('复制失败'))
}

const 搜索卡密 = async () => {
  if (!卡密搜索关键词.value.trim()) { ElMessage.warning('请输入卡密码'); return }
  卡密搜索中.value = true
  try {
    const 结果 = await 订单页搜索充值卡密API(卡密搜索关键词.value.trim())
    if (结果.code === 1) {
      卡密搜索结果.value = 结果.data || []
      if (!卡密搜索结果.value.length) ElMessage.info('未找到匹配的卡密')
    } else {
      ElMessage.warning(结果.message || '搜索失败')
    }
  } catch { ElMessage.error('搜索失败') } finally { 卡密搜索中.value = false }
}

const 确认作废卡密 = async (行) => {
  try {
    await ElMessageBox.confirm(`确定要作废卡密 ${行.code} 吗？作废后不可逆。`, '确认作废', { confirmButtonText: '确认作废', cancelButtonText: '取消', type: 'warning' })
    const 结果 = await 作废充值卡密API(行.id)
    if (结果.code === 1) { ElMessage.success(`卡密 ${行.code} 已作废`); 卡密搜索结果.value = []; 加载订单() }
    else ElMessage.warning(结果.message || '作废失败')
  } catch (e) { if (e !== 'cancel') ElMessage.error('作废失败') }
}

// 标记完成
const 标记完成 = async (行) => {
  try {
    await ElMessageBox.confirm('确认将此充值订单标记为已完成？', '确认', { type: 'success' })
    const 结果 = await 更新充值订单状态API(行.id, { status: 2 })
    if (结果.code === 1) { ElMessage.success('已标记为完成'); 加载订单() }
    else ElMessage.warning(结果.message)
  } catch {}
}

// 申请退款
const 申请退款 = async (行) => {
  try {
    await ElMessageBox.confirm('申请退款后订单状态改为"退款处理中"，确认继续？', '申请退款', { type: 'warning' })
    const 结果 = await 申请充值退款API(行.id)
    if (结果.code === 1) {
      ElMessage.success('已申请退款')
      加载订单()
    } else ElMessage.warning(结果.message)
  } catch {}
}

// 确认退款完成
const 确认退款完成 = async (行) => {
  try {
    await ElMessageBox.confirm('确认退款完成后，卡密将被作废，订单状态改为"已取消"。确认继续？', '确认退款完成', { confirmButtonText: '确认退款完成', cancelButtonText: '取消', type: 'warning' })
    const 结果 = await 确认充值退款完成API(行.id)
    if (结果.code === 1) { ElMessage.success('退款完成，卡密已作废'); 加载订单() }
    else ElMessage.warning(结果.message)
  } catch {}
}

// 查看详情
const 查看详情 = async (id) => {
  try {
    const 结果 = await 获取充值订单详情API(id)
    if (结果.code === 1) {
      当前详情.value = {
        ...结果.data,
        order_log: 安全解析JSON(结果.data.order_log, []),
      }
      显示详情弹窗.value = true
    }
  } catch { ElMessage.error('获取详情失败') }
}

// 备注弹窗
const 打开备注弹窗 = (行) => {
  当前备注订单.value = 行
  备注文本.value = 行.remark || ''
  备注图片列表.value = 解析备注图片(行.remark_images)
  显示备注弹窗.value = true
}

const 追加快捷标签 = (标签) => {
  备注文本.value = 备注文本.value ? `${备注文本.value}；${标签}` : 标签
}

const 清空备注 = () => {
  备注文本.value = ''
  备注图片列表.value = []
}

const 删除备注图片 = (索引) => { 备注图片列表.value.splice(索引, 1) }

const 上传单张图片 = async (文件) => {
  图片上传中.value = true
  try {
    const formData = new FormData()
    formData.append('image', 文件)
    const 结果 = await 上传备注图片API(formData)
    if (结果.code === 1 && 结果.data?.url) {
      备注图片列表.value.push(结果.data.url)
    } else {
      ElMessage.warning(`图片上传失败：${结果.message || '未知错误'}`)
    }
  } catch { ElMessage.error('图片上传失败') } finally { 图片上传中.value = false }
}

const 处理文件选择上传 = (uploadFile) => {
  if (uploadFile?.raw) 上传单张图片(uploadFile.raw)
}

const 处理拖拽上传 = (event) => {
  拖拽中.value = false
  const files = event.dataTransfer?.files
  if (files?.length) Array.from(files).forEach(f => { if (f.type.startsWith('image/')) 上传单张图片(f) })
}

const 处理粘贴上传 = (event) => {
  const items = event.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (blob) { 上传单张图片(blob); event.preventDefault() }
    }
  }
}

const 保存备注 = async () => {
  备注保存中.value = true
  try {
    const 结果 = await 更新充值订单备注API(当前备注订单.value.id, {
      remark: 备注文本.value,
      remark_images: JSON.stringify(备注图片列表.value),
    })
    if (结果.code === 1) { ElMessage.success('备注保存成功'); 显示备注弹窗.value = false; 加载订单() }
    else ElMessage.warning(结果.message)
  } catch { ElMessage.error('保存失败') } finally { 备注保存中.value = false }
}

// 导出CSV
const 导出订单 = async () => {
  导出中.value = true
  try {
    const 参数 = {
      keyword: 搜索条件.value.keyword,
      city: 搜索条件.value.city,
      status: 搜索条件.value.status,
    }
    if (日期范围.value?.length === 2) {
      参数.date_start = 日期范围.value[0]
      参数.date_end = 日期范围.value[1]
    }
    const 响应 = await 导出充值订单API(参数)
    const url = window.URL.createObjectURL(new Blob([响应]))
    const a = document.createElement('a')
    a.href = url
    a.download = `充值订单_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch { ElMessage.error('导出失败') } finally { 导出中.value = false }
}

// 复制订单信息
const 复制订单信息 = (行) => {
  const 文本 = `充值订单：${行.order_no}\n充值账号：${行.topup_account || '-'}\n充值会员：${行.topup_member_name || '-'}\n预计到账：${行.topup_arrival_time || '-'}\n状态：${获取状态文字(行.status)}`
  navigator.clipboard.writeText(文本).then(() => ElMessage.success('已复制订单信息')).catch(() => ElMessage.error('复制失败'))
}
</script>

<style scoped>
.充值订单管理 { padding: 0; }
.分页器 { margin-top: 16px; justify-content: flex-end; }
.无值 { color: #bbb; font-size: 12px; }
.账号脱敏 { cursor: default; font-family: monospace; }
.备注摘要 { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: default; }
.图片备注标签 { color: #999; font-size: 12px; }
.快捷标签标题 { font-size: 13px; color: #666; margin-bottom: 4px; }
.快捷标签列表 { display: flex; flex-wrap: wrap; }
.备注图片区 { margin-top: 8px; }
.已上传图片列表 { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.已上传图片项 { position: relative; }
.删除图片按钮 { position: absolute; top: -8px; right: -8px; }
.图片上传区 { border: 2px dashed #ddd; border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.图片上传区:hover, .图片上传区.拖拽悬停 { border-color: #409eff; }
.上传提示 { display: flex; flex-direction: column; gap: 4px; color: #999; font-size: 13px; }
.上传进度 { color: #409eff; }
.备注图片预览 { max-width: 300px; }
.备注预览文字 { font-size: 13px; color: #333; margin-bottom: 8px; }
</style>

