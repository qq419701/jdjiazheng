<template>
  <!-- 批量生成卡密页面 -->
  <div class="生成卡密页面">
    <el-button @click="$router.back()" style="margin-bottom: 16px">返回</el-button>

    <el-row :gutter="16">
      <!-- 生成表单 -->
      <el-col :span="10">
        <el-card>
          <template #header><span>⚙️ 生成参数</span></template>
          <el-form :model="表单" label-width="100px">
            <el-form-item label="业务类型">
              <el-select v-model="表单.business_type" style="width: 100%">
                <el-option label="京东家政" value="jiazheng" />
                <el-option label="京东洗衣服" value="xiyifu" />
              </el-select>
            </el-form-item>
            <el-form-item label="服务分类">
              <el-input v-model="表单.category" placeholder="如：日常保洁" />
            </el-form-item>
            <el-form-item label="服务类型">
              <el-input v-model="表单.service_type" placeholder="如：日常保洁" />
            </el-form-item>
            <el-form-item label="服务时长">
              <el-input-number v-model="表单.service_hours" :min="1" :max="24" />
              <span style="margin-left: 8px; color: #999">小时</span>
            </el-form-item>
            <el-form-item label="生成数量">
              <el-input-number v-model="表单.count" :min="1" :max="1000" />
            </el-form-item>
            <el-form-item label="批次备注">
              <el-input v-model="表单.remark" placeholder="如：4月第一批、测试批次" />
            </el-form-item>
            <el-form-item label="过期时间">
              <el-date-picker v-model="表单.expired_at" type="datetime" placeholder="选择过期时间（可选）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="生成中" @click="生成卡密">
                {{ 生成中 ? '生成中...' : `🎲 生成 ${表单.count} 个卡密` }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 生成结果 -->
      <el-col :span="14">
        <el-card v-if="生成结果.codes && 生成结果.codes.length > 0">
          <template #header>
            <span>✅ 生成成功！批次号：{{ 生成结果.batch_no }}，共生成 {{ 生成结果.codes.length }} 条卡密</span>
          </template>

          <!-- 操作按钮区 -->
          <el-row :gutter="8" style="margin-bottom: 16px">
            <el-col>
              <el-button type="primary" @click="一键复制完整链接">一键复制完整链接</el-button>
              <el-button @click="一键复制仅卡密">一键复制仅卡密</el-button>
              <el-button @click="下载TXT">下载TXT文件</el-button>
              <el-button type="success" @click="$router.push(`/admin/cards/${表单.business_type}`)">查看批次管理</el-button>
            </el-col>
          </el-row>

          <!-- 预览列表 -->
          <div class="预览标题">预览（显示全部）：</div>
          <el-input
            type="textarea"
            :value="预览内容"
            :rows="Math.min(生成结果.codes.length + 2, 20)"
            readonly
            style="font-family: monospace; font-size: 13px;"
          />
        </el-card>
        <el-empty v-else description="点击生成按钮生成卡密" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 生成卡密API, 获取设置API } from '../api/index'

const route = useRoute()

// 兼容HTTP和HTTPS环境的复制函数
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

const 生成中 = ref(false)
// 生成结果包含 codes 数组、batch_no 批次号
const 生成结果 = ref({ codes: [], batch_no: '' })
// 站点域名（从系统设置读取）
const 站点域名 = ref('')

const 表单 = ref({
  category: '日常保洁',
  service_type: '日常保洁',
  service_hours: 2,
  count: 10,
  remark: '',
  expired_at: null,
  business_type: route.params.businessType || 'jiazheng',
})

// 计算预览内容（有域名显示完整链接，否则只显示卡密）
const 预览内容 = computed(() => {
  if (!生成结果.value.codes || 生成结果.value.codes.length === 0) return ''
  if (站点域名.value) {
    return 生成结果.value.codes.map(code => `${站点域名.value}/${code}`).join('\n')
  }
  return 生成结果.value.codes.join('\n')
})

// 加载站点域名
const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
    }
  } catch {}
}

// 生成卡密
const 生成卡密 = async () => {
  生成中.value = true
  try {
    // 先加载最新域名配置
    await 加载站点域名()
    const 结果 = await 生成卡密API(表单.value)
    if (结果.code === 1) {
      生成结果.value = {
        codes: 结果.data.codes,
        batch_no: 结果.data.batch_no,
        batch_id: 结果.data.batch_id,
      }
      ElMessage.success(结果.message)
    }
  } finally {
    生成中.value = false
  }
}

// 一键复制完整链接
const 一键复制完整链接 = () => {
  const codes = 生成结果.value.codes
  if (!站点域名.value) {
    copyToClipboard(codes.join('\n'))
      .then(() => ElMessage.warning('请先在系统设置中配置站点域名，已复制仅卡密'))
      .catch(() => ElMessage.error('复制失败，请手动复制'))
    return
  }
  const 内容 = codes.map(code => `${站点域名.value}/${code}`).join('\n')
  copyToClipboard(内容)
    .then(() => ElMessage.success(`已复制${codes.length}条完整链接`))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

// 一键复制仅卡密
const 一键复制仅卡密 = () => {
  const 内容 = 生成结果.value.codes.join('\n')
  copyToClipboard(内容)
    .then(() => ElMessage.success(`已复制${生成结果.value.codes.length}个卡密`))
    .catch(() => ElMessage.error('复制失败，请手动复制'))
}

// 下载TXT文件
const 下载TXT = () => {
  const 文件名 = 生成结果.value.batch_no || `卡密_${Date.now()}`
  const 内容 = 预览内容.value
  const blob = new Blob([内容], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${文件名}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}

// 页面加载时获取域名
加载站点域名()
</script>

<style scoped>
.预览标题 {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
</style>
