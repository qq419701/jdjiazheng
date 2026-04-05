<template>
  <!-- 洗衣服主页 -->
  <div class="主页容器" v-if="!加载中 && 卡密有效">

    <!-- 顶部蓝色渐变Banner -->
    <div class="顶部Banner">
      <div class="Banner图标区">
        <span class="洗衣图标">👕</span>
        <span class="品牌图标">优</span>
      </div>
      <div class="Banner文字区">
        <div class="Banner主标题">优米拉洗衣服务</div>
        <div class="Banner副标题">京东快递免费取送 专业洗护</div>
      </div>
      <img v-if="banner图URL" :src="banner图URL" class="Banner图片" alt="优米拉洗衣" />
    </div>

    <!-- 取/收地址卡片 -->
    <div class="地址卡片" :class="{ '地址未填边框': !洗衣Store.已填写地址 }">
      <!-- 取件行 -->
      <div class="地址行" @click="跳转填写地址">
        <span class="地址徽章 取件徽章">取</span>
        <div class="地址文字区">
          <div v-if="洗衣Store.已填写地址" class="地址主文字">{{ 洗衣Store.完整取件地址 }}</div>
          <div v-else class="地址占位文字">点击填写取件地址（必填）</div>
          <div v-if="洗衣Store.已填写地址" class="地址联系人">
            <span class="联系姓名">{{ 洗衣Store.取件姓名 }}</span>
            <span class="联系手机">{{ 洗衣Store.取件手机 }}</span>
          </div>
        </div>
        <span class="行编辑图标">✏️</span>
      </div>

      <!-- 虚线分隔 -->
      <div class="虚线分隔"></div>

      <!-- 收件行 -->
      <div class="地址行" @click="跳转填写地址">
        <span class="地址徽章 收件徽章">收</span>
        <div class="地址文字区">
          <div class="地址主文字地址行">
            <span v-if="洗衣Store.已填写地址" class="地址主文字">{{ 洗衣Store.完整收件地址 }}</span>
            <span v-else class="地址占位文字">与取件地址相同</span>
            <span v-if="洗衣Store.收件与取件相同 && 洗衣Store.已填写地址" class="同上标签">同上</span>
          </div>
          <div v-if="洗衣Store.已填写地址" class="地址联系人">
            <span class="联系姓名">{{ 洗衣Store.实际收件姓名 }}</span>
            <span class="联系手机">{{ 洗衣Store.实际收件手机 }}</span>
          </div>
        </div>
        <span class="行编辑图标">✏️</span>
      </div>
    </div>

    <!-- 服务信息卡片 -->
    <div class="服务信息卡片">
      <!-- 取件时间 -->
      <div class="信息行" @click="点击选择时间">
        <span class="信息标签">取件时间</span>
        <span class="信息值红色" v-if="!洗衣Store.已填写地址">请先填写取件地址</span>
        <span class="信息值蓝色" v-else-if="!洗衣Store.已选择时间">点击选择取件时间 &gt;</span>
        <span class="信息值" v-else>{{ 洗衣Store.取件时间显示 }}</span>
      </div>

      <!-- 商品信息 -->
      <div class="信息行">
        <span class="信息标签">洗护商品</span>
        <span class="信息值">{{ 洗衣Store.商品名称 }}</span>
      </div>

      <!-- 兑换码 -->
      <div class="信息行">
        <span class="信息标签">兑换码</span>
        <span class="信息值灰色">{{ 洗衣Store.卡密 }}</span>
      </div>
    </div>

    <!-- 步骤引导 -->
    <div v-if="!洗衣Store.已填写地址" class="步骤引导卡片">
      预约步骤：① 填写取件地址 ← 当前步骤 &nbsp; ② 选择取件时间 &nbsp; ③ 确认预约
    </div>

    <!-- 服务内容 -->
    <div v-if="洗衣Store.服务内容列表.length > 0" class="服务内容卡片">
      <div class="宫格卡片标题">◆ 服务内容 ◆</div>
      <div class="服务宫格">
        <div v-for="(项, 索引) in 洗衣Store.服务内容列表" :key="索引" class="宫格项">
          <div class="宫格图标容器">
            <span class="宫格图标">{{ 项.icon || '✅' }}</span>
          </div>
          <div class="宫格标题">{{ 项.title }}</div>
        </div>
      </div>
    </div>

    <!-- 下单须知 -->
    <div v-if="洗衣Store.下单须知" class="须知卡片">
      <div class="卡片标题">下单须知</div>
      <div class="须知内容">
        <div v-for="(行, 索引) in 须知行列表" :key="索引" class="须知行">{{ 行 }}</div>
      </div>
    </div>

    <!-- 底部立即预约按钮 -->
    <div class="底部按钮容器">
      <div
        class="立即预约按钮"
        :class="按钮样式类"
        :style="按钮样式"
        @click="点击立即预约"
      >
        {{ 按钮文字 }}
      </div>
    </div>

    <!-- 取件时间选择弹窗 -->
    <van-popup v-model:show="显示时间选择" position="bottom" round :style="{ maxHeight: '70%' }">
      <div class="时间选择弹窗">
        <div class="弹窗标题栏">
          <span class="取消按钮" @click="显示时间选择 = false">取消</span>
          <span class="弹窗标题">选择取件时间</span>
          <span></span>
        </div>
        <!-- 日期选择 -->
        <div class="日期列表">
          <div
            v-for="日期项 in 可选日期列表"
            :key="日期项.值"
            :class="['日期项', { '日期选中': 选中日期 === 日期项.值 }]"
            @click="选中日期 = 日期项.值"
          >
            <div class="日期数字">{{ 日期项.日 }}</div>
            <div class="日期星期">{{ 日期项.星期 }}</div>
          </div>
        </div>
        <!-- 时间段列表 -->
        <div class="时间段区域">
          <div
            v-for="时间段 in 时间段列表"
            :key="时间段.label"
            :class="['时间段项', { '时间段选中': 选中时间段?.label === 时间段.label }]"
            @click="选中时间段 = 时间段"
          >
            {{ 时间段.label }}
          </div>
          <div v-if="时间段列表.length === 0" class="无时间段提示">
            暂无可用时间段，请稍后再试
          </div>
        </div>
        <div class="弹窗底部">
          <van-button type="primary" block @click="确认时间选择" :disabled="!选中日期 || !选中时间段">
            确认选择
          </van-button>
        </div>
      </div>
    </van-popup>
  </div>

  <!-- 加载中 -->
  <div v-else-if="加载中" class="加载页面">
    <van-loading color="#1989fa" size="32px" />
    <span class="加载文字">正在验证...</span>
  </div>

  <!-- 卡密无效 -->
  <div v-else class="无效页面">
    <div class="无效图标">❌</div>
    <div class="无效标题">卡密无效</div>
    <div class="无效描述">该卡密不存在、已使用或已过期</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLaundryOrderStore } from '../stores/laundryOrder'
