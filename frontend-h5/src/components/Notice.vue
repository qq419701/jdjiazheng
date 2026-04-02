<template>
  <!-- 下单须知组件 -->
  <div class="下单须知区块">
    <div class="须知标题">· 下单须知 ·</div>
    <div class="须知内容">
      <p
        v-for="(行, 索引) in 须知行列表"
        :key="索引"
        class="须知行"
      >{{ 行 }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 须知文本（可包含换行符）
  须知文本: {
    type: String,
    default: '1. 预约成功后，客服将在24小时内联系您确认服务时间\n2. 服务当天请保持手机畅通\n3. 请提前清理贵重物品\n4. 服务范围：室内日常清洁，不含高空作业\n5. 如需取消，请提前24小时联系客服',
  },
})

// 将文本按换行分割为行数组
const 须知行列表 = computed(() => {
  return props.须知文本.split('\n').filter(行 => 行.trim())
})
</script>

<style scoped>
.下单须知区块 {
  background: white;
  border-radius: 12px;
  margin: 12px 16px;
  padding: 16px;
}

.须知标题 {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #e54635;
  margin-bottom: 12px;
}

.须知内容 {
  padding: 0 4px;
}

.须知行 {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
  margin-bottom: 4px;
}
</style>
