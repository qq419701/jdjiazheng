<template>
  <!-- 生成充值卡密页面 -->
  <div class="充值卡密生成">
    <el-card style="max-width: 720px">
      <template #header>
        <div>批量生成充值卡密</div>
      </template>

      <el-form :model="表单" label-width="140px">
        <!-- 生成数量 -->
        <el-form-item label="生成数量">
          <el-input-number v-model="表单.count" :min="1" :max="1000" style="width: 200px" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">最多1000个</span>
        </el-form-item>

        <!-- 充值账号类型 -->
        <el-form-item label="充值账号类型">
          <el-select v-model="表单.topup_account_type" style="width: 200px" @change="自动填充账号标签">
            <el-option label="手机号 (phone)" value="phone" />
            <el-option label="微信号 (wechat)" value="wechat" />
            <el-option label="QQ号 (qq)" value="qq" />
            <el-option label="邮箱 (email)" value="email" />
            <el-option label="自定义 (other)" value="other" />
          </el-select>
        </el-form-item>

        <!-- 账号输入框标签 -->
        <el-form-item label="账号输入标签">
          <el-input v-model="表单.topup_account_label" placeholder="前端输入框的提示文字" style="width: 300px" />
          <el-button size="small" style="margin-left: 8px" @click="自动填充账号标签(表单.topup_account_type)">智能填充</el-button>
          <div class="字段说明">显示在充值H5前端输入框上方，如：请输入手机号</div>
        </el-form-item>

        <!-- 充值会员名称 -->
        <el-form-item label="充值会员名称">
          <el-input v-model="表单.topup_member_name" placeholder="如：优酷年卡、爱奇艺季卡、腾讯视频月卡" style="width: 300px" />
        </el-form-item>

        <!-- 会员图标URL -->
        <el-form-item label="会员图标URL">
          <el-input v-model="表单.topup_member_icon" placeholder="可选，显示在顶部Banner旁" style="width: 300px" />
        </el-form-item>

        <!-- 预计到账时间 -->
        <el-form-item label="预计到账时间">
          <el-input v-model="表单.topup_arrival_time" placeholder="如：1-6小时" style="width: 200px" />
          <div style="margin-top: 6px">
            <el-button size="small" v-for="时间 in 到账时间快捷选项" :key="时间" style="margin-right: 4px; margin-bottom: 4px" @click="表单.topup_arrival_time = 时间">{{ 时间 }}</el-button>
          </div>
        </el-form-item>

        <!-- 是否显示到期选项 -->
        <el-form-item label="显示到期选项">
          <el-switch v-model="显示到期选项开关" @change="表单.topup_show_expired = 显示到期选项开关 ? 1 : 0" />
          <div class="字段说明">开启后，充值H5会显示"会员是否已到期"的是/否单选（某些充值不需要此选项）</div>
        </el-form-item>

        <!-- 充值步骤说明 -->
        <el-form-item label="充值步骤说明">
          <el-input v-model="表单.topup_steps" placeholder="如：①填写充值账号 ②接听客服电话 ③充值成功" style="width: 400px" />
          <div style="margin-top: 6px">
            <el-button size="small" @click="表单.topup_steps = '①填写充值账号 ②接听人工客服电话 ③充值成功'">快捷填充步骤</el-button>
          </div>
          <div class="字段说明">显示在充值H5前端的操作步骤引导</div>
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="批次备注">
          <el-input v-model="表单.remark" placeholder="内部备注，不显示在前端（可选）" style="width: 300px" />
        </el-form-item>

        <!-- 过期时间 -->
        <el-form-item label="过期时间">
          <el-date-picker v-model="表单.expired_at" type="datetime" placeholder="选择过期时间（可选）" style="width: 220px" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="生成中" @click="生成卡密">
            🎫 生成充值卡密
          </el-button>
          <el-button @click="$router.push('/admin/topup-cards')">返回</el-button>
        </el-form-item>
      </el-form>

      <!-- 生成结果 -->
      <div v-if="生成结果" class="生成结果区">
        <el-alert
          :title="`已成功生成 ${生成结果.codes.length} 个充值卡密，批次号：${生成结果.batch_no}`"
          type="success"
          :closable="false"
          style="margin-bottom: 12px"
        />

        <!-- 运营使用说明 -->
        <div class="运营说明框">
          <pre class="运营说明内容">{{ 运营说明文字 }}</pre>
        </div>

        <div style="margin-bottom: 12px">
          <el-button type="primary" @click="复制所有链接">复制所有完整链接（{{ 生成结果.codes.length }}个）</el-button>
          <el-button @click="复制所有卡密">复制仅卡密</el-button>
        </div>

        <div class="卡密预览">
          <div v-for="code in 生成结果.codes.slice(0, 20)" :key="code" class="卡密行">
            <span class="卡密文字">{{ code }}</span>
            <span v-if="站点域名" class="链接文字"> → {{ 站点域名 }}/cz/{{ code }}</span>
          </div>
          <div v-if="生成结果.codes.length > 20" class="更多提示">
            ... 还有 {{ 生成结果.codes.length - 20 }} 个
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 生成充值卡密API, 获取设置API } from '../api/index'

