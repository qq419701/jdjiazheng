<template>
  <!-- 三角洲哈夫币主页 -->
  <div class="主页容器">
    <!-- 加载中状态 -->
    <div v-if="加载中" class="加载容器">
      <van-loading size="36px" color="#e94560" vertical>验证卡密中...</van-loading>
    </div>

    <!-- 卡密有效：显示下单页面 -->
    <div v-else-if="卡密有效">
      <!-- 弹窗1：首页提醒弹窗 -->
      <NoticePopup
        :show="显示弹窗1"
        :title="store.sjz_popup1_title"
        :content="store.sjz_popup1_content"
        :icon-emoji="store.sjz_popup1_icon"
        :btn-text="store.sjz_popup1_btn_text"
        btn-color="#e94560"
        bg-color="#16213e"
        title-color="#f5c518"
        content-color="#e0e0e0"
        :auto-close-seconds="parseInt(store.sjz_popup1_auto_close) || 0"
        @close="关闭弹窗1"
      />

      <!-- 弹窗2：信息确认弹窗 -->
      <NoticePopup
        :show="显示弹窗2"
        :title="store.sjz_popup2_title"
        :content="store.sjz_popup2_content"
        icon-emoji="⚔️"
        :btn-text="store.sjz_popup2_btn_text"
        btn-color="#e94560"
        bg-color="#16213e"
        title-color="#f5c518"
        content-color="#e0e0e0"
        @close="确认弹窗2提交"
      />

      <!-- 顶部Banner -->
      <div class="顶部Banner">
        <!-- 城市定位胶囊（右上角） -->
        <div class="城市胶囊">
          <span>📍</span>
          <span class="城市文字" :class="{ '定位中': store.城市加载状态 === 'loading' }">
            {{ store.城市加载状态 === 'loading' ? '定位中...' : (store.登录城市 || '获取城市') }}
          </span>
        </div>
        <img v-if="store.banner图URL" :src="store.banner图URL" class="Banner背景图" alt="Banner" />
        <div class="Banner内容">
          <div class="Banner图标">⚔️</div>
          <div class="Banner文字区">
            <div class="Banner主标题">{{ store.主标题 }}</div>
            <div class="Banner副标题">{{ store.副标题 }}</div>
          </div>
        </div>
        <!-- 哈夫币数量徽章 -->
        <div v-if="store.哈夫币数量" class="哈夫币徽章">
          <span>💰 {{ store.哈夫币数量 }} 哈夫币</span>
        </div>
      </div>

      <!-- 表单区域 -->
      <div class="内容区">

        <!-- 手机号 -->
        <div v-if="store.需要手机号" class="表单卡片">
          <div class="字段标题">📱 手机号 <span class="必填标记">*</span></div>
          <input
            v-model="手机号输入"
            type="tel"
            inputmode="numeric"
            placeholder="请输入手机号"
            class="输入框"
            :class="{ '输入错误': 手机号错误提示, '输入正确': 手机号验证通过 }"
            @blur="触发手机号验证"
            @input="重置手机号状态"
          />
          <div v-if="手机号错误提示" class="错误提示">{{ 手机号错误提示 }}</div>
        </div>

        <!-- 游戏昵称 -->
        <div v-if="store.需要游戏昵称" class="表单卡片">
          <div class="字段标题">🎮 游戏昵称 <span class="选填标记">（选填）</span></div>
          <input
            v-model="游戏昵称输入"
            type="text"
            placeholder="请输入游戏内昵称"
            class="输入框"
          />
        </div>

        <!-- 几格保险 -->
        <div v-if="store.需要保险格数" class="表单卡片">
          <div class="字段标题">🛡️ 保险格数</div>
          <div class="保险格按钮组">
            <button
              v-for="格数 in [0,1,2,3,4,5,6]"
              :key="格数"
              class="保险格按钮"
              :class="{ '已选': 保险格数选择 === 格数 }"
              @click="保险格数选择 = 格数"
            >{{ 格数 }}格</button>
          </div>
        </div>

        <!-- 是否成年 -->
        <div v-if="store.需要成年认证" class="表单卡片">
          <div class="字段标题">🔞 是否成年</div>
          <div class="单选组">
            <label class="单选项" :class="{ '已选': 成年选择 === 1 }" @click="成年选择 = 1">
              <span class="单选圆" :class="{ '已选': 成年选择 === 1 }"></span>
              <span>已成年</span>
            </label>
            <label class="单选项" :class="{ '已选': 成年选择 === 0 }" @click="成年选择 = 0">
              <span class="单选圆" :class="{ '已选': 成年选择 === 0 }"></span>
              <span>未成年</span>
            </label>
          </div>
        </div>

        <!-- 仓库截图 -->
        <div v-if="store.需要仓库截图" class="表单卡片">
          <div class="字段标题">📦 仓库截图 <span class="选填标记">（最多3张）</span></div>
          <div class="截图区域">
            <div v-for="(预览, 索引) in 截图预览列表" :key="索引" class="截图预览项">
              <img :src="预览" class="截图缩略图" alt="仓库截图" />
              <button class="删除截图按钮" @click="删除截图(索引)">✕</button>
            </div>
            <label v-if="截图预览列表.length < 3" class="截图添加按钮">
              <input type="file" accept="image/*" multiple @change="选择截图" style="display:none" />
              <span class="添加图标">+</span>
              <span class="添加文字">添加截图</span>
            </label>
          </div>
          <div v-if="截图上传中" class="截图提示">上传中...</div>
        </div>

        <!-- 服务内容宫格 -->
        <div v-if="store.服务内容列表.length > 0" class="表单卡片">
          <div class="字段标题">⚔️ 服务内容</div>
          <div class="服务宫格">
            <div
              v-for="(项, 索引) in store.服务内容列表"
              :key="索引"
              class="服务格子"
              :style="{ background: 获取宫格渐变(索引) }"
            >
              <div class="服务图标">{{ 项.icon || '⚔️' }}</div>
              <div class="服务名称">{{ 项.name || 项 }}</div>
            </div>
          </div>
        </div>

        <!-- 下单须知折叠卡片 -->
        <div v-if="store.下单须知" class="表单卡片">
          <div class="须知标题" @click="展开须知 = !展开须知">
            <span>📋 下单须知</span>
            <span class="展开箭头">{{ 展开须知 ? '▲' : '▼' }}</span>
          </div>
          <div v-if="展开须知" class="须知内容">
            <p v-for="(行, 索引) in 须知行列表" :key="索引">{{ 行 }}</p>
          </div>
        </div>

      </div>

      <!-- 底部固定按钮 -->
      <div class="底部按钮区">
        <button
          class="提交按钮"
          :class="{ '提交中': 提交中 }"
          @click="点击下单"
          :disabled="提交中"
        >
          <span v-if="提交中">⏳ 提交中...</span>
          <span v-else>⚔️ 立即下单</span>
        </button>
      </div>

      <!-- 底部安全间距 -->
      <div style="height: 80px"></div>
    </div>

    <!-- 加载失败/无效状态 -->
    <div v-else class="加载容器">
      <van-loading size="36px" color="#e94560" vertical>{{ 加载错误信息 || '加载中...' }}</van-loading>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSjzOrderStore } from '../stores/sjzOrder'
