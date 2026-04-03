<template>
  <!-- 选择上门时间弹出层 -->
  <van-popup
    v-model:show="显示弹窗"
    position="bottom"
    round
    :style="{ height: '60%' }"
    @closed="关闭弹窗"
  >
    <div class="时间选择器">
      <!-- 标题栏 -->
      <div class="时间选择标题">
        <span>选择上门时间</span>
        <van-icon name="cross" class="关闭图标" @click="关闭弹窗" />
      </div>

      <!-- 顶部约满横幅（仅当前3天全约满时显示） -->
      <div v-if="前三天全约满 && !加载中" class="近期约满横幅">
        📅 近期约满，请向下滑动选择后面的日期 ↓
      </div>

      <!-- 加载中 -->
      <div v-if="加载中" class="加载提示">
        <van-loading color="#e54635" />
        <span>正在获取可用时间...</span>
      </div>

      <!-- 日期和时间列表 -->
      <div v-else class="时间选择主体">
        <!-- 左侧日期列表 -->
        <div class="日期列表" ref="日期列表引用">
          <div
            v-for="(日期项, 索引) in 日期时间列表"
            :key="索引"
            class="日期项"
            :class="{
              '日期选中': 选中日期索引 === 索引,
              '日期约满': 日期项.is_full
            }"
            :data-index="索引"
            @click="选择日期(索引, 日期项)"
          >
            <div class="周几文字">{{ 日期项.week }}</div>
            <div class="日期文字">{{ 日期项.display }}</div>
            <div v-if="日期项.is_full" class="约满标签">已约满</div>
          </div>
        </div>

        <!-- 右侧时间格子 -->
        <div class="时间格子区">
          <template v-if="当前日期约满">
            <div class="约满占位卡">
              <div class="约满占位图标">🚫</div>
              <div class="约满占位文字">该日期已约满<br/>请在左侧选择其他日期</div>
            </div>
          </template>
          <template v-else-if="选中日期索引 >= 0">
            <div class="时间格子列表">
              <div
                v-for="(时间项, 索引) in 当前时间段列表"
                :key="索引"
                class="时间格子"
                :class="{ '时间选中': 选中时间段 === 时间项.time }"
                @click="选择时间段(时间项)"
              >
                {{ 时间项.time }}
              </div>
            </div>
          </template>
          <template v-else>
            <div class="约满提示">请先选择日期</div>
          </template>
        </div>
      </div>

      <!-- 确认按钮 -->
      <div class="时间确认按钮区">
        <van-button
          block
          round
          :color="选中时间段 ? 'linear-gradient(135deg, #e54635, #ff6b35)' : '#cccccc'"
          :disabled="!选中时间段"
          @click="确认时间选择"
        >
          确认选择
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { showToast } from 'vant'
import { 获取时间表API } from '../api/index'

// 接收父组件参数
const props = defineProps({
  // 是否显示弹窗
  显示: {
    type: Boolean,
    default: false,
  },
  // 用户所在城市
  城市: {
    type: String,
    default: '',
  },
})

// 向父组件发送事件
const emit = defineEmits(['关闭', '确认选择'])

// 控制弹窗显示
const 显示弹窗 = computed({
  get: () => props.显示,
  set: (值) => emit('关闭'),
})

// 状态
const 加载中 = ref(false)
const 日期时间列表 = ref([])
const 选中日期索引 = ref(-1)
const 选中时间段 = ref('')
const 选中日期字符串 = ref('')
const 日期列表引用 = ref(null)

// 当前选中日期是否约满
const 当前日期约满 = computed(() => {
  if (选中日期索引.value < 0) return false
  return 日期时间列表.value[选中日期索引.value]?.is_full || false
})

// 前3个日期是否全约满
const 前三天全约满 = computed(() => {
  if (日期时间列表.value.length === 0) return false
  const 前三 = 日期时间列表.value.slice(0, 3)
  return 前三.every(d => d.is_full)
})

