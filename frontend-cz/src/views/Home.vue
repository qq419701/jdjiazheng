<template>
  <!-- 充值主页 -->
  <div class="主页容器">
    <!-- 加载中状态 -->
    <div v-if="加载中" class="加载容器">
      <van-loading size="36px" color="#667eea" vertical>验证充值卡密中...</van-loading>
    </div>

    <!-- 卡密有效：显示充值页面 -->
    <div v-else-if="卡密有效">
      <!-- 顶部渐变Banner -->
      <div class="顶部Banner">
        <div class="Banner内容">
          <div class="Banner图标区">
            <span class="主图标">💎</span>
            <img v-if="充值Store.会员图标" :src="充值Store.会员图标" class="会员图标" alt="会员图标" />
          </div>
          <div class="Banner文字区">
            <div class="Banner主标题">{{ 充值Store.主标题 }}</div>
            <div class="Banner副标题">{{ 充值Store.副标题1 }}</div>
            <div class="Banner副标题">{{ 充值Store.副标题2 }}</div>
          </div>
        </div>
        <img v-if="充值Store.banner图URL" :src="充值Store.banner图URL" class="Banner背景图" alt="Banner" />
      </div>

      <!-- 充值信息卡片 -->
      <div class="内容区">
        <!-- 账号输入卡片 -->
        <div class="信息卡片">
          <!-- 充值账号输入 -->
          <div class="输入行">
            <span class="账号图标">{{ 获取账号图标() }}</span>
            <input
              v-model="充值账号输入"
              :placeholder="充值Store.账号标签"
              class="账号输入框"
              :class="{ '输入错误': 账号错误提示, '输入正确': 账号验证通过 }"
              :type="充值Store.账号类型 === 'phone' || 充值Store.账号类型 === 'qq' ? 'tel' : 'text'"
              :inputmode="充值Store.账号类型 === 'phone' || 充值Store.账号类型 === 'qq' ? 'numeric' : 'text'"
              @blur="触发账号验证"
              @input="账号错误提示 = ''"
            />
            <span v-if="账号验证通过" class="验证成功图标">✓</span>
          </div>
          <!-- 账号错误提示 -->
          <div v-if="账号错误提示" class="错误提示">{{ 账号错误提示 }}</div>

          <div class="卡片分隔线"></div>

          <!-- 城市显示行 -->
          <div class="城市行" @click="打开城市弹窗">
            <span class="城市图标">📍</span>
            <span class="城市文字" :class="{ '城市加载中': 充值Store.城市加载状态 === 'loading' }">
              {{ 充值Store.城市显示 }}
            </span>
            <span class="城市刷新图标">↻</span>
          </div>
        </div>

        <!-- 服务详情卡片 -->
        <div class="信息卡片">
          <!-- 预计到账时间 -->
          <div v-if="充值Store.到账时间" class="详情行">
            <span class="详情标签">预计到账时间</span>
            <span class="详情值">{{ 充值Store.到账时间 }}</span>
          </div>

          <!-- 充值会员 -->
          <div v-if="充值Store.会员名称" class="详情行">
            <span class="详情标签">充值会员</span>
            <span class="详情值">{{ 充值Store.会员名称 }}</span>
          </div>

          <!-- 兑换码 -->
          <div class="详情行">
            <span class="详情标签">兑换码</span>
            <span class="详情值灰色">{{ 充值Store.卡密 }}</span>
          </div>

          <!-- 会员是否到期（topup_show_expired=1 才显示） -->
          <div v-if="充值Store.显示到期选项 === 1" class="详情行 到期选择行">
            <span class="详情标签">会员是否到期</span>
            <div class="单选组">
              <label class="单选项" :class="{ '已选': 是否到期选择 === 1 }" @click="是否到期选择 = 1">
                <span class="单选圆" :class="{ '已选': 是否到期选择 === 1 }"></span>
                <span>已到期</span>
              </label>
              <label class="单选项" :class="{ '已选': 是否到期选择 === 0 }" @click="是否到期选择 = 0">
                <span class="单选圆" :class="{ '已选': 是否到期选择 === 0 }"></span>
                <span>未到期</span>
              </label>
            </div>
          </div>
          <!-- 到期选择错误提示 -->
          <div v-if="到期错误提示" class="错误提示">{{ 到期错误提示 }}</div>
        </div>

        <!-- 充值步骤引导卡片 -->
        <div v-if="充值Store.充值步骤" class="步骤卡片">
          <span class="步骤文字">充值步骤：{{ 充值Store.充值步骤 }}</span>
        </div>

        <!-- 服务内容宫格 -->
        <div v-if="充值Store.服务内容列表.length > 0" class="服务内容区">
          <div class="服务内容标题">◆ 服务内容 ◆</div>
          <div class="服务宫格">
            <div
              v-for="(项目, 索引) in 充值Store.服务内容列表"
              :key="索引"
              class="宫格项目"
            >
              <div class="宫格图标" :style="{ background: 获取宫格渐变(索引) }">{{ 项目.icon }}</div>
              <div class="宫格标题">{{ 项目.title }}</div>
              <div class="宫格描述">{{ 项目.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 下单须知 -->
        <div v-if="充值Store.下单须知" class="须知区">
          <div class="须知标题" @click="显示须知 = !显示须知">
            📋 下单须知
            <span class="须知展开图标">{{ 显示须知 ? '▲' : '▼' }}</span>
          </div>
          <div v-if="显示须知" class="须知内容">
            <p v-for="(条目, 索引) in 须知列表" :key="索引">{{ 条目 }}</p>
          </div>
        </div>

        <!-- 底部占位（防止被固定按钮遮挡） -->
        <div style="height: 80px"></div>
      </div>

      <!-- 底部固定提交按钮 -->
      <div class="底部按钮区">
        <button class="提交按钮" :class="{ '加载中': 提交中 }" @click="提交充值订单" :disabled="提交中">
          <span v-if="提交中">⏳ 提交中...</span>
          <span v-else>💎 立即充值</span>
        </button>
      </div>
    </div>

    <!-- 城市弹窗 -->
    <van-popup v-model:show="显示城市弹窗" position="bottom" round :style="{ padding: '20px' }">
      <div class="城市弹窗内容">
        <div class="弹窗标题">📍 获取登录城市</div>
        <p class="弹窗提示">为了更好地为您服务，建议允许获取位置信息</p>
        <div class="弹窗按钮组">
          <van-button type="primary" block @click="使用IP定位" :loading="IP定位中">
            使用IP定位（推荐）
          </van-button>
          <div style="height: 10px"></div>
          <van-button plain block @click="显示手动输入 = true; 显示城市弹窗 = false">
            手动填写城市
          </van-button>
          <div style="height: 10px"></div>
          <van-button plain block @click="显示城市弹窗 = false">
            暂不获取
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 手动输入城市弹窗 -->
    <van-popup v-model:show="显示手动输入" position="bottom" round :style="{ padding: '20px' }">
      <div class="城市弹窗内容">
        <div class="弹窗标题">✏️ 手动填写城市</div>
        <van-field
          v-model="手动城市输入"
          placeholder="请输入所在城市（如：广东省东莞市）"
          :border="true"
          style="background: #f5f7fa; border-radius: 8px; margin: 12px 0"
        />
        <van-button type="primary" block @click="确认手动城市">确认</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useTopupOrderStore } from '../stores/topupOrder'
import { 验证充值卡密API, 获取IP城市API, 提交充值订单API } from '../api/index'

const route = useRoute()
const router = useRouter()
const 充值Store = useTopupOrderStore()

// 状态
const 加载中 = ref(true)
const 卡密有效 = ref(false)
const 充值账号输入 = ref('')
const 账号错误提示 = ref('')
const 账号验证通过 = ref(false)
const 是否到期选择 = ref(null)  // null=未选 0=未到期 1=已到期
const 到期错误提示 = ref('')
const 提交中 = ref(false)
const 显示须知 = ref(false)
const 显示城市弹窗 = ref(false)
const 显示手动输入 = ref(false)
const 手动城市输入 = ref('')
const IP定位中 = ref(false)

// 须知列表（换行分隔）
const 须知列表 = computed(() => {
  if (!充值Store.下单须知) return []
  return 充值Store.下单须知.split('\n').filter(s => s.trim())
})

// 宫格渐变色列表
const 渐变色列表 = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f6d365, #fda085)',
  'linear-gradient(135deg, #84fab0, #8fd3f4)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
]
const 获取宫格渐变 = (索引) => 渐变色列表[索引 % 渐变色列表.length]

