<template>
  <!-- 选择上门时间弹出层（横向日历风格，仿美团/京东风格） -->
  <van-popup
    v-model:show="显示弹窗"
    position="bottom"
    round
    :style="{ height: '70%' }"
    @closed="关闭弹窗"
  >
    <div class="时间选择器">
      <!-- 标题栏 -->
      <div class="时间选择标题">
        <span>选择上门时间</span>
        <van-icon name="cross" class="关闭图标" @click="关闭弹窗" />
      </div>

      <!-- 多选模式提示文字（从设置读取，多选模式下显示） -->
      <div v-if="多选模式 && 多选提示" class="多选提示横幅">
        {{ 多选提示 }}
      </div>

      <!-- 近期约满提示横幅（当前可见前4个日期全约满时显示） -->
      <div v-if="前N天全约满 && !加载中" class="近期约满横幅">
        📅 近期约满，请向右滑动选择后面的日期 →
      </div>

      <!-- 加载中状态 -->
      <div v-if="加载中" class="加载提示">
        <van-loading color="#e54635" />
        <span>正在获取可用时间...</span>
      </div>

      <template v-else>
        <!-- 横向滑动日期选择条 -->
        <div class="日期选择条" ref="日期条引用">
          <div
            v-for="(日期项, 索引) in 日期时间列表"
            :key="索引"
            class="日期芯片"
            :class="{
              '日期芯片_选中': 选中日期索引 === 索引,
              '日期芯片_约满': 日期项.is_full,
            }"
            @click="选择日期(索引, 日期项)"
          >
            <!-- 周几（小字） -->
            <div class="芯片周几">{{ 日期项.week }}</div>
            <!-- 月/日（大字） -->
            <div class="芯片日期">{{ 日期项.display }}</div>
            <!-- 今天标签 -->
            <div v-if="日期项.is_today" class="芯片今天标签">今天</div>
            <!-- 约满标签 -->
            <div v-else-if="日期项.is_full" class="芯片约满标签">已满</div>
          </div>
        </div>

        <!-- 当前选中日期标题行 -->
        <div v-if="选中日期索引 >= 0" class="选中日期标题">
          {{ 当前选中日期显示 }}
        </div>

        <!-- 时间格子区 -->
        <div class="时间格子区">
          <!-- 该日期已约满 -->
          <template v-if="当前日期约满">
            <div class="约满占位卡">
              <div class="约满占位图标">🚫</div>
              <div class="约满占位文字">该日期已约满<br/>请在上方选择其他日期</div>
            </div>
          </template>
          <!-- 显示时间格子（2列网格） -->
          <template v-else-if="选中日期索引 >= 0">
            <div class="时间格子列表">
              <div
                v-for="(时间项, 索引) in 当前时间段列表"
                :key="索引"
                class="时间格子"
                :class="{ '时间格子_选中': 是否已选中(时间项) }"
                @click="选择时间段(时间项)"
              >
                <!-- 多选模式：显示优先级序号徽章 -->
                <span
                  v-if="多选模式 && 获取选中序号(时间项) > 0"
                  class="优先级徽章"
                >{{ 获取选中序号(时间项) }}</span>
                {{ 时间项.time }}
              </div>
            </div>
          </template>
          <!-- 未选择日期 -->
          <template v-else>
            <div class="约满提示">请先在上方选择日期</div>
          </template>
        </div>

        <!-- 多选模式：已选时间标签区（显示在时间格子下方） -->
        <div v-if="多选模式 && 多选时间列表.length > 0" class="已选时间标签区">
          <div
            v-for="(项, 索引) in 多选时间列表"
            :key="索引"
            class="已选时间标签"
          >
            <span class="标签序号">{{ 序号字符[索引] || `${索引 + 1}.` }}</span>
            {{ 项.date }} {{ 项.time }}
            <span class="标签删除" @click.stop="删除多选时间(索引)">×</span>
          </div>
        </div>
      </template>

      <!-- 底部确认按钮 -->
      <div class="时间确认按钮区">
        <van-button
          block
          round
          :color="确认按钮可用 ? 'linear-gradient(135deg, #e54635, #ff6b35)' : '#cccccc'"
          :disabled="!确认按钮可用"
          @click="确认时间选择"
        >
          {{ 确认按钮文字 }}
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { showToast } from 'vant'
import { 获取时间表API } from '../api/index'

