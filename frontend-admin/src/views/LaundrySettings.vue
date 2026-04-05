<template>
  <!-- 洗衣设置页面 -->
  <div class="洗衣设置页面">
    <el-tabs v-model="当前标签" type="border-card" v-loading="加载中">

      <!-- ===== Tab 1：基本设置 ===== -->
      <el-tab-pane label="🛁 基本设置" name="basic">
        <el-form :model="设置表单" label-width="160px" style="max-width: 680px">
          <el-form-item label="洗衣Banner URL">
            <el-input v-model="设置表单.laundry_banner_url" placeholder="Banner图片地址（可选）" />
            <div class="字段说明">显示在洗衣H5前端顶部的横幅图片</div>
          </el-form-item>
          <el-form-item label="下单须知">
            <el-input
              v-model="设置表单.laundry_notice"
              type="textarea"
              :rows="6"
              placeholder="每行一条须知，换行分隔"
            />
          </el-form-item>
          <el-form-item label="商品名称">
            <el-input v-model="设置表单.laundry_product_name" placeholder="如：任洗一件" />
            <div class="字段说明">显示在洗衣H5前端的默认商品名称</div>
          </el-form-item>
          <el-form-item label="商品价格（分）">
            <el-input-number v-model="设置表单.laundry_product_price" :min="0" style="width: 200px" />
            <div class="字段说明">单位：分，如1000=10元（用于推送到鲸蚁API）</div>
          </el-form-item>
          <el-form-item label="服务内容JSON">
            <el-input
              v-model="设置表单.laundry_service_content"
              type="textarea"
              :rows="6"
              placeholder='[{"icon":"👕","title":"专业洗护","desc":"标准清洗流程"}]'
            />
            <div class="字段说明">JSON格式，每项含 icon/title/desc 三个字段</div>
          </el-form-item>
          <el-form-item label="自动下单">
            <el-switch
              v-model="设置表单.laundry_auto_order_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后，新洗衣订单自动推送到鲸蚁API下单</div>
          </el-form-item>
          <el-form-item label="回调地址">
            <el-input :value="回调地址" readonly />
            <div class="字段说明">将此地址配置到鲸蚁系统，用于接收订单状态回调</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置">💾 保存基本设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 2：鲸蚁API配置 ===== -->
      <el-tab-pane label="🔗 鲸蚁API配置" name="api">
        <el-form :model="设置表单" label-width="160px" style="max-width: 700px">

          <!-- API认证配置 -->
          <div class="设置分组标题">── API认证配置 ──</div>
          <el-form-item label="API基础地址">
            <el-input v-model="设置表单.laundry_api_url" placeholder="如：https://api.jingyishenghua.com" />
            <div class="字段说明">鲸蚁生活系统的API地址</div>
          </el-form-item>
          <el-form-item label="AppID">
            <el-input v-model="设置表单.laundry_app_id" placeholder="在鲸蚁生活系统获取" />
            <div class="字段说明">在鲸蚁生活系统获取</div>
          </el-form-item>
          <el-form-item label="AppSecret">
            <el-input v-model="设置表单.laundry_app_secret" type="password" placeholder="AppSecret" show-password />
            <div class="字段说明">在鲸蚁生活系统获取</div>
          </el-form-item>
          <el-form-item label="TenantID">
            <el-input :value="设置表单.laundry_tenant_id || '（获取Token后自动填充）'" readonly style="background:#f5f5f5" />
            <div class="字段说明">获取Token后自动填充</div>
          </el-form-item>

          <!-- Token状态 -->
          <div class="设置分组标题">── Token状态 ──</div>
          <el-form-item label="Token状态">
            <el-tag :type="Token状态类型" size="default">{{ Token状态文字 }}</el-tag>
          </el-form-item>
          <el-form-item v-if="Token过期时间文字" label="过期时间">
            <span class="字段只读值">{{ Token过期时间文字 }}</span>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置">💾 保存API配置</el-button>
            <el-button type="success" :loading="测试中" @click="测试连接">⚡ 测试连接</el-button>
          </el-form-item>
          <el-alert
            v-if="测试结果"
            :title="测试结果.消息"
            :type="测试结果.成功 ? 'success' : 'error'"
            :closable="false"
            style="margin-top: 12px"
          />

          <!-- 回调配置 -->
          <div class="设置分组标题">── 回调配置 ──</div>
          <el-form-item label="回调接收地址">
            <el-input :value="回调地址" readonly />
            <div class="字段说明">将此地址填入鲸蚁生活系统的回调URL设置</div>
          </el-form-item>

          <!-- 自动化开关 -->
          <div class="设置分组标题">── 自动化开关 ──</div>
          <!-- 修复：新增订单来源类型配置（laundry_order_type），鲸蚁API要求必须传有效平台值 -->
          <el-form-item label="订单来源类型">
            <el-select v-model="设置表单.laundry_order_type" style="width: 200px">
              <el-option label="微信小程序 (50)" value="50" />
              <el-option label="抖音小程序 (60)" value="60" />
              <el-option label="快手小程序 (70)" value="70" />
            </el-select>
            <div class="字段说明">推送到鲸蚁API的订单来源平台标识，微信小程序填50</div>
          </el-form-item>
          <el-form-item label="自动下单">
            <el-switch
              v-model="设置表单.laundry_auto_order_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">新订单提交后自动推送到鲸蚁API下单</div>
          </el-form-item>
          <el-form-item label="自动取件">
            <el-switch
              v-model="设置表单.laundry_auto_express_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">鲸蚁API下单成功后自动触发快递取件（鲸蚁内部处理）</div>
          </el-form-item>

          <!-- 订单同步说明 -->
          <div class="设置分组标题">── 订单同步 ──</div>
          <el-form-item label-width="0">
            <el-alert
              title="鲸蚁会通过回调地址推送状态，系统自动更新订单状态"
              type="info"
              :closable="false"
              style="margin-bottom: 12px"
            />
            <div class="状态说明列表">
              <div class="状态说明项">• 1 = 已分配（含快递单号）</div>
              <div class="状态说明项">• 2 = 已取件</div>
              <div class="状态说明项">• 3 = 已入厂</div>
              <div class="状态说明项">• 4 = 预检中（含图片）</div>
              <div class="状态说明项">• 5 = 已回寄（含快递单号）</div>
              <div class="状态说明项">• 6 = 已送达</div>
              <div class="状态说明项">• 11 = 质检完成</div>
              <div class="状态说明项">• -1 = 取消</div>
              <div class="状态说明项">• 10 = 完成</div>
            </div>
          </el-form-item>

        </el-form>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 获取设置API, 保存设置API, 测试洗衣API连接 } from '../api/index'

