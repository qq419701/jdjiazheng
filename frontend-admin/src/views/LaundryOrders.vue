<template>
  <!-- 洗衣订单管理页面 -->
  <div class="洗衣订单管理">

    <!-- 顶部一键打开洗衣前端按钮 -->
    <el-card class="顶部操作栏" style="margin-bottom: 12px">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
        <el-button type="primary" size="large" @click="打开洗衣前端">
          🌐 预览洗衣前端页面
        </el-button>
        <span v-if="预览链接" style="font-size:13px; color:#409eff">
          {{ 预览链接 }}
          <el-button link @click="复制预览链接">复制</el-button>
        </span>
        <span style="font-size:12px; color:#999">自动使用一个未使用的演示卡密打开前端</span>
      </div>
    </el-card>

    <!-- 搜索筛选 -->
    <el-card class="搜索卡片">
      <el-form :inline="true" :model="搜索条件">
        <el-form-item label="关键词">
          <el-input v-model="搜索条件.keyword" placeholder="订单号/姓名/手机/备注" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="搜索条件.city" placeholder="城市" clearable style="width: 100px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="搜索条件.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="待处理" value="0" />
            <el-option label="下单中" value="1" />
            <el-option label="已下单" value="2" />
            <el-option label="失败" value="3" />
            <el-option label="已取消" value="4" />
            <el-option label="已送达" value="6" />
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
          <el-button type="primary" @click="搜索订单">搜索</el-button>
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
        <el-table-column label="取件时间" width="160">
          <template #default="{ row }">
            {{ row.visit_date }} {{ row.visit_time }}
          </template>
        </el-table-column>
        <el-table-column prop="card_code" label="卡密" width="160" />
        <el-table-column prop="service_type" label="商品名称" width="100" />
        <el-table-column label="鲸蚁订单号" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.laundry_order_id" class="鲸蚁订单号">{{ row.laundry_order_id }}</span>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="洗衣状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.laundry_status" :type="获取洗衣状态类型(row.laundry_status)" size="small">
              {{ row.laundry_status }}
            </el-tag>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="取件快递单号" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.express_order_id" class="快递单号">{{ row.express_order_id }}</span>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="获取状态类型(row.status)" size="small">{{ 获取状态文字(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" width="120">
          <template #default="{ row }">
            <span v-if="row.remark" class="备注摘要">
              <span>📝</span>
              {{ row.remark.length > 15 ? row.remark.substring(0, 15) + '…' : row.remark }}
            </span>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="查看详情(row.id)">详情</el-button>
            <el-button size="small" type="info" plain @click="打开备注弹窗(row)">备注</el-button>
            <el-button
              v-if="row.status === 0 || row.status === 3"
              size="small" type="primary"
              @click="触发下单(row.id)"
            >触发下单</el-button>
            <el-button size="small" type="success" plain @click="打开物流弹窗(row)">📋 物流查询</el-button>
            <el-button size="small" type="warning" plain @click="打开修改预约弹窗(row)">✏️ 修改预约</el-button>
            <el-button
              v-if="row.status !== 4"
              size="small" type="danger"
              @click="取消订单(row.id)"
            >取消</el-button>
            <el-button
              v-if="row.status === 3"
              size="small" type="warning"
              @click="执行重置(row.id)"
            >重置</el-button>
            <el-button size="small" @click="复制订单信息(row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="当前页"
        v-model:page-size="每页数量"
        :total="总数"
        layout="total, prev, pager, next"
        class="分页器"
        @change="加载订单"
      />
    </el-card>

    <!-- 备注编辑弹窗 -->
    <el-dialog v-model="显示备注弹窗" title="编辑备注" width="460px" :close-on-click-modal="false">
      <el-input
        v-model="备注文本"
        type="textarea"
        rows="4"
        placeholder="请输入备注内容"
      />
      <template #footer>
        <el-button @click="显示备注弹窗 = false">取消</el-button>
        <el-button type="primary" @click="保存备注">保存</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="显示详情弹窗" title="洗衣订单详情" width="700px">
      <template v-if="当前详情">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ 当前详情.order_no }}</el-descriptions-item>
          <el-descriptions-item label="卡密">{{ 当前详情.card_code }}</el-descriptions-item>
          <el-descriptions-item label="取件人">{{ 当前详情.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ 当前详情.phone }}</el-descriptions-item>
          <el-descriptions-item label="取件地址" :span="2">{{ 当前详情.full_address }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ 当前详情.return_name || 当前详情.name }}</el-descriptions-item>
          <el-descriptions-item label="收件手机">{{ 当前详情.return_phone || 当前详情.phone }}</el-descriptions-item>
          <el-descriptions-item label="收件地址" :span="2">
            <span v-if="(当前详情.return_province || '') + (当前详情.return_city || '') + (当前详情.return_district || '') + (当前详情.return_address || '')">
              {{ (当前详情.return_province || '') + (当前详情.return_city || '') + (当前详情.return_district || '') + (当前详情.return_address || '') }}
            </span>
            <span v-else class="无值">与取件地址相同</span>
          </el-descriptions-item>
          <el-descriptions-item label="取件时间">{{ 当前详情.visit_date }} {{ 当前详情.visit_time }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ 当前详情.service_type }}</el-descriptions-item>
          <el-descriptions-item label="鲸蚁订单号">{{ 当前详情.laundry_order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="洗衣状态">{{ 当前详情.laundry_status || '-' }}</el-descriptions-item>
          <el-descriptions-item label="取件快递单号">{{ 当前详情.express_order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="回寄快递单号">{{ 当前详情.return_waybill_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="洗衣工厂">{{ 当前详情.factory_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工厂代码">{{ 当前详情.factory_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="获取状态类型(当前详情.status)" size="small">{{ 获取状态文字(当前详情.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ 当前详情.created_at }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ 当前详情.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 预检图片 -->
        <div v-if="当前详情预检图片.length > 0" style="margin-top: 16px">
          <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px">🖼️ 预检图片</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px">
            <el-image
              v-for="(图片, 索引) in 当前详情预检图片"
              :key="索引"
              :src="图片"
              style="width:100px; height:100px; border-radius:4px; object-fit:cover"
              :preview-src-list="当前详情预检图片"
              :initial-index="索引"
              fit="cover"
            />
          </div>
        </div>

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
            >
              {{ 日志.操作 }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <template #footer>
        <el-button type="primary" @click="显示详情弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 物流查询弹窗 -->
    <el-dialog v-model="显示物流弹窗" title="📋 物流查询" width="680px" :close-on-click-modal="false">
      <template v-if="当前物流订单">
        <div style="margin-bottom:16px">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单号">{{ 当前物流订单.order_no }}</el-descriptions-item>
            <el-descriptions-item label="洗衣状态">
              <el-tag :type="获取洗衣状态类型(当前物流订单.laundry_status)" size="small">
                {{ 当前物流订单.laundry_status || '-' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 取件物流 -->
        <div style="margin-bottom:16px">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px">
            <span style="font-weight:600">🚚 取件物流</span>
            <span v-if="当前物流订单.express_order_id" class="快递单号">{{ 当前物流订单.express_order_id }}</span>
            <span v-else class="无值">暂无快递单号</span>
            <el-button
              v-if="当前物流订单.express_order_id"
              size="small" type="primary" :loading="取件物流加载中"
              @click="查询物流('pickup')"
            >查询</el-button>
          </div>
          <template v-if="取件物流数据">
            <div v-if="取件物流数据.courierName || 取件物流数据.courierPhone" style="font-size:13px; color:#666; margin-bottom:8px">
              快递员：{{ 取件物流数据.courierName || '-' }}
              <template v-if="取件物流数据.courierPhone">
                &nbsp;|&nbsp;
                <a :href="`tel:${取件物流数据.courierPhone}`" style="color:#409eff">{{ 取件物流数据.courierPhone }}</a>
              </template>
            </div>
            <el-timeline v-if="取件物流数据.routes?.length > 0" style="padding-left:0">
              <el-timeline-item
                v-for="(路由, 索引) in 取件物流数据.routes"
                :key="索引"
                :timestamp="路由.time || 路由.timestamp"
                placement="top"
                :type="索引 === 0 ? 'primary' : ''"
              >
                {{ 路由.desc || 路由.remark || 路由.content }}
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无物流轨迹" :image-size="60" />
          </template>
        </div>

        <!-- 回寄物流 -->
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px">
            <span style="font-weight:600">📦 回寄物流</span>
            <span v-if="当前物流订单.return_waybill_code" class="快递单号">{{ 当前物流订单.return_waybill_code }}</span>
            <span v-else class="无值">暂无回寄单号</span>
            <el-button
              v-if="当前物流订单.return_waybill_code"
              size="small" type="primary" :loading="回寄物流加载中"
              @click="查询物流('return')"
            >查询</el-button>
          </div>
          <template v-if="回寄物流数据">
            <div v-if="回寄物流数据.courierName || 回寄物流数据.courierPhone" style="font-size:13px; color:#666; margin-bottom:8px">
              快递员：{{ 回寄物流数据.courierName || '-' }}
              <template v-if="回寄物流数据.courierPhone">
                &nbsp;|&nbsp;
                <a :href="`tel:${回寄物流数据.courierPhone}`" style="color:#409eff">{{ 回寄物流数据.courierPhone }}</a>
              </template>
            </div>
            <el-timeline v-if="回寄物流数据.routes?.length > 0" style="padding-left:0">
              <el-timeline-item
                v-for="(路由, 索引) in 回寄物流数据.routes"
                :key="索引"
                :timestamp="路由.time || 路由.timestamp"
                placement="top"
                :type="索引 === 0 ? 'primary' : ''"
              >
                {{ 路由.desc || 路由.remark || 路由.content }}
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无物流轨迹" :image-size="60" />
          </template>
        </div>
      </template>
      <template #footer>
        <el-button @click="显示物流弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 修改预约弹窗 -->
    <el-dialog v-model="显示修改预约弹窗" title="✏️ 修改预约信息" width="560px" :close-on-click-modal="false">
      <el-alert
        v-if="修改预约表单.status === 2"
        title="订单已下单，保存后将同步修改到鲸蚁系统"
        type="warning"
        :closable="false"
        style="margin-bottom:16px"
      />
      <el-form :model="修改预约表单" label-width="100px">
        <el-form-item label="预约日期">
          <el-date-picker
            v-model="修改预约表单.visit_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="取件时间段">
          <el-select v-model="修改预约表单.visit_time_label" placeholder="选择时间段" style="width:100%">
            <el-option v-for="段 in 时间段选项" :key="段.label" :label="段.label" :value="段.label" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">收件地址</el-divider>
        <el-form-item label="收件姓名">
          <el-input v-model="修改预约表单.return_name" placeholder="收件人姓名" />
        </el-form-item>
        <el-form-item label="收件手机">
          <el-input v-model="修改预约表单.return_phone" placeholder="收件人手机号" />
        </el-form-item>
        <el-form-item label="收件省份">
          <el-input v-model="修改预约表单.return_province" placeholder="省份" />
        </el-form-item>
        <el-form-item label="收件城市">
          <el-input v-model="修改预约表单.return_city" placeholder="城市" />
        </el-form-item>
        <el-form-item label="收件区县">
          <el-input v-model="修改预约表单.return_district" placeholder="区县" />
        </el-form-item>
        <el-form-item label="收件详址">
          <el-input v-model="修改预约表单.return_address" type="textarea" rows="2" placeholder="详细地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示修改预约弹窗 = false">取消</el-button>
        <el-button type="primary" :loading="修改保存中" @click="保存修改预约">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  获取洗衣订单列表API, 获取洗衣订单详情API,
  更新洗衣订单备注API, 触发洗衣API下单, 取消洗衣订单API,
  重置洗衣订单API, 获取设置API, 获取洗衣预览卡密API,
  修改洗衣订单API, 查询洗衣物流路由API,
} from '../api/index'

// 站点域名
const 站点域名 = ref('')
const 预览链接 = ref('')

// 搜索条件
const 搜索条件 = ref({ keyword: '', city: '', status: '' })
const 日期范围 = ref(null)

// 表格数据
const 加载中 = ref(false)
const 订单列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)

// 备注弹窗
const 显示备注弹窗 = ref(false)
const 备注文本 = ref('')
const 当前备注订单ID = ref(null)

// 详情弹窗
const 显示详情弹窗 = ref(false)
const 当前详情 = ref(null)

// 当前详情预检图片（计算属性）
const 当前详情预检图片 = computed(() => {
  if (!当前详情.value?.laundry_images) return []
  const 图片 = 当前详情.value.laundry_images
  if (Array.isArray(图片)) return 图片
  try { return JSON.parse(图片) } catch { return [] }
})

// 物流查询弹窗
const 显示物流弹窗 = ref(false)
const 当前物流订单 = ref(null)
const 取件物流加载中 = ref(false)
const 回寄物流加载中 = ref(false)
const 取件物流数据 = ref(null)
const 回寄物流数据 = ref(null)

// 修改预约弹窗
const 显示修改预约弹窗 = ref(false)
const 修改预约表单 = ref({})
const 修改保存中 = ref(false)

// 时间段选项（常用时间段）
const 时间段选项 = [
  { label: '09:00-10:00', start: '09:00:00', end: '10:00:00' },
  { label: '10:00-11:00', start: '10:00:00', end: '11:00:00' },
  { label: '11:00-12:00', start: '11:00:00', end: '12:00:00' },
  { label: '14:00-15:00', start: '14:00:00', end: '15:00:00' },
  { label: '15:00-16:00', start: '15:00:00', end: '16:00:00' },
  { label: '16:00-17:00', start: '16:00:00', end: '17:00:00' },
]

// 加载设置
const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
    }
  } catch {}
}

// 打开洗衣前端（获取一个未使用的洗衣卡密）
const 打开洗衣前端 = async () => {
  try {
    const 结果 = await 获取洗衣预览卡密API()
    if (结果.code === 1 && 结果.data?.code) {
      const 链接 = `${站点域名.value || ''}/xi/${结果.data.code}`
      预览链接.value = 链接
      window.open(链接, '_blank')
    } else {
      ElMessage.warning(结果.message || '请先生成洗衣卡密')
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

// 加载订单
const 加载订单 = async () => {
  加载中.value = true
  try {
    const 参数 = {
      page: 当前页.value,
      limit: 每页数量.value,
      ...搜索条件.value,
    }
    if (日期范围.value) {
      参数.date_start = 日期范围.value[0]
      参数.date_end = 日期范围.value[1]
    }
    const 结果 = await 获取洗衣订单列表API(参数)
    if (结果.code === 1) {
      订单列表.value = 结果.data.list
      总数.value = 结果.data.total
    }
  } finally {
    加载中.value = false
  }
}

const 搜索订单 = () => { 当前页.value = 1; 加载订单() }
const 重置筛选 = () => {
  搜索条件.value = { keyword: '', city: '', status: '' }
  日期范围.value = null
  当前页.value = 1
  加载订单()
}

// 查看详情
const 查看详情 = async (id) => {
  try {
    const 结果 = await 获取洗衣订单详情API(id)
    if (结果.code === 1) {
      当前详情.value = 结果.data
      显示详情弹窗.value = true
    }
  } catch {
    ElMessage.error('获取详情失败')
  }
}

// 备注
const 打开备注弹窗 = (订单) => {
  当前备注订单ID.value = 订单.id
  备注文本.value = 订单.remark || ''
  显示备注弹窗.value = true
}
const 保存备注 = async () => {
  try {
    await 更新洗衣订单备注API(当前备注订单ID.value, { remark: 备注文本.value })
    ElMessage.success('备注已保存')
    显示备注弹窗.value = false
    加载订单()
  } catch {
    ElMessage.error('保存失败')
  }
}

// 触发下单
const 触发下单 = async (id) => {
  try {
    const 结果 = await 触发洗衣API下单(id)
    ElMessage.success(结果.message || '下单任务已启动')
    setTimeout(加载订单, 3000)
  } catch {
    ElMessage.error('操作失败')
  }
}

// 取消订单
const 取消订单 = async (id) => {
  try {
    await ElMessageBox.confirm('确认取消此洗衣订单？', '提示', { type: 'warning' })
    const 结果 = await 取消洗衣订单API(id)
    ElMessage.success(结果.message || '已取消')
    加载订单()
  } catch {}
}

// 重置订单
const 执行重置 = async (id) => {
  try {
    await 重置洗衣订单API(id)
    ElMessage.success('订单已重置')
    加载订单()
  } catch {
    ElMessage.error('重置失败')
  }
}

// 物流查询
const 打开物流弹窗 = (订单) => {
  当前物流订单.value = 订单
  取件物流数据.value = null
  回寄物流数据.value = null
  显示物流弹窗.value = true
}

const 查询物流 = async (类型) => {
  if (!当前物流订单.value) return
  const 加载标志 = 类型 === 'pickup' ? 取件物流加载中 : 回寄物流加载中
  加载标志.value = true
  try {
    const 结果 = await 查询洗衣物流路由API(当前物流订单.value.id, 类型)
    if (结果.code === 1) {
      if (类型 === 'pickup') {
        取件物流数据.value = 结果.data
      } else {
        回寄物流数据.value = 结果.data
      }
    } else {
      ElMessage.warning(结果.message || '查询失败')
    }
  } catch {
    ElMessage.error('查询物流失败，请重试')
  } finally {
    加载标志.value = false
  }
}

// 修改预约
const 打开修改预约弹窗 = (订单) => {
  修改预约表单.value = {
    id: 订单.id,
    status: 订单.status,
    visit_date: 订单.visit_date || '',
    visit_time_label: 订单.visit_time || '',
    visit_time_start: 订单.visit_time_start || '',
    visit_time_end: 订单.visit_time_end || '',
    return_name: 订单.return_name || '',
    return_phone: 订单.return_phone || '',
    return_province: 订单.return_province || '',
    return_city: 订单.return_city || '',
    return_district: 订单.return_district || '',
    return_address: 订单.return_address || '',
  }
  显示修改预约弹窗.value = true
}

const 保存修改预约 = async () => {
  修改保存中.value = true
  try {
    // 解析时间段
    const 选中时间段 = 时间段选项.find(段 => 段.label === 修改预约表单.value.visit_time_label)
    const 请求数据 = {
      visit_date: 修改预约表单.value.visit_date,
      visit_time: 修改预约表单.value.visit_time_label,
      visit_time_start: 选中时间段?.start || 修改预约表单.value.visit_time_start,
      visit_time_end: 选中时间段?.end || 修改预约表单.value.visit_time_end,
      return_name: 修改预约表单.value.return_name,
      return_phone: 修改预约表单.value.return_phone,
      return_province: 修改预约表单.value.return_province,
      return_city: 修改预约表单.value.return_city,
      return_district: 修改预约表单.value.return_district,
      return_address: 修改预约表单.value.return_address,
    }
    const 结果 = await 修改洗衣订单API(修改预约表单.value.id, 请求数据)
    ElMessage.success(结果.message || '修改成功')
    显示修改预约弹窗.value = false
    加载订单()
  } catch {
    ElMessage.error('修改失败，请重试')
  } finally {
    修改保存中.value = false
  }
}

// 复制订单信息
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
    try {
      document.execCommand('copy') ? resolve() : reject()
      document.body.removeChild(el)
    } catch (e) { document.body.removeChild(el); reject(e) }
  })
}

const 复制订单信息 = async (订单) => {
  const 文本 = `订单号：${订单.order_no}\n取件人：${订单.name}\n手机：${订单.phone}\n取件时间：${订单.visit_date} ${订单.visit_time}\n商品：${订单.service_type || '-'}`
  try {
    await copyToClipboard(文本)
    ElMessage.success('已复制订单信息')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 状态文字/类型
const 获取状态文字 = (status) => {
  const 映射 = ['待处理', '下单中', '已下单', '失败', '已取消', '', '已送达']
  return 映射[status] || `状态${status}`
}
const 获取状态类型 = (status) => {
  const 映射 = ['warning', 'primary', 'success', 'danger', 'info', '', 'success']
  return 映射[status] || ''
}
const 获取洗衣状态类型 = (洗衣状态) => {
  const 映射 = {
    '已分配': 'primary', '已取件': 'warning', '已入厂': '',
    '预检中': 'warning', '已回寄': 'primary', '已送达': 'success', '质检中': 'info', '已取消': 'danger',
  }
  return 映射[洗衣状态] || 'info'
}

onMounted(() => {
  加载站点域名()
  加载订单()
})
</script>

<style scoped>
.搜索卡片, .顶部操作栏 { margin-bottom: 16px; }
.前端链接提示 { margin-left: 12px; font-size: 12px; color: #999; }
.分页器 { margin-top: 16px; justify-content: center; }
.鲸蚁订单号, .快递单号 { font-size: 12px; color: #409eff; font-family: monospace; }
.无值 { color: #ccc; font-size: 12px; }
.备注摘要 { font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px; }
</style>
