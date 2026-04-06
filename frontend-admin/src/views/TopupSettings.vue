<template>
  <!-- 虚拟充值设置（占位页面，功能待接入） -->
  <div class="占位页面">
    <el-empty description="虚拟充值设置功能正在开发中">
      <template #image>
        <span style="font-size: 64px">⚙️</span>
      </template>
      <p class="占位说明">此模块将支持配置充值业务参数，包括充值渠道、手续费率、自动到账规则、充值限额等设置。</p>
    </el-empty>
  </div>
</template>

<style scoped>
.占位页面 { padding: 60px 20px; text-align: center; }
.占位说明 { color: #999; font-size: 14px; margin-top: 12px; }
</style>