// 账号图标（根据账号类型）
const 获取账号图标 = () => {
  const 图标映射 = {
    phone: '📱',
    wechat: '💬',
    qq: '🐧',
    email: '📧',
    other: '👤',
  }
  return 图标映射[充值Store.账号类型] || '👤'
}

// 初始化：验证卡密
onMounted(async () => {
  const code = route.params.code
  if (!code) {
    router.replace('/invalid')
    return
  }

  try {
    const 响应 = await 验证充值卡密API(code)
    const 结果 = 响应.data

    if (结果.code === 2) {
      // 卡密已被使用
      router.replace('/invalid?used=1')
      return
    }
    if (结果.code === 3) {
      // 卡密已作废
      router.replace('/invalid')
      return
    }
    if (结果.code !== 1) {
      router.replace('/invalid')
      return
    }

    // 设置卡密信息
    充值Store.设置卡密信息(结果.data)
    卡密有效.value = true
  } catch (错误) {
    console.error('[充值] 验证卡密失败:', 错误)
    router.replace('/invalid')
    return
  } finally {
    加载中.value = false
  }

  // 页面加载后自动获取IP城市
  获取IP城市()
})

// 获取IP城市
const 获取IP城市 = async () => {
  充值Store.城市加载状态 = 'loading'
  try {
    const 响应 = await 获取IP城市API()
    const 结果 = 响应.data
    if (结果.code === 1 && 结果.data) {
      充值Store.设置登录城市(结果.data.province, 结果.data.city)
    } else {
      充值Store.设置城市失败()
    }
  } catch {
    充值Store.设置城市失败()
  }
}