import { 验证洗衣卡密API, 获取洗衣时间表API } from '../api/index'

const route = useRoute()
const router = useRouter()
const 洗衣Store = useLaundryOrderStore()

const 加载中 = ref(true)
const 卡密有效 = ref(false)
const banner图URL = ref('')
const 显示时间选择 = ref(false)
const 选中日期 = ref('')
const 选中时间段 = ref(null)
const 时间段列表 = ref([])

// 生成未来14天日期列表
const 可选日期列表 = computed(() => {
  const 列表 = []
  const 星期名 = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  for (let i = 1; i <= 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const 年 = d.getFullYear()
    const 月 = String(d.getMonth() + 1).padStart(2, '0')
    const 日 = String(d.getDate()).padStart(2, '0')
    列表.push({
      值: `${年}-${月}-${日}`,
      日: `${月}/${日}`,
      星期: 星期名[d.getDay()],
    })
  }
  return 列表
})

// 须知行列表
const 须知行列表 = computed(() => {
  return (洗衣Store.下单须知 || '').split('\n').filter(行 => 行.trim())
})

// 页面初始化：验证卡密
onMounted(async () => {
  const 卡密码 = route.params.code
  if (!卡密码) {
    加载中.value = false
    return
  }
  try {
    const 结果 = await 验证洗衣卡密API(卡密码)
    if (结果.code === 1) {
      卡密有效.value = true
      洗衣Store.设置卡密信息(结果.data)
      banner图URL.value = 结果.data.banner_url || ''
    } else if (结果.code === 2) {
      router.replace({ name: 'Invalid', query: { used: '1', code: 卡密码 } })
      return
    } else {
      router.replace({ name: 'Invalid' })
      return
    }
  } catch {
    showToast('网络错误，请刷新重试')
  } finally {
    加载中.value = false
  }
})

