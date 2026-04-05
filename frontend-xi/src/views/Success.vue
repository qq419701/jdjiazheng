<template>
  <div class="成功页面">
    <div class="成功图标">✅</div>
    <div class="成功标题">预约成功！</div>
    <div class="成功描述">快递员将在预约时间段内上门取件，请保持手机畅通</div>

    <div class="订单卡片">
      <div class="订单信息项" v-if="订单号">
        <span class="订单标签">订单号</span>
        <span class="订单值">{{ 订单号 }}</span>
      </div>
      <div class="订单信息项" v-if="商品名称">
        <span class="订单标签">洗护商品</span>
        <span class="订单值">{{ 商品名称 }}</span>
      </div>
      <div class="订单信息项" v-if="取件人">
        <span class="订单标签">取件人</span>
        <span class="订单值">{{ 取件人 }} {{ 取件手机 }}</span>
      </div>
      <div class="订单信息项" v-if="取件地址">
        <span class="订单标签">取件地址</span>
        <span class="订单值小字">{{ 取件地址 }}</span>
      </div>
      <div class="订单信息项" v-if="取件时间">
        <span class="订单标签">取件时间</span>
        <span class="订单值蓝色">{{ 取件时间 }}</span>
      </div>
      <!-- 修复：使用 洗衣Store.收件与取件相同 判断，避免路由参数为空时判断失效 -->
      <template v-if="!洗衣Store.收件与取件相同">
        <div class="分隔线"></div>
        <div class="订单信息项">
          <span class="订单标签">收件人</span>
          <span class="订单值">{{ 收件人 }} {{ 收件手机 }}</span>
        </div>
        <div class="订单信息项" v-if="收件地址">
          <span class="订单标签">回寄地址</span>
          <span class="订单值小字">{{ 收件地址 }}</span>
        </div>
      </template>
      <template v-else>
        <div class="分隔线"></div>
        <div class="订单信息项">
          <span class="订单标签">回寄地址</span>
          <span class="订单值灰色">与取件地址相同</span>
        </div>
      </template>
    </div>

    <div class="温馨提示">
      <div class="提示标题">温馨提示</div>
      <div class="提示内容">请在取件时间段内确保有人在家，快递员将上门收取您的衣物。洗护完成后将快递送回您填写的收件地址。</div>
    </div>

    <van-button
      v-if="订单号"
      type="primary"
      block
      round
      style="margin-top: 20px; max-width: 400px"
      @click="查看物流"
    >
      📦 查看物流动态
    </van-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLaundryOrderStore } from '../stores/laundryOrder'

const route = useRoute()
const router = useRouter()
// 修复：引入洗衣Store，用 收件与取件相同 布尔值判断，避免依赖路由参数为空的判断方式
const 洗衣Store = useLaundryOrderStore()

const 订单号 = computed(() => route.query.order_no || '')
const 商品名称 = computed(() => route.query.product_name || '')
const 取件人 = computed(() => route.query.name || '')
const 取件手机 = computed(() => route.query.phone || '')
const 取件地址 = computed(() => route.query.full_address || '')
const 取件时间 = computed(() => {
  const 日期 = route.query.visit_date || ''
  const 时间 = route.query.visit_time || ''
  return 日期 && 时间 ? `${日期} ${时间}` : ''
})
const 收件人 = computed(() => route.query.return_name || '')
const 收件手机 = computed(() => route.query.return_phone || '')
const 收件地址 = computed(() => {
  const 省 = route.query.return_province || ''
  const 市 = route.query.return_city || ''
  const 区 = route.query.return_district || ''
  const 详址 = route.query.return_address || ''
  return 省 + 市 + 区 + 详址
})

const 查看物流 = () => {
  const 卡密 = route.params.code
  router.push({ name: 'Tracking', params: { code: 卡密 }, query: { orderNo: 订单号.value } })
}
</script>

<style scoped>
.成功页面 {
  min-height: 100vh;
  background: linear-gradient(180deg, #e8f4fd 0%, #f5f5f5 40%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px 40px;
}
.成功图标 { font-size: 72px; margin-bottom: 16px; }
.成功标题 { font-size: 24px; font-weight: 700; color: #1989fa; margin-bottom: 8px; }
.成功描述 { font-size: 14px; color: #666; margin-bottom: 32px; text-align: center; }
.订单卡片 { background: white; border-radius: 16px; padding: 20px; width: 100%; max-width: 400px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(25,137,250,0.1); }
.订单信息项 { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f5f5f5; gap: 8px; }
.订单信息项:last-child { border-bottom: none; }
.订单标签 { font-size: 14px; color: #999; flex-shrink: 0; }
.订单值 { font-size: 14px; color: #333; font-weight: 500; text-align: right; }
.订单值小字 { font-size: 13px; color: #333; text-align: right; line-height: 1.4; }
.订单值蓝色 { font-size: 14px; color: #1989fa; font-weight: 500; text-align: right; }
.订单值灰色 { font-size: 13px; color: #999; text-align: right; }
.分隔线 { height: 1px; background: #f0f0f0; margin: 4px 0; }
.温馨提示 { background: #e8f4fd; border-radius: 12px; padding: 16px; width: 100%; max-width: 400px; margin-bottom: 16px; }
.提示标题 { font-size: 14px; font-weight: 600; color: #1989fa; margin-bottom: 8px; }
.提示内容 { font-size: 13px; color: #666; line-height: 1.6; }
</style>
