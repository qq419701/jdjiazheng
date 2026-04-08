<template>
  <!-- 主页（京东家政预约） -->
  <div class="主页容器" v-if="!加载中 && 卡密有效">

    <!-- 顶部红色渐变Banner -->
    <div class="顶部Banner">
      <div class="Banner图标区">
        <span class="家政图标">🏠</span>
        <span class="京东图标">京</span>
      </div>
      <div class="Banner文字区">
        <div class="Banner主标题">京东家政日常保洁</div>
        <div class="Banner副标题">流程清晰 服务可见 高效服务</div>
      </div>
      <img v-if="banner图URL" :src="banner图URL" class="Banner图片" alt="京东家政" />
    </div>

    <!-- 服务信息卡片 -->
    <div
      class="服务信息卡片"
      :class="{ '地址未填边框': !订单Store.已填写地址 }"
    >
      <!-- 地址区域 -->
      <div class="地址区域" @click="跳转填写地址">
        <div class="地址标题行">
          <span class="定位图标">📍</span>
          <span class="服务信息标题">服务信息</span>
          <span class="编辑图标" :class="{ '编辑图标红色': !订单Store.已填写地址 }">✏️</span>
        </div>
        <div class="地址内容">
          <template v-if="订单Store.已填写地址">
            <div class="已填写地址">
              <span class="客户姓名">{{ 订单Store.姓名 }}</span>
              <span class="客户手机">{{ 订单Store.手机号 }}</span>
            </div>
            <div class="完整地址文字">{{ 订单Store.完整地址 }}</div>
          </template>
          <template v-else>
            <div class="未填写引导文字">👆 点击此处填写上门地址（必填）</div>
          </template>
        </div>
      </div>

      <div class="分割线"></div>

      <!-- 服务类型 -->
      <div class="信息行">
        <span class="信息标签">服务类型</span>
        <span class="信息值">{{ 订单Store.服务类型 }}</span>
      </div>

      <!-- 服务时长 -->
      <div class="信息行">
        <span class="信息标签">服务时长</span>
        <span class="信息值">{{ 订单Store.服务时长 }}小时</span>
      </div>

      <!-- 上门时间 -->
      <div class="信息行" @click="点击选择时间">
        <span class="信息标签">上门时间</span>
        <!-- 未填地址时：红色警示文字 -->
        <span class="信息值红色" v-if="!订单Store.已填写地址">
          请先填写上门地址
        </span>
        <!-- 已填地址未选时间 -->
        <span class="信息值橙色" v-else-if="!订单Store.已选择时间">
          暂不预约 &gt;
        </span>
        <!-- 已选时间 -->
        <span class="信息值" v-else>
          {{ 订单Store.预约时间显示 }}
        </span>
      </div>

      <!-- 兑换码 -->
      <div class="信息行">
        <span class="信息标签">兑换码</span>
        <span class="信息值灰色">{{ 订单Store.卡密 }}</span>
      </div>
    </div>

    <!-- 步骤引导卡片（地址未填时显示，填完后隐藏） -->
    <div v-if="!订单Store.已填写地址" class="步骤引导卡片">
      预约步骤：① 填写上门地址 ← 当前步骤 &nbsp; ② 选择上门时间 &nbsp; ③ 点击立即预约
    </div>

    <!-- 服务内容 -->
    <ServiceContent :服务内容列表="订单Store.服务内容列表" />

    <!-- 下单须知 -->
    <Notice :须知文本="订单Store.下单须知" />

    <!-- 底部立即预约按钮 -->
    <div class="底部按钮容器">
      <div
        class="立即预约按钮"
        :class="按钮样式类"
        :style="按钮样式"
        @click="点击立即预约"
      >
        {{ 按钮文字 }}
      </div>
    </div>

    <!-- 选择上门时间弹窗（传入多选配置） -->
    <TimeSlot
      :显示="显示时间选择"
      :城市="订单Store.城市"
      :多选模式="订单Store.多选时间已启用"
      :最多选几个="订单Store.多选时间最多"
      :最少选几个="订单Store.多选时间最少"
      :多选提示="订单Store.多选时间提示"
      @关闭="显示时间选择 = false"
      @确认选择="处理时间选择"
    />

    <NoticePopup
      :show="显示弹窗1"
      :title="订单Store.jz_popup1_title"
      :content="订单Store.jz_popup1_content"
      :icon-emoji="订单Store.jz_popup1_icon"
      :bg-color="订单Store.jz_popup1_bg_color"
      :title-color="订单Store.jz_popup1_title_color"
      :content-color="订单Store.jz_popup1_content_color"
      :btn-text="订单Store.jz_popup1_btn_text"
      :btn-color="订单Store.jz_popup1_btn_color"
      :btn-size="订单Store.jz_popup1_btn_size"
      :auto-close-seconds="parseInt(订单Store.jz_popup1_auto_close) || 0"
      :mask-closable="true"
      @close="显示弹窗1 = false"
    />
    <NoticePopup
      :show="显示弹窗2"
      :title="订单Store.jz_popup2_title"
      :content="订单Store.jz_popup2_content"
      :icon-emoji="订单Store.jz_popup2_icon"
      :bg-color="订单Store.jz_popup2_bg_color"
      :title-color="订单Store.jz_popup2_title_color"
      :content-color="订单Store.jz_popup2_content_color"
      :btn-text="订单Store.jz_popup2_btn_text"
      :btn-color="订单Store.jz_popup2_btn_color"
      :btn-size="订单Store.jz_popup2_btn_size"
      :auto-close-seconds="parseInt(订单Store.jz_popup2_auto_close) || 0"
      :mask-closable="true"
      @close="显示弹窗2 = false"
    />
  </div>

  <!-- 加载中 -->
  <div v-else-if="加载中" class="加载页面">
    <van-loading color="#e54635" size="32px" />
    <span class="加载文字">正在验证...</span>
  </div>

  <!-- 卡密无效 -->
  <Invalid v-else />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useOrderStore } from '../stores/order'