// 打开城市弹窗
const 打开城市弹窗 = () => {
  显示城市弹窗.value = true
}

// 使用IP定位（弹窗内）
const 使用IP定位 = async () => {
  IP定位中.value = true
  await 获取IP城市()
  IP定位中.value = false
  显示城市弹窗.value = false
  showToast(充值Store.城市加载状态 === 'success' ? `定位成功：${充值Store.城市显示}` : '定位失败，请手动填写')
}

// 确认手动城市
const 确认手动城市 = () => {
  const 城市 = 手动城市输入.value.trim()
  if (!城市) {
    showToast('请输入城市名称')
    return
  }
  充值Store.设置登录城市('', 城市)
  显示手动输入.value = false
}

// 验证充值账号格式（前端验证）
const 验证账号格式 = (账号) => {
  if (!账号 || !账号.trim()) {
    return { 有效: false, 错误: `${充值Store.账号类型中文}不能为空` }
  }
  const 值 = 账号.trim()
  const 类型 = 充值Store.账号类型

  if (类型 === 'phone') {
    if (!/^1[3-9]\d{9}$/.test(值)) {
      return { 有效: false, 错误: '请输入正确的手机号（11位数字）' }
    }
  } else if (类型 === 'wechat') {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(值)) {
      return { 有效: false, 错误: '请输入正确的微信号（6-20位字母/数字/下划线，以字母开头）' }
    }
  } else if (类型 === 'qq') {
    if (!/^[1-9]\d{4,10}$/.test(值)) {
      return { 有效: false, 错误: '请输入正确的QQ号（5-11位数字）' }
    }
  } else if (类型 === 'email') {
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(值)) {
      return { 有效: false, 错误: '请输入正确的邮箱地址' }
    }
  }
  return { 有效: true, 错误: '' }
}

// 失焦时触发账号验证
const 触发账号验证 = () => {
  const 结果 = 验证账号格式(充值账号输入.value)
  if (!结果.有效) {
    账号错误提示.value = 结果.错误
    账号验证通过.value = false
  } else {
    账号错误提示.value = ''
    账号验证通过.value = true
  }
}

// 提交充值订单
const 提交充值订单 = async () => {
  // 1. 验证账号
  const 账号结果 = 验证账号格式(充值账号输入.value)
  if (!账号结果.有效) {
    账号错误提示.value = 账号结果.错误
    return
  }

  // 2. 验证到期选项（若需要）
  if (充值Store.显示到期选项 === 1 && 是否到期选择.value === null) {
    到期错误提示.value = '请选择会员是否已到期'
    return
  }
  到期错误提示.value = ''

  提交中.value = true
  try {
    const 响应 = await 提交充值订单API({
      card_code: 充值Store.卡密,
      topup_account: 充值账号输入.value.trim(),
      topup_is_expired: 是否到期选择.value,
    })
    const 结果 = 响应.data

    if (结果.code === 2) {
      // 卡密已被使用（并发情况）
      showToast('该卡密已被使用')
      setTimeout(() => router.replace('/invalid?used=1'), 1500)
      return
    }
    if (结果.code !== 1) {
      showToast(结果.message || '提交失败，请重试')
      return
    }

    // 保存订单结果并跳转成功页
    充值Store.保存订单结果(结果.data)
    router.push(`/${充值Store.卡密}/success`)
  } catch (错误) {
    console.error('[充值] 提交订单失败:', 错误)
    showToast('网络错误，请稍后重试')
  } finally {
    提交中.value = false
  }
}
</script>

