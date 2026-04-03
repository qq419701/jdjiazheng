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
            <el-option label="省" :value="1" />
            <el-option label="市" :value="2" />
            <el-option label="区/县" :value="3" />
            <el-option label="街道/乡镇" :value="4" />
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
        <el-button type="warning" @click="显示导入向导 = true; 导入步骤 = 0">📥 导入数据向导</el-button>
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
            <el-option label="省" :value="1" />
            <el-option label="市" :value="2" />
            <el-option label="区/县" :value="3" />
            <el-option label="街道/乡镇" :value="4" />
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

    <!-- ===== 地区数据导入向导弹窗 ===== -->
    <el-dialog
      v-model="显示导入向导"
      title="📥 地区数据导入向导"
      width="720px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <el-steps :active="导入步骤" finish-status="success" style="margin-bottom: 24px">
        <el-step title="下载数据" />
        <el-step title="了解格式" />
        <el-step title="上传导入" />
        <el-step title="验证结果" />
      </el-steps>

      <!-- 第1步：下载数据 -->
      <div v-if="导入步骤 === 0">
        <el-alert type="warning" :closable="false"
          title="街道数据全国约4万条，需要手动下载后导入。请选择以下任一方式下载数据文件："
          style="margin-bottom: 16px" />

        <el-card shadow="never" style="margin-bottom: 16px">
          <template #header>
            <strong>🌐 方式一：Gitee 镜像（推荐，国内直接访问）</strong>
          </template>
          <p style="margin:0 0 8px">网址：<a href="https://gitee.com/modood/Administrative-divisions-of-China"
            target="_blank" style="color:#409eff;word-break:break-all">
            https://gitee.com/modood/Administrative-divisions-of-China</a></p>
          <ol style="margin:0;padding-left:20px;line-height:2.2">
            <li>打开上方 Gitee 网址（无需注册，直接访问）</li>
            <li>点击右上角橙色「克隆/下载」按钮 → 选择「下载 ZIP」</li>
            <li>解压 ZIP，找到这4个文件：<br>
              <code>provinces.csv</code>（省，34条） /
              <code>cities.csv</code>（市，约340条） /
              <code>areas.csv</code>（区县，约3000条） /
              <code>streets.csv</code>（街道，约4万条）
            </li>
            <li>按顺序导入：先 provinces.csv → cities.csv → areas.csv → streets.csv</li>
          </ol>
          <el-alert type="info" :closable="false" style="margin-top:8px"
            title="⚠️ 注意：该数据文件中的 parent 字段是行政区划代码，不是数据库 id。需要在第2步了解如何处理。" />
        </el-card>

        <el-card shadow="never">
          <template #header>
            <strong>🏛️ 方式二：国家统计局官方数据（权威但需手动整理）</strong>
          </template>
          <p style="margin:0 0 8px">网址：<a href="https://www.stats.gov.cn/sj/tjbz/qhdm/"
            target="_blank" style="color:#409eff;word-break:break-all">
            https://www.stats.gov.cn/sj/tjbz/qhdm/</a></p>
          <ol style="margin:0;padding-left:20px;line-height:2.2">
            <li>打开上方网址</li>
            <li>找到最新年份的行政区划代码，点击下载 Excel 文件</li>
            <li>⚠️ 官方数据是 Excel 格式，需要自行整理成本系统所需的 CSV 格式</li>
            <li>建议初学者优先使用方式一，格式已整理好，可直接导入</li>
          </ol>
        </el-card>
      </div>

      <!-- 第2步：了解格式 -->
      <div v-if="导入步骤 === 1">
        <el-alert type="error" :closable="false" style="margin-bottom:16px"
          title="⚠️ 重要：本系统的 parent_id 是数据库自增 id（不是行政区划代码），必须按顺序导入！" />

        <p style="font-weight:600;margin-bottom:8px">本系统 CSV 格式（第一行是表头，必须保留）：</p>
        <pre style="background:#f5f7fa;padding:12px;border-radius:4px;font-size:13px;margin-bottom:8px;overflow:auto">name,code,parent_id,level,is_enabled,sort