// ===== Props 接收父组件传入的参数 =====
const props = defineProps({
  /** 是否显示弹窗 */
  显示: {
    type: Boolean,
    default: false,
  },
  /** 用户所在城市（用于查询时间表） */
  城市: {
    type: String,
    default: '',
  },
  /** 是否开启多选模式（多备选时间预约） */
  多选模式: {
    type: Boolean,
    default: false,
  },
  /** 最多可选几个备选时间 */
  最多选几个: {
    type: Number,
    default: 3,
  },
  /** 至少需选几个才能提交 */
  最少选几个: {
    type: Number,
    default: 1,
  },
  /** 顶部多选提示文字（从系统设置读取） */
  多选提示: {
    type: String,
    default: '',
  },
})

// ===== emit 向父组件发送事件 =====
const emit = defineEmits(['关闭', '确认选择'])

// ===== 计算弹窗显示状态 =====
const 显示弹窗 = computed({
  get: () => props.显示,
  set: () => emit('关闭'),
})

// ===== 组件状态 =====
/** 是否正在加载时间表 */
const 加载中 = ref(false)
/** 日期+时间段数据列表（来自API） */
const 日期时间列表 = ref([])
/** 当前选中日期的索引 */
const 选中日期索引 = ref(-1)
/** 单选模式：当前选中的时间段字符串 */
const 选中时间段 = ref('')
/** 单选模式：当前选中的日期字符串 */
const 选中日期字符串 = ref('')
/** 日期选择条DOM引用（用于自动滚动） */
const 日期条引用 = ref(null)
/** 多选模式：已选时间列表 [{date, time, priority}] */
const 多选时间列表 = ref([])

/** 优先级序号字符（①②③） */
const 序号字符 = ['①', '②', '③', '④', '⑤']

// ===== 计算属性 =====

/** 当前选中日期是否约满 */
const 当前日期约满 = computed(() => {
  if (选中日期索引.value < 0) return false
  return 日期时间列表.value[选中日期索引.value]?.is_full || false
})

/** 前4个日期是否全约满（用于显示约满横幅） */
const 前N天全约满 = computed(() => {
  if (日期时间列表.value.length === 0) return false
  const 前四 = 日期时间列表.value.slice(0, 4)
  return 前四.every(d => d.is_full)
})

/** 当前选中日期的可用时间段列表 */
const 当前时间段列表 = computed(() => {
  if (选中日期索引.value < 0) return []
  return 日期时间列表.value[选中日期索引.value]?.time_slots || []
})

/** 当前选中日期的展示文字（如"周四 4月9日"） */
const 当前选中日期显示 = computed(() => {
  if (选中日期索引.value < 0) return ''
  const 日期项 = 日期时间列表.value[选中日期索引.value]
  if (!日期项) return ''
  return `${日期项.week} ${日期项.display}`
})

/** 确认按钮是否可用 */
const 确认按钮可用 = computed(() => {
  if (props.多选模式) {
    // 多选模式：已选数量 >= 最少选几个
    return 多选时间列表.value.length >= props.最少选几个
  }
  // 单选模式：有选中时间段
  return !!选中时间段.value
})

/** 确认按钮文字 */
const 确认按钮文字 = computed(() => {
  if (props.多选模式) {
    const 已选数 = 多选时间列表.value.length
    if (已选数 === 0) {
      return `请选择备选时间（至少${props.最少选几个}个）`
    }
    return `确认选择（已选${已选数}个备选时间）`
  }
  return '确认选择'
})

// ===== 方法 =====

/** 加载时间表数据 */
const 加载时间表 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取时间表API(props.城市)
    if (结果.code === 1) {
      日期时间列表.value = 结果.data
      // 默认选中第一个未约满的日期
      const 第一个可选索引 = 日期时间列表.value.findIndex(d => !d.is_full)
      if (第一个可选索引 >= 0) {
        选中日期索引.value = 第一个可选索引
        选中日期字符串.value = 日期时间列表.value[第一个可选索引].date
        // DOM更新后自动滚动到选中日期芯片
        await nextTick()
        setTimeout(() => 滚动到选中日期芯片(第一个可选索引), 100)
      }
    }
  } catch {
    showToast('获取时间表失败，请重试')
  } finally {
    加载中.value = false
  }
}

/**
 * 自动滚动日期条，使选中的日期芯片居中可见
 * @param {number} 索引 - 目标日期的索引
 */
