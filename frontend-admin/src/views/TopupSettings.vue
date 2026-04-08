<template>
  <!-- 虚拟充值设置页面 -->
  <div class="充值设置">
    <el-tabs v-model="当前标签" type="border-card">

      <!-- Tab 1: 基本设置 -->
      <el-tab-pane label="🎁 基本设置" name="basic">
        <el-form :model="基本设置" label-width="150px" style="max-width: 700px">
          <el-form-item label="Banner图片URL">
            <el-input v-model="基本设置.topup_banner_url" placeholder="充值H5顶部横幅图片URL（可选）" />
          </el-form-item>
          <el-form-item label="顶部主标题">
            <el-input v-model="基本设置.topup_title" placeholder="如：各类会员充值" />
          </el-form-item>
          <el-form-item label="副标题第1行">
            <el-input v-model="基本设置.topup_subtitle1" placeholder="如：专业充值  特惠价格  安全有保障" />
          </el-form-item>
          <el-form-item label="副标题第2行">
            <el-input v-model="基本设置.topup_subtitle2" placeholder="如：快速到账  全程客服  值得信赖" />
          </el-form-item>
          <el-form-item label="下单须知">
            <el-input v-model="基本设置.topup_notice" type="textarea" :rows="5" placeholder="每行一条须知，换行分隔" />
          </el-form-item>
          <el-form-item label="服务内容JSON">
            <el-input v-model="基本设置.topup_service_content" type="textarea" :rows="6" placeholder='[{"icon":"💎","title":"特惠充值","desc":"会员专属优惠"}]' />
            <div class="字段说明">格式：JSON数组，每项含 icon、title、desc 字段</div>
            <el-button size="small" style="margin-top:6px" @click="填入默认服务内容">填入默认服务内容</el-button>
          </el-form-item>

          <!-- 弹窗提醒设置 -->
          <div style="color: #409eff; font-size: 13px; font-weight: 500; margin: 16px 0 12px; padding-left: 8px; border-left: 3px solid #409eff;">── 🔔 弹窗提醒设置 ──</div>

          <!-- 弹窗1：首页弹窗 -->
          <el-card style="margin-bottom: 16px; border: 1px solid #e4e7ed; border-radius: 8px;">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>🏠 充值首页弹窗（popup1）</span>
                <el-switch v-model="基本设置.cz_popup1_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="基本设置.cz_popup1_title" placeholder="安全提醒" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="基本设置.cz_popup1_content" type="textarea" :rows="3" placeholder="弹窗内容，支持换行" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="基本设置.cz_popup1_icon" placeholder="⚠️" style="width: 100px" />
              <span class="字段说明" style="margin-left:8px">输入Emoji图标</span>
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="基本设置.cz_popup1_title_color" show-alpha />
              <el-input v-model="基本设置.cz_popup1_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="基本设置.cz_popup1_content_color" show-alpha />
              <el-input v-model="基本设置.cz_popup1_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="基本设置.cz_popup1_bg_color" show-alpha />
              <el-input v-model="基本设置.cz_popup1_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="基本设置.cz_popup1_btn_text" placeholder="我知道了" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="基本设置.cz_popup1_btn_color" show-alpha />
              <el-input v-model="基本设置.cz_popup1_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="基本设置.cz_popup1_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="基本设置.cz_popup1_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <!-- 弹窗2：账号验证通过弹窗 -->
          <el-card style="margin-bottom: 16px; border: 1px solid #e4e7ed; border-radius: 8px;">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>🔒 充值账号确认弹窗（popup2）</span>
                <el-switch v-model="基本设置.cz_popup2_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="基本设置.cz_popup2_title" placeholder="账号确认" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="基本设置.cz_popup2_content" type="textarea" :rows="3" placeholder="弹窗内容" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="基本设置.cz_popup2_icon" placeholder="🔒" style="width: 100px" />
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="基本设置.cz_popup2_title_color" show-alpha />
              <el-input v-model="基本设置.cz_popup2_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="基本设置.cz_popup2_content_color" show-alpha />
              <el-input v-model="基本设置.cz_popup2_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="基本设置.cz_popup2_bg_color" show-alpha />
              <el-input v-model="基本设置.cz_popup2_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="基本设置.cz_popup2_btn_text" placeholder="我已确认" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="基本设置.cz_popup2_btn_color" show-alpha />
              <el-input v-model="基本设置.cz_popup2_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="基本设置.cz_popup2_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="基本设置.cz_popup2_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存基本设置">保存基本设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- Tab 2: 账号验证设置 -->
      <el-tab-pane label="🔐 验证规则" name="validation">
        <el-form :model="验证设置" label-width="160px" style="max-width: 700px">
          <el-form-item label="手机号验证正则">
            <el-input v-model="验证设置.topup_phone_regex" placeholder="默认：^1[3-9]\d{9}$" />
            <div class="字段说明">中国大陆手机号验证正则</div>
          </el-form-item>
          <el-form-item label="微信号验证正则">
            <el-input v-model="验证设置.topup_wechat_regex" placeholder="默认：^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$" />
            <div class="字段说明">微信号验证正则（6-20位，支持字母/数字/下划线，兼容手机号绑定登录）</div>
          </el-form-item>
          <el-form-item label="QQ号验证正则">
            <el-input v-model="验证设置.topup_qq_regex" placeholder="默认：^[1-9]\d{4,10}$" />
            <div class="字段说明">QQ号验证正则（5-11位数字）</div>
          </el-form-item>
          <el-form-item label="邮箱验证正则">
            <el-input v-model="验证设置.topup_email_regex" placeholder="默认：^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" />
            <div class="字段说明">标准邮箱格式验证</div>
          </el-form-item>
          <el-form-item label="自定义最小长度">
            <el-input-number v-model="验证设置.topup_custom_min_len" :min="1" :max="50" style="width:120px" />
            <span style="margin-left:8px; color:#999; font-size:12px">账号类型为"其他"时使用</span>
          </el-form-item>
          <el-form-item label="自定义最大长度">
            <el-input-number v-model="验证设置.topup_custom_max_len" :min="1" :max="200" style="width:120px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存验证设置">保存验证规则</el-button>
            <el-button @click="恢复默认验证规则">恢复默认</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- Tab 3: IP定位设置 -->
      <el-tab-pane label="📍 位置定位" name="location">
        <el-form :model="定位设置" label-width="150px" style="max-width: 700px">
          <el-form-item label="定位方式">
            <el-radio-group v-model="定位设置.topup_location_mode">
              <el-radio value="ip">IP自动定位（无感知，无需用户操作）</el-radio>
              <el-radio value="gps">弹窗请求定位（先弹窗询问，允许后使用GPS）</el-radio>
              <el-radio value="both">两步走（先IP定位，失败后弹窗请求）【推荐】</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="定位弹窗提示语">
            <el-input v-model="定位设置.topup_location_tip" placeholder="为了更好地为您提供充值服务，需要获取您的所在城市" />
          </el-form-item>
          <el-form-item label="弹窗确认按钮">
            <el-input v-model="定位设置.topup_location_confirm" placeholder="允许获取位置" style="width:200px" />
          </el-form-item>
          <el-form-item label="弹窗取消按钮">
            <el-input v-model="定位设置.topup_location_cancel" placeholder="暂不授权" style="width:200px" />
          </el-form-item>
          <el-form-item label="IP定位接口">
            <el-select v-model="定位设置.topup_ip_provider" style="width: 300px">
              <el-option label="🥇 太平洋优先（推荐，国内最稳）" value="pconline_first" />
              <el-option label="🥈 vore.top优先" value="vore_first" />
              <el-option label="仅太平洋" value="pconline_only" />
              <el-option label="仅vore.top" value="vore_only" />
            </el-select>
            <div class="字段说明">
              两个接口均免费、无需注册、无Key：<br>
              • <b>太平洋</b>：whois.pconline.com.cn — 国内最稳定，无频率限制<br>
              • <b>vore.top</b>：api.vore.top — 国内服务器，无频率限制<br>
              默认"太平洋优先"：先请求太平洋，失败自动切换vore.top
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存定位设置">保存定位设置</el-button>
            <el-button :loading="测试定位中" @click="测试定位">测试IP定位</el-button>
          </el-form-item>
          <el-form-item v-if="定位测试结果" label="定位测试结果">
            <el-alert :title="`IP: ${定位测试结果.ip} | 城市: ${定位测试结果.full_city || '获取失败'}`" type="success" :closable="false" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 获取设置API, 保存设置API } from '../api/index'
