<template>
  <!-- 洗衣物流查询页 -->
  <div class="物流查询页">

    <!-- 顶部导航 -->
    <van-nav-bar
      title="物流查询"
      left-arrow
      @click-left="返回"
      class="顶部导航"
    />

    <!-- 加载中 -->
    <div v-if="加载中" class="加载区">
      <van-loading size="32px" color="#1989fa">查询物流中...</van-loading>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="错误信息" class="错误区">
      <van-empty image="error" :description="错误信息" />
      <van-button type="primary" size="small" round @click="加载物流" style="margin-top:16px">重新查询</van-button>
    </div>

    <template v-else-if="物流数据">
      <!-- 订单基本信息 -->
      <div class="信息卡片">
        <div class="信息卡片标题">📦 订单信息</div>
        <div class="信息行">
          <span class="信息标签">订单号</span>
          <span class="信息值">{{ 物流数据.order_no }}</span>
        </div>
        <div class="信息行" v-if="物流数据.service_type">
          <span class="信息标签">洗护商品</span>
          <span class="信息值">{{ 物流数据.service_type }}</span>
        </div>
        <div class="信息行" v-if="物流数据.factory_name">
          <span class="信息标签">洗衣工厂</span>
          <span class="信息值">{{ 物流数据.factory_name }}</span>
        </div>
        <div class="信息行" v-if="物流数据.visit_date">
          <span class="信息标签">预约取件</span>
          <span class="信息值蓝色">{{ 物流数据.visit_date }} {{ 物流数据.visit_time }}</span>
        </div>
      </div>

      <!-- 洗衣进度步骤条 -->
      <div class="信息卡片">
        <div class="信息卡片标题">🔄 洗衣进度</div>
        <div class="步骤条">
          <div
            v-for="(步骤, 索引) in 步骤列表"
            :key="索引"
            class="步骤项"
            :class="{ '步骤完成': 步骤已完成(步骤.状态), '步骤当前': 步骤.状态 === 物流数据.laundry_status }"
          >
            <div class="步骤圆点">{{ 步骤已完成(步骤.状态) ? '✓' : 索引 + 1 }}</div>
            <div class="步骤名称">{{ 步骤.名称 }}</div>
          </div>
        </div>
        <div v-if="物流数据.laundry_status" class="当前状态文字">
          当前状态：<span class="状态高亮">{{ 物流数据.laundry_status }}</span>
        </div>
      </div>

      <!-- 快递信息 -->
      <div class="信息卡片" v-if="物流数据.express_order_id || 物流数据.return_waybill_code">
        <div class="信息卡片标题">🚚 快递信息</div>
        <div class="信息行" v-if="物流数据.express_order_id">
          <span class="信息标签">取件单号</span>
          <span class="信息值单号">{{ 物流数据.express_order_id }}</span>
        </div>
        <div class="信息行" v-if="物流数据.return_waybill_code">
          <span class="信息标签">回寄单号</span>
          <span class="信息值单号">{{ 物流数据.return_waybill_code }}</span>
        </div>
        <!-- 快递员信息 -->
        <template v-if="取件快递员姓名 || 取件快递员电话">
          <div class="分隔线"></div>
          <div class="信息行" v-if="取件快递员姓名">
            <span class="信息标签">取件快递员</span>
            <span class="信息值">{{ 取件快递员姓名 }}</span>
          </div>
          <div class="信息行" v-if="取件快递员电话">
            <span class="信息标签">快递员电话</span>
            <a :href="`tel:${取件快递员电话}`" class="电话链接">📞 {{ 取件快递员电话 }}</a>
          </div>
        </template>
      </div>

      <!-- 取件物流轨迹 -->
      <div class="信息卡片" v-if="取件路由列表.length > 0">
        <div class="信息卡片标题">📍 取件物流轨迹</div>
        <div class="时间轴">
          <div
            v-for="(路由, 索引) in 取件路由列表"
            :key="索引"
            class="时间轴项"
            :class="{ '时间轴最新': 索引 === 0 }"
          >
            <div class="时间轴点"></div>
            <div class="时间轴内容">
              <div class="时间轴时间">{{ 路由.time || 路由.timestamp }}</div>
              <div class="时间轴文字">{{ 路由.desc || 路由.remark || 路由.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 回寄物流轨迹（有数据时展示） -->
      <div class="信息卡片" v-if="回寄路由列表.length > 0">
        <div class="信息卡片标题">📦 回寄物流轨迹</div>
        <div class="时间轴">
          <div
            v-for="(路由, 索引) in 回寄路由列表"
            :key="索引"
            class="时间轴项"
            :class="{ '时间轴最新': 索引 === 0 }"
          >
            <div class="时间轴点"></div>
            <div class="时间轴内容">
              <div class="时间轴时间">{{ 路由.time || 路由.timestamp }}</div>
              <div class="时间轴文字">{{ 路由.desc || 路由.remark || 路由.content }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预检图片 -->
      <div class="信息卡片" v-if="预检图片列表.length > 0">
        <div class="信息卡片标题">🖼️ 预检图片</div>
        <div class="图片列表">
          <van-image
            v-for="(图片, 索引) in 预检图片列表"
            :key="索引"
            :src="图片"
            width="100"
            height="100"
            fit="cover"
            radius="8"
            class="预检图片"
            @click="预览图片(索引)"
          />
        </div>
      </div>

      <!-- 无物流信息提示 -->
      <div class="信息卡片" v-if="!物流数据.express_order_id && !物流数据.return_waybill_code">
        <van-empty description="暂无物流信息，订单处理中请耐心等待" :image-size="80" />
      </div>
    </template>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="显示图片预览"
      :images="预检图片列表"
      :start-position="预览图片索引"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { 查询洗衣物流API } from '../api/index'

const route = useRoute()
const router = useRouter()

const 加载中 = ref(false)
const 错误信息 = ref('')
const 物流数据 = ref(null)

// 图片预览
const 显示图片预览 = ref(false)
const 预览图片索引 = ref(0)

// 洗衣步骤（按流程顺序）
const 步骤列表 = [
  { 名称: '已提交', 状态: '已提交' },
  { 名称: '已分配', 状态: '已分配' },
  { 名称: '已取件', 状态: '已取件' },
  { 名称: '已入厂', 状态: '已入厂' },
  { 名称: '预检中', 状态: '预检中' },
  { 名称: '质检中', 状态: '质检中' },
  { 名称: '已回寄', 状态: '已回寄' },
  { 名称: '已送达', 状态: '已送达' },
]

// 步骤完成判断（当前状态之前的步骤都算完成）
const 当前步骤索引 = computed(() => {
  const 当前 = 物流数据.value?.laundry_status
  if (!当前) return -1
  const 索引 = 步骤列表.findIndex(步骤 => 步骤.状态 === 当前)
  return 索引
})

const 步骤已完成 = (步骤状态) => {
  // 若当前状态不在步骤列表中（如已取消），不标记任何步骤完成
  if (当前步骤索引.value < 0) return false
  const 步骤索引 = 步骤列表.findIndex(步骤 => 步骤.状态 === 步骤状态)
  return 步骤索引 <= 当前步骤索引.value
}

// 取件快递员信息
const 取件快递员姓名 = computed(() => 物流数据.value?.pickup_route?.courierName || '')
const 取件快递员电话 = computed(() => 物流数据.value?.pickup_route?.courierPhone || '')

// 取件路由列表
const 取件路由列表 = computed(() => {
  const 数据 = 物流数据.value?.pickup_route
  return 数据?.routes || 数据?.routeList || []
})

// 回寄路由列表
const 回寄路由列表 = computed(() => {
  const 数据 = 物流数据.value?.return_route
  return 数据?.routes || 数据?.routeList || []
})

// 预检图片列表（兼容 images_v2 对象数组和旧版字符串数组两种格式）
// images_v2 格式：[{image: ["url1", "url2"], ...}, ...]
// 旧版 images 格式：["url1", "url2"]
const 预检图片列表 = computed(() => {
  const 原始 = 物流数据.value?.laundry_images
  if (!原始 || !Array.isArray(原始) || 原始.length === 0) return []
  // 判断是否为 images_v2 格式（数组元素是对象且含 image 字段）
  if (typeof 原始[0] === 'object' && 原始[0] !== null && Array.isArray(原始[0].image)) {
    // 将所有 image 数组内的 URL 合并为一个平铺列表
    return 原始.flatMap(项 => 项.image || [])
  }
  // 旧版：元素直接是 URL 字符串
  return 原始.filter(项 => typeof 项 === 'string')
})

// 加载物流数据
const 加载物流 = async () => {
  const 订单号 = route.query.orderNo
  if (!订单号) {
    错误信息.value = '订单号不存在'
    return
  }

  加载中.value = true
  错误信息.value = ''
  try {
    const 结果 = await 查询洗衣物流API(订单号)
    if (结果.code === 1) {
      物流数据.value = 结果.data
    } else {
      错误信息.value = 结果.message || '查询失败，请重试'
    }
  } catch {
    错误信息.value = '网络错误，请重试'
  } finally {
    加载中.value = false
  }
}

const 返回 = () => router.back()

const 预览图片 = (索引) => {
  预览图片索引.value = 索引
  显示图片预览.value = true
}

onMounted(() => 加载物流())
</script>

<style scoped>
.物流查询页 {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 32px;
}
.顶部导航 {
  position: sticky;
  top: 0;
  z-index: 100;
}
.加载区 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.错误区 {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}
.信息卡片 {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.信息卡片标题 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.信息行 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 0;
}
.信息标签 {
  font-size: 13px;
  color: #999;
  flex-shrink: 0;
  margin-right: 8px;
}
.信息值 { font-size: 14px; color: #333; }
.信息值蓝色 { font-size: 14px; color: #1989fa; font-weight: 500; }
.信息值单号 { font-size: 13px; color: #1989fa; font-family: monospace; }
.电话链接 { font-size: 14px; color: #1989fa; text-decoration: none; }
.分隔线 { height: 1px; background: #f5f5f5; margin: 6px 0; }

/* 步骤条 */
.步骤条 {
  display: flex;
  overflow-x: auto;
  gap: 0;
  padding: 8px 0;
}
.步骤项 {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 60px;
  position: relative;
}
.步骤项:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #e0e0e0;
  z-index: 0;
}
.步骤完成.步骤项:not(:last-child)::after { background: #1989fa; }
.步骤圆点 {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  position: relative;
  z-index: 1;
}
.步骤完成 .步骤圆点 { background: #1989fa; color: white; }
.步骤当前 .步骤圆点 { background: #ff9500; color: white; }
.步骤名称 {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  text-align: center;
}
.步骤完成 .步骤名称, .步骤当前 .步骤名称 { color: #333; font-weight: 500; }
.当前状态文字 {
  font-size: 13px;
  color: #666;
  margin-top: 12px;
  text-align: center;
}
.状态高亮 { color: #ff9500; font-weight: 600; }

/* 时间轴 */
.时间轴 { padding: 4px 0; }
.时间轴项 {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  position: relative;
}
.时间轴项:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 22px;
  bottom: -8px;
  width: 2px;
  background: #e0e0e0;
}
.时间轴点 {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #c0c0c0;
  flex-shrink: 0;
  margin-top: 3px;
}
.时间轴最新 .时间轴点 { background: #1989fa; }
.时间轴内容 { flex: 1; }
.时间轴时间 { font-size: 12px; color: #999; margin-bottom: 2px; }
.时间轴文字 { font-size: 14px; color: #333; line-height: 1.4; }
.时间轴最新 .时间轴文字 { color: #1989fa; font-weight: 500; }

/* 图片列表 */
.图片列表 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.预检图片 { cursor: pointer; }
</style>
