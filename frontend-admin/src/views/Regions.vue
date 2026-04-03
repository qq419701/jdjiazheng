<template>
  <!-- 地区管理页面 -->
  <div class="地区管理">
    <!-- 提示信息 -->
    <el-alert
      title="地区数据已内置全国数据，如需自定义可手动添加或编辑。"
      type="info"
      :closable="false"
      style="margin-bottom: 16px"
    />

    <!-- 搜索区域 -->
    <el-card class="搜索卡片">
      <el-form :inline="true" :model="搜索条件">
        <el-form-item label="名称">
          <el-input v-model="搜索条件.name" placeholder="地区名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="代码">
          <el-input v-model="搜索条件.code" placeholder="地区代码" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="搜索条件.level" clearable placeholder="全部级别" style="width: 120px">
            <el-option label="省" value="province" />
            <el-option label="市" value="city" />
            <el-option label="区/县" value="district" />
            <el-option label="街道" value="street" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="搜索地区" :icon="Search">搜索</el-button>
          <el-button @click="重置筛选">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card>
      <el-row justify="end" style="margin-bottom: 16px">
        <el-button type="primary" @click="打开新增弹窗">+ 新增地区</el-button>
      </el-row>

      <!-- 表格 -->
      <el-table :data="地区列表" v-loading="加载中" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="code" label="代码" width="150" />
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="级别标签类型(row.level)" size="small">{{ 级别文字(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parent_id" label="父级ID" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_enabled ? 'success' : 'info'" size="small">
              {{ row.is_enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="打开编辑弹窗(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="删除地区(row)">删除</el-button>
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
        @change="加载地区列表"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="显示编辑弹窗"
      :title="编辑中地区 ? '编辑地区' : '新增地区'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="编辑表单" :rules="表单规则" ref="编辑表单引用" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="编辑表单.name" placeholder="地区名称" />
        </el-form-item>
        <el-form-item label="代码" prop="code">
          <el-input v-model="编辑表单.code" placeholder="地区代码（如：110000）" />
        </el-form-item>
        <el-form-item label="级别" prop="level">
          <el-select v-model="编辑表单.level" placeholder="选择级别" style="width: 100%">
            <el-option label="省" value="province" />
            <el-option label="市" value="city" />
            <el-option label="区/县" value="district" />
            <el-option label="街道" value="street" />
          </el-select>
        </el-form-item>
        <el-form-item label="父级ID">
          <el-input-number v-model="编辑表单.parent_id" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="编辑表单.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="编辑表单.is_enabled"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示编辑弹窗 = false">取消</el-button>
        <el-button type="primary" :loading="提交中" @click="提交表单">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { 获取地区列表API, 新增地区API, 更新地区API, 删除地区API } from '../api/index'

const 加载中 = ref(false)
const 提交中 = ref(false)
const 地区列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)

const 搜索条件 = ref({
  name: '',
  code: '',
  level: '',
})

// 弹窗状态
const 显示编辑弹窗 = ref(false)
const 编辑中地区 = ref(null)
const 编辑表单引用 = ref(null)
const 编辑表单 = ref({
  name: '',
  code: '',
  level: 'province',
  parent_id: 0,
  sort: 0,
  is_enabled: 1,
})

const 表单规则 = {
  name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入地区代码', trigger: 'blur' }],
  level: [{ required: true, message: '请选择级别', trigger: 'change' }],
}

// 级别文字映射
const 级别文字 = (level) => {
  const 映射 = { province: '省', city: '市', district: '区/县', street: '街道' }
  return 映射[level] || level
}

// 级别标签类型
const 级别标签类型 = (level) => {
  const 映射 = { province: 'danger', city: 'warning', district: 'success', street: '' }
  return 映射[level] || 'info'
}

// 加载地区列表
const 加载地区列表 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取地区列表API({
      page: 当前页.value,
      limit: 每页数量.value,
      ...搜索条件.value,
    })
    if (结果.code === 1) {
      地区列表.value = 结果.data.list
      总数.value = 结果.data.total
    }
  } finally {
    加载中.value = false
  }
}

const 搜索地区 = () => {
  当前页.value = 1
  加载地区列表()
}

const 重置筛选 = () => {
  搜索条件.value = { name: '', code: '', level: '' }
  搜索地区()
}

// 打开新增弹窗
const 打开新增弹窗 = () => {
  编辑中地区.value = null
  编辑表单.value = { name: '', code: '', level: 'province', parent_id: 0, sort: 0, is_enabled: 1 }
  显示编辑弹窗.value = true
}

// 打开编辑弹窗
const 打开编辑弹窗 = (行) => {
  编辑中地区.value = 行
  编辑表单.value = {
    name: 行.name,
    code: 行.code,
    level: 行.level,
    parent_id: 行.parent_id || 0,
    sort: 行.sort || 0,
    is_enabled: 行.is_enabled,
  }
  显示编辑弹窗.value = true
}

// 提交表单
const 提交表单 = async () => {
  const 表单 = 编辑表单引用.value
  if (!表单) return
  try {
    await 表单.validate()
  } catch {
    return
  }
  提交中.value = true
  try {
    if (编辑中地区.value) {
      await 更新地区API(编辑中地区.value.id, 编辑表单.value)
      ElMessage.success('更新成功')
    } else {
      await 新增地区API(编辑表单.value)
      ElMessage.success('新增成功')
    }
    显示编辑弹窗.value = false
    加载地区列表()
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    提交中.value = false
  }
}

// 删除地区
const 删除地区 = async (行) => {
  try {
    await ElMessageBox.confirm(`确认删除地区「${行.name}」吗？`, '提示', { type: 'warning' })
    await 删除地区API(行.id)
    ElMessage.success('删除成功')
    加载地区列表()
  } catch {}
}

onMounted(() => 加载地区列表())
</script>

<style scoped>
.搜索卡片 { margin-bottom: 16px; }
.分页器 { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