北京市,110000,0,1,1,0
天津市,120000,0,1,1,0
上海市,310000,0,1,1,0
重庆市,500000,0,1,1,0</pre>
        <el-button size="small" @click="复制示例CSV" style="margin-bottom:16px">📋 复制示例 CSV</el-button>

        <el-table :data="字段说明列表" border size="small" style="margin-bottom:16px">
          <el-table-column prop="字段" label="字段名" width="110" />
          <el-table-column prop="说明" label="说明" />
          <el-table-column prop="示例" label="示例值" width="130" />
        </el-table>

        <p style="font-weight:600;margin-bottom:8px">导入完省后，用以下 SQL 查询省份 id（用作市的 parent_id）：</p>
        <pre style="background:#f5f7fa;padding:12px;border-radius:4px;font-size:13px;margin-bottom:8px;overflow:auto">-- 查询省份 id：
SELECT id, name FROM regions WHERE level=1 ORDER BY id;

-- 查询城市 id（含省份名）：
SELECT r.id, r.name, p.name as 省份
FROM regions r LEFT JOIN regions p ON r.parent_id=p.id
WHERE r.level=2 ORDER BY r.id;</pre>
        <el-button size="small" @click="复制查询SQL">📋 复制查询 SQL</el-button>
      </div>

      <!-- 第3步：上传导入 -->
      <div v-if="导入步骤 === 2">
        <el-alert type="warning" :closable="false" style="margin-bottom:16px"
          title="每次上传会【追加】数据，不会清空已有数据。如担心重复，请先在第4步检查现有数量。" />
        <p style="margin-bottom:12px">选择 CSV 文件（仅支持 .csv，最大 50MB）：</p>
        <el-upload
          :action="CSV上传地址"
          :headers="上传请求头"
          accept=".csv"
          :show-file-list="false"
          :on-success="CSV上传成功"
          :on-error="CSV上传失败"
          :before-upload="上传前检查"
        >
          <el-button type="primary" size="large">📁 选择 CSV 文件并导入</el-button>
        </el-upload>
        <div v-if="上传结果" style="margin-top:16px">
          <el-alert
            :type="上传结果.fail > 0 ? 'warning' : 'success'"
            :closable="false"
            :title="`导入完成！✅ 成功：${上传结果.success} 条  ❌ 失败：${上传结果.fail} 条`"
            style="margin-bottom:8px"
          />
          <el-table v-if="上传结果.errors && 上传结果.errors.length > 0"
            :data="上传结果.errors" border size="small">
            <el-table-column prop="line" label="行号" width="70" />
            <el-table-column prop="reason" label="失败原因" />
          </el-table>
        </div>
      </div>

      <!-- 第4步：验证结果 -->
      <div v-if="导入步骤 === 3">
        <p style="margin-bottom:12px">点击按钮查看当前数据库各级别地区数量：</p>
        <el-button type="primary" @click="检查地区统计" :loading="统计加载中">
          🔍 立即检查数据库
        </el-button>
        <div v-if="地区统计" style="margin-top:16px">
          <el-descriptions border :column="2" title="📊 当前数据库地区数据统计">
            <el-descriptions-item label="🏔️ 省级">
              {{ 地区统计[1]?.total || 0 }} 条（启用 {{ 地区统计[1]?.enabled || 0 }}）
            </el-descriptions-item>
            <el-descriptions-item label="🏙️ 市级">
              {{ 地区统计[2]?.total || 0 }} 条（启用 {{ 地区统计[2]?.enabled || 0 }}）
            </el-descriptions-item>
            <el-descriptions-item label="🏘️ 区县">
              {{ 地区统计[3]?.total || 0 }} 条（启用 {{ 地区统计[3]?.enabled || 0 }}）
            </el-descriptions-item>
            <el-descriptions-item label="🏠 街道">
              {{ 地区统计[4]?.total || 0 }} 条（启用 {{ 地区统计[4]?.enabled || 0 }}）
            </el-descriptions-item>
          </el-descriptions>
          <div style="margin-top:12px">
            <el-alert v-if="(地区统计[1]?.total || 0) === 0" type="error" :closable="false"
              title="❌ 未导入任何省级数据，请回到第3步重新导入" />
            <el-alert
              v-else-if="(地区统计[2]?.total || 0) > 0 && (地区统计[3]?.total || 0) > 0"
              type="success" :closable="false"
              title="✅ 省市区数据正常，用户可以正常选择地址" />
            <el-alert v-if="(地区统计[4]?.total || 0) === 0" type="info" :closable="false"
              title="ℹ️ 暂无街道数据（街道为可选项，不影响正常使用）"
              style="margin-top:8px" />
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="显示导入向导 = false">关闭</el-button>
        <el-button v-if="导入步骤 > 0" @click="导入步骤--">⬅ 上一步</el-button>
        <el-button v-if="导入步骤 < 3" type="primary" @click="导入步骤++">下一步 ➡</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { 获取地区列表API, 新增地区API, 更新地区API, 删除地区API, 获取地区统计API } from '../api/index'

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
  level: 1,
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
  const 映射 = { 1: '省', 2: '市', 3: '区/县', 4: '街道/乡镇' }
  return 映射[level] || level
}

