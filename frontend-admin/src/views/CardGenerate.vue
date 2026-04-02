<template>
  <!-- 批量生成卡密页面 -->
  <div class="生成卡密页面">
    <el-button @click="$router.back()" style="margin-bottom: 16px">返回</el-button>

    <el-row :gutter="16">
      <!-- 生成表单 -->
      <el-col :span="10">
        <el-card title="生成参数">
          <template #header><span>⚙️ 生成参数</span></template>
          <el-form :model="表单" label-width="100px">
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
            <el-form-item label="备注">
              <el-input v-model="表单.remark" placeholder="备注信息（可选）" />
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
        <el-card v-if="生成结果.length > 0">
          <template #header>
            <el-row justify="space-between" align="middle">
              <span>✅ 已生成 {{ 生成结果.length }} 个卡密</span>
              <div>
                <el-button size="small" @click="全选复制">📋 全选复制</el-button>
                <el-button size="small" @click="下载TXT">💾 下载TXT</el-button>
              </div>
            </el-row>
          </template>
          <el-input
            type="textarea"
            :value="生成结果.join('\n')"
            :rows="Math.min(生成结果.length + 2, 20)"
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { 生成卡密API } from '../api/index'

const 生成中 = ref(false)
const 生成结果 = ref([])

const 表单 = ref({
  category: '日常保洁',
  service_type: '日常保洁',
  service_hours: 2,
  count: 10,
  remark: '',
  expired_at: null,
})

// 生成卡密
const 生成卡密 = async () => {
  生成中.value = true
  try {
    const 结果 = await 生成卡密API(表单.value)
    if (结果.code === 1) {
      生成结果.value = 结果.data
      ElMessage.success(结果.message)
    }
  } finally {
    生成中.value = false
  }
}

// 全选复制（适配阿奇所发货格式）
const 全选复制 = () => {
  const 内容 = 生成结果.value.join('\n')
  navigator.clipboard.writeText(内容).then(() => {
    ElMessage.success(`已复制 ${生成结果.value.length} 个卡密`)
  }).catch(() => {
    ElMessage.error('复制失败，请手动选择复制')
  })
}

// 下载TXT
const 下载TXT = () => {
  const 内容 = 生成结果.value.join('\n')
  const blob = new Blob([内容], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `卡密_${new Date().toLocaleDateString()}_${生成结果.value.length}个.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}
</script>
