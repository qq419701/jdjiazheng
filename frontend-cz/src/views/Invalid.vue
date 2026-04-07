<template>
  <!-- 卡密无效页 -->
  <div class="无效页容器">
    <div class="无效内容">
      <div class="无效图标">{{ 是否已使用 ? '🔒' : '❌' }}</div>
      <div class="无效标题">{{ 是否已使用 ? '卡密已被使用' : '卡密无效' }}</div>
      <div class="无效描述">
        <template v-if="是否已使用">
          此充值链接已被使用，每个链接仅可充值一次。<br>如有疑问请联系客服。
        </template>
        <template v-else>
          此充值链接无效或已过期。<br>请确认链接是否正确，或联系客服获取帮助。
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// 通过 URL 参数判断是否是"已使用"状态
const 是否已使用 = computed(() => route.query.used === '1')
</script>

<style scoped>
.无效页容器 {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.无效内容 {
  text-align: center;
  padding: 40px 30px;
  background: rgba(255,255,255,0.15);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  margin: 20px;
}

.无效图标 {
  font-size: 64px;
  margin-bottom: 16px;
}

.无效标题 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.无效描述 {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  line-height: 1.8;
}
</style>
