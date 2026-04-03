<template>
  <!-- 系统设置页面 -->
  <div class="设置页面">
    <el-tabs v-model="当前标签" type="border-card" v-loading="加载中">

      <!-- ===== Tab 1：通用设置 ===== -->
      <el-tab-pane label="⚙️ 通用设置" name="general">
        <el-form :model="设置表单" label-width="140px" style="max-width: 640px">
          <el-form-item label="站点域名">
            <el-input v-model="设置表单.site_url" placeholder="http://39.103.98.34:5500 或 https://yourdomain.com" />
            <div class="字段说明">填写后卡密管理页可一键复制带域名的完整链接</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('general')">
              💾 保存通用设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 2：京东家政设置 ===== -->
      <el-tab-pane label="🏠 京东家政设置" name="jiazheng">
        <el-form :model="设置表单" label-width="140px" style="max-width: 640px">
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
            <el-button type="primary" :loading="保存中" @click="保存设置('jiazheng')">
              💾 保存家政设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 3：京东洗衣API设置 ===== -->
      <el-tab-pane label="👕 洗衣API设置" name="laundry">
        <el-form :model="设置表单" label-width="160px" style="max-width: 680px">
          <el-form-item label="洗衣订单API地址">
            <el-input v-model="设置表单.laundry_api_url" placeholder="https://api.example.com/orders" />
          </el-form-item>
          <el-form-item label="洗衣API AppID">
            <el-input v-model="设置表单.laundry_app_id" placeholder="AppID" />
          </el-form-item>
          <el-form-item label="洗衣API AppSecret">
            <el-input v-model="设置表单.laundry_app_secret" type="password" placeholder="AppSecret" show-password />
          </el-form-item>
          <el-form-item label="洗衣API Token">
            <el-input v-model="设置表单.laundry_api_token" type="password" placeholder="API Token" show-password />
          </el-form-item>
          <el-form-item label="快递API地址">
            <el-input v-model="设置表单.express_api_url" placeholder="https://api.express.com" />
          </el-form-item>
          <el-form-item label="快递API Key">
            <el-input v-model="设置表单.express_api_key" type="password" placeholder="API Key" show-password />
          </el-form-item>
          <el-form-item label="快递API Secret">
            <el-input v-model="设置表单.express_api_secret" type="password" placeholder="API Secret" show-password />
          </el-form-item>
          <el-form-item label="洗衣自动下单">
            <el-switch
              v-model="设置表单.laundry_auto_order_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后新洗衣订单自动调用洗衣订单API</div>
          </el-form-item>
          <el-form-item label="洗衣自动取件">
            <el-switch
              v-model="设置表单.laundry_auto_express_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后下单成功自动调用快递API安排取件</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('laundry')">
              💾 保存洗衣API设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 4：地区管理 ===== -->
      <el-tab-pane label="🗺️ 地区管理" name="regions">
        <el-alert
          title="地区数据已内置全国数据，如需自定义可前往地区管理页面手动添加或编辑。"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        />
        <el-button type="primary" @click="$router.push('/admin/regions')">
          🗺️ 前往地区管理
        </el-button>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 获取设置API, 保存设置API } from '../api/index'

const router = useRouter()
const 加载中 = ref(false)
const 保存中 = ref(false)
const 当前标签 = ref('general')

const 设置表单 = ref({
  site_url: '',
  banner_url: '',
  service_type: '日常保洁',
  service_hours: 2,
  notice: '',
  auto_order_enabled: '1',
  laundry_api_url: '',
  laundry_app_id: '',
  laundry_app_secret: '',
  laundry_api_token: '',
  express_api_url: '',
  express_api_key: '',
  express_api_secret: '',
  laundry_auto_order_enabled: '0',
  laundry_auto_express_enabled: '0',
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
        laundry_api_url: 数据.laundry_api_url || '',
        laundry_app_id: 数据.laundry_app_id || '',
        laundry_app_secret: 数据.laundry_app_secret || '',
        laundry_api_token: 数据.laundry_api_token || '',
        express_api_url: 数据.express_api_url || '',
        express_api_key: 数据.express_api_key || '',
        express_api_secret: 数据.express_api_secret || '',
        laundry_auto_order_enabled: 数据.laundry_auto_order_enabled || '0',
        laundry_auto_express_enabled: 数据.laundry_auto_express_enabled || '0',
      }
    }
  } finally {
    加载中.value = false
  }
}

const 保存设置 = async (标签) => {
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
