<template>
  <!-- 商品管理页面（SUP商品管理） -->
  <div class="商品管理">
    <!-- 顶部操作栏 -->
    <el-card class="搜索卡片">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px">
        <el-form :inline="true" :model="搜索条件">
          <el-form-item label="业务类型">
            <el-select v-model="搜索条件.business_type" clearable placeholder="全部" style="width: 120px">
              <el-option label="家政" value="jiazheng" />
              <el-option label="洗衣" value="xiyifu" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="搜索条件.status" clearable placeholder="全部" style="width: 100px">
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="加载商品列表">搜索</el-button>
            <el-button @click="重置筛选">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="打开新增弹窗">+ 新增商品</el-button>
      </div>
    </el-card>

    <!-- 商品提示 -->
    <el-alert
      title="商品编号由系统自动分配（从1001开始递增），永久不变。将商品编号填入奇所（91卡券）后台关联一次即可，以后补货只需在「卡密管理」中选择该商品生成卡密，无需重新关联。"
      type="info"
      :closable="false"
      style="margin-bottom: 12px"
    />

    <!-- 商品表格 -->
    <el-card>
      <el-table :data="商品列表" v-loading="加载中" stripe>
        <el-table-column prop="product_no" label="商品编号" width="100" />
        <el-table-column prop="product_name" label="商品名称" min-width="160" />
        <el-table-column label="业务类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.business_type === 'xiyifu' ? 'primary' : 'success'" size="small">
              {{ row.business_type === 'xiyifu' ? '洗衣' : '家政' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="service_type" label="服务类型" width="120" />
        <el-table-column label="服务时长" width="100">
          <template #default="{ row }">
            {{ row.service_hours > 0 ? row.service_hours + ' 小时' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="成本价" width="100">
          <template #default="{ row }">
            ¥{{ parseFloat(row.cost_price || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
              @change="切换状态(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="关联卡密数" width="110">
          <template #default="{ row }">
            <span>{{ row.card_count || 0 }} 张</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="打开编辑弹窗(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="确认删除(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑商品弹窗 -->
    <el-dialog
      v-model="显示弹窗"
      :title="是编辑模式 ? '编辑商品' : '新增商品'"
      width="540px"
      :close-on-click-modal="false"
    >
      <el-form :model="表单" label-width="100px" ref="表单引用">
        <el-form-item label="商品编号">
          <span v-if="是编辑模式" style="font-weight:bold; color:#409eff">{{ 表单.product_no }}</span>
          <span v-else style="color:#999">保存后自动分配</span>
        </el-form-item>
        <el-form-item label="商品名称" required>
          <el-input v-model="表单.product_name" placeholder="如：家政日常保洁2小时卡" />
        </el-form-item>
        <el-form-item label="业务类型" required>
          <el-select v-model="表单.business_type" style="width: 100%">
            <el-option label="家政（jiazheng）" value="jiazheng" />
            <el-option label="洗衣（xiyifu）" value="xiyifu" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型">
          <el-input v-model="表单.service_type" placeholder="如：日常保洁、任洗一件" />
        </el-form-item>
        <el-form-item label="服务时长">
          <el-input-number v-model="表单.service_hours" :min="0" :max="24" />
          <span style="margin-left: 8px; color: #999">小时（洗衣填 0）</span>
        </el-form-item>
        <el-form-item label="成本价">
          <el-input-number v-model="表单.cost_price" :min="0" :precision="2" :step="1" />
          <span style="margin-left: 8px; color: #999">元</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="表单.remark" type="textarea" :rows="2" placeholder="（可选）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="表单.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示弹窗 = false">取消</el-button>
        <el-button type="primary" :loading="保存中" @click="保存商品">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取商品列表API, 新增商品API, 更新商品API, 删除商品API } from '../api/index'

const 加载中 = ref(false)
const 保存中 = ref(false)
const 商品列表 = ref([])
const 显示弹窗 = ref(false)
const 是编辑模式 = ref(false)
const 当前编辑ID = ref(null)

const 搜索条件 = ref({
  business_type: '',
  status: '',
})

const 初始表单 = () => ({
  product_no: '',
  product_name: '',
  business_type: 'jiazheng',
  service_type: '',
  service_hours: 0,
  cost_price: 0,
  remark: '',
  status: 1,
})

const 表单 = ref(初始表单())

const 加载商品列表 = async () => {
  加载中.value = true
  try {
    const 参数 = {}
    if (搜索条件.value.business_type) 参数.business_type = 搜索条件.value.business_type
    if (搜索条件.value.status !== '') 参数.status = 搜索条件.value.status
    const 结果 = await 获取商品列表API(参数)
    if (结果.code === 1) {
      商品列表.value = 结果.data
    }
  } finally {
    加载中.value = false
  }
}

const 重置筛选 = () => {
  搜索条件.value = { business_type: '', status: '' }
  加载商品列表()
}

const 打开新增弹窗 = () => {
  是编辑模式.value = false
  当前编辑ID.value = null
  表单.value = 初始表单()
  显示弹窗.value = true
}

const 打开编辑弹窗 = (行) => {
  是编辑模式.value = true
  当前编辑ID.value = 行.id
  表单.value = {
    product_no: 行.product_no,
    product_name: 行.product_name,
    business_type: 行.business_type,
    service_type: 行.service_type || '',
    service_hours: 行.service_hours || 0,
    cost_price: parseFloat(行.cost_price) || 0,
    remark: 行.remark || '',
    status: 行.status,
  }
  显示弹窗.value = true
}

const 保存商品 = async () => {
  if (!表单.value.product_name.trim()) {
    ElMessage.warning('请填写商品名称')
    return
  }
  保存中.value = true
  try {
    let 结果
    if (是编辑模式.value) {
      结果 = await 更新商品API(当前编辑ID.value, 表单.value)
    } else {
      结果 = await 新增商品API(表单.value)
    }
    if (结果.code === 1) {
      ElMessage.success(结果.message)
      显示弹窗.value = false
      加载商品列表()
    } else {
      ElMessage.warning(结果.message || '操作失败')
    }
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    保存中.value = false
  }
}

const 切换状态 = async (行) => {
  try {
    const 结果 = await 更新商品API(行.id, { status: 行.status })
    if (结果.code === 1) {
      ElMessage.success(`商品已${行.status === 1 ? '启用' : '禁用'}`)
    } else {
      // 回滚
      行.status = 行.status === 1 ? 0 : 1
      ElMessage.warning(结果.message || '操作失败')
    }
  } catch {
    行.status = 行.status === 1 ? 0 : 1
    ElMessage.error('操作失败，请重试')
  }
}

const 确认删除 = async (行) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品「${行.product_name}」（编号：${行.product_no}）吗？`,
      '确认删除',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
    )
    const 结果 = await 删除商品API(行.id)
    if (结果.code === 1) {
      ElMessage.success('商品已删除')
      加载商品列表()
    } else {
      ElMessage.warning(结果.message || '删除失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败，请重试')
  }
}

onMounted(() => {
  加载商品列表()
})
</script>

<style scoped>
.商品管理 {
  padding: 0;
}
.搜索卡片 {
  margin-bottom: 12px;
}
</style>