<style scoped>
/* 主页容器 */
.主页容器 {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 加载容器 */
.加载容器 {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

/* 顶部Banner */
.顶部Banner {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 20px 20px;
  overflow: hidden;
}

.Banner内容 {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
}

.Banner图标区 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.主图标 {
  font-size: 40px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.会员图标 {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}

.Banner文字区 {
  flex: 1;
}

.Banner主标题 {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.Banner副标题 {
  font-size: 12px;
  color: rgba(255,255,255,0.85);
  line-height: 1.6;
}

.Banner背景图 {
  position: absolute;
  right: -20px;
  top: 0;
  height: 100%;
  opacity: 0.15;
  z-index: 1;
}

/* 内容区 */
.内容区 {
  padding: 12px 12px 0;
}

/* 信息卡片 */
.信息卡片 {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* 输入行 */
.输入行 {
  display: flex;
  align-items: center;
  gap: 10px;
}

.账号图标 {
  font-size: 22px;
  flex-shrink: 0;
}

.账号输入框 {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #333;
  padding: 8px 0;
  background: transparent;
}

.账号输入框::placeholder {
  color: #bbb;
}

.账号输入框.输入错误 {
  color: #f44336;
}

.账号输入框.输入正确 {
  color: #4caf50;
}

.验证成功图标 {
  color: #4caf50;
  font-size: 18px;
  font-weight: bold;
}

/* 错误提示 */
.错误提示 {
  color: #f44336;
  font-size: 12px;
  margin-top: 6px;
  padding-left: 32px;
}

/* 卡片分隔线 */
.卡片分隔线 {
  height: 1px;
  background: #f0f0f0;
  margin: 12px 0;
}

/* 城市行 */
.城市行 {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
}

.城市图标 {
  font-size: 18px;
}

.城市文字 {
  flex: 1;
  font-size: 14px;
  color: #555;
}

.城市文字.城市加载中 {
  color: #aaa;
}

.城市刷新图标 {
  color: #999;
  font-size: 16px;
}

/* 详情行 */
.详情行 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.详情行:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.详情标签 {
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
}

.详情值 {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.详情值灰色 {
  font-size: 13px;
  color: #999;
  font-family: monospace;
}

/* 到期选择 */
.到期选择行 {
  flex-direction: column;
  align-items: flex-start;
}

.单选组 {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.单选项 {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

.单选项.已选 {
  color: #667eea;
}

.单选圆 {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: #fff;
  transition: all 0.2s;
}

.单选圆.已选 {
  border-color: #667eea;
  background: #667eea;
  box-shadow: 0 0 0 2px rgba(102,126,234,0.2);
}

/* 步骤卡片 */
.步骤卡片 {
  background: linear-gradient(135deg, #e8f4fd, #dbeafe);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.步骤文字 {
  font-size: 13px;
  color: #3b82f6;
  line-height: 1.6;
}

/* 服务内容 */
.服务内容区 {
  margin-bottom: 12px;
}

.服务内容标题 {
  text-align: center;
  font-size: 14px;
  color: #667eea;
  font-weight: bold;
  margin-bottom: 12px;
  letter-spacing: 4px;
}

.服务宫格 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.宫格项目 {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.宫格图标 {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 6px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
}

.宫格标题 {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.宫格描述 {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
}

/* 须知区 */
.须知区 {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

.须知标题 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.须知展开图标 {
  font-size: 12px;
  color: #999;
}

.须知内容 {
  padding: 0 16px 14px;
  border-top: 1px solid #f0f0f0;
}

.须知内容 p {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
  padding-top: 6px;
}

/* 底部固定按钮 */
.底部按钮区 {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(245,247,250,0.98) 80%, transparent);
  z-index: 100;
}

.提交按钮 {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 2px;
  box-shadow: 0 4px 15px rgba(102,126,234,0.4);
  transition: all 0.2s;
}

.提交按钮:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(102,126,234,0.3);
}

.提交按钮.加载中 {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 城市弹窗 */
.城市弹窗内容 {
  padding: 8px 0;
}

.弹窗标题 {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
}

.弹窗提示 {
  font-size: 13px;
  color: #888;
  text-align: center;
  margin-bottom: 16px;
}

.弹窗按钮组 {
  margin-top: 8px;
}
</style>
