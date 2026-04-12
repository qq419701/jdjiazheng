<template>
  <!-- 三角洲下单成功页 -->
  <div class="成功页容器">
    <!-- 顶部成功区 -->
    <div class="成功动画区">
      <div class="成功圆圈">
        <svg class="成功勾" viewBox="0 0 52 52">
          <circle class="成功圆" cx="26" cy="26" r="25" fill="none" />
          <path class="成功路径" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>
      <div class="成功标题">✅ 下单成功！</div>
      <div class="成功副标题">我们已收到您的服务订单</div>
    </div>

    <!-- 订单信息卡片 -->
    <div class="信息卡片">
      <div class="信息行">
        <span class="信息标签">订单号</span>
        <span class="信息值单色">{{ store.订单号 || '-' }}</span>
      </div>
      <div v-if="store.哈夫币数量" class="信息行">
        <span class="信息标签">哈夫币数量</span>
        <span class="信息值高亮">{{ store.哈夫币数量 }}</span>
      </div>
    </div>

    <!-- 企业微信入口（核心！） -->
    <div class="微信入口卡片">
      <div class="微信入口标题">🎮 下一步：添加专属客服</div>
      <div class="微信入口说明">添加企业微信后第一时间安排哈夫币充值服务</div>

      <!-- 无数据时的提示 -->
      <div v-if="!有企业微信数据" class="无微信提示">
        <p>📞 客服会主动联系您</p>
        <p>请保持手机畅通，耐心等待联系</p>
      </div>

      <template v-if="有企业微信数据">
        <!-- 方案1：链接跳转 -->
        <button v-if="显示链接" class="link-btn" @click="跳转企业微信">
          💬 点击添加专属客服
        </button>

        <!-- 分隔线 -->
        <div v-if="显示链接 && 显示二维码" class="分隔线">
          <span class="分隔文字">── 或者 ──</span>
        </div>

        <!-- 方案2：二维码 -->
        <div v-if="显示二维码" class="二维码区">
          <div class="二维码标题">📱 扫码添加专属客服</div>
          <img :src="store.qywx_qrcode_url" class="qrcode-img" alt="企业微信二维码" />
          <div class="二维码说明">长按或扫描二维码 → 点击添加</div>
        </div>
      </template>
    </div>

    <!-- 服务保障 -->
    <div class="guarantee-card">
      <div class="保障标题">🛡️ 服务保障</div>
      <div class="保障格子">
        <div class="保障项">✅ 追缴包赔</div>
        <div class="保障项">✅ 手游端游均可</div>
        <div class="保障项">✅ 24小时客服</div>
        <div class="保障项">✅ 安全有保障</div>
      </div>
    </div>

    <!-- 底部间距 -->
    <div style="height: 32px"></div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSjzOrderStore } from '../stores/sjzOrder'

const store = useSjzOrderStore()

// 从sessionStorage恢复（防止页面刷新）
onMounted(() => {
  if (!store.订单号) {
    store.从缓存恢复()
  }
})

// 是否有企业微信数据
const 有企业微信数据 = computed(() => {
  return store.qywx_link || store.qywx_qrcode_url
})

// 是否显示链接入口
const 显示链接 = computed(() => {
  return ['link', 'both'].includes(store.qywx_add_friend_mode) && store.qywx_link
})

// 是否显示二维码
const 显示二维码 = computed(() => {
  return ['qrcode', 'both'].includes(store.qywx_add_friend_mode) && store.qywx_qrcode_url
})

// 跳转企业微信
const 跳转企业微信 = () => {
  if (store.qywx_link) {
    window.location.href = store.qywx_link
  }
}
</script>

<style scoped>
/* ===== 成功页容器 ===== */
.成功页容器 {
  min-height: 100vh;
  background: #1a1a2e;
  padding: 0 16px 40px;
}

/* ===== 成功动画区 ===== */
.成功动画区 {
  text-align: center;
  padding: 50px 0 24px;
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

.成功圆 {
  stroke: #e94560;
  stroke-width: 2;
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: 描边动画 0.6s ease forwards;
}

.成功路径 {
  stroke: #f5c518;
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
  color: #e0e0e0;
  margin-bottom: 6px;
}

.成功副标题 {
  font-size: 14px;
  color: #aaa;
}

/* ===== 信息卡片 ===== */
.信息卡片 {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.信息行 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #0f3460;
}

.信息行:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.信息标签 { font-size: 14px; color: #888; }
.信息值单色 { font-size: 12px; color: #e94560; font-family: monospace; }
.信息值高亮 { font-size: 16px; color: #f5c518; font-weight: 700; }

/* ===== 企业微信入口 ===== */
.微信入口卡片 {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 20px 16px;
  margin-bottom: 12px;
  text-align: center;
}

.微信入口标题 {
  font-size: 17px;
  font-weight: 700;
  color: #f5c518;
  margin-bottom: 6px;
}

.微信入口说明 {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 16px;
}

.无微信提示 {
  padding: 16px;
  background: rgba(233, 69, 96, 0.08);
  border-radius: 8px;
}

.无微信提示 p {
  font-size: 14px;
  color: #aaa;
  line-height: 2;
}

/* 链接按钮 */
.link-btn {
  background: linear-gradient(135deg, #07c160, #06a854);
  color: white;
  width: 100%;
  padding: 14px;
  border-radius: 28px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(7, 193, 96, 0.4);
  transition: opacity 0.2s;
}

.link-btn:active { opacity: 0.85; }

/* 分隔线 */
.分隔线 {
  display: flex;
  align-items: center;
  margin: 16px 0;
  gap: 8px;
}

.分隔线::before,
.分隔线::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #0f3460;
}

.分隔文字 { font-size: 13px; color: #555; white-space: nowrap; }

/* 二维码 */
.二维码区 { margin-top: 8px; }
.二维码标题 { font-size: 14px; color: #aaa; margin-bottom: 4px; }

.qrcode-img {
  width: 200px;
  height: 200px;
  border: 4px solid #f5c518;
  border-radius: 12px;
  display: block;
  margin: 12px auto;
  object-fit: contain;
  background: #fff;
}

.二维码说明 { font-size: 13px; color: #888; margin-top: 8px; }

/* ===== 服务保障 ===== */
.guarantee-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 16px;
}

.保障标题 {
  font-size: 15px;
  font-weight: 700;
  color: #f5c518;
  margin-bottom: 12px;
}

.保障格子 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.保障项 {
  font-size: 13px;
  color: #aaa;
  padding: 4px 0;
}
</style>
