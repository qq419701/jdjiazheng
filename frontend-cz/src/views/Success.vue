<template>
  <!-- 充值成功页 -->
  <div class="成功页容器">
    <!-- 顶部成功动画区 -->
    <div class="成功动画区">
      <div class="成功圆圈">
        <svg class="成功勾" viewBox="0 0 52 52">
          <circle class="成功圆" cx="26" cy="26" r="25" fill="none" />
          <path class="成功路径" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>
      <div class="成功标题">充值订单提交成功</div>
      <div class="成功副标题">客服将在预计时间内完成充值</div>
    </div>

    <!-- 订单信息卡片 -->
    <div class="订单信息卡片">
      <div class="信息行">
        <span class="信息标签">订单号</span>
        <span class="信息值单色">{{ 充值Store.订单号 || '-' }}</span>
      </div>
      <div class="信息行">
        <span class="信息标签">充值账号</span>
        <span class="信息值">{{ 脱敏账号 }}</span>
      </div>
      <div v-if="充值Store.会员名称" class="信息行">
        <span class="信息标签">充值会员</span>
        <span class="信息值">{{ 充值Store.会员名称 }}</span>
      </div>
      <div v-if="充值Store.到账时间" class="信息行">
        <span class="信息标签">预计到账时间</span>
        <span class="信息值高亮">{{ 充值Store.到账时间 }}</span>
      </div>
    </div>

    <!-- 温馨提示 -->
    <div class="温馨提示">
      <p>💬 如有疑问，请联系在线客服</p>
      <p>⏱️ 充值将在预计时间内完成到账</p>
      <p>📱 请保持手机畅通，等待客服联系</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTopupOrderStore } from '../stores/topupOrder'

const 充值Store = useTopupOrderStore()

// 账号脱敏显示（如 138****8888）
const 脱敏账号 = computed(() => {
  const 账号 = 充值Store.提交成功数据?.topup_account || ''
  if (!账号) return '-'
  const 类型 = 充值Store.账号类型

  if (类型 === 'phone' && 账号.length === 11) {
    return `${账号.slice(0, 3)}****${账号.slice(7)}`
  } else if (类型 === 'email') {
    const [用户名, 域名] = 账号.split('@')
    if (用户名.length > 2) {
      return `${用户名.slice(0, 2)}****@${域名}`
    }
  } else if (账号.length > 6) {
    return `${账号.slice(0, 3)}****${账号.slice(-2)}`
  }
  return 账号
})
</script>

<style scoped>
.成功页容器 {
  min-height: 100vh;
  background: linear-gradient(160deg, #667eea 0%, #764ba2 30%, #f5f7fa 30%);
  padding: 0 16px 40px;
}

/* 成功动画区 */
.成功动画区 {
  text-align: center;
  padding: 60px 0 30px;
}

.成功圆圈 {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.成功勾 {
  width: 80px;
  height: 80px;
}

/* 动画 */
.成功圆 {
  stroke: #fff;
  stroke-width: 2;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: 描边动画 0.6s ease forwards;
}

.成功路径 {
  stroke: #fff;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: 描边动画 0.4s ease forwards 0.6s;
}

@keyframes 描边动画 {
  from { stroke-dashoffset: 166; }
  to { stroke-dashoffset: 0; }
}

.成功标题 {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}

.成功副标题 {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

/* 订单信息卡片 */
.订单信息卡片 {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.信息行 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.信息行:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.信息标签 {
  font-size: 14px;
  color: #999;
}

.信息值 {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.信息值单色 {
  font-size: 12px;
  color: #667eea;
  font-family: monospace;
}

.信息值高亮 {
  font-size: 14px;
  color: #f6a623;
  font-weight: 700;
}

/* 温馨提示 */
.温馨提示 {
  background: rgba(102,126,234,0.08);
  border-radius: 12px;
  padding: 16px;
}

.温馨提示 p {
  font-size: 13px;
  color: #667eea;
  line-height: 2;
}
</style>