import { 验证卡密API } from '../api/index'
import ServiceContent from '../components/ServiceContent.vue'
import Notice from '../components/Notice.vue'
import TimeSlot from './TimeSlot.vue'
import Invalid from './Invalid.vue'
import NoticePopup from '../components/NoticePopup.vue'

const route = useRoute()
const router = useRouter()
const 订单Store = useOrderStore()

// 状态
const 加载中 = ref(true)
const 卡密有效 = ref(false)
const 显示时间选择 = ref(false)
const banner图URL = ref('')
const 显示弹窗1 = ref(false)
const 显示弹窗2 = ref(false)

// 页面初始化：验证卡密
onMounted(async () => {
  const 卡密码 = route.params.code
  if (!卡密码) {
    加载中.value = false
    return
  }

  try {
    const 结果 = await 验证卡密API(卡密码)
    if (结果.code === 1) {
      卡密有效.value = true
      订单Store.设置卡密信息(结果.data)
      banner图URL.value = 结果.data.banner_url || ''
      // 弹窗1：首页弹窗（每次会话只弹一次）
      const popup1Key = `jz_popup1_shown_${卡密码}`
      if (订单Store.jz_popup1_enabled === '1' && !sessionStorage.getItem(popup1Key)) {
        setTimeout(() => { 显示弹窗1.value = true }, 500)
        sessionStorage.setItem(popup1Key, '1')
      }
    } else if (结果.code === 2) {
      router.replace({ name: 'Invalid', query: { used: '1' } })
      return
    } else if (结果.code === 3) {
      router.replace({ name: 'Invalid', query: { invalidated: '1' } })
      return
    } else {
      router.replace({ name: 'Invalid' })
      return
    }
  } catch {
    showToast('网络错误，请刷新重试')
  } finally {
    加载中.value = false
  }
})

// 跳转填写地址
const 跳转填写地址 = () => {
  router.push({ name: 'Address', params: { code: route.params.code } })
}

// 点击选择上门时间
const 点击选择时间 = () => {
  if (!订单Store.已填写地址) {
    showToast({ message: '请先点击上方蓝色区域填写服务地址', duration: 3000 })
    return
  }
  显示时间选择.value = true
}

// 处理时间选择结果（兼容单选和多选两种模式）
const 处理时间选择 = ({ 日期, 时间段, 多选时间列表 }) => {
  // 单选兼容字段（无论单选/多选都保存第1优先时间）
  订单Store.保存预约时间(日期, 时间段)
  // 多选模式：同时保存多选时间列表
  if (多选时间列表 && 多选时间列表.length > 0) {
    订单Store.保存多选时间(多选时间列表)
    showToast(`已选择${多选时间列表.length}个备选时间`)
  } else {
    订单Store.保存多选时间([]) // 单选模式清空多选列表
    showToast('已选择：' + 日期 + ' ' + 时间段)
  }
  显示时间选择.value = false
  if (订单Store.jz_popup2_enabled === '1') {
    显示弹窗2.value = true
  }
}