import axios from 'axios'

const 当前标签 = ref('basic')
const 保存中 = ref(false)
const 测试定位中 = ref(false)
const 定位测试结果 = ref(null)

// 基本设置
const 基本设置 = ref({
  topup_banner_url: '',
  topup_title: '各类会员充值',
  topup_subtitle1: '专业充值  特惠价格  安全有保障',
  topup_subtitle2: '快速到账  全程客服  值得信赖',
  topup_notice: '',
  topup_service_content: '',
  // 充值弹窗1配置
  cz_popup1_enabled: '0',
  cz_popup1_title: '安全提醒',
  cz_popup1_content: '务必确保充值账号准确，虚拟商品充错账号不支持退换货。',
  cz_popup1_icon: '⚠️',
  cz_popup1_title_color: '#667eea',
  cz_popup1_content_color: '#333333',
  cz_popup1_bg_color: '#ffffff',
  cz_popup1_btn_text: '我知道了',
  cz_popup1_btn_color: '#667eea',
  cz_popup1_btn_size: 'large',
  cz_popup1_auto_close: '0',
  // 充值弹窗2配置
  cz_popup2_enabled: '0',
  cz_popup2_title: '账号确认',
  cz_popup2_content: '请再次确认您的充值账号是否正确，虚拟商品一旦充值成功无法退款。',
  cz_popup2_icon: '🔒',
  cz_popup2_title_color: '#667eea',
  cz_popup2_content_color: '#333333',
  cz_popup2_bg_color: '#ffffff',
  cz_popup2_btn_text: '我已确认',
  cz_popup2_btn_color: '#667eea',
  cz_popup2_btn_size: 'large',
  cz_popup2_auto_close: '0',
})