const 加载中 = ref(false)
const 保存中 = ref(false)
const 测试中 = ref(false)
const 当前标签 = ref('basic')
const 测试结果 = ref(null)

const 设置表单 = ref({
  site_url: '',
  laundry_banner_url: '',
  laundry_notice: '',
  laundry_product_name: '任洗一件',
  laundry_product_price: 0,
  laundry_service_content: '',
  laundry_auto_order_enabled: '0',
  laundry_auto_express_enabled: '0',
  // 修复：新增 laundry_order_type，对应鲸蚁API平台来源值（50=微信，60=抖音，70=快手）
  laundry_order_type: '50',
  laundry_api_url: '',
  laundry_app_id: '',
  laundry_app_secret: '',
  laundry_tenant_id: '',
  laundry_token_expire_at: '0',
})

// 回调地址（自动拼接 site_url + /api/laundry/callback）
const 回调地址 = computed(() => {
  const 域名 = (设置表单.value.site_url || '').replace(/\/$/, '')
  return 域名 ? `${域名}/api/laundry/callback` : '/api/laundry/callback'
})

const Token过期时间文字 = computed(() => {
  const expireAt = parseInt(设置表单.value.laundry_token_expire_at || '0')
  if (expireAt <= 0) return ''
  return new Date(expireAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
})

// Token状态计算
const Token状态文字 = computed(() => {
  if (!设置表单.value.laundry_app_id || !设置表单.value.laundry_api_url) return '未配置'
  const expireAt = parseInt(设置表单.value.laundry_token_expire_at || '0')
  if (expireAt > Date.now()) return '有效'
  if (设置表单.value.laundry_tenant_id) return '已过期'
  return '未获取'
})

const Token状态类型 = computed(() => {
  const 文字 = Token状态文字.value
  if (文字 === '有效') return 'success'
  if (文字 === '已过期') return 'danger'
  return 'info'
})

const 加载设置 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      const 数据 = 结果.data
      设置表单.value = {
        site_url: 数据.site_url || '',
        laundry_banner_url: 数据.laundry_banner_url || '',
        laundry_notice: 数据.laundry_notice || '',
        laundry_product_name: 数据.laundry_product_name || '任洗一件',
        laundry_product_price: parseInt(数据.laundry_product_price) || 0,
        laundry_service_content: 数据.laundry_service_content || '',
        laundry_auto_order_enabled: 数据.laundry_auto_order_enabled || '0',
        laundry_auto_express_enabled: 数据.laundry_auto_express_enabled || '0',
        // 修复：加载 laundry_order_type，默认50（微信小程序）
        laundry_order_type: 数据.laundry_order_type || '50',
        laundry_api_url: 数据.laundry_api_url || '',
        laundry_app_id: 数据.laundry_app_id || '',
        laundry_app_secret: 数据.laundry_app_secret || '',
        laundry_tenant_id: 数据.laundry_tenant_id || '',
        laundry_token_expire_at: 数据.laundry_token_expire_at || '0',
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

const 测试连接 = async () => {
  测试中.value = true
  测试结果.value = null
  try {
    const 结果 = await 测试洗衣API连接()
    if (结果.code === 1) {
      测试结果.value = { 成功: true, 消息: `连接成功！TenantID: ${结果.data?.tenantId}` }
      // 刷新设置以获取最新tenantId
      await 加载设置()
    } else {
      测试结果.value = { 成功: false, 消息: 结果.message || '连接失败' }
    }
  } catch {
    测试结果.value = { 成功: false, 消息: '连接失败，请检查API配置' }
  } finally {
    测试中.value = false
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

.设置分组标题 {
  color: #409eff;
  font-size: 13px;
  font-weight: 500;
  margin: 20px 0 14px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.字段只读值 {
  font-size: 14px;
  color: #333;
}

.状态说明列表 {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px 16px;
  border: 1px solid #eee;
}

.状态说明项 {
  font-size: 13px;
  color: #555;
  line-height: 2;
}
</style>
