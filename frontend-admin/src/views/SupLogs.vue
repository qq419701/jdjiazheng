<template>
  <div>
    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <el-card shadow="hover" style="text-align:center">
          <div style="font-size:28px;font-weight:700;color:#409eff">{{ stats.todayTotal }}</div>
          <div style="color:#888;margin-top:4px">今日总请求</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="text-align:center">
          <div style="font-size:28px;font-weight:700;color:#67c23a">{{ stats.todaySuccess }}</div>
          <div style="color:#888;margin-top:4px">今日成功</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="text-align:center">
          <div style="font-size:28px;font-weight:700;color:#e6a23c">{{ stats.todayPurchase }}</div>
          <div style="color:#888;margin-top:4px">今日下单</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="text-align:center">
          <div style="font-size:28px;font-weight:700;color:#f56c6c">{{ stats.todayCancel }}</div>
          <div style="color:#888;margin-top:4px">今日撤单</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 -->
    <el-card shadow="never" style="margin-bottom:16px">
      <el-form :inline="true" :model="筛选条件">
        <el-form-item label="日志类型">
          <el-select v-model="筛选条件.log_type" placeholder="全部" clearable style="width:150px">
            <el-option label="📦 卡密下单" value="createPurchase" />
            <el-option label="🚫 撤销订单" value="cancelOrder" />
            <el-option label="🔍 查询订单" value="queryOrder" />
            <el-option label="📞 异步回调" value="callback" />
            <el-option label="📋 商品列表" value="getList" />
            <el-option label="📄 商品模板" value="getTemplate" />
            <el-option label="🆔 获取AppID" value="getAppId" />
          </el-select>
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="筛选条件.result" placeholder="全部" clearable style="width:110px">
            <el-option label="✅ 成功" value="success" />
            <el-option label="❌ 失败" value="fail" />
            <el-option label="⏳ 处理中" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="电商单号">
          <el-input v-model="筛选条件.ecommerce_order_no" placeholder="电商平台订单号" clearable style="width:200px" @keyup.enter="查询" />
        </el-form-item>
        <el-form-item label="卡密">
          <el-input v-model="筛选条件.card_code" placeholder="关联卡密码" clearable style="width:160px" @keyup.enter="查询" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="筛选条件.dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width:230px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="查询">🔍 查询</el-button>
          <el-button @click="重置">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card shadow="never">
      <el-table :data="日志列表" stripe border v-loading="加载中" style="width:100%">
        <el-table-column label="时间" width="165">
          <template #default="{ row }">{{ 格式化时间(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="65" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag :type="类型颜色[row.log_type] || ''" size="small">{{ 类型名称[row.log_type] || row.log_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.result === 'success' ? 'success' : row.result === 'fail' ? 'danger' : 'warning'" size="small">
              {{ row.result === 'success' ? '✅ 成功' : row.result === 'fail' ? '❌ 失败' : '⏳ 处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="电商平台单号" min-width="185" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.ecommerce_order_no" style="color:#409eff">{{ row.ecommerce_order_no }}</span>
            <span v-else-if="row.order_no" style="color:#aaa">{{ row.order_no }}</span>
            <span v-else style="color:#ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="card_code" label="卡密" width="150" show-overflow-tooltip />
        <el-table-column prop="out_trade_no" label="outTradeNo" width="120" show-overflow-tooltip />
        <el-table-column prop="product_no" label="商品编号" width="90" />
        <el-table-column label="订单成本" width="100">
          <template #default="{ row }">
            <span v-if="row.order_cost != null && row.order_cost !== ''">¥{{ parseFloat(row.order_cost).toFixed(4) }}</span>
            <span v-else style="color:#ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.order_status === 20" type="success" size="small">已完成(20)</el-tag>
            <el-tag v-else-if="row.order_status === 10" type="warning" size="small">处理中(10)</el-tag>
            <el-tag v-else-if="row.order_status === 30" type="danger" size="small">失败(30)</el-tag>
            <span v-else style="color:#ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="撤单状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.cancel_status === 20" type="success" size="small">成功(20)</el-tag>
            <el-tag v-else-if="row.cancel_status === 30" type="danger" size="small">失败(30)</el-tag>
            <span v-else style="color:#ccc">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="error_msg" label="错误信息" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="75" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="查看详情(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <el-pagination v-model:current-page="当前页" v-model:page-size="每页数量"
          :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper"
          :total="总数量" @size-change="查询" @current-change="查询" />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="弹窗显示" title="📋 SUP日志详情" width="820px" destroy-on-close>
      <div v-if="当前详情">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="日志ID">{{ 当前详情.id }}</el-descriptions-item>
          <el-descriptions-item label="日志类型">{{ 类型名称[当前详情.log_type] || 当前详情.log_type }}</el-descriptions-item>
          <el-descriptions-item label="结果">{{ 当前详情.result }}</el-descriptions-item>
          <el-descriptions-item label="响应Code">{{ 当前详情.status_code }}</el-descriptions-item>
          <el-descriptions-item label="阿奇所订单号">{{ 当前详情.order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电商平台单号">{{ 当前详情.ecommerce_order_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="outTradeNo">{{ 当前详情.out_trade_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联卡密">{{ 当前详情.card_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="商品编号">{{ 当前详情.product_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="购买数量">{{ 当前详情.buy_num || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单成本">{{ 当前详情.order_cost != null ? '¥' + parseFloat(当前详情.order_cost).toFixed(4) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="userId">{{ 当前详情.user_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ 格式化时间(当前详情.created_at) }}</el-descriptions-item>
          <el-descriptions-item v-if="当前详情.error_msg" label="错误信息" :span="2">
            <span style="color:#f56c6c">{{ 当前详情.error_msg }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:14px">
          <div style="font-weight:600;font-size:13px;color:#555;margin-bottom:6px">📤 请求数据</div>
          <pre style="background:#f5f7fa;border:1px solid #e4e7ed;border-radius:4px;padding:10px;font-size:12px;max-height:220px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">{{ 格式化JSON(当前详情.request_data) }}</pre>
          <div style="font-weight:600;font-size:13px;color:#555;margin-bottom:6px;margin-top:12px">📥 响应数据</div>
          <pre style="background:#f5f7fa;border:1px solid #e4e7ed;border-radius:4px;padding:10px;font-size:12px;max-height:220px;overflow-y:auto;white-space:pre-wrap;word-break:break-all">{{ 格式化JSON(当前详情.response_data) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 获取SUP日志列表API, 获取SUP日志统计API } from '../api/index.js'

const 加载中 = ref(false)
const 日志列表 = ref([])
const 总数量 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)
const 弹窗显示 = ref(false)
const 当前详情 = ref(null)
const stats = ref({ todayTotal: 0, todaySuccess: 0, todayPurchase: 0, todayCancel: 0 })

const 筛选条件 = ref({ log_type: '', result: '', ecommerce_order_no: '', card_code: '', dateRange: [] })

const 类型名称 = {
  createPurchase: '📦 卡密下单',
  cancelOrder: '🚫 撤销订单',
  queryOrder: '🔍 查询订单',
  callback: '📞 异步回调',
  getList: '📋 商品列表',
  getTemplate: '📄 商品模板',
  getAppId: '🆔 获取AppID',
}
const 类型颜色 = {
  createPurchase: 'primary',
  cancelOrder: 'danger',
  queryOrder: '',
  callback: 'success',
  getList: 'info',
  getTemplate: 'info',
  getAppId: 'info',
}

const 查询 = async () => {
  加载中.value = true
  try {
    const params = {
      page: 当前页.value,
      pageSize: 每页数量.value,
    }
    if (筛选条件.value.log_type) params.log_type = 筛选条件.value.log_type
    if (筛选条件.value.result) params.result = 筛选条件.value.result
    if (筛选条件.value.ecommerce_order_no) params.ecommerce_order_no = 筛选条件.value.ecommerce_order_no
    if (筛选条件.value.card_code) params.card_code = 筛选条件.value.card_code
    if (筛选条件.value.dateRange?.[0]) params.start_date = 筛选条件.value.dateRange[0]
    if (筛选条件.value.dateRange?.[1]) params.end_date = 筛选条件.value.dateRange[1]
    const res = await 获取SUP日志列表API(params)
    if (res?.code === 1) {
      日志列表.value = res.data.items
      总数量.value = res.data.total
    }
  } finally {
    加载中.value = false
  }
}

const 加载统计 = async () => {
  try {
    const res = await 获取SUP日志统计API()
    if (res?.code === 1) stats.value = res.data
  } catch {
    // 统计接口失败时静默忽略，不影响主列表加载
  }
}

const 重置 = () => {
  筛选条件.value = { log_type: '', result: '', ecommerce_order_no: '', card_code: '', dateRange: [] }
  当前页.value = 1
  查询()
}

const 查看详情 = (row) => {
  当前详情.value = row
  弹窗显示.value = true
}

const 格式化时间 = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

const 格式化JSON = (str) => {
  if (!str) return ''
  try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str }
}

onMounted(() => {
  查询()
  加载统计()
})
</script>
