<template>
  <!-- 三角洲下单成功页 -->
  <!-- 成功页专属弹窗：出现二维码/链接时的提示弹窗 -->
  <NoticePopup
    :show="显示成功弹窗"
    title="🎉 预约成功！"
    :content="`您的专属客服二维码已生成！\n请立即扫码或点击链接添加专属客服\n客服会第一时间为您安排服务`"
    icon-emoji="⚔️"
    btn-text="立即查看"
    btn-color="#e94560"
    bg-color="#16213e"
    title-color="#f5c518"
    content-color="#e0e0e0"
    :auto-close-seconds="5"
    :mask-closable="true"
    @close="显示成功弹窗 = false"
  />
  <div class="成功页容器">
    <!-- 顶部成功区 -->
    <div class="成功动画区">
      <div class="成功光晕容器">
        <div class="成功光晕"></div>
        <div class="成功圆圈">
          <svg class="成功勾" viewBox="0 0 52 52">
            <circle class="成功圆" cx="26" cy="26" r="25" fill="none" />
            <path class="成功路径" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </div>
      <div class="成功标题">{{ store.sjz_success_title }}</div>
      <div class="成功副标题">{{ store.sjz_success_subtitle }}</div>
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
      <div class="微信入口标题">{{ store.sjz_success_next_title }}</div>
      <div class="微信入口说明">{{ store.sjz_success_next_subtitle }}</div>

      <!-- 无数据时的提示 -->
      <div v-if="!有企业微信数据" class="无微信提示">
        <p v-for="(行, 索引) in 无微信提示行" :key="索引">{{ 行 }}</p>
      </div>

      <template v-if="有企业微信数据">
        <!-- 方案1：链接跳转 -->
        <button v-if="显示链接" class="link-btn" @click="跳转企业微信">
          {{ store.sjz_link_btn_text }}
        </button>

        <!-- 分隔线 -->
        <div v-if="显示链接 && 显示二维码" class="分隔线">
          <span class="分隔文字">── 或者 ──</span>
        </div>

        <!-- 方案2：二维码 -->
        <div v-if="显示二维码" class="二维码区">
          <div class="二维码标题">📱 扫码添加专属客服</div>
          <div class="二维码外框">
            <img :src="store.qywx_qrcode_url" class="qrcode-img" alt="企业微信二维码" />
          </div>
          <div class="二维码指引">
            <span>长按二维码 → 识别添加 → 马上安排</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 服务保障 -->
    <div class="guarantee-card">
      <div class="保障标题">{{ store.sjz_success_guarantee_title }}</div>
      <div class="保障格子">
        <div
          v-for="(项, 索引) in store.sjz_success_guarantee_items"
          :key="索引"
          class="保障项"
        >{{ 项 }}</div>
      </div>
    </div>

    <!-- 底部间距 -->
    <div style="height: 32px"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useSjzOrderStore } from '../stores/sjzOrder'
import NoticePopup from '../components/NoticePopup.vue'

const store = useSjzOrderStore()

// 成功页弹窗状态
const 显示成功弹窗 = ref(false)

// 从sessionStorage恢复（防止页面刷新）
onMounted(() => {
  if (!store.订单号) {
    store.从缓存恢复()
  }
  // 若有企业微信数据（二维码或链接），延迟 800ms 弹出提示弹窗
  setTimeout(() => {
    if (store.qywx_link || store.qywx_qrcode_url) {
      显示成功弹窗.value = true
    }
  }, 800)
})

// 无微信提示按行分割
const 无微信提示行 = computed(() => {
  return (store.sjz_success_no_qywx_text || '').split('\n').filter(行 => 行.trim())
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
  background: linear-gradient(180deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 0 16px 40px;
}

/* ===== 成功动画区 ===== */
.成功动画区 {
  text-align: center;
  padding: 50px 0 24px;
}

.成功光晕容器 {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.成功光晕 {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,197,24,0.25) 0%, rgba(245,197,24,0) 70%);
  animation: 光晕脉冲 2.5s ease-in-out infinite;
}

@keyframes 光晕脉冲 {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 0.4; }
}

.成功圆圈 {
  position: relative;
  width: 80px;
  height: 80px;
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
  font-size: 24px;
  font-weight: 800;
  color: #f5c518;
  margin-bottom: 8px;
  text-shadow: 0 0 20px rgba(245,197,24,0.4);
}

.成功副标题 {
  font-size: 14px;
  color: #aaa;
}

/* ===== 信息卡片 ===== */
.信息卡片 {
  background: #16213e;
  border: 1px solid #1a3a6e;
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
  border: 2px solid rgba(7, 193, 96, 0.3);
  border-radius: 16px;
  padding: 20px 16px;
  margin-bottom: 12px;
  text-align: center;
  box-shadow: 0 0 20px rgba(7, 193, 96, 0.1);
}

.微信入口标题 {
  font-size: 18px;
  font-weight: 800;
  color: #f5c518;
  margin-bottom: 6px;
}

.微信入口说明 {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 20px;
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

/* 链接按钮（更大更绿） */
.link-btn {
  background: linear-gradient(135deg, #07c160, #06a854);
  color: white;
  width: 100%;
  padding: 18px;
  border-radius: 28px;
  font-size: 17px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(7, 193, 96, 0.55);
  animation: 绿按钮脉冲 2s ease-in-out infinite;
  letter-spacing: 0.5px;
}

@keyframes 绿按钮脉冲 {
  0%, 100% { box-shadow: 0 4px 20px rgba(7,193,96,0.55); transform: scale(1); }
  50% { box-shadow: 0 6px 28px rgba(7,193,96,0.75); transform: scale(1.015); }
}

.link-btn:active { opacity: 0.85; transform: scale(0.98); animation: none; }

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

.二维码外框 {
  display: inline-block;
  border: 3px solid #f5c518;
  border-radius: 12px;
  padding: 6px;
  background: #fff;
  box-shadow: 0 0 20px rgba(245,197,24,0.35);
  margin: 12px 0 8px;
}

.qrcode-img {
  width: 200px;
  height: 200px;
  display: block;
  object-fit: contain;
}

.二维码指引 {
  font-size: 13px;
  color: #07c160;
  font-weight: 600;
  margin-top: 4px;
}

/* ===== 服务保障 ===== */
.guarantee-card {
  background: #16213e;
  border: 1px solid #1a3a6e;
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
  color: #07c160;
  font-weight: 600;
  padding: 6px 8px;
  background: rgba(7, 193, 96, 0.08);
  border-radius: 8px;
}
</style>
