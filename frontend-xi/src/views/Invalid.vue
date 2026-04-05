<template>
  <div class="无效页面">
    <div class="无效图标">❌</div>
    <div class="无效标题">卡密无效</div>
    <div class="无效描述">该卡密不存在、已使用或已过期</div>
    <div class="无效提示">如有疑问，请联系客服</div>
  </div>
</template>

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
.无效图标 { font-size: 72px; }
.无效标题 { font-size: 22px; font-weight: 700; color: #333; }
.无效描述 { font-size: 14px; color: #999; }
.无效提示 { font-size: 13px; color: #bbb; }
</style>
