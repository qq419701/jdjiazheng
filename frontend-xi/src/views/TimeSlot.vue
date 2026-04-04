<template>
  <div class="时间选择页面">
    <van-nav-bar title="选择取件时间" left-arrow @click-left="返回上页" :border="false" />

    <!-- 日期列表 -->
    <div class="日期滚动区">
      <div
        v-for="日期项 in 日期列表"
        :key="日期项.值"
        :class="['日期卡片', { '日期卡片选中': 选中日期 === 日期项.值 }]"
        @click="选中日期 = 日期项.值"
      >
        <div class="日期数字">{{ 日期项.日 }}</div>
        <div class="日期星期">{{ 日期项.星期 }}</div>
      </div>
    </div>

    <!-- 时间段 -->
    <div class="时间段区域">
      <div class="时间段标题">可选取件时间段</div>
      <div v-if="加载中" class="加载提示"><van-loading color="#1989fa" size="24px" /></div>
      <div v-else-if="时间段列表.length === 0" class="无时间段">暂无可选时间段</div>
      <div v-else class="时间段网格">
        <div
          v-for="时间段 in 时间段列表"
          :key="时间段.label"
          :class="['时间段卡片', { '时间段选中': 选中时间段?.label === 时间段.label }]"
          @click="选中时间段 = 时间段"
        >
          {{ 时间段.label }}
        </div>
      </div>
    </div>

    <div class="底部按钮容器">
      <van-button
        type="primary"
        block
        round
        color="linear-gradient(135deg, #1989fa, #4fc3f7)"
        :disabled="!选中日期 || !选中时间段"
        @click="确认选择"
      >
        确认选择
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLaundryOrderStore } from '../stores/laundryOrder'
import { 获取洗衣时间表API } from '../api/index'

const route = useRoute()
const router = useRouter()
const 洗衣Store = useLaundryOrderStore()

const 加载中 = ref(false)
const 时间段列表 = ref([])
const 选中日期 = ref('')
const 选中时间段 = ref(null)

const 星期名 = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const 日期列表 = computed(() => {
  const 列表 = []
  for (let i = 1; i <= 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const 年 = d.getFullYear()
    const 月 = String(d.getMonth() + 1).padStart(2, '0')
    const 日 = String(d.getDate()).padStart(2, '0')
    列表.push({ 值: `${年}-${月}-${日}`, 日: `${月}/${日}`, 星期: 星期名[d.getDay()] })
  }
  return 列表
})

onMounted(async () => {
  if (日期列表.value.length > 0) 选中日期.value = 日期列表.value[0].值
  加载中.value = true
  try {
    const 结果 = await 获取洗衣时间表API(洗衣Store.取件城市)
    if (结果.code === 1) 时间段列表.value = 结果.data
  } catch {
    showToast('加载时间段失败')
  } finally {
    加载中.value = false
  }
})

const 返回上页 = () => router.back()

const 确认选择 = () => {
  if (!选中日期.value || !选中时间段.value) {
    showToast('请选择日期和时间段')
    return
  }
  洗衣Store.保存取件时间(选中日期.value, 选中时间段.value.label, 选中时间段.value.start, 选中时间段.value.end)
  router.back()
}
</script>

<style scoped>
.时间选择页面 { min-height: 100vh; background: #f5f5f5; padding-bottom: 80px; }
.日期滚动区 { display: flex; overflow-x: auto; padding: 12px 16px; gap: 8px; background: white; }
.日期卡片 { display: flex; flex-direction: column; align-items: center; padding: 10px 14px; border-radius: 8px; cursor: pointer; flex-shrink: 0; background: #f5f5f5; min-width: 60px; }
.日期卡片选中 { background: #1989fa; color: white; }
.日期数字 { font-size: 14px; font-weight: 600; }
.日期星期 { font-size: 11px; opacity: 0.8; margin-top: 2px; }
.时间段区域 { padding: 16px; }
.时间段标题 { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 12px; }
.加载提示 { display: flex; justify-content: center; padding: 20px; }
.无时间段 { text-align: center; color: #ccc; padding: 20px; }
.时间段网格 { display: flex; flex-wrap: wrap; gap: 10px; }
.时间段卡片 { padding: 10px 20px; border-radius: 20px; font-size: 14px; background: white; border: 1.5px solid #e8e8e8; cursor: pointer; }
.时间段选中 { background: #e8f4fd; color: #1989fa; border-color: #1989fa; font-weight: 500; }
.底部按钮容器 { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: white; box-shadow: 0 -2px 10px rgba(0,0,0,0.08); }
</style>