// 级别标签类型
const 级别标签类型 = (level) => {
  const 映射 = { 1: 'danger', 2: 'warning', 3: 'success', 4: '' }
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
  编辑表单.value = { name: '', code: '', level: 1, parent_id: 0, sort: 0, is_enabled: 1 }
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

// ===== 导入向导 =====
const 显示导入向导 = ref(false)
const 导入步骤 = ref(0)
const 上传结果 = ref(null)
const 地区统计 = ref(null)
const 统计加载中 = ref(false)

const CSV上传地址 = computed(() => {
  const token = localStorage.getItem('admin_token') || ''
  return `/admin/api/regions/import-csv?token=${encodeURIComponent(token)}`
})

const 上传请求头 = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
}))

const 字段说明列表 = [
  { 字段: 'name', 说明: '地区名称，必填', 示例: '北京市' },
  { 字段: 'code', 说明: '行政区划代码，可为空', 示例: '110000' },
  { 字段: 'parent_id', 说明: '父级数据库id（省填0，市/区填父级id）', 示例: '0 或 5' },
  { 字段: 'level', 说明: '1=省 2=市 3=区县 4=街道', 示例: '1' },
  { 字段: 'is_enabled', 说明: '1=启用 0=禁用，可留空默认1', 示例: '1' },
  { 字段: 'sort', 说明: '排序权重，可留空默认0', 示例: '0' },
]

const 上传前检查 = (file) => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    ElMessage.error('仅支持 .csv 格式文件')
    return false
  }
  上传结果.value = null
  return true
}

const CSV上传成功 = (response) => {
  if (response.code === 1) {
    上传结果.value = response.data
    ElMessage.success(`导入完成：成功 ${response.data.success} 条，失败 ${response.data.fail} 条`)
  } else {
    ElMessage.error(response.message || '导入失败')
  }
}

const CSV上传失败 = (err) => {
  console.error('CSV上传失败:', err)
  ElMessage.error('上传失败，请检查文件格式或网络连接')
}

const 检查地区统计 = async () => {
  统计加载中.value = true
  try {
    const res = await 获取地区统计API()
    if (res.code === 1) 地区统计.value = res.data
    else ElMessage.error('查询失败')
  } catch {
    ElMessage.error('网络错误')
  } finally {
    统计加载中.value = false
  }
}

const 复制示例CSV = async () => {
  const text = 'name,code,parent_id,level,is_enabled,sort\n北京市,110000,0,1,1,0\n天津市,120000,0,1,1,0\n上海市,310000,0,1,1,0\n重庆市,500000,0,1,1,0'
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制示例 CSV')
  } catch {
    ElMessage.warning('请手动复制上方内容')
  }
}

const 复制查询SQL = async () => {
  const text = '-- 查询省份 id：\nSELECT id, name FROM regions WHERE level=1 ORDER BY id;\n\n-- 查询城市 id（含省份名）：\nSELECT r.id, r.name, p.name as 省份 FROM regions r LEFT JOIN regions p ON r.parent_id=p.id WHERE r.level=2 ORDER BY r.id;'
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制查询 SQL')
  } catch {
    ElMessage.warning('请手动复制上方内容')
  }
}

onMounted(() => 加载地区列表())
</script>

<style scoped>
.搜索卡片 { margin-bottom: 16px; }
.分页器 { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