// 按钮三态计算
const 按钮文字 = computed(() => {
  if (!订单Store.已填写地址) return '请先填写地址'
  if (!订单Store.已选择时间) return '请选择上门时间'
  return '立即预约'
})

const 按钮样式 = computed(() => {
  if (!订单Store.已填写地址) {
    return { background: '#cccccc', boxShadow: 'none' }
  }
  if (!订单Store.已选择时间) {
    return { background: '#ff6b35', boxShadow: '0 4px 12px rgba(255, 107, 53, 0.4)' }
  }
  return {}
})

const 按钮样式类 = computed(() => {
  if (订单Store.已填写地址 && 订单Store.已选择时间) return '按钮激活'
  return ''
})

// 点击立即预约
const 点击立即预约 = () => {
  if (!订单Store.已填写地址) {
    showToast('请先填写服务地址')
    return
  }
  if (!订单Store.已选择时间) {
    showToast('请选择上门时间')
    return
  }
  router.push({ name: 'Confirm', params: { code: route.params.code } })
}
</script>

<style scoped>
.主页容器 {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

/* 顶部Banner */
.顶部Banner {
  background: linear-gradient(135deg, #e54635, #ff6b35);
  padding: 24px 20px 30px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-height: 120px;
}

.Banner图标区 {
  margin-right: 12px;
}

.家政图标 {
  font-size: 36px;
  display: block;
}

.京东图标 {
  display: block;
  width: 28px;
  height: 28px;
  background: white;
  color: #e54635;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  line-height: 28px;
  margin-top: 4px;
}

.Banner文字区 {
  flex: 1;
  color: white;
}

.Banner主标题 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.Banner副标题 {
  font-size: 13px;
  opacity: 0.9;
  letter-spacing: 1px;
}

.Banner图片 {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  opacity: 0.3;
}

/* 服务信息卡片 */
.服务信息卡片 {
  background: white;
  border-radius: 12px;
  margin: -12px 16px 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

/* 地址未填时橙色虚线边框 */
.地址未填边框 {
  border: 2px dashed #ff6b35;
}

/* 步骤引导卡片 */
.步骤引导卡片 {
  background: #fff5f5;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  margin: 0 16px 12px;
  padding: 10px 14px;
  font-size: 12px;
  color: #e54635;
  line-height: 1.6;
}

/* 地址区域 */
.地址区域 {
  cursor: pointer;
  padding-bottom: 12px;
}

.地址标题行 {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.定位图标 {
  font-size: 16px;
  margin-right: 6px;
}

.服务信息标题 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.编辑图标 {
  font-size: 14px;
  color: #999;
}

.编辑图标红色 {
  color: #e54635;
}

.地址内容 {
  padding-left: 22px;
}

.已填写地址 {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.客户姓名 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.客户手机 {
  font-size: 14px;
  color: #666;
}

.完整地址文字 {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

/* 未填写地址引导文字 */
.未填写引导文字 {
  font-size: 14px;
  color: #ff6b35;
  font-weight: 500;
}

.分割线 {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0 8px;
}

/* 信息行 */
.信息行 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f8f8f8;
  cursor: pointer;
}

.信息行:last-child {
  border-bottom: none;
}

.信息标签 {
  font-size: 14px;
  color: #999;
}

.信息值 {
  font-size: 14px;
  color: #333;
}

.信息值橙色 {
  font-size: 14px;
  color: #ff6b35;
}

/* 红色警示文字 */
.信息值红色 {
  font-size: 14px;
  color: #e54635;
  font-weight: 500;
}

.信息值灰色 {
  font-size: 13px;
  color: #bbb;
  letter-spacing: 1px;
}

/* 底部按钮 */
.底部按钮容器 {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.立即预约按钮 {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #e54635, #ff6b35);
  border: none;
  border-radius: 24px;
  color: white;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(229, 70, 53, 0.4);
  transition: background 0.3s, box-shadow 0.3s;
}

/* 加载页面 */
.加载页面 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f5f5f5;
}

.加载文字 {
  font-size: 14px;
  color: #999;
}
</style>
