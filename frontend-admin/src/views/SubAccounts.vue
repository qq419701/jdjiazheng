<template>
  <!-- 子账号管理页面 -->
  <div class="子账号管理">
    <el-card class="顶部操作栏">
      <div style="display:flex; align-items:center; gap:12px">
        <el-button type="primary" @click="打开新增弹窗" :icon="Plus">新增子账号</el-button>
        <el-button @click="打开修改密码弹窗" plain>修改我的密码</el-button>
        <span class="提示文字">子账号可分配模块访问权限，供货商角色仅能查看订单中心</span>
      </div>
    </el-card>

    <el-card>
      <el-table :data="账号列表" v-loading="加载中" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="用户名" width="120">
          <template #default="{ row }">
            <span>{{ row.username }}</span>
            <el-tag v-if="row.nickname && row.nickname !== row.username" size="small" type="info" style="margin-left:6px">{{ row.nickname }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <!-- 角色标签颜色：admin=黄 sub=蓝灰 vendor=绿 -->
            <el-tag
              :type="row.role === 'admin' ? 'warning' : row.role === 'vendor' ? 'success' : 'info'"
              size="small"
            >
              {{ { admin: '管理员', sub: '子账号', vendor: '供货商' }[row.role] || row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限/批次" min-width="200">
          <template #default="{ row }">
            <!-- 管理员：全部权限 -->
            <template v-if="row.role === 'admin'">
              <el-tag type="success" size="small">全部权限</el-tag>
            </template>
            <!-- 供货商：显示绑定批次信息 -->
            <template v-else-if="row.role === 'vendor'">
              <el-tag v-if="解析批次IDs(row.vendor_batch_ids).length" type="primary" size="small" style="margin:2px">
                绑定{{ 解析批次IDs(row.vendor_batch_ids).length }}个批次
              </el-tag>
              <span v-else class="无值">未绑定批次</span>
              <el-tag v-if="row.vendor_business_types" type="info" size="small" style="margin:2px">
                {{ row.vendor_business_types }}
              </el-tag>
            </template>
            <!-- 子账号：显示权限模块 -->
            <template v-else>
              <el-tag
                v-for="权限 in 解析权限(row.permissions)"
                :key="权限"
                size="small"
                type="primary"
                effect="plain"
                style="margin:2px"
              >{{ 权限模块标签[权限] || 权限 }}</el-tag>
              <span v-if="!解析权限(row.permissions).length" class="无值">未授权任何模块</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">{{ row.is_active ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="145">
          <template #default="{ row }">
            <span class="创建时间">{{ 格式化时间(row.last_login) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.remark" class="备注文字">{{ row.remark }}</span>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="打开编辑弹窗(row)">编辑</el-button>
            <el-button size="small" type="warning" @click="打开重置密码弹窗(row)">重置密码</el-button>
            <el-button size="small" type="danger" @click="删除账号(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑子账号弹窗 -->
    <el-dialog v-model="显示编辑弹窗" :title="是新增 ? '新增子账号' : '编辑子账号'" width="580px" :close-on-click-modal="false">
      <el-form :model="编辑表单" label-width="100px">
        <el-form-item label="用户名" v-if="是新增">
          <el-input v-model="编辑表单.username" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item label="密码" v-if="是新增">
          <el-input v-model="编辑表单.password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="编辑表单.nickname" placeholder="显示名称（可选）" />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="编辑表单.role">
            <el-radio value="sub">子账号（按模块授权）</el-radio>
            <el-radio value="admin">管理员（全部权限）</el-radio>
            <el-radio value="vendor">供货商（按批次授权）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="编辑表单.is_active" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="编辑表单.remark" placeholder="备注信息（可选）" />
        </el-form-item>

        <!-- 子账号：权限模块选择 -->
        <el-form-item label="权限模块" v-if="编辑表单.role === 'sub'">
          <el-checkbox-group v-model="编辑表单.permissions">
            <el-checkbox v-for="(标签, key) in 权限模块标签" :key="key" :value="key" style="margin:4px 8px 4px 0">
              {{ 标签 }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- 供货商：批次绑定选择 -->
        <template v-if="编辑表单.role === 'vendor'">
          <el-form-item label="可见业务">
            <el-checkbox-group v-model="编辑表单.vendor_business_types">
              <el-checkbox value="jiazheng">🏠 家政</el-checkbox>
              <el-checkbox value="xiyifu">🧺 洗衣</el-checkbox>
              <el-checkbox value="topup">💳 充值</el-checkbox>
              <el-checkbox value="sjz">⚔️ 三角洲</el-checkbox>
            </el-checkbox-group>
            <div style="font-size:12px;color:#999;margin-top:4px">不选则显示所有业务的订单</div>
          </el-form-item>
          <el-form-item label="绑定批次">
            <div v-if="批次加载中" style="color:#999">加载批次中...</div>
            <div v-else>
              <el-checkbox-group v-model="编辑表单.vendor_batch_ids">
                <div v-for="(批次组, 业务类型) in 批次按业务分组" :key="业务类型" style="margin-bottom:8px">
                  <div style="font-size:12px;color:#666;margin-bottom:4px">
                    {{ { jiazheng:'🏠 家政', xiyifu:'🧺 洗衣', topup:'💳 充值', sjz:'⚔️ 三角洲' }[业务类型] || 业务类型 }}
                  </div>
                  <el-checkbox
                    v-for="批次 in 批次组"
                    :key="批次.id"
                    :value="批次.id"
                    style="margin:2px 8px 2px 0"
                  >
                    {{ 批次.batch_no }}
                    <el-tag v-if="批次.service_type" size="small" style="margin-left:4px">{{ 批次.service_type }}</el-tag>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
              <div v-if="!批次列表.length" style="font-size:12px;color:#ccc">暂无批次，请先生成卡密批次</div>
            </div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="显示编辑弹窗 = false">取消</el-button>
        <el-button type="primary" :loading="保存中" @click="保存账号">{{ 是新增 ? '创建' : '保存' }}</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗（超管给子账号重置） -->
    <el-dialog v-model="显示重置密码弹窗" title="重置密码" width="400px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="新密码">
          <el-input v-model="新密码" type="password" placeholder="至少6位" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示重置密码弹窗 = false">取消</el-button>
        <el-button type="warning" :loading="保存中" @click="确认重置密码">确认重置</el-button>
      </template>
    </el-dialog>

    <!-- 修改自己密码弹窗 -->
    <el-dialog v-model="显示修改密码弹窗" title="修改我的密码" width="400px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="原密码">
          <el-input v-model="修改密码表单.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="修改密码表单.new_password" type="password" placeholder="至少6位" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示修改密码弹窗 = false">取消</el-button>
        <el-button type="primary" :loading="保存中" @click="确认修改密码">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 获取子账号列表API, 新增子账号API, 更新子账号API, 重置子账号密码API, 删除子账号API, 修改自己密码API, 统一获取批次列表API } from '../api/index'

// 所有可授权的模块（新版权限key，与最新路由一致）
const 权限模块标签 = {
  dashboard: '数据看板',
  card_workbench: '卡密工作台',
  template_manager: '套餐管理',
  order_center: '订单中心',
  business_settings: '业务设置',
  regions: '地区管理',
  sub_accounts: '子账号管理',
}

const 格式化时间 = (isoStr) => {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return '-'
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return fmt.format(d).replace(', ', ' ')
}

const 有效权限列表 = Object.keys(权限模块标签)

const 解析权限 = (permissionsJson) => {
  try {
    const list = JSON.parse(permissionsJson || '[]')
    return list.filter(k => 有效权限列表.includes(k))
  } catch { return [] }
}

// 解析供货商绑定的批次ID列表
const 解析批次IDs = (batchIdsJson) => {
  try { return JSON.parse(batchIdsJson || '[]') } catch { return [] }
}

const 加载中 = ref(false)
const 账号列表 = ref([])
const 保存中 = ref(false)

// 批次列表（用于供货商绑定选择）
const 批次列表 = ref([])
const 批次加载中 = ref(false)
// 按业务类型分组的批次
const 批次按业务分组 = computed(() => {
  const 分组 = {}
  for (const 批次 of 批次列表.value) {
    const 类型 = 批次.business_type || 'jiazheng'
    if (!分组[类型]) 分组[类型] = []
    分组[类型].push(批次)
  }
  return 分组
})

// 编辑弹窗
const 显示编辑弹窗 = ref(false)
const 是新增 = ref(true)
const 当前编辑ID = ref(null)
const 编辑表单 = ref({
  username: '', password: '', nickname: '', role: 'sub',
  permissions: [], is_active: 1, remark: '',
  vendor_batch_ids: [],        // 供货商绑定的批次ID列表
  vendor_business_types: [],   // 供货商可见的业务类型列表
})

// 重置密码
const 显示重置密码弹窗 = ref(false)
const 当前重置账号 = ref(null)
const 新密码 = ref('')

// 修改自己密码
const 显示修改密码弹窗 = ref(false)
const 修改密码表单 = ref({ old_password: '', new_password: '' })

// 加载所有批次列表（供货商绑定用）
const 加载批次列表 = async () => {
  批次加载中.value = true
  try {
    const 结果 = await 统一获取批次列表API({})
    if (结果.code === 1) 批次列表.value = 结果.data?.list || 结果.data || []
  } catch { } finally { 批次加载中.value = false }
}

const 加载账号列表 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取子账号列表API()
    if (结果.code === 1) 账号列表.value = 结果.data || []
  } catch { ElMessage.error('加载失败') } finally { 加载中.value = false }
}

const 打开新增弹窗 = () => {
  是新增.value = true
  当前编辑ID.value = null
  编辑表单.value = {
    username: '', password: '', nickname: '', role: 'sub',
    permissions: [], is_active: 1, remark: '',
    vendor_batch_ids: [], vendor_business_types: [],
  }
  显示编辑弹窗.value = true
  // 加载批次列表（供货商绑定选择用）
  加载批次列表()
}

const 打开编辑弹窗 = (行) => {
  是新增.value = false
  当前编辑ID.value = 行.id
  编辑表单.value = {
    username: 行.username,
    nickname: 行.nickname || '',
    role: 行.role,
    permissions: 解析权限(行.permissions),
    is_active: 行.is_active,
    remark: 行.remark || '',
    // 供货商字段
    vendor_batch_ids: 解析批次IDs(行.vendor_batch_ids),
    vendor_business_types: (行.vendor_business_types || '').split(',').filter(Boolean),
  }
  显示编辑弹窗.value = true
  // 加载批次列表（供货商角色需要显示批次选择）
  加载批次列表()
}

const 保存账号 = async () => {
  保存中.value = true
  try {
    if (是新增.value) {
      if (!编辑表单.value.username) return ElMessage.warning('请输入用户名')
      // 构建创建数据（vendor角色不传permissions）
      const 创建数据 = {
        username: 编辑表单.value.username,
        password: 编辑表单.value.password,
        nickname: 编辑表单.value.nickname,
        role: 编辑表单.value.role,
        remark: 编辑表单.value.remark,
      }
      if (编辑表单.value.role === 'vendor') {
        创建数据.vendor_batch_ids = 编辑表单.value.vendor_batch_ids
        创建数据.vendor_business_types = 编辑表单.value.vendor_business_types
      } else {
        创建数据.permissions = 编辑表单.value.permissions
      }
      const 结果 = await 新增子账号API(创建数据)
      if (结果.code === 1) { ElMessage.success('创建成功'); 显示编辑弹窗.value = false; 加载账号列表() }
      else ElMessage.warning(结果.message)
    } else {
      // 构建更新数据（vendor角色不传permissions）
      const 更新数据 = {
        nickname: 编辑表单.value.nickname,
        role: 编辑表单.value.role,
        is_active: 编辑表单.value.is_active,
        remark: 编辑表单.value.remark,
      }
      if (编辑表单.value.role === 'vendor') {
        更新数据.vendor_batch_ids = 编辑表单.value.vendor_batch_ids
        更新数据.vendor_business_types = 编辑表单.value.vendor_business_types
      } else {
        更新数据.permissions = 编辑表单.value.permissions
      }
      const 结果 = await 更新子账号API(当前编辑ID.value, 更新数据)
      if (结果.code === 1) { ElMessage.success('更新成功'); 显示编辑弹窗.value = false; 加载账号列表() }
      else ElMessage.warning(结果.message)
    }
  } catch { ElMessage.error('操作失败') } finally { 保存中.value = false }
}

const 打开重置密码弹窗 = (行) => {
  当前重置账号.value = 行
  新密码.value = ''
  显示重置密码弹窗.value = true
}

const 确认重置密码 = async () => {
  if (!新密码.value || 新密码.value.length < 6) return ElMessage.warning('密码至少6位')
  保存中.value = true
  try {
    const 结果 = await 重置子账号密码API(当前重置账号.value.id, { password: 新密码.value })
    if (结果.code === 1) { ElMessage.success('密码已重置'); 显示重置密码弹窗.value = false }
    else ElMessage.warning(结果.message)
  } catch { ElMessage.error('操作失败') } finally { 保存中.value = false }
}

const 打开修改密码弹窗 = () => {
  修改密码表单.value = { old_password: '', new_password: '' }
  显示修改密码弹窗.value = true
}

const 确认修改密码 = async () => {
  保存中.value = true
  try {
    const 结果 = await 修改自己密码API(修改密码表单.value)
    if (结果.code === 1) { ElMessage.success('密码已修改，下次登录生效'); 显示修改密码弹窗.value = false }
    else ElMessage.warning(结果.message)
  } catch { ElMessage.error('操作失败') } finally { 保存中.value = false }
}

const 删除账号 = async (行) => {
  try {
    await ElMessageBox.confirm(`确认删除子账号 ${行.username} 吗？`, '提示', { type: 'warning' })
    const 结果 = await 删除子账号API(行.id)
    if (结果.code === 1) { ElMessage.success('已删除'); 加载账号列表() }
    else ElMessage.warning(结果.message)
  } catch {}
}

onMounted(() => { 加载账号列表() })
</script>

<style scoped>
.子账号管理 { padding: 0; }
.顶部操作栏 { margin-bottom: 16px; }
.提示文字 { color: #999; font-size: 12px; }
.无值 { color: #ccc; font-size: 12px; }
.创建时间 { font-size: 12px; color: #888; }
.备注文字 { font-size: 12px; color: #555; }
</style>
