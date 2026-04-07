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

          <!-- 多备选时间设置分组 -->
          <div class="设置分组标题">── 多备选时间设置 ──</div>

          <el-form-item label="开启多备选时间预约">
            <el-switch
              v-model="设置表单.multi_time_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后客户可选择多个备用时间，提高预约成功率</div>
          </el-form-item>

          <el-form-item label="最多备选次数">
            <el-select v-model="设置表单.multi_time_max_count" style="width: 160px">
              <el-option label="1个（单次预约）" value="1" />
              <el-option label="2个" value="2" />
              <el-option label="3个" value="3" />
            </el-select>
            <div class="字段说明">客户最多可选择几个备用时间点</div>
          </el-form-item>

          <el-form-item label="客户端提示说明">
            <el-input
              v-model="设置表单.multi_time_tip"
              type="textarea"
              :rows="3"
              placeholder="为提高预约成功率，建议选择多个备用时间，客服将按您的优先顺序为您安排。"
            />
            <div class="字段说明">显示在客户时间选择界面顶部的说明文字</div>
          </el-form-item>

          <el-form-item label="至少选择数量">
            <el-select v-model="设置表单.multi_time_min_count" style="width: 200px">
              <el-option label="1个（不强制，推荐）" value="1" />
              <el-option label="2个" value="2" />
              <el-option label="3个" value="3" />
            </el-select>
            <div class="字段说明">客户至少需要选择几个时间才能提交预约（设为1则不强制）</div>
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

      <!-- ===== Tab 3：奇所SUP设置 ===== -->
      <el-tab-pane label="🔗 奇所SUP设置" name="agiso_sup">
        <el-form :model="设置表单" label-width="160px" style="max-width: 680px">

          <el-form-item label="SUP接口总开关">
            <el-switch
              v-model="设置表单.agiso_sup_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后，奇所平台可调用本系统的标准SUP接口</div>
          </el-form-item>

          <el-form-item label="开放平台应用ID">
            <el-input v-model="设置表单.agiso_app_id" placeholder="在 open.agiso.com 创建应用后获取" />
            <div class="字段说明">在 open.agiso.com 创建应用后获取</div>
          </el-form-item>

          <el-form-item label="开放平台AppSecret">
            <el-input
              v-model="设置表单.agiso_app_secret"
              type="password"
              show-password
              placeholder="32位密钥，用于签名验证和卡密AES加密"
            />
            <div class="字段说明">32位密钥，用于签名验证和卡密AES加密</div>
          </el-form-item>

          <el-form-item label="商户密钥">
            <el-input
              v-model="设置表单.agiso_merchant_key"
              type="password"
              show-password
              placeholder="用于签名计算（MD5源串拼接）"
            />
            <div class="字段说明">用于签名计算（MD5源串拼接）</div>
          </el-form-item>

          <el-form-item label="平台会员ID">
            <el-input v-model="设置表单.agiso_user_id" placeholder="下单方身份校验" />
            <div class="字段说明">奇所分配的平台会员ID，用于校验下单方身份</div>
          </el-form-item>

          <el-form-item label="SUP商品配置">
            <el-input
              v-model="设置表单.agiso_products"
              type="textarea"
              :rows="6"
              placeholder='留空则自动扫描卡密表生成商品列表，或填写JSON数组，例如：
[{"productNo":"jiazheng_日常保洁_2h","productTitle":"日常保洁2小时卡","productCost":50,"businessType":"jiazheng"}]'
            />
            <div class="字段说明">JSON数组格式，每项含 productNo/productTitle/productCost/businessType 字段；留空则自动扫描卡密表生成商品列表</div>
          </el-form-item>

          <!-- 接口地址参考（只读展示） -->
          <el-form-item label="接口地址参考">
            <div class="接口地址展示">
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/app/getAppId</code>
                <span class="接口备注">获取应用ID（匿名）</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/product/getList</code>
                <span class="接口备注">获取商品分页列表</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/product/getTemplate</code>
                <span class="接口备注">获取商品模板</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/cardOrder</code>
                <span class="接口备注">卡密下单（核心）</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/queryOrder</code>
                <span class="接口备注">订单查询</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/cancelOrder</code>
                <span class="接口备注">撤单（退款）</span>
              </div>
            </div>
            <div class="字段说明">以上为奇所平台请求本系统的接口地址，在 open.agiso.com 填写供应商服务地址时使用</div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('agiso_sup')">
              💾 保存奇所SUP设置
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
import { ElMessage } from 'element-plus'
import { 获取设置API, 保存设置API } from '../api/index'
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
  // 多备选时间设置
  multi_time_enabled: '0',      // 是否开启多选时间（默认关闭）
  multi_time_max_count: '3',    // 最多几个备选时间
  multi_time_tip: '',           // 客户端提示文字
  multi_time_min_count: '1',    // 至少选几个
  laundry_api_url: '',
  laundry_app_id: '',
  laundry_app_secret: '',
  laundry_api_token: '',
  express_api_url: '',
  express_api_key: '',
  express_api_secret: '',
  laundry_auto_order_enabled: '0',
  // 奇所SUP设置
  agiso_sup_enabled: '0',
  agiso_app_id: '',
  agiso_app_secret: '',
  agiso_merchant_key: '',
  agiso_user_id: '',
  agiso_products: '',
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
        // 多备选时间设置（默认关闭）
        multi_time_enabled: 数据.multi_time_enabled || '0',
        multi_time_max_count: 数据.multi_time_max_count || '3',
        multi_time_tip: 数据.multi_time_tip || '',
        multi_time_min_count: 数据.multi_time_min_count || '1',
        laundry_api_url: 数据.laundry_api_url || '',
        laundry_app_id: 数据.laundry_app_id || '',
        laundry_app_secret: 数据.laundry_app_secret || '',
        laundry_api_token: 数据.laundry_api_token || '',
        express_api_url: 数据.express_api_url || '',
        express_api_key: 数据.express_api_key || '',
        express_api_secret: 数据.express_api_secret || '',
        laundry_auto_order_enabled: 数据.laundry_auto_order_enabled || '0',
        // 奇所SUP设置
        agiso_sup_enabled: 数据.agiso_sup_enabled || '0',
        agiso_app_id: 数据.agiso_app_id || '',
        agiso_app_secret: 数据.agiso_app_secret || '',
        agiso_merchant_key: 数据.agiso_merchant_key || '',
        agiso_user_id: 数据.agiso_user_id || '',
        agiso_products: 数据.agiso_products || '',
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

/* 设置分组标题样式 */
.设置分组标题 {
  color: #409eff;
  font-size: 13px;
  font-weight: 500;
  margin: 16px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

/* 接口地址展示样式 */
.接口地址展示 {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px 16px;
  width: 100%;
}

.接口地址行 {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
}

.接口方法 {
  background: #409eff;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 36px;
  text-align: center;
}

.接口地址行 code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #303133;
  background: #fff;
  border: 1px solid #dcdfe6;
  padding: 2px 6px;
  border-radius: 3px;
  flex: 1;
}

.接口备注 {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}
</style>
