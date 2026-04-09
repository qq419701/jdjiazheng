<template>
  <!-- 套餐管理页面 -->
  <div class="套餐管理容器">
    <div class="页面标题">
      <h2>📦 套餐管理</h2>
      <p class="副标题">管理各业务的卡密套餐，SUP编号自动分配，运营人员直接使用</p>
    </div>

    <el-tabs v-model="当前业务类型" type="border-card" @tab-change="切换业务类型">
      <el-tab-pane label="🏠 家政套餐" name="jiazheng" />
      <el-tab-pane label="🧺 洗衣套餐" name="xiyifu" />
      <el-tab-pane label="💳 充值套餐" name="topup" />
    </el-tabs>

    <!-- 操作栏 -->
    <div class="操作栏">
      <el-button type="primary" @click="打开新建弹窗">+ 新建套餐</el-button>
    </div>

    <!-- 套餐列表 -->
    <el-table :data="套餐列表" v-loading="加载中" border stripe>
      <el-table-column prop="product_no" label="SUP编号" width="100" />
      <el-table-column prop="product_name" label="套餐名称" min-width="160" />
      <el-table-column label="业务规格" min-width="180">
        <template #default="{ row }">
          <span v-if="当前业务类型 === 'jiazheng'">
            {{ row.service_type || '-' }}
            <el-tag v-if="row.service_hours > 0" size="small" type="info" style="margin-left:4px">{{ row.service_hours }}小时</el-tag>
            <el-tag v-else size="small" type="success" style="margin-left:4px">不限时</el-tag>
          </span>
          <span v-else-if="当前业务类型 === 'xiyifu'">{{ row.service_type || '-' }}</span>
          <span v-else-if="当前业务类型 === 'topup'">
            {{ row.topup_member_name || '-' }}
            <el-tag v-if="row.topup_account_type" size="small" style="margin-left:4px">{{ 账号类型标签(row.topup_account_type) }}</el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="cost_price" label="成本价" width="90">
        <template #default="{ row }">¥{{ row.cost_price || 0 }}</template>
      </el-table-column>
      <el-table-column label="库存（未使用）" width="120">
        <template #default="{ row }">
          <el-tag :type="库存样式(row.stock_unused)">{{ row.stock_unused ?? '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 1"
            @change="(v) => 切换状态(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="打开编辑弹窗(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="删除套餐(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="弹窗可见"
      :title="当前编辑ID ? '编辑套餐' : '新建套餐'"
      width="600px"
      @closed="重置表单"
    >
      <el-form ref="表单引用" :model="表单数据" :rules="表单规则" label-width="140px">
        <el-form-item label="套餐名称" prop="product_name">
          <el-input v-model="表单数据.product_name" placeholder="如：日常保洁2小时家政卡" />
        </el-form-item>

        <!-- 家政专用字段 -->
        <template v-if="当前业务类型 === 'jiazheng'">
          <el-form-item label="服务类型" prop="service_type">
            <el-input v-model="表单数据.service_type" placeholder="如：日常保洁" />
          </el-form-item>
          <el-form-item label="服务时长（小时）">
            <el-input-number v-model="表单数据.service_hours" :min="0" :max="24" />
            <span class="字段提示">0 = 不限时长</span>
          </el-form-item>
        </template>

        <!-- 洗衣专用字段 -->
        <template v-if="当前业务类型 === 'xiyifu'">
          <el-form-item label="服务类型" prop="service_type">
            <el-input v-model="表单数据.service_type" placeholder="如：任洗一件" />
          </el-form-item>
        </template>

        <!-- 充值专用字段 -->
        <template v-if="当前业务类型 === 'topup'">
          <el-form-item label="充值会员名称" prop="topup_member_name">
            <el-input v-model="表单数据.topup_member_name" placeholder="如：优酷年卡" />
          </el-form-item>
          <el-form-item label="账号类型">
            <el-select v-model="表单数据.topup_account_type" placeholder="请选择" @change="自动填充标签" style="width:180px">
              <el-option label="手机号" value="phone" />
              <el-option label="微信号" value="wechat" />
              <el-option label="QQ号" value="qq" />
              <el-option label="邮箱" value="email" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="输入框标签">
            <el-input v-model="表单数据.topup_account_label" placeholder="如：请输入手机号" />
          </el-form-item>
          <el-form-item label="预计到账时间">
            <el-input v-model="表单数据.topup_arrival_time" placeholder="如：24小时内" />
          </el-form-item>
          <el-form-item label="显示到期选项">
            <el-switch v-model="表单数据.topup_show_expired" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="充值步骤说明">
            <el-input
              v-model="表单数据.topup_steps"
              type="textarea"
              :rows="3"
              placeholder="填写充值操作步骤说明"
            />
          </el-form-item>
          <el-form-item label="验证正则（可选）">
            <el-input v-model="表单数据.topup_account_regex" placeholder="如：^1[3-9]\\d{9}$" />
          </el-form-item>
          <el-form-item label="验证失败提示">
            <el-input v-model="表单数据.topup_account_error_msg" placeholder="如：请输入正确的手机号" />
          </el-form-item>
          <el-form-item label="会员图标URL">
            <el-input v-model="表单数据.topup_member_icon" placeholder="图标图片地址（可选）" />
          </el-form-item>
        </template>

        <el-form-item label="成本价（元）">
          <el-input-number v-model="表单数据.cost_price" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="表单数据.remark" type="textarea" :rows="2" placeholder="备注（可选）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="表单数据.status" :active-value="1" :inactive-value="0" />
          <span class="字段提示">{{ 表单数据.status === 1 ? '启用' : '禁用' }}</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="弹窗可见 = false">取消</el-button>
        <el-button type="primary" :loading="提交中" @click="提交表单">
          {{ 当前编辑ID ? '保存修改' : '确认新建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取套餐列表API, 新增套餐API, 更新套餐API, 删除套餐API } from '../api/index'

// ===== 状态 =====
const 当前业务类型 = ref('jiazheng')
const 套餐列表 = ref([])
const 加载中 = ref(false)
const 弹窗可见 = ref(false)
const 当前编辑ID = ref(null)
const 提交中 = ref(false)
const 表单引用 = ref(null)

const 表单数据 = reactive({
  product_name: '',
  service_type: '',
  service_hours: 0,
  cost_price: 0,
  status: 1,
  remark: '',
  topup_account_type: '',
  topup_account_label: '',
  topup_member_name: '',
  topup_member_icon: '',
  topup_arrival_time: '',
  topup_show_expired: 0,
  topup_steps: '',
  topup_account_regex: '',
  topup_account_error_msg: '',
})

// 表单验证规则
const 表单规则 = {
  product_name: [{ required: true, message: '请填写套餐名称', trigger: 'blur' }],
  service_type: [{ required: true, message: '请填写服务类型', trigger: 'blur' }],
  topup_member_name: [{ required: true, message: '请填写充值会员名称', trigger: 'blur' }],
}

// ===== 数据加载 =====
const 加载套餐列表 = async () => {
  加载中.value = true
  try {
    const 响应 = await 获取套餐列表API({ business_type: 当前业务类型.value })
    套餐列表.value = 响应.data?.data || []
  } catch {
    ElMessage.error('加载套餐列表失败')
  } finally {
    加载中.value = false
  }
}

const 切换业务类型 = () => {
  加载套餐列表()
}

// ===== 工具函数 =====
const 账号类型标签 = (type) => {
  const map = { phone: '手机号', wechat: '微信号', qq: 'QQ号', email: '邮箱', other: '其他' }
  return map[type] || type
}

const 库存样式 = (stock) => {
  if (stock === undefined || stock === null) return 'info'
  if (stock === 0) return 'danger'
  if (stock < 10) return 'warning'
  return 'success'
}

// 选择账号类型时自动填充标签
const 自动填充标签 = (type) => {
  if (!表单数据.topup_account_label) {
    const map = { phone: '请输入手机号', wechat: '请输入微信号', qq: '请输入QQ号', email: '请输入邮箱', other: '请输入账号' }
    表单数据.topup_account_label = map[type] || ''
  }
}

// ===== 弹窗操作 =====
const 打开新建弹窗 = () => {
  当前编辑ID.value = null
  重置表单()
  弹窗可见.value = true
}

const 打开编辑弹窗 = (行) => {
  当前编辑ID.value = 行.id
  Object.assign(表单数据, {
    product_name: 行.product_name || '',
    service_type: 行.service_type || '',
    service_hours: 行.service_hours || 0,
    cost_price: 行.cost_price || 0,
    status: 行.status ?? 1,
    remark: 行.remark || '',
    topup_account_type: 行.topup_account_type || '',
    topup_account_label: 行.topup_account_label || '',
    topup_member_name: 行.topup_member_name || '',
    topup_member_icon: 行.topup_member_icon || '',
    topup_arrival_time: 行.topup_arrival_time || '',
    topup_show_expired: 行.topup_show_expired || 0,
    topup_steps: 行.topup_steps || '',
    topup_account_regex: 行.topup_account_regex || '',
    topup_account_error_msg: 行.topup_account_error_msg || '',
  })
  弹窗可见.value = true
}

const 重置表单 = () => {
  Object.assign(表单数据, {
    product_name: '', service_type: '', service_hours: 0,
    cost_price: 0, status: 1, remark: '',
    topup_account_type: '', topup_account_label: '', topup_member_name: '',
    topup_member_icon: '', topup_arrival_time: '', topup_show_expired: 0,
    topup_steps: '', topup_account_regex: '', topup_account_error_msg: '',
  })
  表单引用.value?.clearValidate()
}

const 提交表单 = async () => {
  await 表单引用.value?.validate()
  提交中.value = true
  try {
    const 数据 = {
      ...表单数据,
      business_type: 当前业务类型.value,
    }
    if (当前编辑ID.value) {
      await 更新套餐API(当前编辑ID.value, 数据)
      ElMessage.success('套餐更新成功')
    } else {
      await 新增套餐API(数据)
      ElMessage.success('套餐新建成功')
    }
    弹窗可见.value = false
    加载套餐列表()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '操作失败，请稍后重试')
  } finally {
    提交中.value = false
  }
}

// ===== 状态切换 =====
const 切换状态 = async (行, 启用) => {
  try {
    await 更新套餐API(行.id, { status: 启用 ? 1 : 0 })
    行.status = 启用 ? 1 : 0
    ElMessage.success(启用 ? '套餐已启用' : '套餐已禁用')
  } catch {
    ElMessage.error('状态切换失败')
  }
}

// ===== 删除 =====
const 删除套餐 = async (行) => {
  await ElMessageBox.confirm(
    `确定要删除套餐「${行.product_name}」吗？\n注意：如有未使用卡密将无法删除。`,
    '确认删除',
    { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
  )
  try {
    const 响应 = await 删除套餐API(行.id)
    if (响应.data?.code === 1) {
      ElMessage.success('套餐已删除')
      加载套餐列表()
    } else {
      ElMessage.warning(响应.data?.message || '删除失败')
    }
  } catch {
    ElMessage.error('删除失败，请稍后重试')
  }
}

onMounted(() => {
  加载套餐列表()
})
</script>

<style scoped>
.套餐管理容器 {
  padding: 0;
}

.页面标题 {
  margin-bottom: 20px;
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

.操作栏 {
  margin: 16px 0;
  display: flex;
  justify-content: flex-end;
}

.字段提示 {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
