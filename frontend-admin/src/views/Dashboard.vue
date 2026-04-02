<template>
  <!-- 数据看板 -->
  <div class="看板页面">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="统计卡片行">
      <el-col :span="6">
        <div class="统计卡片 蓝色">
          <div class="统计数字">{{ 统计数据.总订单数 }}</div>
          <div class="统计标签">总订单数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="统计卡片 绿色">
          <div class="统计数字">{{ 统计数据.今日新增 }}</div>
          <div class="统计标签">今日新增</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="统计卡片 橙色">
          <div class="统计数字">{{ 统计数据.待处理数 }}</div>
          <div class="统计标签">待处理</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="统计卡片 红色">
          <div class="统计数字">{{ 统计数据.成功率 }}%</div>
          <div class="统计标签">下单成功率</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="图表行">
      <!-- 近7天订单折线图 -->
      <el-col :span="16">
        <el-card title="近7天订单趋势">
          <template #header>
            <span class="卡片标题">📈 近7天订单趋势</span>
          </template>
          <div ref="折线图容器" style="height: 280px;"></div>
        </el-card>
      </el-col>

      <!-- 订单状态分布饼图 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span class="卡片标题">🥧 订单状态分布</span>
          </template>
          <div ref="饼图容器" style="height: 280px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { 获取看板数据API } from '../api/index'

// 统计数据
const 统计数据 = ref({
  总订单数: 0,
  今日新增: 0,
  待处理数: 0,
  成功率: 0,
  近七天: [],
  状态分布: [],
})

// 图表容器
const 折线图容器 = ref(null)
const 饼图容器 = ref(null)

// 加载数据
const 加载数据 = async () => {
  try {
    const 结果 = await 获取看板数据API()
    if (结果.code === 1) {
      统计数据.value = 结果.data
      await nextTick()
      初始化折线图()
      初始化饼图()
    }
  } catch (e) {
    console.error('加载看板数据失败:', e)
  }
}

// 初始化折线图
const 初始化折线图 = () => {
  const 图表 = echarts.init(折线图容器.value)
  const 数据 = 统计数据.value.近七天 || []

  图表.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: 数据.map(d => d.日期),
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '订单数',
      type: 'line',
      smooth: true,
      data: 数据.map(d => d.数量),
      itemStyle: { color: '#e54635' },
      areaStyle: { color: 'rgba(229, 70, 53, 0.1)' },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  })
}

// 初始化饼图
const 初始化饼图 = () => {
  const 图表 = echarts.init(饼图容器.value)
  const 数据 = 统计数据.value.状态分布 || []

  图表.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: ['40%', '70%'],
      data: 数据.map(d => ({ name: d.名称, value: d.数量 })),
      itemStyle: {
        borderRadius: 4,
      },
    }],
    color: ['#909399', '#409EFF', '#67C23A', '#F56C6C', '#E6A23C'],
  })
}

onMounted(() => {
  加载数据()
})
</script>

<style scoped>
.看板页面 {}

.统计卡片行 {
  margin-bottom: 16px;
}

.统计卡片 {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-top: 3px solid;
}

.统计卡片.蓝色 { border-top-color: #409EFF; }
.统计卡片.绿色 { border-top-color: #67C23A; }
.统计卡片.橙色 { border-top-color: #E6A23C; }
.统计卡片.红色 { border-top-color: #F56C6C; }

.统计数字 {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.统计标签 {
  font-size: 14px;
  color: #999;
}

.图表行 {}

.卡片标题 {
  font-size: 15px;
  font-weight: 600;
}
</style>