const 滚动到选中日期芯片 = (索引) => {
  if (!日期条引用.value) return
  const 所有芯片 = 日期条引用.value.querySelectorAll('.日期芯片')
  if (所有芯片[索引]) {
    所有芯片[索引].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

/** 监听弹窗打开：重置状态并加载数据 */
watch(() => props.显示, (新值) => {
  if (新值) {
    选中时间段.value = ''
    多选时间列表.value = []
    加载时间表()
  }
})

/**
 * 选择日期
 * @param {number} 索引 - 日期索引
 * @param {Object} 日期项 - 日期数据
 */
const 选择日期 = (索引, 日期项) => {
  if (日期项.is_full) return // 约满日期不可点击
  选中日期索引.value = 索引
  选中日期字符串.value = 日期项.date
  选中时间段.value = '' // 切换日期时重置单选时间段
}

/**
 * 判断某个时间项是否已被选中（单选或多选）
 * @param {Object} 时间项 - 时间段数据
 */
const 是否已选中 = (时间项) => {
  if (props.多选模式) {
    // 多选模式：检查多选列表中是否包含该时间
    return 多选时间列表.value.some(
      项 => 项.date === 选中日期字符串.value && 项.time === 时间项.time
    )
  }
  // 单选模式：检查选中时间段字符串
  return 选中时间段.value === 时间项.time
}

/**
 * 获取多选时间在已选列表中的序号（从1开始，未选返回0）
 * @param {Object} 时间项 - 时间段数据
 */
const 获取选中序号 = (时间项) => {
  const 索引 = 多选时间列表.value.findIndex(
    项 => 项.date === 选中日期字符串.value && 项.time === 时间项.time
  )
  return 索引 >= 0 ? 索引 + 1 : 0
}

/**
 * 选择/取消选择时间段
 * @param {Object} 时间项 - 时间段数据
 */
const 选择时间段 = (时间项) => {
  if (props.多选模式) {
    // 多选模式处理
    const 已存在索引 = 多选时间列表.value.findIndex(
      项 => 项.date === 选中日期字符串.value && 项.time === 时间项.time
    )
    if (已存在索引 >= 0) {
      // 再次点击取消选中
      多选时间列表.value.splice(已存在索引, 1)
      // 重新排列优先级
      多选时间列表.value = 多选时间列表.value.map((项, 索引) => ({ ...项, priority: 索引 + 1 }))
    } else {
      // 检查是否超出最多选几个限制
      if (多选时间列表.value.length >= props.最多选几个) {
        showToast(`最多选择${props.最多选几个}个备选时间`)
        return
      }
      // 添加到多选列表，priority为当前列表长度+1
      多选时间列表.value.push({
        date: 选中日期字符串.value,
        time: 时间项.time,
        priority: 多选时间列表.value.length + 1,
      })
    }
  } else {
    // 单选模式
    选中时间段.value = 时间项.time
  }
}

/**
 * 从多选列表删除指定索引的时间
 * @param {number} 删除索引 - 要删除的时间的索引
 */
const 删除多选时间 = (删除索引) => {
  多选时间列表.value.splice(删除索引, 1)
  // 重新排列优先级编号
  多选时间列表.value = 多选时间列表.value.map((项, 索引) => ({ ...项, priority: 索引 + 1 }))
}

/** 确认时间选择，向父组件发送事件 */
const 确认时间选择 = () => {
  if (props.多选模式) {
    // 多选模式：校验最少选几个
    if (多选时间列表.value.length < props.最少选几个) {
      showToast(`至少需要选择${props.最少选几个}个备选时间`)
      return
    }
    const 第一优先 = 多选时间列表.value[0]
    // 发送多选结果（兼容单选字段 + 多选列表）
    emit('确认选择', {
      日期: 第一优先.date,           // 第1优先（向下兼容）
      时间段: 第一优先.time,          // 第1优先（向下兼容）
      多选时间列表: [...多选时间列表.value], // 完整多选数据
    })
  } else {
    // 单选模式
    if (!选中时间段.value) {
      showToast('请选择上门时间')
      return
    }
    emit('确认选择', {
      日期: 选中日期字符串.value,
      时间段: 选中时间段.value,
    })
  }
}

/** 关闭弹窗 */
const 关闭弹窗 = () => {
  emit('关闭')
}
</script>

<style scoped>
/* 整体容器：flex纵向布局 */
.时间选择器 {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

/* 标题栏 */
.时间选择标题 {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  flex-shrink: 0;
}

/* 关闭按钮（右上角） */
.关闭图标 {
  position: absolute;
  right: 16px;
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

/* 多选提示横幅 */
.多选提示横幅 {
  background: #fff7e6;
  border-left: 3px solid #ff9800;
  color: #e65100;
  font-size: 12px;
  padding: 8px 14px;
  flex-shrink: 0;
  line-height: 1.5;
}

/* 近期约满横幅 */
.近期约满横幅 {
  background: linear-gradient(135deg, #e54635, #ff6b35);
  color: white;
  font-size: 13px;
  font-weight: bold;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 12px;
  flex-shrink: 0;
}

/* 加载状态 */
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

/* 横向滑动日期选择条 */
.日期选择条 {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  padding: 10px 12px;
  gap: 8px;
  flex-shrink: 0;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  /* 隐藏滚动条但保留滑动功能 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.日期选择条::-webkit-scrollbar { display: none; }

/* 日期芯片：每个日期的卡片样式 */
.日期芯片 {
  flex-shrink: 0;
  width: 56px;
  height: 64px;
  border-radius: 12px;
  background: white;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  box-sizing: border-box;
}

/* 约满日期芯片：灰色背景，半透明，不可点击 */
.日期芯片_约满 {
  background: #f5f5f5;
  opacity: 0.5;
  cursor: not-allowed;
}

/* 选中日期芯片：橙红渐变，白色文字，阴影 */
.日期芯片_选中 {
  background: linear-gradient(135deg, #e54635, #ff6b35) !important;
  border-color: #e54635 !important;
  opacity: 1 !important;
  box-shadow: 0 4px 12px rgba(229, 70, 53, 0.35);
}
.日期芯片_选中 .芯片周几,
.日期芯片_选中 .芯片日期 {
  color: white !important;
}

/* 芯片内周几文字（小字） */
.芯片周几 {
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}

/* 芯片内日期文字（大字） */
.芯片日期 {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

/* 今天标签（小徽标） */
.芯片今天标签 {
  position: absolute;
  top: -1px;
  right: -1px;
  font-size: 9px;
  background: #e54635;
  color: white;
  padding: 1px 4px;
  border-radius: 0 12px 0 8px;
  line-height: 1.4;
}

/* 约满标签（小徽标） */
.芯片约满标签 {
  font-size: 9px;
  color: #999;
  background: #eee;
  padding: 1px 4px;
  border-radius: 4px;
  margin-top: 2px;
}

/* 当前选中日期标题行 */
.选中日期标题 {
  padding: 8px 14px 4px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}

/* 时间格子区：可滚动 */
.时间格子区 {
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
}

/* 时间格子列表：2列网格 */
.时间格子列表 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

/* 单个时间格子 */
.时间格子 {
  padding: 12px 10px;
  text-align: center;
  border: 1px solid #eee;
  border-radius: 10px;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
  position: relative;
}

/* 选中的时间格子：橙红渐变背景 */
.时间格子_选中 {
  background: linear-gradient(135deg, #e54635, #ff6b35) !important;
  color: white !important;
  border-color: #e54635 !important;
}

/* 多选模式优先级序号徽章 */
.优先级徽章 {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 16px;
  color: white;
  font-weight: bold;
  line-height: 1;
}

/* 约满占位卡 */
.约满占位卡 {
  height: 100%;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  text-align: center;
  padding: 20px;
}
.约满占位图标 { font-size: 36px; }
.约满占位文字 { font-size: 14px; color: #999; line-height: 1.6; }

/* 未选日期提示 */
.约满提示 {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

/* 已选时间标签区（多选模式） */
.已选时间标签区 {
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
  max-height: 80px;
  overflow-y: auto;
}

/* 单个已选时间标签 */
.已选时间标签 {
  display: inline-flex;
  align-items: center;
  background: #fff0ee;
  border: 1px solid #ffcac3;
  color: #e54635;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  gap: 4px;
}

/* 标签序号（①②③） */
.标签序号 {
  font-size: 14px;
  font-weight: bold;
}

/* 标签删除按钮 */
.标签删除 {
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  color: #ff6b35;
  margin-left: 2px;
}

/* 底部确认按钮区 */
.时间确认按钮区 {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
}
</style>