// 验证设置
const 验证设置 = ref({
  topup_phone_regex: '^1[3-9]\\d{9}$',
  topup_wechat_regex: '^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$',
  topup_qq_regex: '^[1-9]\\d{4,10}$',
  topup_email_regex: '',
  topup_custom_min_len: 1,
  topup_custom_max_len: 50,
})

// 定位设置
const 定位设置 = ref({
  topup_location_mode: 'ip',
  topup_location_tip: '为了更好地为您提供充值服务，需要获取您的所在城市',
  topup_location_confirm: '允许获取位置',
  topup_location_cancel: '暂不授权',
  topup_ip_provider: 'pconline_first',
})

onMounted(async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      const 数据 = 结果.data
      // 基本设置
      基本设置.value.topup_banner_url = 数据.topup_banner_url || ''
      基本设置.value.topup_title = 数据.topup_title || '各类会员充值'
      基本设置.value.topup_subtitle1 = 数据.topup_subtitle1 || '专业充值  特惠价格  安全有保障'
      基本设置.value.topup_subtitle2 = 数据.topup_subtitle2 || '快速到账  全程客服  值得信赖'
      基本设置.value.topup_notice = 数据.topup_notice || ''
      基本设置.value.topup_service_content = 数据.topup_service_content || ''
      // 充值弹窗1配置
      基本设置.value.cz_popup1_enabled = 数据.cz_popup1_enabled || '0'
      基本设置.value.cz_popup1_title = 数据.cz_popup1_title || '安全提醒'
      基本设置.value.cz_popup1_content = 数据.cz_popup1_content || '务必确保充值账号准确，虚拟商品充错账号不支持退换货。'
      基本设置.value.cz_popup1_icon = 数据.cz_popup1_icon || '⚠️'
      基本设置.value.cz_popup1_title_color = 数据.cz_popup1_title_color || '#667eea'
      基本设置.value.cz_popup1_content_color = 数据.cz_popup1_content_color || '#333333'
      基本设置.value.cz_popup1_bg_color = 数据.cz_popup1_bg_color || '#ffffff'
      基本设置.value.cz_popup1_btn_text = 数据.cz_popup1_btn_text || '我知道了'
      基本设置.value.cz_popup1_btn_color = 数据.cz_popup1_btn_color || '#667eea'
      基本设置.value.cz_popup1_btn_size = 数据.cz_popup1_btn_size || 'large'
      基本设置.value.cz_popup1_auto_close = 数据.cz_popup1_auto_close || '0'
      // 充值弹窗2配置
      基本设置.value.cz_popup2_enabled = 数据.cz_popup2_enabled || '0'
      基本设置.value.cz_popup2_title = 数据.cz_popup2_title || '账号确认'
      基本设置.value.cz_popup2_content = 数据.cz_popup2_content || '请再次确认您的充值账号是否正确，虚拟商品一旦充值成功无法退款。'
      基本设置.value.cz_popup2_icon = 数据.cz_popup2_icon || '🔒'
      基本设置.value.cz_popup2_title_color = 数据.cz_popup2_title_color || '#667eea'
      基本设置.value.cz_popup2_content_color = 数据.cz_popup2_content_color || '#333333'
      基本设置.value.cz_popup2_bg_color = 数据.cz_popup2_bg_color || '#ffffff'
      基本设置.value.cz_popup2_btn_text = 数据.cz_popup2_btn_text || '我已确认'
      基本设置.value.cz_popup2_btn_color = 数据.cz_popup2_btn_color || '#667eea'
      基本设置.value.cz_popup2_btn_size = 数据.cz_popup2_btn_size || 'large'
      基本设置.value.cz_popup2_auto_close = 数据.cz_popup2_auto_close || '0'
      // 验证设置
      验证设置.value.topup_phone_regex = 数据.topup_phone_regex || '^1[3-9]\\d{9}$'
      验证设置.value.topup_wechat_regex = 数据.topup_wechat_regex || '^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$'
      验证设置.value.topup_qq_regex = 数据.topup_qq_regex || '^[1-9]\\d{4,10}$'
      验证设置.value.topup_email_regex = 数据.topup_email_regex || ''
      验证设置.value.topup_custom_min_len = parseInt(数据.topup_custom_min_len) || 1
      验证设置.value.topup_custom_max_len = parseInt(数据.topup_custom_max_len) || 50
      // 定位设置
      定位设置.value.topup_location_mode = 数据.topup_location_mode || 'ip'
      定位设置.value.topup_location_tip = 数据.topup_location_tip || '为了更好地为您提供充值服务，需要获取您的所在城市'
      定位设置.value.topup_location_confirm = 数据.topup_location_confirm || '允许获取位置'
      定位设置.value.topup_location_cancel = 数据.topup_location_cancel || '暂不授权'
      定位设置.value.topup_ip_provider = 数据.topup_ip_provider || 'pconline_first'
    }
  } catch { ElMessage.error('加载设置失败') }
})

