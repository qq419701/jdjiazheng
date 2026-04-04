<template>
  <!-- 洗衣卡密生成页面 -->
  <div class="洗衣卡密生成">
    <el-card style="max-width: 640px">
      <template #header>
        <div>批量生成洗衣卡密</div>
      </template>

      <el-form :model="表单" label-width="120px">
        <el-form-item label="生成数量">
          <el-input-number v-model="表单.count" :min="1" :max="1000" style="width: 200px" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">最多1000个</span>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="表单.service_type" placeholder="如：任洗一件" style="width: 300px" />
          <div class="字段说明">显示在洗衣H5前端的商品名称</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="表单.remark" placeholder="批次备注（可选）" style="width: 300px" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="表单.expired_at"
            type="datetime"
            placeholder="选择过期时间（可选）"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="生成中" @click="生成卡密">
            🎫 生成洗衣卡密
          </el-button>
          <el-button @click="$router.push('/admin/laundry-cards')">返回</el-button>
        </el-form-item>
      </el-form>

      <!-- 生成结果 -->
      <div v-if="生成结果" class="生成结果区">
        <el-alert
          :title="`已成功生成 ${生成结果.codes.length} 个洗衣卡密，批次号：${生成结果.batch_no}`"
          type="success"
          :closable="false"
          style="margin-bottom: 12px"
        />
        <el-button type="primary" @click="复制所有链接">复制所有完整链接</el-button>
        <el-button @click="复制所有卡密">复制仅卡密</el-button>
        <div class="卡密预览">
          <div v-for="code in 生成结果.codes.slice(0, 20)" :key="code" class="卡密行">
            {{ 站点域名 ? `${站点域名}/xi/${code}` : code }}
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 生成洗衣卡密API, 获取设置API } from '../api/index'

const 站点域名 = ref('')
const 生成中 = ref(false)
const 生成结果 = ref(null)

const 表单 = ref({
  count: 10,
  service_type: '任洗一件',
  remark: '',
  expired_at: null,
})

const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) 站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
  } catch {}
}

const 生成卡密 = async () => {
  生成中.value = true
  生成结果.value = null
  try {
    const 结果 = await 生成洗衣卡密API({
      count: 表单.value.count,
      service_type: 表单.value.service_type || '任洗一件',
      category: 表单.value.service_type || '任洗一件',
      remark: 表单.value.remark,
      expired_at: 表单.value.expired_at ? new Date(表单.value.expired_at).toISOString() : null,
    })
    if (结果.code === 1) {
      生成结果.value = 结果.data
      ElMessage.success(结果.message)
    } else {
      ElMessage.error(结果.message || '生成失败')
    }
  } catch {
    ElMessage.error('生成失败，请重试')
  } finally {
    生成中.value = false
  }
}

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
    try { document.execCommand('copy') ? resolve() : reject(); document.body.removeChild(el) }
    catch (e) { document.body.removeChild(el); reject(e) }
  })
}

const 复制所有链接 = async () => {
  const 链接列表 = 生成结果.value.codes.map(c => 站点域名.value ? `${站点域名.value}/xi/${c}` : c)
  try { await copyToClipboard(链接列表.join('\n')); ElMessage.success('已复制') }
  catch { ElMessage.error('复制失败') }
}

const 复制所有卡密 = async () => {
  try { await copyToClipboard(生成结果.value.codes.join('\n')); ElMessage.success('已复制') }
  catch { ElMessage.error('复制失败') }
}

onMounted(() => 加载站点域名())
</script>

<style scoped>
.字段说明 { font-size: 12px; color: #999; margin-top: 4px; }
.生成结果区 { margin-top: 24px; padding-top: 24px; border-top: 1px solid #f0f0f0; }
.卡密预览 { margin-top: 12px; background: #f9f9f9; border-radius: 8px; padding: 12px; max-height: 300px; overflow-y: auto; }
.卡密行 { font-family: monospace; font-size: 13px; color: #333; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
.更多提示 { text-align: center; color: #999; font-size: 12px; padding: 8px 0; }
</style>