// 跳转填写地址
const 跳转填写地址 = () => {
  router.push({ name: 'Address', params: { code: route.params.code } })
}

// 点击选择取件时间
const 点击选择时间 = async () => {
  if (!洗衣Store.已填写地址) {
    showToast({ message: '请先填写取件地址', duration: 2000 })
    return
  }
  // 加载时间段
  try {
    const 结果 = await 获取洗衣时间表API(洗衣Store.取件城市)
    if (结果.code === 1) {
      时间段列表.value = 结果.data
    }
  } catch {
    时间段列表.value = []
  }
  选中日期.value = 可选日期列表.value[0]?.值 || ''
  选中时间段.value = null
  显示时间选择.value = true
}

// 确认时间选择
const 确认时间选择 = () => {
  if (!选中日期.value || !选中时间段.value) {
    showToast('请选择日期和时间段')
    return
  }
  洗衣Store.保存取件时间(
    选中日期.value,
    选中时间段.value.label,
    选中时间段.value.start,
    选中时间段.value.end
  )
  显示时间选择.value = false
  showToast('已选择：' + 选中日期.value + ' ' + 选中时间段.value.label)
}

// 按钮计算
const 按钮文字 = computed(() => {
  if (!洗衣Store.已填写地址) return '请先填写取件地址'
  if (!洗衣Store.已选择时间) return '请选择取件时间'
  return '立即预约'
})

const 按钮样式 = computed(() => {
  if (!洗衣Store.已填写地址) return { background: '#cccccc', boxShadow: 'none' }
  if (!洗衣Store.已选择时间) return { background: '#5ba3f0', boxShadow: '0 4px 12px rgba(91, 163, 240, 0.4)' }
  return {}
})

const 按钮样式类 = computed(() => {
  return (洗衣Store.已填写地址 && 洗衣Store.已选择时间) ? '按钮激活' : ''
})

// 点击立即预约
const 点击立即预约 = () => {
  if (!洗衣Store.已填写地址) {
    showToast('请先填写取件地址')
    return
  }
  if (!洗衣Store.已选择时间) {
    showToast('请选择取件时间')
    return
  }
  router.push({ name: 'Confirm', params: { code: route.params.code } })
}
</script>

