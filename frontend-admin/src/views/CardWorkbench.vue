<template>
  <!-- 卡密工作台 -->
  <div class="卡密工作台容器">
    <div class="页面标题">
      <h2>🎫 卡密工作台</h2>
      <p class="副标题">统一管理三业务卡密：生成、查询、批次记录</p>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="统计区" v-if="统计数据">
      <div
        v-for="业务 in 业务列表"
        :key="业务.type"
        class="统计卡片"
      >
        <div class="统计标题">{{ 业务.label }} 库存</div>
        <div class="统计数字">
          <span class="总数">{{ 获取统计(业务.type, 'total') }}</span>
          <span class="统计小字">总计</span>
        </div>
        <div class="统计细分">
          <span class="未使用">未用 {{ 获取统计(业务.type, 'unused') }}</span>
          <span class="已使用">已用 {{ 获取统计(业务.type, 'used') }}</span>
          <span class="已失效">失效 {{ 获取统计(业务.type, 'expired') }}</span>
        </div>
      </div>
    </div>

    <!-- 主Tab -->
    <el-tabs v-model="主Tab" type="border-card" @tab-change="主TabChange">

      <!-- ===== Tab1：生成卡密 ===== -->
      <el-tab-pane label="🎲 生成卡密" name="generate">
        <div class="生成区布局">
          <!-- 左侧套餐选择 -->
          <div class="套餐选择区">
            <div class="业务切换">
              <el-button-group>
                <el-button
                  v-for="业务 in 业务列表"
                  :key="业务.type"
                  :type="选中业务类型 === 业务.type ? 'primary' : ''"
                  @click="切换业务类型(业务.type)"
                >{{ 业务.label }}</el-button>
              </el-button-group>
            </div>

            <div class="套餐卡片列表" v-loading="套餐加载中">
              <div
                v-for="套餐 in 当前套餐列表"
                :key="套餐.id"
                class="套餐卡片"
                :class="{
                  '选中': 已选套餐?.id === 套餐.id,
                  '库存警告': (套餐.stock_unused ?? 0) > 0 && (套餐.stock_unused ?? 0) < 10,
                  '库存为零': (套餐.stock_unused ?? 0) === 0,
                }"
              >
                <div class="卡片主信息">
                  <span class="套餐名称">{{ 套餐.product_name }}</span>
                  <el-tag size="small" :type="库存标签样式(套餐.stock_unused)">
                    库存 {{ 套餐.stock_unused ?? 0 }}
                  </el-tag>
                </div>
                <div class="卡片副信息">
                  <span class="编号">SUP #{{ 套餐.product_no }}</span>
                </div>
                <el-button
                  size="small"
                  type="primary"
                  plain
                  @click="选择套餐(套餐)"
                  style="margin-top:8px;width:100%"
                >选择</el-button>
              </div>

              <div v-if="当前套餐列表.length === 0 && !套餐加载中" class="空状态">
                <p>暂无套餐</p>
              </div>
            </div>

            <div class="新建套餐入口">
              <el-button text type="primary" @click="$router.push('/admin/template-manager')">
                + 新建套餐
              </el-button>
            </div>
          </div>

          <!-- 右侧生成参数 -->
          <div class="生成参数区">
            <div v-if="!已选套餐" class="未选提示">
              <el-icon class="提示图标"><Ticket /></el-icon>
              <p>请先从左侧选择一个套餐</p>
            </div>

            <template v-else>
              <!-- 已选套餐信息 -->
              <el-card class="已选套餐卡片" shadow="never">
                <div class="已选套餐信息">
                  <div class="已选行"><label>套餐名称：</label><span>{{ 已选套餐.product_name }}</span></div>
                  <div class="已选行"><label>SUP编号：</label><span>#{{ 已选套餐.product_no }}</span></div>
                  <div class="已选行">
                    <label>业务类型：</label>
                    <el-tag size="small" :type="业务Tag样式(已选套餐.business_type)">
                      {{ 业务中文(已选套餐.business_type) }}
                    </el-tag>
                  </div>
                  <div class="已选行">
                    <label>当前库存：</label>
                    <el-tag size="small" :type="库存标签样式(已选套餐.stock_unused)">
                      {{ 已选套餐.stock_unused ?? 0 }} 张未使用
                    </el-tag>
                  </div>
                </div>
              </el-card>

              <!-- 生成参数表单 -->
              <el-form label-width="100px" style="margin-top:16px">
                <el-form-item label="生成数量">
                  <el-input-number v-model="生成数量" :min="1" :max="1000" />
                  <span class="字段提示">最多1000张</span>
                </el-form-item>
                <el-form-item label="批次备注">
                  <el-input v-model="批次备注" placeholder="可选，用于区分批次" />
                </el-form-item>
                <el-form-item label="过期时间">
                  <el-date-picker
                    v-model="过期时间"
                    type="datetime"
                    placeholder="不填则永久有效"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :loading="生成中"
                    @click="执行生成卡密"
                    size="large"
                  >🎲 批量生成卡密</el-button>
                  <el-button @click="已选套餐 = null">取消选择</el-button>
                </el-form-item>
              </el-form>

              <!-- 生成结果 -->
              <el-card v-if="生成结果" class="生成结果卡片" shadow="never">
                <div class="结果标题">✅ 生成成功</div>
                <div class="结果信息">
                  <div>批次号：<strong>{{ 生成结果.batch_no }}</strong></div>
                  <div>生成数量：<strong>{{ 生成结果.count }}</strong> 张</div>
                </div>
                <div class="结果操作">
                  <el-button size="small" @click="复制完整链接">复制完整链接</el-button>
                  <el-button size="small" @click="复制仅卡密">复制仅卡密</el-button>
                  <el-button size="small" type="success" @click="下载TXT">下载TXT</el-button>
                </div>
                <div class="预览卡密">
                  <div class="预览标题">
                    前20条预览（{{ 站点域名 || '加载站点域名中...' }}）：
                  </div>
                  <div
                    v-for="(码, i) in 生成结果.codes.slice(0, 20)"
                    :key="i"
                    class="卡密预览行"
                  >
                    <span class="序号">{{ i + 1 }}.</span>
                    <span class="卡密码">{{ 码 }}</span>
                    <span class="完整链接">{{ 生成链接(生成结果.business_type, 码) }}</span>
                    <el-button size="small" text type="primary" style="padding:0 2px; font-size:11px" @click="复制文本(生成链接(生成结果.business_type, 码))">复制</el-button>
                  </div>
                  <div v-if="生成结果.codes.length > 20" class="更多提示">
                    ... 共 {{ 生成结果.codes.length }} 张，请下载TXT查看全部
                  </div>
                </div>
              </el-card>
            </template>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===== Tab2：卡密列表 ===== -->
      <el-tab-pane label="📋 卡密列表" name="cards">
        <!-- 筛选栏 -->
        <div class="筛选栏">
          <el-select v-model="卡密筛选.business_type" placeholder="全部业务" clearable style="width:120px">
            <el-option v-for="业务 in 业务列表" :key="业务.type" :label="业务.label" :value="业务.type" />
          </el-select>
          <el-select v-model="卡密筛选.status" placeholder="全部状态" clearable style="width:120px">
            <el-option label="未使用" value="0" />
            <el-option label="已使用" value="1" />
            <el-option label="已失效" value="2" />
          </el-select>
          <el-select v-model="卡密筛选.sup_status" placeholder="SUP发货" clearable style="width:120px">
            <el-option label="未发货" value="0" />
            <el-option label="已发货" value="1" />
            <el-option label="已撤单" value="2" />
          </el-select>
          <el-input
            v-model="卡密筛选.batch_no"
            placeholder="批次号"
            style="width:160px"
            clearable
          />
          <el-input
            v-model="卡密筛选.keyword"
            placeholder="卡密码/备注"
            style="width:160px"
            clearable
          />
          <el-button type="primary" @click="搜索卡密">搜索</el-button>
          <el-button @click="重置卡密筛选">重置</el-button>
          <el-button type="success" @click="导出卡密列表TXT">📥 导出TXT</el-button>
        </div>

        <el-table
          ref="卡密表格引用"
          :data="卡密列表"
          v-loading="卡密加载中"
          border stripe
          style="margin-top:12px"
          @selection-change="卡密选择变化"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="卡密码" min-width="160">
            <template #default="{ row }">
              <span class="等宽字体">{{ row.code }}</span>
              <el-button size="small" text type="primary" style="padding:0 4px" @click="复制文本(row.code)">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="完整链接" min-width="200">
            <template #default="{ row }">
              <span class="截断链接" style="cursor:pointer" @click="复制文本(生成链接(row.business_type, row.code))">
                {{ 生成链接(row.business_type, row.code) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="套餐名称" min-width="120">
            <template #default="{ row }">{{ row.product_name || row.service_type || '-' }}</template>
          </el-table-column>
          <el-table-column label="业务" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="业务Tag样式(row.business_type)">
                {{ 业务中文(row.business_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="SUP发货" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="发货状态样式(row.sup_status)">
                {{ 发货状态文字(row.sup_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="卡密状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="卡密状态样式(row.status)">
                {{ 卡密状态文字(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">{{ 格式化时间(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="复制文本(生成链接(row.business_type, row.code))">复制链接</el-button>
              <el-button size="small" type="warning" @click="作废卡密(row)" :disabled="row.status !== 0">作废</el-button>
              <el-button size="small" type="danger" @click="删除卡密(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作栏 -->
        <div v-if="卡密选中列表.length > 0" class="批量操作栏">
          <span class="批量提示">已选 {{ 卡密选中列表.length }} 条</span>
          <el-button size="small" type="warning" @click="批量作废">批量作废</el-button>
          <el-button size="small" type="primary" @click="批量复制链接">批量复制链接</el-button>
          <el-button size="small" type="danger" @click="批量删除卡密">🗑️ 批量删除</el-button>
        </div>

        <!-- 分页 -->
        <div class="分页区">
          <el-pagination
            v-model:current-page="卡密分页.page"
            v-model:page-size="卡密分页.limit"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            :total="卡密分页.total"
            @size-change="搜索卡密"
            @current-change="搜索卡密"
          />
        </div>
      </el-tab-pane>

      <!-- ===== Tab3：批次记录 ===== -->
      <el-tab-pane label="📦 批次记录" name="batches">
        <!-- 筛选 -->
        <div class="筛选栏">
          <el-select v-model="批次筛选.business_type" placeholder="全部业务" clearable style="width:120px">
            <el-option v-for="业务 in 业务列表" :key="业务.type" :label="业务.label" :value="业务.type" />
          </el-select>
          <el-button type="primary" @click="加载批次列表">搜索</el-button>
          <el-button @click="重置批次筛选">重置</el-button>
        </div>

        <el-table :data="批次列表" v-loading="批次加载中" border stripe style="margin-top:12px">
          <el-table-column prop="batch_no" label="批次号" min-width="180" />
          <el-table-column label="业务" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="业务Tag样式(row.business_type)">
                {{ 业务中文(row.business_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="套餐名称" min-width="140">
            <template #default="{ row }">{{ row.category || row.product_name || '-' }}</template>
          </el-table-column>
          <el-table-column label="总/已用/未用" width="140">
            <template #default="{ row }">
              <span>{{ row.count }}</span> /
              <span style="color:#909399">{{ row.used_count ?? '-' }}</span> /
              <span style="color:#67c23a">{{ row.unused_count ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="170">
            <template #default="{ row }">{{ 格式化时间(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="320" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="查看批次卡密(row)">查看卡密</el-button>
              <el-button size="small" @click="复制批次链接(row)">复制链接</el-button>
              <el-button size="small" @click="复制批次卡密(row)">复制卡密</el-button>
              <el-button size="small" type="success" @click="导出批次TXT(row)">导出TXT</el-button>
              <el-button size="small" type="danger" @click="删除批次(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 批次卡密弹窗 -->
    <el-dialog v-model="批次弹窗可见" :title="`批次卡密 - ${当前批次?.batch_no}`" width="780px">
      <!-- 操作按钮 -->
      <div style="margin-bottom:12px; display:flex; gap:8px">
        <el-button size="small" type="primary" @click="批次弹窗全选复制链接">全选复制链接</el-button>
        <el-button size="small" @click="批次弹窗全选复制卡密">全选复制卡密</el-button>
        <el-button size="small" type="success" @click="批次弹窗导出TXT">导出TXT</el-button>
      </div>
      <el-table :data="批次卡密列表" border stripe max-height="400px">
        <el-table-column prop="code" label="卡密码" min-width="160">
          <template #default="{ row }">
            <span class="等宽字体">{{ row.code }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="卡密状态样式(row.status)">
              {{ 卡密状态文字(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="完整链接" min-width="200">
          <template #default="{ row }">
            <span
              class="截断链接"
              style="cursor:pointer; max-width:200px"
              @click="复制文本(生成链接(row.business_type || 当前批次?.business_type, row.code))"
            >
              {{ 生成链接(row.business_type || 当前批次?.business_type, row.code) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Ticket, CopyDocument } from '@element-plus/icons-vue'
import {
  获取套餐列表API,
  套餐生成卡密API,
  统一获取卡密列表API,
  统一获取批次列表API,
  统一获取卡密统计API,
  获取设置API,
  作废卡密API,
  删除卡密API,
} from '../api/index'

// 批次删除需要判断业务类型，引入各业务接口
import { 删除批次API, 删除洗衣批次API, 删除充值批次API } from '../api/index'
import { 作废洗衣卡密API, 作废充值卡密API, 删除洗衣卡密API, 删除充值卡密API } from '../api/index'

// ===== 常量 =====
const 业务列表 = [
  { type: 'jiazheng', label: '🏠 家政' },
  { type: 'xiyifu', label: '🧺 洗衣' },
  { type: 'topup', label: '💳 充值' },
]

// ===== 状态 =====
const 主Tab = ref('generate')
const 站点域名 = ref('')
const 统计数据 = ref(null)

// 生成卡密
const 选中业务类型 = ref('jiazheng')
const 当前套餐列表 = ref([])
const 套餐加载中 = ref(false)
const 已选套餐 = ref(null)
const 生成数量 = ref(10)
const 批次备注 = ref('')
const 过期时间 = ref('')
const 生成中 = ref(false)
const 生成结果 = ref(null)

// 卡密列表
const 卡密列表 = ref([])
const 卡密加载中 = ref(false)
const 卡密筛选 = reactive({ business_type: '', status: '', keyword: '', batch_no: '', sup_status: '' })
const 卡密分页 = reactive({ page: 1, limit: 20, total: 0 })

// 批次
const 批次列表 = ref([])
const 批次加载中 = ref(false)
const 批次筛选 = reactive({ business_type: '' })
const 批次弹窗可见 = ref(false)
const 当前批次 = ref(null)
const 批次卡密列表 = ref([])

// Tab2 多选
const 卡密选中列表 = ref([])
const 卡密表格引用 = ref(null)

// ===== 初始化 =====
onMounted(async () => {
  // 读取站点域名
  try {
    const 设置响应 = await 获取设置API()
    const 设置列表 = 设置响应?.data || []
    const 站点配置 = 设置列表.find(s => s.key_name === 'site_url')
    if (站点配置?.key_value) {
      站点域名.value = 站点配置.key_value.replace(/\/$/, '')
    }
  } catch {}

  // 加载统计、套餐
  加载统计()
  加载当前套餐()
})

// ===== 统计 =====
const 加载统计 = async () => {
  try {
    const 响应 = await 统一获取卡密统计API()
    统计数据.value = 响应?.data || null
  } catch {}
}

const 获取统计 = (业务类型, 字段) => {
  if (!统计数据.value) return '-'
  const 业务统计 = 统计数据.value[业务类型]
  if (!业务统计) return 0
  const map = { total: 'total', unused: 'unused', used: 'used', expired: 'expired' }
  return 业务统计[map[字段]] ?? 0
}

// ===== 套餐管理 =====
const 加载当前套餐 = async () => {
  套餐加载中.value = true
  try {
    const 响应 = await 获取套餐列表API({ business_type: 选中业务类型.value, status: 1 })
    当前套餐列表.value = 响应?.data || []
  } catch {
    ElMessage.error('加载套餐失败')
  } finally {
    套餐加载中.value = false
  }
}

const 切换业务类型 = (类型) => {
  选中业务类型.value = 类型
  已选套餐.value = null
  生成结果.value = null
  加载当前套餐()
}

const 选择套餐 = (套餐) => {
  已选套餐.value = 套餐
  生成结果.value = null
}

// ===== 生成卡密 =====
const 执行生成卡密 = async () => {
  if (!已选套餐.value) return
  生成中.value = true
  try {
    const 响应 = await 套餐生成卡密API({
      template_id: 已选套餐.value.id,
      count: 生成数量.value,
      remark: 批次备注.value,
      expired_at: 过期时间.value || null,
    })
    if (响应?.code === 1) {
      生成结果.value = 响应.data
      ElMessage.success(响应.message)
      // 刷新统计和套餐库存
      加载统计()
      加载当前套餐()
    } else {
      ElMessage.warning(响应?.message || '生成失败')
    }
  } catch {
    ElMessage.error('生成卡密失败，请稍后重试')
  } finally {
    生成中.value = false
  }
}

// ===== 链接生成 =====
const 生成链接 = (业务类型, 卡密码) => {
  const 域名 = 站点域名.value || window.location.origin
  if (业务类型 === 'xiyifu') return `${域名}/xi/${卡密码}`
  if (业务类型 === 'topup') return `${域名}/cz/${卡密码}`
  // 家政统一用 /jz/ 前缀
  return `${域名}/jz/${卡密码}`
}

// ===== 复制/下载 =====
// HTTP/HTTPS 兼容复制函数
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

const 复制文本 = (text) => {
  copyToClipboard(text)
    .then(() => ElMessage.success('已复制'))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

const 复制完整链接 = () => {
  if (!生成结果.value) return
  const 文本 = 生成结果.value.codes
    .map(码 => 生成链接(生成结果.value.business_type, 码))
    .join('\n')
  复制文本(文本)
}

const 复制仅卡密 = () => {
  if (!生成结果.value) return
  复制文本(生成结果.value.codes.join('\n'))
}

const 下载TXT = () => {
  if (!生成结果.value) return
  const 内容 = 生成结果.value.codes
    .map(码 => `${码}\t${生成链接(生成结果.value.business_type, 码)}`)
    .join('\n')
  const blob = new Blob([内容], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${生成结果.value.batch_no}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ===== 卡密列表 =====
const 搜索卡密 = async () => {
  卡密加载中.value = true
  try {
    const 响应 = await 统一获取卡密列表API({
      ...卡密筛选,
      page: 卡密分页.page,
      limit: 卡密分页.limit,
    })
    卡密列表.value = 响应?.data?.list || 响应?.data || []
    卡密分页.total = 响应?.data?.total || 卡密列表.value.length
  } catch {
    ElMessage.error('加载卡密列表失败')
  } finally {
    卡密加载中.value = false
  }
}

const 重置卡密筛选 = () => {
  Object.assign(卡密筛选, { business_type: '', status: '', keyword: '', batch_no: '', sup_status: '' })
  卡密分页.page = 1
  搜索卡密()
}

const 作废卡密 = async (行) => {
  await ElMessageBox.confirm(`确认作废卡密 ${行.code}？此操作不可逆。`, '确认作废', { type: 'warning' })
  try {
    if (行.business_type === 'xiyifu') {
      await 作废洗衣卡密API(行.id)
    } else if (行.business_type === 'topup') {
      await 作废充值卡密API(行.id)
    } else {
      await 作废卡密API(行.id)
    }
    ElMessage.success('卡密已作废')
    搜索卡密()
  } catch {
    ElMessage.error('作废失败')
  }
}

const 删除卡密 = async (行) => {
  await ElMessageBox.confirm(`确认删除卡密 ${行.code}？`, '确认删除', { type: 'warning' })
  try {
    if (行.business_type === 'xiyifu') {
      await 删除洗衣卡密API(行.id)
    } else if (行.business_type === 'topup') {
      await 删除充值卡密API(行.id)
    } else {
      await 删除卡密API(行.id)
    }
    ElMessage.success('卡密已删除')
    搜索卡密()
  } catch {
    ElMessage.error('删除失败')
  }
}

// ===== 批次管理 =====
const 加载批次列表 = async () => {
  批次加载中.value = true
  try {
    const 响应 = await 统一获取批次列表API(批次筛选)
    批次列表.value = 响应?.data?.list || 响应?.data || []
  } catch {
    ElMessage.error('加载批次列表失败')
  } finally {
    批次加载中.value = false
  }
}

const 重置批次筛选 = () => {
  批次筛选.business_type = ''
  加载批次列表()
}

const 查看批次卡密 = async (行) => {
  当前批次.value = 行
  批次弹窗可见.value = true
  // 通过统一接口筛选该批次卡密
  try {
    const 响应 = await 统一获取卡密列表API({ batch_id: 行.id, limit: 500 })
    批次卡密列表.value = 响应?.data?.list || 响应?.data || []
  } catch {
    ElMessage.error('加载批次卡密失败')
  }
}

const 复制批次链接 = (行) => {
  if (!行.codes && 批次卡密列表.value.length === 0) {
    ElMessage.warning('请先查看批次卡密后再复制')
    return
  }
  const 卡密s = 批次卡密列表.value.filter(c => c.batch_id === 行.id || 批次弹窗可见.value)
  if (卡密s.length === 0) {
    ElMessage.warning('暂无卡密数据，请先点击"查看卡密"')
    return
  }
  const 文本 = 卡密s.map(c => 生成链接(c.business_type || 行.business_type, c.code)).join('\n')
  复制文本(文本)
}

const 复制批次卡密 = (行) => {
  if (批次卡密列表.value.length === 0) {
    ElMessage.warning('请先点击"查看卡密"加载数据后再复制')
    return
  }
  const 文本 = 批次卡密列表.value.map(c => c.code).join('\n')
  复制文本(文本)
}

const 删除批次 = async (行) => {
  await ElMessageBox.confirm(`确认删除批次 ${行.batch_no}？`, '确认删除', { type: 'warning' })
  try {
    // 根据业务类型调用对应删除接口
    if (行.business_type === 'xiyifu') {
      await 删除洗衣批次API(行.id)
    } else if (行.business_type === 'topup') {
      await 删除充值批次API(行.id)
    } else {
      await 删除批次API(行.id)
    }
    ElMessage.success('批次已删除')
    加载批次列表()
  } catch {
    ElMessage.error('删除失败')
  }
}

// ===== 批量操作 =====
const 卡密选择变化 = (selection) => {
  卡密选中列表.value = selection
}

const 批量作废 = async () => {
  const 待作废 = 卡密选中列表.value.filter(c => c.status === 0)
  if (待作废.length === 0) {
    ElMessage.warning('请先勾选状态为"未使用"的卡密')
    return
  }
  await ElMessageBox.confirm(`确认批量作废 ${待作废.length} 张卡密？此操作不可逆。`, '确认批量作废', { type: 'warning' })
  let 成功 = 0
  for (const 卡密 of 待作废) {
    try {
      if (卡密.business_type === 'xiyifu') {
        await 作废洗衣卡密API(卡密.id)
      } else if (卡密.business_type === 'topup') {
        await 作废充值卡密API(卡密.id)
      } else {
        await 作废卡密API(卡密.id)
      }
      成功++
    } catch {}
  }
  ElMessage.success(`已作废 ${成功} 张`)
  搜索卡密()
}

const 批量复制链接 = () => {
  if (卡密选中列表.value.length === 0) {
    ElMessage.warning('请先勾选卡密')
    return
  }
  const 文本 = 卡密选中列表.value.map(c => 生成链接(c.business_type, c.code)).join('\n')
  复制文本(文本)
}

const 批量删除卡密 = async () => {
  if (卡密选中列表.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${卡密选中列表.value.length} 条卡密？已使用的卡密将跳过删除，此操作不可逆。`,
      '批量删除确认',
      { type: 'warning', confirmButtonText: '确认删除' }
    )
    let 成功数 = 0
    let 跳过数 = 0
    for (const 卡密 of 卡密选中列表.value) {
      try {
        if (卡密.business_type === 'xiyifu') {
          await 删除洗衣卡密API(卡密.id)
        } else if (卡密.business_type === 'topup') {
          await 删除充值卡密API(卡密.id)
        } else {
          await 删除卡密API(卡密.id)
        }
        成功数++
      } catch {
        跳过数++
      }
    }
    ElMessage.success(`删除完成：成功 ${成功数} 条${跳过数 > 0 ? `，跳过 ${跳过数} 条（已使用）` : ''}`)
    搜索卡密()
    加载统计()
  } catch {}
}

// ===== 导出卡密列表 =====
const 导出卡密列表TXT = async () => {
  卡密加载中.value = true
  try {
    const 响应 = await 统一获取卡密列表API({
      ...卡密筛选,
      page: 1,
      limit: 5000,
    })
    const 列表 = 响应?.data?.list || 响应?.data || []
    if (列表.length === 0) {
      ElMessage.warning('没有可导出的卡密')
      return
    }
    const 内容 = 列表.map(c => `${c.code}\t${生成链接(c.business_type, c.code)}`).join('\n')
    const blob = new Blob([内容], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `卡密列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`已导出 ${列表.length} 条`)
  } catch {
    ElMessage.error('导出失败')
  } finally {
    卡密加载中.value = false
  }
}

// ===== 导出批次TXT =====
const 导出批次TXT = async (批次行) => {
  try {
    const 响应 = await 统一获取卡密列表API({ batch_id: 批次行.id, limit: 5000 })
    const 列表 = 响应?.data?.list || 响应?.data || []
    if (列表.length === 0) {
      ElMessage.warning('该批次暂无卡密')
      return
    }
    const 内容 = 列表.map(c => `${c.code}\t${生成链接(c.business_type || 批次行.business_type, c.code)}`).join('\n')
    const blob = new Blob([内容], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${批次行.batch_no}.txt`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`已导出 ${列表.length} 张`)
  } catch {
    ElMessage.error('导出失败')
  }
}

// ===== 批次弹窗 - 全选复制 =====
const 批次弹窗全选复制链接 = () => {
  if (批次卡密列表.value.length === 0) return
  const 文本 = 批次卡密列表.value
    .map(c => 生成链接(c.business_type || 当前批次.value?.business_type, c.code))
    .join('\n')
  复制文本(文本)
}

const 批次弹窗全选复制卡密 = () => {
  if (批次卡密列表.value.length === 0) return
  复制文本(批次卡密列表.value.map(c => c.code).join('\n'))
}

const 批次弹窗导出TXT = () => {
  if (!当前批次.value) return
  导出批次TXT(当前批次.value)
}

// ===== 工具函数 =====
const 业务中文 = (type) => {
  const map = { jiazheng: '家政', xiyifu: '洗衣', topup: '充值' }
  return map[type] || type
}

const 业务Tag样式 = (type) => {
  const map = { jiazheng: 'primary', xiyifu: 'success', topup: 'warning' }
  return map[type] || ''
}

const 库存标签样式 = (stock) => {
  if (stock === undefined || stock === null) return 'info'
  if (stock === 0) return 'danger'
  if (stock < 10) return 'warning'
  return 'success'
}

const 发货状态文字 = (sup_status) => {
  const map = { 0: '未发货', 1: '已发货', 2: '已撤单' }
  return map[sup_status] ?? '未发货'
}

const 发货状态样式 = (sup_status) => {
  const map = { 0: 'info', 1: 'success', 2: 'danger' }
  return map[sup_status] ?? 'info'
}

const 卡密状态文字 = (status) => {
  const map = { 0: '未使用', 1: '已使用', 2: '已失效' }
  return map[status] ?? '未知'
}

const 卡密状态样式 = (status) => {
  const map = { 0: 'success', 1: 'info', 2: 'danger' }
  return map[status] ?? ''
}

const 格式化时间 = (时间) => {
  if (!时间) return '-'
  return new Date(时间).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

// 监听Tab切换自动加载数据
const 主TabChange = (tab) => {
  if (tab === 'cards') 搜索卡密()
  if (tab === 'batches') 加载批次列表()
}
</script>

<style scoped>
.卡密工作台容器 {
  padding: 0;
}

.页面标题 {
  margin-bottom: 16px;
}

.页面标题 h2 {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 6px 0;
}

.副标题 {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* 统计区 */
.统计区 {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.统计卡片 {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.统计标题 {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.统计数字 {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.总数 {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}

.统计小字 {
  font-size: 12px;
  color: #999;
}

.统计细分 {
  margin-top: 6px;
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.未使用 { color: #67c23a; }
.已使用 { color: #909399; }
.已失效 { color: #f56c6c; }

/* 生成区 */
.生成区布局 {
  display: flex;
  gap: 24px;
  min-height: 400px;
}

.套餐选择区 {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.业务切换 {
  display: flex;
}

.套餐卡片列表 {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  max-height: 500px;
}

.套餐卡片 {
  border: 1.5px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.套餐卡片:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.15);
}

.套餐卡片.选中 {
  border-color: #409eff;
  background: #ecf5ff;
}

.套餐卡片.库存警告 {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.套餐卡片.库存为零 {
  border-color: #f56c6c;
  background: #fef0f0;
  opacity: 0.8;
}

.卡片主信息 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.套餐名称 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.卡片副信息 {
  font-size: 12px;
  color: #999;
}

.新建套餐入口 {
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}

.空状态 {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
}

/* 右侧生成参数 */
.生成参数区 {
  flex: 1;
}

.未选提示 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #c0c4cc;
  gap: 12px;
}

.提示图标 {
  font-size: 48px;
}

.已选套餐卡片 {
  background: #f8fafc;
}

.已选套餐信息 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.已选行 {
  font-size: 13px;
  color: #555;
}

.已选行 label {
  color: #999;
}

.生成结果卡片{
  margin-top: 16px;
  background: #f0f9eb;
  border-color: #b3e19d;
}

.结果标题 {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 10px;
}

.结果信息 {
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;
  display: flex;
  gap: 20px;
}

.结果操作 {
  margin-bottom: 12px;
}

.预览卡密 {
  font-size: 12px;
}

.预览标题 {
  color: #666;
  margin-bottom: 6px;
}

.卡密预览行 {
  display: flex;
  gap: 10px;
  padding: 2px 0;
  border-bottom: 1px solid #e8f5e9;
}

.序号 {
  color: #999;
  width: 24px;
  flex-shrink: 0;
}

.卡密码 {
  font-family: 'Courier New', monospace;
  color: #333;
  width: 160px;
  flex-shrink: 0;
}

.完整链接 {
  color: #409eff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.更多提示 {
  color: #999;
  margin-top: 6px;
  font-size: 12px;
}

/* 筛选栏 */
.筛选栏 {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

/* 分页 */
.分页区 {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 等宽字体 */
.等宽字体 {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.截断链接 {
  font-size: 12px;
  color: #409eff;
  display: inline-block;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

/* 字段提示 */
.字段提示 {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

/* 批量操作栏 */
.批量操作栏 {
  margin-top: 12px;
  padding: 8px 16px;
  background: #ecf5ff;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.批量提示 {
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}
</style>