const 填入默认服务内容 = () => {
  基本设置.value.topup_service_content = JSON.stringify([
    { icon: '💎', title: '特惠充值', desc: '会员专属优惠价格' },
    { icon: '⚡', title: '极速到账', desc: '1-6小时内到账' },
    { icon: '🔒', title: '安全可靠', desc: '正规渠道100%安全' },
    { icon: '📞', title: '全程客服', desc: '7×24小时在线服务' },
    { icon: '✅', title: '正品保证', desc: '官方直充无风险' },
    { icon: '🎁', title: '多种会员', desc: '优酷/爱奇艺/腾讯视频' },
  ], null, 2)
}

const 保存基本设置 = async () => {
  保存中.value = true
  try {
    const 结果 = await 保存设置API(基本设置.value)
    if (结果.code === 1) ElMessage.success('基本设置保存成功')
    else ElMessage.warning(结果.message)
  } catch { ElMessage.error('保存失败') } finally { 保存中.value = false }
}

const 保存验证设置 = async () => {
  保存中.value = true
  try {
    const 结果 = await 保存设置API(验证设置.value)
    if (结果.code === 1) ElMessage.success('验证规则保存成功')
    else ElMessage.warning(结果.message)
  } catch { ElMessage.error('保存失败') } finally { 保存中.value = false }
}

const 恢复默认验证规则 = () => {
  验证设置.value.topup_phone_regex = '^1[3-9]\\d{9}$'
  验证设置.value.topup_wechat_regex = '^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$'
  验证设置.value.topup_qq_regex = '^[1-9]\\d{4,10}$'
  验证设置.value.topup_email_regex = ''
  验证设置.value.topup_custom_min_len = 1
  验证设置.value.topup_custom_max_len = 50
  ElMessage.info('已恢复默认验证规则，请保存')
}

const 保存定位设置 = async () => {
  保存中.value = true
  try {
    const 结果 = await 保存设置API(定位设置.value)
    if (结果.code === 1) ElMessage.success('定位设置保存成功')
    else ElMessage.warning(结果.message)
  } catch { ElMessage.error('保存失败') } finally { 保存中.value = false }
}

const 测试定位 = async () => {
  测试定位中.value = true
  定位测试结果.value = null
  try {
    const 响应 = await axios.get('/api/cz/ip-city')
    const 结果 = 响应.data
    if (结果.code === 1) {
      定位测试结果.value = 结果.data
      ElMessage.success(`定位成功：${结果.data.full_city || '未知城市'}`)
    } else {
      ElMessage.warning('定位失败：' + (结果.message || '未知错误'))
    }
  } catch { ElMessage.error('测试定位失败') } finally { 测试定位中.value = false }
}
</script>

<style scoped>
.充值设置 { padding: 0; }
.字段说明 { font-size: 12px; color: #999; margin-top: 4px; }
</style>

