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
    <div class="服务信息卡片">
      <!-- 地址区域 -->
      <div class="地址区域" @click="跳转填写地址">
        <div class="地址标题行">
          <span class="定位图标">📍</span>
          <span class="服务信息标题">服务信息</span>
          <span class="编辑图标">✏️</span>
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
            <div class="未填写提示">请输入您的服务地址信息</div>
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
        <span class="信息值橙色" v-if="!订单Store.已选择时间">
          暂不预约 &gt;
        </span>
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

    <!-- 服务内容 -->
    <ServiceContent :服务内容列表="订单Store.服务内容列表" />

    <!-- 下单须知 -->
    <Notice :须知文本="订单Store.下单须知" />

    <!-- 底部立即预约按钮 -->
    <div class="底部按钮容器">
      <div class="立即预约按钮" @click="点击立即预约">
        立即预约
      </div>
    </div>

    <!-- 选择上门时间弹窗 -->
    <TimeSlot
      :显示="显示时间选择"
      :城市="订单Store.城市"
      @关闭="显示时间选择 = false"
      @确认选择="处理时间选择"
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useOrderStore } from '../stores/order'
import { 验证卡密API } from '../api/index'
import ServiceContent from '../components/ServiceContent.vue'
import Notice from '../components/Notice.vue'
import TimeSlot from './TimeSlot.vue'
import Invalid from './Invalid.vue'

const route = useRoute()
const router = useRouter()
const 订单Store = useOrderStore()

// 状态
const 加载中 = ref(true)
const 卡密有效 = ref(false)
const 显示时间选择 = ref(false)
const banner图URL = ref('')

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
    }
  } catch {
    showToast('网络错误，请刷新重试')
  } finally {
    加载中.value = false
  }
})

// 跳转填写地址
const 跳转填写地址 = () => {
  router.push({ name: 'Address' })
}

// 点击选择上门时间
const 点击选择时间 = () => {
  if (!订单Store.已填写地址) {
    showToast('请先填写服务地址')
    return
  }
  显示时间选择.value = true
}

// 处理时间选择结果
const 处理时间选择 = ({ 日期, 时间段 }) => {
  订单Store.保存预约时间(日期, 时间段)
  显示时间选择.value = false
  showToast('已选择：' + 日期 + ' ' + 时间段)
}

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
  router.push({ name: 'Confirm' })
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

.未填写提示 {
  font-size: 14px;
  color: #ccc;
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