import { 验证三角洲卡密API, 获取IP城市API, 上传截图API, 提交三角洲订单API } from '../api/index'
import NoticePopup from '../components/NoticePopup.vue'
import { showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const store = useSjzOrderStore()

// 状态
const 加载中 = ref(true)
const 卡密有效 = ref(false)
const 加载错误信息 = ref('')

// 表单数据
const 手机号输入 = ref('')
const 游戏昵称输入 = ref('')
const 保险格数选择 = ref(null)
const 成年选择 = ref(-1)
const 截图文件列表 = ref([])
const 截图预览列表 = ref([])
const 截图URLs = ref([])
const 截图上传中 = ref(false)

// 验证状态
const 手机号错误提示 = ref('')
const 手机号验证通过 = ref(false)

// 提交状态
const 提交中 = ref(false)

// 弹窗状态
const 显示弹窗1 = ref(false)
const 显示弹窗2 = ref(false)

// 须知展开
const 展开须知 = ref(false)

// 须知内容按行分割
const 须知行列表 = computed(() => {
  return (store.下单须知 || '').split('\n').filter(行 => 行.trim())
})

// 宫格渐变色
const 渐变色列表 = [
  'linear-gradient(135deg, #e94560, #c62a47)',
  'linear-gradient(135deg, #f5c518, #e0a800)',
  'linear-gradient(135deg, #0f3460, #16213e)',
  'linear-gradient(135deg, #6c5ce7, #5a4fcf)',
  'linear-gradient(135deg, #00b894, #00a381)',
  'linear-gradient(135deg, #e17055, #d05f48)',
]
const 获取宫格渐变 = (索引) => 渐变色列表[索引 % 渐变色列表.length]

// 手机号验证
const 触发手机号验证 = () => {
  const 手机 = 手机号输入.value.trim()
  if (!手机) {
    手机号错误提示.value = '手机号不能为空'
    手机号验证通过.value = false
    return
  }
  if (!/^1[3-9]\d{9}$/.test(手机)) {
    手机号错误提示.value = '请输入正确的手机号（11位）'
    手机号验证通过.value = false
    return
  }
  手机号错误提示.value = ''
  手机号验证通过.value = true
}

const 重置手机号状态 = () => {
  手机号错误提示.value = ''
  手机号验证通过.value = false
}

// 截图处理
const 选择截图 = async (事件) => {
  const 文件列表 = Array.from(事件.target.files || [])
  if (!文件列表.length) return
  const 可选数量 = 3 - 截图预览列表.value.length
  const 待处理 = 文件列表.slice(0, 可选数量)

  // 先显示本地预览
  for (const 文件 of 待处理) {
    const 读取器 = new FileReader()
    读取器.onload = (e) => { 截图预览列表.value.push(e.target.result) }
    读取器.readAsDataURL(文件)
  }
  截图文件列表.value.push(...待处理)

  // 上传到服务器
  截图上传中.value = true
  try {
    const formData = new FormData()
    待处理.forEach(f => formData.append('files', f))
    const 响应 = await 上传截图API(formData)
    if (响应.data?.code === 1) {
      截图URLs.value.push(...(响应.data.data?.urls || []))
    }
  } catch (错误) {
    console.warn('[三角洲] 截图上传失败:', 错误.message)
    showToast('截图上传失败，请重试')
  } finally {
    截图上传中.value = false
  }
  // 重置input
  事件.target.value = ''
}

const 删除截图 = (索引) => {
  截图预览列表.value.splice(索引, 1)
  截图文件列表.value.splice(索引, 1)
  截图URLs.value.splice(索引, 1)
}

// 弹窗关闭
const 关闭弹窗1 = () => { 显示弹窗1.value = false }

// 点击下单
const 点击下单 = async () => {
  // 验证手机号
  if (store.需要手机号) {
    触发手机号验证()
    if (手机号错误提示.value) {
      showToast(手机号错误提示.value)
      return
    }
  }
  // 显示二次确认弹窗（若开启）
  if (store.sjz_popup2_enabled === '1') {
    显示弹窗2.value = true
    return
  }
  // 直接提交
  await 执行提交()
}

const 确认弹窗2提交 = async () => {
  显示弹窗2.value = false
  await 执行提交()
}

// 执行提交
const 执行提交 = async () => {
  if (提交中.value) return
  提交中.value = true
  try {
    const 请求数据 = {
      card_code: store.卡密,
      phone: 手机号输入.value.trim(),
      sjz_game_nickname: 游戏昵称输入.value.trim() || null,
      sjz_insurance_slots: 保险格数选择.value,
      sjz_is_adult: 成年选择.value,
      sjz_warehouse_images: 截图URLs.value.length > 0 ? 截图URLs.value : null,
    }

    const 响应 = await 提交三角洲订单API(请求数据)
    const 结果 = 响应.data

    if (结果.code === 1) {
      store.保存订单结果(结果.data)
      router.push(`/${route.params.code}/success`)
    } else {
      showToast(结果.message || '提交失败，请重试')
    }
  } catch (错误) {
    console.error('[三角洲] 提交订单失败:', 错误)
    showToast('网络错误，请重试')
  } finally {
    提交中.value = false
  }
}

// 初始化
onMounted(async () => {
  const code = route.params.code
  try {
    const 响应 = await 验证三角洲卡密API(code)
    const 结果 = 响应.data

    if (结果.code === 1) {
      store.设置卡密信息(结果.data)
      卡密有效.value = true
      // 显示首页弹窗
      if (store.sjz_popup1_enabled === '1') {
        显示弹窗1.value = true
      }
      // 异步获取IP城市
      获取IP城市API().then(城市响应 => {
        const 城市结果 = 城市响应.data
        if (城市结果.code === 1 && 城市结果.data) {
          store.设置登录城市(城市结果.data.province, 城市结果.data.city)
        } else {
          store.设置城市失败()
        }
      }).catch(() => store.设置城市失败())
    } else if (结果.code === 2) {
      // 已使用
      router.replace('/invalid?used=1')
    } else {
      router.replace('/invalid')
    }
  } catch (错误) {
    console.error('[三角洲] 验证卡密失败:', 错误)
    加载错误信息.value = '网络错误，请刷新重试'
    router.replace('/invalid')
  } finally {
    加载中.value = false
  }
})
</script>

<style scoped>
/* ===== 主页容器 ===== */
.主页容器 {
  min-height: 100vh;
  background: #1a1a2e;
  color: #e0e0e0;
  padding-bottom: 100px;
}

.加载容器 {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
}

/* ===== 顶部Banner ===== */
.顶部Banner {
  position: relative;
  background: linear-gradient(135deg, #16213e, #0f3460);
  border-bottom: 2px solid #e94560;
  padding: 20px 16px 24px;
  overflow: hidden;
}

.Banner背景图 {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.15;
}

.Banner内容 {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}

.Banner图标 {
  font-size: 40px;
  flex-shrink: 0;
}

.Banner文字区 {
  flex: 1;
}

.Banner主标题 {
  font-size: 20px;
  font-weight: 700;
  color: #f5c518;
  margin-bottom: 4px;
}

.Banner副标题 {
  font-size: 13px;
  color: #aaa;
}

/* 城市胶囊 */
.城市胶囊 {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  color: #ccc;
}

.城市文字 {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.定位中 { color: #f5c518; }

/* 哈夫币徽章 */
.哈夫币徽章 {
  position: relative;
  display: inline-block;
  margin-top: 12px;
  padding: 6px 16px;
  background: linear-gradient(135deg, #f5c518, #e0a800);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
}

/* ===== 内容区 ===== */
.内容区 {
  padding: 12px 12px 0;
}

/* ===== 表单卡片 ===== */
.表单卡片 {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.字段标题 {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 10px;
}

.必填标记 { color: #e94560; margin-left: 2px; }
.选填标记 { color: #888; font-size: 12px; font-weight: normal; }

/* 输入框 */
.输入框 {
  width: 100%;
  background: #0f3460;
  border: 1px solid #1a4a7e;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
  color: #e0e0e0;
  outline: none;
  transition: border-color 0.2s;
}

.输入框::placeholder { color: #666; }
.输入框:focus { border-color: #e94560; }
.输入框.输入错误 { border-color: #e94560; }
.输入框.输入正确 { border-color: #07c160; }

.错误提示 {
  font-size: 12px;
  color: #e94560;
  margin-top: 6px;
}

/* 保险格按钮组 */
.保险格按钮组 {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.保险格按钮 {
  flex: 1;
  min-width: calc(14.28% - 8px);
  padding: 8px 0;
  background: #0f3460;
  border: 1px solid #1a4a7e;
  border-radius: 8px;
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.保险格按钮.已选 {
  background: #e94560;
  border-color: #e94560;
  color: #fff;
  font-weight: 600;
}

/* 单选组 */
.单选组 {
  display: flex;
  gap: 16px;
}

.单选项 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #aaa;
  cursor: pointer;
  padding: 6px 0;
}

.单选项.已选 { color: #e0e0e0; }

.单选圆 {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #555;
  flex-shrink: 0;
  transition: all 0.2s;
}

.单选圆.已选 {
  border-color: #e94560;
  background: #e94560;
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.2);
}

/* 截图区域 */
.截图区域 {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.截图预览项 {
  position: relative;
  width: 80px;
  height: 80px;
}

.截图缩略图 {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.删除截图按钮 {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #e94560;
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.截图添加按钮 {
  width: 80px;
  height: 80px;
  background: #0f3460;
  border: 1px dashed #1a4a7e;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  gap: 4px;
}

.添加图标 { font-size: 24px; color: #555; }
.添加文字 { font-size: 11px; color: #555; }

.截图提示 { font-size: 12px; color: #f5c518; margin-top: 8px; }

/* 服务宫格 */
.服务宫格 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.服务格子 {
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
}

.服务图标 { font-size: 22px; margin-bottom: 4px; }
.服务名称 { font-size: 12px; color: #fff; font-weight: 500; }

/* 须知折叠 */
.须知标题 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}

.展开箭头 { font-size: 12px; color: #888; }

.须知内容 {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #0f3460;
}

.须知内容 p {
  font-size: 13px;
  color: #aaa;
  line-height: 1.8;
  padding: 2px 0;
}

/* ===== 底部按钮 ===== */
.底部按钮区 {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: linear-gradient(180deg, transparent, #1a1a2e 30%);
  z-index: 100;
}

.提交按钮 {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #e94560, #c62a47);
  border: none;
  border-radius: 28px;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.5);
  transition: opacity 0.2s, transform 0.1s;
}

.提交按钮:active { opacity: 0.85; transform: scale(0.98); }
.提交按钮.提交中 { opacity: 0.7; cursor: not-allowed; }
</style>
