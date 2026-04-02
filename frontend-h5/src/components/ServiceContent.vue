<template>
  <!-- 服务内容展示组件 -->
  <div class="服务内容区块">
    <div class="服务内容标题">
      <span class="红钻图标">◆</span>
      <span>服务内容</span>
      <span class="红钻图标">◆</span>
    </div>
    <div class="服务内容列表">
      <div v-for="(项目, 索引) in 服务内容列表" :key="索引" class="服务项目">
        <div class="服务图标">{{ 项目.icon }}</div>
        <div class="服务文字">
          <div class="服务标题">{{ 项目.title }}</div>
          <div class="服务描述">{{ 项目.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 服务内容组件属性
defineProps({
  服务内容列表: {
    type: Array,
    default: () => [
      { icon: '🏆', title: '清洁标准流程', desc: '专业培训标准作业流程' },
      { icon: '✨', title: '清洁彻底高效', desc: '高效工具深度彻底清洁' },
      { icon: '📦', title: '分格收纳卫生', desc: '分类收纳整洁干净卫生' },
    ],
  },
})
</script>

<style scoped>
.服务内容区块 {
  background: white;
  border-radius: 12px;
  margin: 12px 16px;
  padding: 16px;
}

.服务内容标题 {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #e54635;
  margin-bottom: 16px;
}

.红钻图标 {
  font-size: 12px;
  margin: 0 6px;
}

.服务内容列表 {
  display: flex;
  justify-content: space-around;
}

.服务项目 {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.服务图标 {
  font-size: 32px;
  margin-bottom: 8px;
}

.服务文字 {
  text-align: center;
}

.服务标题 {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.服务描述 {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
}
</style>
