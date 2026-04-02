<template>
  <!-- 卡密无效页 -->
  <div class="无效页面">
    <div class="无效内容">
      <div class="无效图标">❌</div>
      <div class="无效标题">卡密无效</div>
      <div class="无效描述">{{ 错误信息 }}</div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'

const route = useRoute()
const 错误信息 = ref(route.query.msg || '该卡密不存在、已被使用或已过期，请联系客服')
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
}

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
</style>
