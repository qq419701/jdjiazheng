<template>
  <div class="无效页面">
    <template v-if="是已使用">
      <div class="已使用图标">✅</div>
      <div class="已使用标题">该服务已使用</div>
      <div class="已使用副标题">此卡密对应的服务已经使用过了</div>
      <div class="已使用提示卡片">
        <div class="提示文字">如有疑问或服务未完成，请联系客服处理</div>
        <div class="客服按钮" @click="联系客服">📞 联系客服</div>
      </div>
      <div class="查快递按钮" @click="查询快递" v-if="卡密码">
        📦 查询快递物流
      </div>
    </template>
    <template v-else-if="是已作废">
      <div class="无效图标">🚫</div>
      <div class="无效标题">卡密已作废</div>
      <div class="无效描述">该卡密已被商家作废，无法使用</div>
      <div class="无效提示">如有疑问，请联系客服处理退款</div>
      <div class="客服按钮" @click="联系客服">📞 联系客服</div>
    </template>
    <template v-else>
      <div class="无效图标">❌</div>
      <div class="无效标题">卡密无效</div>
      <div class="无效描述">该卡密不存在或已过期</div>
      <div class="无效提示">如有疑问，请联系客服</div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { 验证洗衣卡密API } from '../api/index'

const route = useRoute()
const router = useRouter()

const 是已使用 = computed(() => route.query.used === '1')
const 是已作废 = computed(() => route.query.invalidated === '1')
const 卡密码 = computed(() => route.query.code || '')

const 查询快递 = async () => {
  if (!卡密码.value) return
  showLoadingToast({ message: '查询中...', forbidClick: true })
  try {
    const 结果 = await 验证洗衣卡密API(卡密码.value)
    closeToast()
    const 订单号 = 结果?.data?.order_no || ''
    if (订单号) {
      router.push({ name: 'Tracking', params: { code: 卡密码.value }, query: { orderNo: 订单号 } })
    } else {
      showToast('暂时查不到订单号，请联系客服')
    }
  } catch {
    closeToast()
    showToast('查询失败，请稍后重试')
  }
}

const 联系客服 = () => {
  showToast('请联系在线客服')
}
</script>

<style scoped>
.无效页面 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  gap: 12px;
  padding: 20px;
}

/* 已使用状态 */
.已使用图标 { font-size: 72px; }
.已使用标题 { font-size: 26px; font-weight: 700; color: #333; }
.已使用副标题 { font-size: 14px; color: #999; }

.已使用提示卡片 {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 320px;
}

.提示文字 { font-size: 14px; color: #666; margin-bottom: 12px; line-height: 1.6; }

.客服按钮 {
  display: inline-block;
  background: #07c160;
  color: white;
  font-size: 15px;
  font-weight: 600;
  padding: 10px 28px;
  border-radius: 24px;
  cursor: pointer;
}

.查快递按钮 {
  background: #1989fa;
  color: white;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 24px;
  cursor: pointer;
  margin-top: 4px;
}

/* 无效/过期状态 */
.无效图标 { font-size: 72px; }
.无效标题 { font-size: 22px; font-weight: 700; color: #333; }
.无效描述 { font-size: 14px; color: #999; }
.无效提示 { font-size: 13px; color: #bbb; }
</style>

