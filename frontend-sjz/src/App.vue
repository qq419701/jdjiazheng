<template>
  <!-- 三角洲H5根组件 -->
  <router-view />
</template>

<script setup>
// 三角洲H5根组件，仅作为路由容器
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background-color: #1a1a2e;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>
