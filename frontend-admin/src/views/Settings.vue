<template>
  <!-- 系统设置页面 -->
  <div class="设置页面">
    <el-card v-loading="加载中">
      <template #header><span>⚙️ 系统设置</span></template>

      <el-form :model="设置表单" label-width="120px" style="max-width: 600px">

        <el-form-item label="站点域名">
          <el-input v-model="设置表单.site_url" placeholder="http://39.103.98.34:5500 或 https://yourdomain.com" />
          <div class="字段说明">填写后卡密管理页可一键复制带域名的完整链接</div>
        </el-form-item>

        <el-form-item label="Banner图片URL">
          <el-input v-model="设置表单.banner_url" placeholder="输入Banner图片的URL地址" />
          <div class="字段说明">顶部横幅图片地址，留空显示默认样式</div>
        </el-form-item>

        <el-form-item label="服务类型">
          <el-input v-model="设置表单.service_type" placeholder="如：日常保洁" />
        </el-form-item>

        <el-form-item label="服务时长（小时）">
          <el-input-number v-model="设置表单.service_hours" :min="1" :max="24" />
        </el-form-item>

        <el-form-item label="下单须知">
          <el-input
            v-model="设置表单.notice"
            type="textarea"
            :rows="8"
            placeholder="每行一条须知，换行分隔"
          />
        </el-form-item>

        <el-form-item label="自动下单">
          <el-switch
            v-model="设置表单.auto_order_enabled"
            active-value="1"
            inactive-value="0"
            active-text="开启"
            inactive-text="关闭"
          />
          <div class="字段说明">开启后，新订单会自动触发京东下单流程</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="保存中" @click="保存设置">
            💾 保存设置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 获取设置API, 保存设置API } from '../api/index'

const 加载中 = ref(false)
const 保存中 = ref(false)

const 设置表单 = ref({
  site_url: '',
  banner_url: '',
  service_type: '日常保洁',
  service_hours: 2,
  notice: '',
  auto_order_enabled: '1',
})

const 加载设置 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      const 数据 = 结果.data
      设置表单.value = {
        site_url: 数据.site_url || '',
        banner_url: 数据.banner_url || '',
        service_type: 数据.service_type || '日常保洁',
        service_hours: parseInt(数据.service_hours) || 2,
        notice: 数据.notice || '',
        auto_order_enabled: 数据.auto_order_enabled || '1',
      }
    }
  } finally {
    加载中.value = false
  }
}

const 保存设置 = async () => {
  保存中.value = true
  try {
    await 保存设置API(设置表单.value)
    ElMessage.success('设置保存成功')
  } finally {
    保存中.value = false
  }
}

onMounted(() => 加载设置())
</script>

<style scoped>
.字段说明 {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