const 站点域名 = ref('')
const 生成中 = ref(false)
const 生成结果 = ref(null)
const 显示到期选项开关 = ref(false)

// 到账时间快捷选项
const 到账时间快捷选项 = ['1小时内', '1-6小时', '24小时内', '即时到账']

const 表单 = ref({
  count: 10,
  topup_account_type: 'phone',
  topup_account_label: '请输入手机号',
  topup_member_name: '',
  topup_member_icon: '',
  topup_arrival_time: '1-6小时',
  topup_show_expired: 0,
  topup_steps: '①填写充值账号 ②接听人工客服电话 ③充值成功',
  remark: '',
  expired_at: null,
})

// 账号标签自动填充
const 默认账号标签 = {
  phone: '请输入手机号',
  wechat: '请输入微信号',
  qq: '请输入QQ号',
  email: '请输入邮箱',
  other: '请输入账号',
}

const 自动填充账号标签 = (类型) => {
  表单.value.topup_account_label = 默认账号标签[类型] || '请输入账号'
}

// 运营说明文字
const 运营说明文字 = computed(() => {
  if (!生成结果.value) return ''
  const t = 表单.value
  return `
═══════ 运营使用说明 ═══════
🔗 充值链接格式：${站点域名.value || '域名'}/cz/卡密码
💎 充值会员：${t.topup_member_name || '（未设置）'}
📱 需收集账号类型：${账号类型中文(t.topup_account_type)}
📝 前端输入提示：${t.topup_account_label}
⏱  预计到账时间：${t.topup_arrival_time || '（未设置）'}
🔍 是否显示到期选项：${t.topup_show_expired ? '是' : '否'}
📋 充值步骤：${t.topup_steps || '（未设置）'}
════════════════════════════`
})

const 账号类型中文 = (类型) => {
  const 映射 = { phone: '手机号', wechat: '微信号', qq: 'QQ号', email: '邮箱', other: '自定义' }
  return 映射[类型] || 类型
}

onMounted(async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) 站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
  } catch {}
})

const 生成卡密 = async () => {
  if (!表单.value.topup_member_name) {
    ElMessage.warning('请输入充值会员名称')
    return
  }
  生成中.value = true
  生成结果.value = null
  try {
    const 结果 = await 生成充值卡密API({
      ...表单.value,
      expired_at: 表单.value.expired_at ? new Date(表单.value.expired_at).toISOString() : null,
    })
    if (结果.code === 1) {
      生成结果.value = 结果.data
      ElMessage.success(`成功生成 ${结果.data.codes.length} 个充值卡密！`)
    } else {
      ElMessage.warning(结果.message || '生成失败')
    }
  } catch { ElMessage.error('生成失败，请重试') } finally { 生成中.value = false }
}

const 复制所有链接 = () => {
  if (!生成结果.value) return
  const 链接列表 = 生成结果.value.codes.map(code => `${站点域名.value}/cz/${code}`).join('\n')
  navigator.clipboard.writeText(链接列表).then(() => ElMessage.success(`已复制 ${生成结果.value.codes.length} 个链接`)).catch(() => ElMessage.error('复制失败'))
}

const 复制所有卡密 = () => {
  if (!生成结果.value) return
  const 只卡密 = 生成结果.value.codes.join('\n')
  navigator.clipboard.writeText(只卡密).then(() => ElMessage.success(`已复制 ${生成结果.value.codes.length} 个卡密`)).catch(() => ElMessage.error('复制失败'))
}
</script>

<style scoped>
.充值卡密生成 { padding: 0; }
.字段说明 { font-size: 12px; color: #999; margin-top: 4px; }
.生成结果区 { margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; }

/* 运营说明框 */
.运营说明框 {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
.运营说明内容 {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #92400e;
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.8;
}

/* 卡密预览 */
.卡密预览 {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f9fafb;
  max-height: 400px;
  overflow-y: auto;
}

.卡密行 {
  font-size: 13px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.卡密行:last-child { border-bottom: none; }

.卡密文字 {
  font-family: monospace;
  color: #333;
  font-weight: 600;
}

.链接文字 {
  color: #409eff;
  font-size: 12px;
}

.更多提示 {
  text-align: center;
  color: #999;
  padding: 8px 0;
  font-size: 13px;
}
</style>
