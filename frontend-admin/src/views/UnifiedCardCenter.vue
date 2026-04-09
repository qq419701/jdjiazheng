<template>
  <!-- 统一卡密中心页面 -->
  <div class="统一卡密中心">

    <!-- 顶部统计总览 -->
    <el-row :gutter="12" style="margin-bottom: 16px">
      <el-col :xs="24" :sm="8" v-for="(业务, 键) in 业务列表" :key="键">
        <el-card class="统计卡片" :style="{ borderTop: `3px solid ${业务.颜色}` }">
          <div class="统计卡片标题">
            <span :style="{ color: 业务.颜色 }">{{ 业务.名称 }}</span>
          </div>
          <el-row :gutter="8" style="margin-top: 8px">
            <el-col :span="6">
              <el-statistic title="总计" :value="统计数据[键]?.total || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="未使用" :value="统计数据[键]?.unused || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已使用" :value="统计数据[键]?.used || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已失效" :value="统计数据[键]?.expired || 0" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- Tab 主体 -->
    <el-tabs v-model="当前标签" type="border-card">

      <!-- ===== Tab1: 统一生成 ===== -->
      <el-tab-pane label="统一生成" name="generate">
        <el-form :model="生成表单" label-width="110px" style="max-width: 700px">

          <!-- 第一步：选择业务类型 -->
          <el-form-item label="第一步：业务类型" required>
            <el-radio-group v-model="生成表单.business_type" @change="切换业务类型">
              <el-radio-button value="jiazheng">🏠 家政</el-radio-button>
              <el-radio-button value="xiyifu">🧺 洗衣</el-radio-button>
              <el-radio-button value="topup">💳 充值</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 第二步：关联SUP商品（可选） -->
          <el-form-item label="第二步：关联商品">
            <el-select
              v-model="生成表单.product_id"
              clearable
              placeholder="可选，选择后自动填充字段"
              style="width: 100%"
              @change="选择商品后自动填充"
              v-loading="商品加载中"
            >
              <el-option
                v-for="商品 in 可选商品列表"
                :key="商品.id"
                :label="`[${商品.product_no}] ${商品.product_name}`"
                :value="商品.id"
              />
            </el-select>
            <div style="color: #999; font-size: 12px; margin-top: 4px" v-if="可选商品列表.length === 0 && !商品加载中">
              暂无该业务类型的商品，可前往
              <el-link type="primary" @click="$router.push('/admin/products')">商品管理</el-link>
              创建
            </div>
          </el-form-item>

          <!-- 第三步：动态表单（根据业务类型显示不同字段） -->
          <template v-if="生成表单.business_type === 'jiazheng'">
            <el-form-item label="第三步：服务分类">
              <el-input v-model="生成表单.category" placeholder="如：日常保洁" />
            </el-form-item>
            <el-form-item label="服务类型">
              <el-input v-model="生成表单.service_type" placeholder="如：日常保洁" />
            </el-form-item>
            <el-form-item label="服务时长（小时）">
              <el-input-number v-model="生成表单.service_hours" :min="1" :max="24" />
            </el-form-item>
          </template>

          <template v-else-if="生成表单.business_type === 'xiyifu'">
            <el-form-item label="第三步：商品名称">
              <el-input v-model="生成表单.service_type" placeholder="如：任洗一件" />
            </el-form-item>
          </template>

          <template v-else-if="生成表单.business_type === 'topup'">
            <el-form-item label="第三步：账号类型">
              <el-select v-model="生成表单.topup_account_type" style="width: 100%">
                <el-option label="手机号" value="phone" />
                <el-option label="微信号" value="wechat" />
                <el-option label="QQ号" value="qq" />
                <el-option label="邮箱" value="email" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="输入框标签">
              <el-input v-model="生成表单.topup_account_label" placeholder="如：请输入手机号" />
            </el-form-item>
            <el-form-item label="会员名称">
              <el-input v-model="生成表单.topup_member_name" placeholder="如：优酷年卡" />
            </el-form-item>
            <el-form-item label="图标URL（可选）">
              <el-input v-model="生成表单.topup_member_icon" placeholder="https://..." clearable />
            </el-form-item>
            <el-form-item label="到账时间">
              <el-input v-model="生成表单.topup_arrival_time" placeholder="如：1-6小时" />
            </el-form-item>
            <el-form-item label="显示到期选项">
              <el-switch v-model="生成表单.topup_show_expired" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="步骤说明">
              <el-input v-model="生成表单.topup_steps" type="textarea" :rows="3" placeholder="如：①填写充值账号 ②等待客服联系 ③充值成功" />
            </el-form-item>
            <el-form-item label="自定义正则（可选）">
              <el-input v-model="生成表单.topup_account_regex" placeholder="如：^\\d{11}$" clearable />
            </el-form-item>
            <el-form-item label="验证失败提示（可选）">
              <el-input v-model="生成表单.topup_account_error_msg" placeholder="如：请输入正确的手机号" clearable />
            </el-form-item>
          </template>

          <!-- 第四步：数量/备注/过期时间 -->
          <el-form-item label="第四步：生成数量">
            <el-input-number v-model="生成表单.count" :min="1" :max="1000" />
            <span style="margin-left: 8px; color: #999">张（最多1000）</span>
          </el-form-item>
          <el-form-item label="批次备注（可选）">
            <el-input v-model="生成表单.remark" placeholder="可选" clearable />
          </el-form-item>
          <el-form-item label="过期时间（可选）">
            <el-date-picker
              v-model="生成表单.expired_at"
              type="datetime"
              placeholder="不设置则永久有效"
              value-format="YYYY-MM-DD HH:mm:ss"
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="生成中" @click="点击生成">
              批量生成卡密
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 生成结果展示 -->
        <el-card v-if="生成结果" style="margin-top: 16px; background: #f0fdf4; border-color: #86efac">
          <div style="font-weight: 600; margin-bottom: 12px">
            ✅ 生成成功！批次号：<code>{{ 生成结果.batch_no }}</code>，共 {{ 生成结果.codes.length }} 个卡密
          </div>
          <div style="margin-bottom: 10px">
            <el-tag size="small" style="margin-right: 8px">{{ 当前业务名称 }}</el-tag>
            <span style="color: #666; font-size: 13px">链接前缀：{{ 当前链接前缀 }}</span>
          </div>
          <div style="font-size: 13px; color: #374151; line-height: 1.8; max-height: 240px; overflow-y: auto; background: white; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb; margin-bottom: 10px">
            <div v-for="(码, i) in 显示卡密列表" :key="i">{{ 当前链接前缀 }}{{ 码 }}</div>
            <div v-if="生成结果.codes.length > 20" style="color: #999; text-align: center; margin-top: 4px">
              ... 还有 {{ 生成结果.codes.length - 20 }} 个未显示
            </div>
          </div>
          <el-space>
            <el-button type="primary" size="small" @click="复制完整链接(生成结果.codes)">复制所有完整链接</el-button>
            <el-button size="small" @click="复制仅卡密(生成结果.codes)">复制仅卡密</el-button>
          </el-space>
        </el-card>
      </el-tab-pane>

      <!-- ===== Tab2: 统一列表 ===== -->
      <el-tab-pane label="统一列表" name="list">
        <el-card class="操作栏" style="margin-bottom: 12px">
          <el-form :inline="true">
            <el-form-item label="业务类型">
              <el-select v-model="列表筛选.business_type" clearable placeholder="全部" style="width: 110px" @change="加载卡密列表">
                <el-option label="家政" value="jiazheng" />
                <el-option label="洗衣" value="xiyifu" />
                <el-option label="充值" value="topup" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="列表筛选.status" clearable placeholder="全部" style="width: 100px" @change="加载卡密列表">
                <el-option label="未使用" value="0" />
                <el-option label="已使用" value="1" />
                <el-option label="已失效" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="列表筛选.keyword" placeholder="卡密码/备注" clearable style="width: 180px" @keyup.enter="加载卡密列表" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="加载卡密列表">搜索</el-button>
              <el-button @click="重置列表筛选">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card>
          <el-table :data="卡密列表" v-loading="卡密加载中" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="卡密码" width="160">
              <template #default="{ row }">
                <code style="font-size: 13px">{{ row.code }}</code>
              </template>
            </el-table-column>
            <el-table-column label="完整链接" min-width="220">
              <template #default="{ row }">
                <el-text truncated style="max-width: 190px; font-size: 12px; color: #409eff">
                  {{ 站点地址 }}{{ row.link_prefix }}{{ row.code }}
                </el-text>
                <el-button link type="primary" size="small" @click="复制单个链接(row)" style="margin-left: 4px">复制</el-button>
              </template>
            </el-table-column>
            <el-table-column label="业务类型" width="90">
              <template #default="{ row }">
                <el-tag :type="业务类型Tag类型(row.business_type)" size="small">{{ 业务类型中文(row.business_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="服务/商品名称" width="130">
              <template #default="{ row }">
                {{ row.business_type === 'topup' ? (row.topup_member_name || '-') : (row.service_type || '-') }}
              </template>
            </el-table-column>
            <el-table-column label="SUP商品编号" width="120">
              <template #default="{ row }">
                <span style="font-size: 12px; color: #666">{{ row.sup_product_no || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="发货状态" width="90">
              <template #default="{ row }">
                <el-tag :type="发货状态Tag类型(row.sup_status)" size="small">{{ 发货状态中文(row.sup_status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="卡密状态" width="90">
              <template #default="{ row }">
                <el-tag :type="卡密状态Tag类型(row.status)" size="small">{{ 卡密状态中文(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="155">
              <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="warning" plain @click="作废卡密(row)" :disabled="row.status !== 0">作废</el-button>
                <el-button size="small" type="danger" plain @click="删除卡密(row)" :disabled="row.status === 1">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="当前页"
            v-model:page-size="每页数量"
            :total="卡密总数"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            style="margin-top: 16px; justify-content: flex-end"
            @current-change="加载卡密列表"
            @size-change="加载卡密列表"
          />
        </el-card>
      </el-tab-pane>

      <!-- ===== Tab3: 批次管理 ===== -->
      <el-tab-pane label="批次管理" name="batches">
        <el-card class="操作栏" style="margin-bottom: 12px">
          <el-form :inline="true">
            <el-form-item label="业务类型">
              <el-select v-model="批次筛选.business_type" clearable placeholder="全部" style="width: 110px" @change="加载批次列表">
                <el-option label="家政" value="jiazheng" />
                <el-option label="洗衣" value="xiyifu" />
                <el-option label="充值" value="topup" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="加载批次列表">搜索</el-button>
              <el-button @click="重置批次筛选">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card>
          <el-table :data="批次列表" v-loading="批次加载中" stripe>
            <el-table-column prop="batch_no" label="批次号" width="200" />
            <el-table-column label="业务类型" width="90">
              <template #default="{ row }">
                <el-tag :type="业务类型Tag类型(row.business_type)" size="small">{{ 业务类型中文(row.business_type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="商品名称" min-width="130">
              <template #default="{ row }">
                {{ row.business_type === 'topup' ? (row.topup_member_name || row.remark || '-') : (row.service_type || row.remark || '-') }}
              </template>
            </el-table-column>
            <el-table-column label="数量/已用/未用" width="150">
              <template #default="{ row }">
                <span>{{ row.actual_count || row.count }}</span>
                <span style="color: #999; margin: 0 3px">/</span>
                <span style="color: #67c23a">{{ row.used_count || 0 }}</span>
                <span style="color: #999; margin: 0 3px">/</span>
                <span style="color: #409eff">{{ row.unused_count || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="155">
              <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="340" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="打开批次详情(row)">查看卡密</el-button>
                <el-button size="small" type="primary" @click="复制批次完整链接(row)">复制完整链接</el-button>
                <el-button size="small" type="info" @click="复制批次仅卡密(row)">复制仅卡密</el-button>
                <el-button size="small" type="danger" @click="删除批次(row)">删除批次</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

    </el-tabs>

    <!-- 批次详情弹窗 -->
    <el-dialog
      v-model="批次详情弹窗"
      :title="`批次详情：${当前批次?.batch_no}`"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="当前批次" style="margin-bottom: 12px">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="业务类型">
            <el-tag :type="业务类型Tag类型(当前批次.business_type)" size="small">{{ 业务类型中文(当前批次.business_type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品名称">
            {{ 当前批次.business_type === 'topup' ? (当前批次.topup_member_name || '-') : (当前批次.service_type || '-') }}
          </el-descriptions-item>
          <el-descriptions-item label="总数/已用/未用">
            {{ 当前批次.actual_count || 当前批次.count }} / {{ 当前批次.used_count || 0 }} / {{ 当前批次.unused_count || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ 格式化北京时间(当前批次.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ 当前批次.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div style="max-height: 320px; overflow-y: auto; background: #f9fafb; padding: 8px; border-radius: 4px; font-size: 13px; line-height: 1.9">
        <div v-if="批次卡密加载中" style="text-align: center; color: #999">加载中...</div>
        <div v-else-if="批次卡密列表.length === 0" style="text-align: center; color: #999">暂无卡密记录</div>
        <div v-for="(卡密, i) in 批次卡密列表" :key="卡密.id">
          <span style="color: #999; margin-right: 6px">{{ i + 1 }}.</span>
          <code>{{ 站点地址 }}{{ 获取链接前缀(当前批次?.business_type) }}{{ 卡密.code }}</code>
          <el-tag size="small" :type="卡密状态Tag类型(卡密.status)" style="margin-left: 8px">{{ 卡密状态中文(卡密.status) }}</el-tag>
        </div>
      </div>

      <template #footer>
        <el-button @click="批次详情弹窗 = false">关闭</el-button>
        <el-button type="primary" @click="复制批次完整链接(当前批次)">复制完整链接</el-button>
        <el-button @click="复制批次仅卡密(当前批次)">复制仅卡密</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  统一获取卡密列表API,
  统一获取批次列表API,
  统一获取卡密统计API,
  获取商品列表API,
  获取批次卡密API,
  删除批次API,
  删除洗衣批次API,
  删除充值批次API,
  作废卡密API,
  作废洗衣卡密API,
  作废充值卡密API,
  删除卡密API,
  删除洗衣卡密API,
  删除充值卡密API,
  生成卡密API,
  生成洗衣卡密API,
  生成充值卡密API,
  获取设置API,
} from '../api/index'

// ===== 状态变量 =====
const 当前标签 = ref('generate')
const 站点地址 = ref('')
const 统计数据 = ref({ jiazheng: {}, xiyifu: {}, topup: {} })

// 业务列表定义
const 业务列表 = {
  jiazheng: { 名称: '京东家政', 颜色: '#67c23a' },
  xiyifu: { 名称: '鲸蚁洗衣', 颜色: '#409eff' },
  topup: { 名称: '会员充值', 颜色: '#e6a23c' },
}

// ===== 生成表单 =====
const 生成表单初始值 = () => ({
  business_type: 'jiazheng',
  product_id: null,
  category: '日常保洁',
  service_type: '日常保洁',
  service_hours: 2,
  topup_account_type: 'phone',
  topup_account_label: '请输入手机号',
  topup_member_name: '',
  topup_member_icon: '',
  topup_arrival_time: '1-6小时',
  topup_show_expired: 0,
  topup_steps: '',
  topup_account_regex: '',
  topup_account_error_msg: '',
  count: 10,
  remark: '',
  expired_at: null,
})
const 生成表单 = ref(生成表单初始值())
const 生成中 = ref(false)
const 生成结果 = ref(null)
const 商品加载中 = ref(false)
const 可选商品列表 = ref([])

// ===== 统一列表 =====
const 卡密列表 = ref([])
const 卡密加载中 = ref(false)
const 卡密总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)
const 列表筛选 = ref({ business_type: '', status: '', keyword: '' })

// ===== 批次管理 =====
const 批次列表 = ref([])
const 批次加载中 = ref(false)
const 批次筛选 = ref({ business_type: '' })
const 批次详情弹窗 = ref(false)
const 当前批次 = ref(null)
const 批次卡密列表 = ref([])
const 批次卡密加载中 = ref(false)

// ===== 计算属性 =====
const 当前业务名称 = computed(() => 业务列表[生成表单.value.business_type]?.名称 || '')
const 当前链接前缀 = computed(() => `${站点地址.value}${获取链接前缀(生成表单.value.business_type)}`)
const 显示卡密列表 = computed(() => (生成结果.value?.codes || []).slice(0, 20))

// ===== 工具函数 =====
const 获取链接前缀 = (业务类型) => {
  if (业务类型 === 'xiyifu') return '/xi/'
  if (业务类型 === 'topup') return '/cz/'
  return '/'
}

const 业务类型中文 = (类型) => {
  if (类型 === 'jiazheng') return '家政'
  if (类型 === 'xiyifu') return '洗衣'
  if (类型 === 'topup') return '充值'
  return 类型 || '-'
}

const 业务类型Tag类型 = (类型) => {
  if (类型 === 'xiyifu') return 'primary'
  if (类型 === 'topup') return 'warning'
  return 'success'
}

const 卡密状态中文 = (状态) => {
  if (状态 === 0) return '未使用'
  if (状态 === 1) return '已使用'
  if (状态 === 2) return '已失效'
  return '-'
}

const 卡密状态Tag类型 = (状态) => {
  if (状态 === 0) return 'success'
  if (状态 === 1) return 'info'
  if (状态 === 2) return 'danger'
  return ''
}

const 发货状态中文 = (状态) => {
  if (状态 === 0) return '未发货'
  if (状态 === 1) return '已发货'
  if (状态 === 2) return '已撤单'
  return '-'
}

const 发货状态Tag类型 = (状态) => {
  if (状态 === 0) return 'info'
  if (状态 === 1) return 'success'
  if (状态 === 2) return 'danger'
  return ''
}

const 格式化北京时间 = (时间) => {
  if (!时间) return '-'
  return new Date(时间).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/\//g, '-')
}

// 兼容 HTTPS 和 HTTP 的复制函数
const 复制文字 = async (文字) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(文字)
    return
  }
  // 降级方案
  const 元素 = document.createElement('textarea')
  元素.value = 文字
  元素.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
  document.body.appendChild(元素)
  元素.select()
  const 成功 = document.execCommand('copy')
  document.body.removeChild(元素)
  if (!成功) throw new Error('复制失败，浏览器不支持')
}

// ===== 初始化 =====
const 初始化 = async () => {
  // 获取站点地址
  try {
    const 设置结果 = await 获取设置API()
    if (设置结果.data?.code === 1) {
      const 设置 = 设置结果.data.data
      站点地址.value = 设置.site_url || ''
    }
  } catch {}

  // 加载统计、卡密列表、批次列表
  加载统计数据()
  加载卡密列表()
  加载批次列表()
  加载商品列表()
}

const 加载统计数据 = async () => {
  try {
    const 结果 = await 统一获取卡密统计API()
    if (结果.data?.code === 1) {
      统计数据.value = 结果.data.data
    }
  } catch (错误) {
    console.error('加载统计数据失败:', 错误)
  }
}

// ===== 生成相关 =====
const 加载商品列表 = async () => {
  商品加载中.value = true
  try {
    const 结果 = await 获取商品列表API({ business_type: 生成表单.value.business_type, status: 1 })
    if (结果.data?.code === 1) {
      可选商品列表.value = 结果.data.data || []
    } else {
      可选商品列表.value = []
    }
  } catch {
    可选商品列表.value = []
  } finally {
    商品加载中.value = false
  }
}

const 切换业务类型 = () => {
  生成表单.value.product_id = null
  生成结果.value = null
  加载商品列表()
}

const 选择商品后自动填充 = (商品ID) => {
  if (!商品ID) return
  const 商品 = 可选商品列表.value.find(p => p.id === 商品ID)
  if (!商品) return
  if (生成表单.value.business_type === 'jiazheng') {
    if (商品.service_type) 生成表单.value.service_type = 商品.service_type
    if (商品.service_hours) 生成表单.value.service_hours = 商品.service_hours
  } else if (生成表单.value.business_type === 'xiyifu') {
    if (商品.service_type) 生成表单.value.service_type = 商品.service_type
  }
}

const 点击生成 = async () => {
  const 类型 = 生成表单.value.business_type
  if (!类型) return ElMessage.warning('请选择业务类型')
  if (生成表单.value.count < 1 || 生成表单.value.count > 1000) return ElMessage.warning('生成数量必须在1-1000之间')

  生成中.value = true
  生成结果.value = null
  try {
    let 结果
    if (类型 === 'jiazheng') {
      const { count, category, service_type, service_hours, remark, expired_at, product_id } = 生成表单.value
      结果 = await 生成卡密API({ count, category, service_type, service_hours, remark, expired_at, product_id, business_type: 'jiazheng' })
    } else if (类型 === 'xiyifu') {
      const { count, service_type, remark, expired_at, product_id } = 生成表单.value
      结果 = await 生成洗衣卡密API({ count, service_type, remark, expired_at, product_id })
    } else {
      const {
        count, remark, expired_at, product_id,
        topup_account_type, topup_account_label, topup_member_name, topup_member_icon,
        topup_arrival_time, topup_show_expired, topup_steps, topup_account_regex, topup_account_error_msg,
      } = 生成表单.value
      结果 = await 生成充值卡密API({
        count, remark, expired_at, product_id,
        topup_account_type, topup_account_label, topup_member_name, topup_member_icon,
        topup_arrival_time, topup_show_expired, topup_steps, topup_account_regex, topup_account_error_msg,
      })
    }
    if (结果.data?.code === 1) {
      生成结果.value = 结果.data.data
      ElMessage.success(结果.data.message || '生成成功')
      加载统计数据()
    } else {
      ElMessage.warning(结果.data?.message || '生成失败')
    }
  } catch {
    ElMessage.error('生成失败，请重试')
  } finally {
    生成中.value = false
  }
}

const 复制完整链接 = async (卡密列表) => {
  const 前缀 = 当前链接前缀.value
  const 文字 = 卡密列表.map(c => `${前缀}${c}`).join('\n')
  try {
    await 复制文字(文字)
    ElMessage.success(`已复制 ${卡密列表.length} 个完整链接`)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const 复制仅卡密 = async (卡密列表) => {
  const 文字 = 卡密列表.join('\n')
  try {
    await 复制文字(文字)
    ElMessage.success(`已复制 ${卡密列表.length} 个卡密`)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// ===== 统一列表相关 =====
const 加载卡密列表 = async () => {
  卡密加载中.value = true
  try {
    const 参数 = {
      page: 当前页.value,
      limit: 每页数量.value,
      ...列表筛选.value,
    }
    const 结果 = await 统一获取卡密列表API(参数)
    if (结果.data?.code === 1) {
      卡密列表.value = 结果.data.data.list || []
      卡密总数.value = 结果.data.data.total || 0
    }
  } catch (错误) {
    console.error('加载卡密列表失败:', 错误)
  } finally {
    卡密加载中.value = false
  }
}

const 重置列表筛选 = () => {
  列表筛选.value = { business_type: '', status: '', keyword: '' }
  当前页.value = 1
  加载卡密列表()
}

const 复制单个链接 = async (行) => {
  const 链接 = `${站点地址.value}${行.link_prefix}${行.code}`
  try {
    await 复制文字(链接)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

const 作废卡密 = async (行) => {
  try {
    await ElMessageBox.confirm(`确定要作废卡密 ${行.code} 吗？此操作不可逆`, '确认作废', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    let 结果
    if (行.business_type === 'xiyifu') 结果 = await 作废洗衣卡密API(行.id)
    else if (行.business_type === 'topup') 结果 = await 作废充值卡密API(行.id)
    else 结果 = await 作废卡密API(行.id)
    if (结果.data?.code === 1) {
      ElMessage.success('卡密已作废')
      加载卡密列表()
      加载统计数据()
    } else {
      ElMessage.warning(结果.data?.message || '作废失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const 删除卡密 = async (行) => {
  try {
    await ElMessageBox.confirm(`确定要删除卡密 ${行.code} 吗？`, '确认删除', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    let 结果
    if (行.business_type === 'xiyifu') 结果 = await 删除洗衣卡密API(行.id)
    else if (行.business_type === 'topup') 结果 = await 删除充值卡密API(行.id)
    else 结果 = await 删除卡密API(行.id)
    if (结果.data?.code === 1) {
      ElMessage.success('删除成功')
      加载卡密列表()
      加载统计数据()
    } else {
      ElMessage.warning(结果.data?.message || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// ===== 批次管理相关 =====
const 加载批次列表 = async () => {
  批次加载中.value = true
  try {
    const 结果 = await 统一获取批次列表API(批次筛选.value)
    if (结果.data?.code === 1) {
      批次列表.value = 结果.data.data || []
    }
  } catch (错误) {
    console.error('加载批次列表失败:', 错误)
  } finally {
    批次加载中.value = false
  }
}

const 重置批次筛选 = () => {
  批次筛选.value = { business_type: '' }
  加载批次列表()
}

const 打开批次详情 = async (批次) => {
  当前批次.value = 批次
  批次详情弹窗.value = true
  批次卡密列表.value = []
  批次卡密加载中.value = true
  try {
    const 结果 = await 获取批次卡密API(批次.id)
    if (结果.data?.code === 1) {
      批次卡密列表.value = 结果.data.data.卡密列表 || []
    }
  } catch {
    ElMessage.error('加载批次卡密失败')
  } finally {
    批次卡密加载中.value = false
  }
}

const 复制批次完整链接 = async (批次) => {
  if (!批次) return
  批次卡密加载中.value = true
  try {
    const 结果 = await 获取批次卡密API(批次.id)
    if (结果.data?.code === 1) {
      const 卡密s = 结果.data.data.卡密列表 || []
      const 前缀 = `${站点地址.value}${获取链接前缀(批次.business_type)}`
      const 文字 = 卡密s.map(c => `${前缀}${c.code}`).join('\n')
      await 复制文字(文字)
      ElMessage.success(`已复制 ${卡密s.length} 个完整链接`)
    }
  } catch {
    ElMessage.error('复制失败')
  } finally {
    批次卡密加载中.value = false
  }
}

const 复制批次仅卡密 = async (批次) => {
  if (!批次) return
  try {
    const 结果 = await 获取批次卡密API(批次.id)
    if (结果.data?.code === 1) {
      const 卡密s = 结果.data.data.卡密列表 || []
      const 文字 = 卡密s.map(c => c.code).join('\n')
      await 复制文字(文字)
      ElMessage.success(`已复制 ${卡密s.length} 个卡密`)
    }
  } catch {
    ElMessage.error('复制失败')
  }
}

const 删除批次 = async (批次) => {
  try {
    await ElMessageBox.confirm(
      `确定删除批次 ${批次.batch_no} 吗？已使用的卡密将保留，未使用的卡密将被删除。`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    )
    let 结果
    if (批次.business_type === 'xiyifu') 结果 = await 删除洗衣批次API(批次.id)
    else if (批次.business_type === 'topup') 结果 = await 删除充值批次API(批次.id)
    else 结果 = await 删除批次API(批次.id)
    if (结果.data?.code === 1) {
      ElMessage.success('批次已删除')
      加载批次列表()
      加载统计数据()
    } else {
      ElMessage.warning(结果.data?.message || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  初始化()
})
</script>

<style scoped>
.统一卡密中心 {
  padding: 0;
}

.统计卡片 {
  margin-bottom: 0;
}

.统计卡片标题 {
  font-size: 15px;
  font-weight: 600;
}

.操作栏 {
  margin-bottom: 12px;
}
</style>