<style scoped>
.主页容器 {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

/* 顶部Banner */
.顶部Banner {
  background: linear-gradient(135deg, #1989fa, #4fc3f7);
  padding: 24px 20px 30px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-height: 120px;
}

.Banner图标区 { margin-right: 12px; }

.洗衣图标 { font-size: 36px; display: block; }

.品牌图标 {
  display: block;
  width: 28px;
  height: 28px;
  background: white;
  color: #1989fa;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  line-height: 28px;
  margin-top: 4px;
}

.Banner文字区 { flex: 1; color: white; }

.Banner主标题 { font-size: 20px; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px; }

.Banner副标题 { font-size: 13px; opacity: 0.9; letter-spacing: 1px; }

.Banner图片 { position: absolute; right: 0; top: 0; height: 100%; opacity: 0.3; }

/* 取/收地址卡片 */
.地址卡片 {
  background: white;
  border-radius: 12px;
  margin: -12px 16px 12px;
  padding: 0 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

.地址未填边框 { border: 2px dashed #1989fa; }

.地址行 {
  display: flex;
  align-items: flex-start;
  padding: 14px 0;
  cursor: pointer;
}

.地址徽章 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  margin-right: 10px;
  margin-top: 1px;
}

.取件徽章 { background: #FF4D4F; }
.收件徽章 { background: #13C2C2; }

.地址文字区 { flex: 1; min-width: 0; }

.地址主文字地址行 { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.地址主文字 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}

.地址占位文字 {
  font-size: 14px;
  color: #1989fa;
  font-weight: 500;
}

.地址联系人 {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.联系姓名 { font-size: 13px; color: #666; }
.联系手机 { font-size: 13px; color: #666; }

.同上标签 {
  background: #FF4D4F;
  color: white;
  font-size: 12px;
  border-radius: 4px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.行编辑图标 {
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
  margin-top: 2px;
}

.虚线分隔 {
  border-top: 1px dashed #eee;
  margin: 0;
}

/* 服务信息卡片 */
.服务信息卡片 {
  background: white;
  border-radius: 12px;
  margin: 0 16px 12px;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 步骤引导卡片 */
.步骤引导卡片 {
  background: #e8f4fd;
  border: 1px solid #bee3fb;
  border-radius: 8px;
  margin: 0 16px 12px;
  padding: 10px 14px;
  font-size: 12px;
  color: #1989fa;
  line-height: 1.6;
}

/* 信息行 */
.信息行 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f8f8f8;
  cursor: pointer;
}
.信息行:last-child { border-bottom: none; }

.信息标签 { font-size: 14px; color: #999; }
.信息值 { font-size: 14px; color: #333; }
.信息值蓝色 { font-size: 14px; color: #1989fa; }
.信息值红色 { font-size: 14px; color: #e54635; font-weight: 500; }
.信息值灰色 { font-size: 13px; color: #bbb; letter-spacing: 1px; }

/* 服务内容卡片 */
.服务内容卡片, .须知卡片 {
  background: white;
  border-radius: 12px;
  margin: 0 16px 12px;
  padding: 16px;
}
.宫格卡片标题 {
  font-size: 15px;
  font-weight: 600;
  color: #FF4D4F;
  text-align: center;
  margin-bottom: 14px;
  letter-spacing: 2px;
}
.卡片标题 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
/* 宫格布局 */
.服务宫格 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.宫格项 {
  background: white;
  border-radius: 10px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.宫格图标容器 {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 77, 79, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.宫格图标 { font-size: 28px; }
.宫格标题 { font-size: 13px; font-weight: 600; color: #333; margin-top: 8px; text-align: center; }

/* 须知 */
.须知内容 { font-size: 13px; color: #666; }
.须知行 { padding: 4px 0; line-height: 1.5; border-bottom: 1px solid #f5f5f5; }
.须知行:last-child { border-bottom: none; }

/* 底部按钮 */
.底部按钮容器 {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.立即预约按钮 {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #1989fa, #4fc3f7);
  border: none;
  border-radius: 24px;
  color: white;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
  transition: background 0.3s, box-shadow 0.3s;
}

/* 加载页面 */
.加载页面 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f5f5f5;
}
.加载文字 { font-size: 14px; color: #999; }

/* 无效页面 */
.无效页面 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f5f5f5;
}
.无效图标 { font-size: 60px; }
.无效标题 { font-size: 20px; font-weight: 600; color: #333; }
.无效描述 { font-size: 14px; color: #999; }

/* 时间选择弹窗 */
.时间选择弹窗 { display: flex; flex-direction: column; }

.弹窗标题栏 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.弹窗标题 { font-size: 16px; font-weight: 600; color: #333; }
.取消按钮 { font-size: 14px; color: #999; cursor: pointer; padding: 4px 8px; }

.日期列表 {
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.日期项 {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  background: #f5f5f5;
  min-width: 56px;
}
.日期选中 { background: #1989fa; color: white; }
.日期数字 { font-size: 14px; font-weight: 600; }
.日期星期 { font-size: 11px; opacity: 0.8; margin-top: 2px; }

.时间段区域 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  max-height: 180px;
  overflow-y: auto;
}
.时间段项 {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  background: #f5f5f5;
  color: #333;
  cursor: pointer;
  border: 1.5px solid transparent;
}
.时间段选中 { background: #e8f4fd; color: #1989fa; border-color: #1989fa; font-weight: 500; }
.无时间段提示 { width: 100%; text-align: center; color: #ccc; font-size: 14px; padding: 20px 0; }

.弹窗底部 { padding: 12px 16px; border-top: 1px solid #f0f0f0; }
</style>
