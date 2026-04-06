<template>
  <!-- 卡密无效页 -->
  <div class="无效页面">
    <template v-if="是已使用">
      <div class="无效内容">
        <div class="已使用图标">✅</div>
        <div class="已使用标题">该服务已使用</div>
        <div class="已使用副标题">此卡密对应的服务已经使用过了</div>
        <div class="提示文字">如有疑问或服务未完成，请联系客服处理</div>
        <div class="客服按钮" @click="联系客服">📞 联系客服</div>
      </div>
    </template>
    <template v-else-if="是已作废">
      <div class="无效内容">
        <div class="无效图标">🚫</div>
        <div class="无效标题">卡密已作废</div>
        <div class="无效描述">该卡密已被商家作废，无法使用</div>
        <div class="无效提示">如有疑问，请联系客服处理退款</div>
        <div class="客服按钮" @click="联系客服">📞 联系客服</div>
      </div>
    </template>
    <template v-else>
      <div class="无效内容">
        <div class="无效图标">❌</div>
        <div class="无效标题">卡密无效</div>
        <div class="无效描述">{{ 错误信息 }}</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'

const route = useRoute()
const 是已使用 = computed(() => route.query.used === '1')
const 是已作废 = computed(() => route.query.invalidated === '1')
const 错误信息 = route.query.msg || '该卡密不存在或已过期，请联系客服'

const 联系客服 = () => {
  showToast('请联系在线客服')
}
</script>

<style scoped>
.无效页面 {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.无效内容 {
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 16px;
  margin: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 360px;
}

/* 已使用状态 */
.已使用图标 {
  font-size: 72px;
  margin-bottom: 16px;
}

.已使用标题 {
  font-size: 26px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.已使用副标题 {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.提示文字 {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}

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

/* 无效状态 */
.无效图标 {
  font-size: 60px;
  margin-bottom: 16px;
}

.无效标题 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.无效描述 {
  font-size: 14px;
  color: #999;
  line-height: 1.6;
}

.无效提示 {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
}
</style>