// 当前日期的可用时间段
const 当前时间段列表 = computed(() => {
  if (选中日期索引.value < 0) return []
  return 日期时间列表.value[选中日期索引.value]?.time_slots || []
})

// 加载时间表
const 加载时间表 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取时间表API(props.城市)
    if (结果.code === 1) {
      日期时间列表.value = 结果.data
      // 默认选择第一个未约满的日期
      const 第一个可选 = 日期时间列表.value.findIndex(d => !d.is_full)
      if (第一个可选 >= 0) {
        选中日期索引.value = 第一个可选
        选中日期字符串.value = 日期时间列表.value[第一个可选].date
        // 等待DOM更新后滚动到选中日期
        await nextTick()
        setTimeout(() => 滚动到选中日期(第一个可选), 100)
      }
    }
  } catch (错误) {
    showToast('获取时间表失败，请重试')
  } finally {
    加载中.value = false
  }
}

// 滚动日期列表到指定索引
const 滚动到选中日期 = (索引) => {
  if (!日期列表引用.value) return
  const 所有日期项 = 日期列表引用.value.querySelectorAll('.日期项')
  if (所有日期项[索引]) {
    所有日期项[索引].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 监听弹窗显示
watch(() => props.显示, (新值) => {
  if (新值) {
    选中时间段.value = ''
    加载时间表()
  }
})

// 选择日期
const 选择日期 = (索引, 日期项) => {
  选中日期索引.value = 索引
  选中日期字符串.value = 日期项.date
  选中时间段.value = '' // 重置时间段选择
}

// 选择时间段
const 选择时间段 = (时间项) => {
  选中时间段.value = 时间项.time
}

// 确认选择
const 确认时间选择 = () => {
  if (!选中时间段.value) {
    showToast('请选择上门时间')
    return
  }
  emit('确认选择', {
    日期: 选中日期字符串.value,
    时间段: 选中时间段.value,
  })
}

// 关闭弹窗
const 关闭弹窗 = () => {
  emit('关闭')
}
</script>

<style scoped>
.时间选择器 {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.时间选择标题 {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.关闭图标 {
  position: absolute;
  right: 16px;
  font-size: 18px;
  color: #999;
}

.加载提示 {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  font-size: 14px;
}

.时间选择主体 {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.日期列表 {
  width: 100px;
  overflow-y: auto;
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
}

/* 顶部约满横幅 */
.近期约满横幅 {
  background: linear-gradient(135deg, #ff6b35, #ff8c42);
  color: white;
  font-size: 13px;
  font-weight: bold;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 12px;
  flex-shrink: 0;
}

/* 普通日期项：正常高度 */
.日期项 {
  height: 64px;
  box-sizing: border-box;
  padding: 10px 8px;
  text-align: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 约满日期项：压缩高度，半透明 */
.日期约满.日期项 {
  height: 48px;
  opacity: 0.6;
}

.日期选中 {
  background: white;
  border-left: 3px solid #e53935;
  border-right: none;
}

.日期约满 {
  color: #999;
}

.周几文字 {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.日期约满 .周几文字 {
  color: #999;
}

.日期文字 {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.日期约满 .日期文字 {
  color: #999;
}

.约满标签 {
  font-size: 10px;
  color: #ff6b35;
  background: #fff3ef;
  padding: 1px 4px;
  border-radius: 3px;
  margin-top: 4px;
}

.时间格子区 {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.时间格子列表 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.时间格子 {
  padding: 10px;
  text-align: center;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.时间选中 {
  background: linear-gradient(135deg, #e54635, #ff6b35) !important;
  color: white !important;
  border-color: #e54635 !important;
}

.约满提示 {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

.约满占位卡 {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  text-align: center;
  padding: 20px;
}

.约满占位图标 {
  font-size: 36px;
}

.约满占位文字 {
  font-size: 14px;
  color: #999;
  line-height: 1.6;
}

.时间确认按钮区 {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
}
</style>
