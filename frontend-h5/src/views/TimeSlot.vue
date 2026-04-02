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

      <!-- 加载中 -->
      <div v-if="加载中" class="加载提示">
        <van-loading color="#e54635" />
        <span>正在获取可用时间...</span>
      </div>

      <!-- 日期和时间列表 -->
      <div v-else class="时间选择主体">
        <!-- 左侧日期列表 -->
        <div class="日期列表">
          <div
            v-for="(日期项, 索引) in 日期时间列表"
            :key="索引"
            class="日期项"
            :class="{
              '日期选中': 选中日期索引 === 索引,
              '日期约满': 日期项.is_full
            }"
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
            <div class="约满提示">该日期已约满</div>
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
          type="primary"
          block
          round
          color="linear-gradient(135deg, #e54635, #ff6b35)"
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
import { ref, computed, watch } from 'vue'
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

// 当前选中日期是否约满
const 当前日期约满 = computed(() => {
  if (选中日期索引.value < 0) return false
  return 日期时间列表.value[选中日期索引.value]?.is_full || false
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
      }
    }
  } catch (错误) {
    showToast('获取时间表失败，请重试')
  } finally {
    加载中.value = false
  }
}

// 监听弹窗显示
watch(() => props.显示, (新值) => {
  if (新值) {
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
  width: 90px;
  overflow-y: auto;
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
}

.日期项 {
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.日期选中 {
  background: white;
  border-right: 2px solid #e54635;
}

.日期约满 {
  color: #ccc;
}

.周几文字 {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.日期约满 .周几文字 {
  color: #ccc;
}

.日期文字 {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.日期约满 .日期文字 {
  color: #ccc;
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
}

.时间确认按钮区 {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
}
</style>
