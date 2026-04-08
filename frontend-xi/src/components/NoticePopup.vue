<template>
  <Teleport to="body">
    <div v-if="show" class="弹窗遮罩" @click="handleMaskClick">
      <div class="弹窗容器" :style="{ background: bgColor }" @click.stop>
        <!-- 顶部渐变装饰条 -->
        <div class="顶部装饰条"></div>

        <!-- 标题行 -->
        <div class="标题行">
          <span v-if="iconEmoji" class="标题图标">{{ iconEmoji }}</span>
          <span class="标题文字" :style="{ color: titleColor }">{{ title }}</span>
          <button class="关闭按钮" @click="handleClose" :style="{ color: titleColor }">✕</button>
        </div>

        <!-- 内容区 -->
        <div class="内容区">
          <div
            v-for="(行, 索引) in 内容行列表"
            :key="索引"
            class="内容行"
            :style="{ color: contentColor, borderLeftColor: titleColor }"
          >
            <span class="项目符号" :style="{ color: titleColor }">•</span>
            <span>{{ 行 }}</span>
          </div>
        </div>

        <!-- 底部关闭按钮 -->
        <div class="底部区">
          <button
            class="确认按钮"
            :class="`按钮尺寸_${btnSize}`"
            :style="{ background: `linear-gradient(135deg, ${btnColor}, ${btnColor})` }"
            @click="handleClose"
          >
            {{ 按钮显示文字 }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  iconEmoji: { type: String, default: '' },
  bgColor: { type: String, default: '#ffffff' },
  titleColor: { type: String, default: '#1989fa' },
  contentColor: { type: String, default: '#333333' },
  btnText: { type: String, default: '我知道了' },
  btnColor: { type: String, default: '#1989fa' },
  btnSize: { type: String, default: 'large' },
  autoCloseSeconds: { type: Number, default: 0 },
  maskClosable: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const 倒计时剩余 = ref(0)
let 倒计时定时器 = null

const 内容行列表 = computed(() => {
  if (!props.content) return []
  return props.content.split('\n').filter(行 => 行.trim())
})



const 按钮显示文字 = computed(() => {
  if (倒计时剩余.value > 0) {
    return `${props.btnText} (${倒计时剩余.value}s)`
  }
  return props.btnText
})

const 启动倒计时 = () => {
  if (props.autoCloseSeconds > 0) {
    倒计时剩余.value = props.autoCloseSeconds
    倒计时定时器 = setInterval(() => {
      倒计时剩余.value -= 1
      if (倒计时剩余.value <= 0) {
        clearInterval(倒计时定时器)
        倒计时定时器 = null
        emit('close')
      }
    }, 1000)
  }
}

const 停止倒计时 = () => {
  if (倒计时定时器) {
    clearInterval(倒计时定时器)
    倒计时定时器 = null
  }
  倒计时剩余.value = 0
}

watch(() => props.show, (新值) => {
  if (新值) {
    启动倒计时()
  } else {
    停止倒计时()
  }
})

onUnmounted(() => {
  停止倒计时()
})

const handleClose = () => {
  停止倒计时()
  emit('close')
}

const handleMaskClick = () => {
  if (props.maskClosable) {
    handleClose()
  }
}
</script>

<style scoped>
.弹窗遮罩 {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: 遮罩淡入 0.3s ease;
}

@keyframes 遮罩淡入 {
  from { opacity: 0; }
  to { opacity: 1; }
}

.弹窗容器 {
  width: 100%;
  max-width: 340px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  animation: 弹窗弹入 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes 弹窗弹入 {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.顶部装饰条 {
  height: 6px;
  background: linear-gradient(135deg, #1989fa, #4fc3f7);
}

.标题行 {
  display: flex;
  align-items: center;
  padding: 16px 16px 8px;
  gap: 8px;
}

.标题图标 {
  font-size: 22px;
  flex-shrink: 0;
}

.标题文字 {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.关闭按钮 {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  transition: background 0.2s;
}

.关闭按钮:active {
  background: rgba(0, 0, 0, 0.06);
}

.内容区 {
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.内容行 {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.6;
  padding-left: 10px;
  border-left: 3px solid;
}

.项目符号 {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.底部区 {
  padding: 0 16px 20px;
}

.确认按钮 {
  width: 100%;
  border: none;
  border-radius: 28px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.确认按钮:active {
  opacity: 0.85;
  transform: scale(0.98);
}

.按钮尺寸_small { height: 44px; }
.按钮尺寸_medium { height: 48px; }
.按钮尺寸_large { height: 56px; }
</style>
