<template>
  <!-- 确认订单页 -->
  <div class="确认页面">
    <van-nav-bar
      title="确认预约"
      left-arrow
      @click-left="返回上页"
      :border="false"
    />

    <!-- 服务信息 -->
    <div class="白色卡片">
      <div class="卡片标题">服务信息</div>
      <div class="信息项">
        <span class="信息标签">服务类型</span>
        <span class="信息值">{{ 订单Store.服务类型 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">服务时长</span>
        <span class="信息值">{{ 订单Store.服务时长 }}小时</span>
      </div>
      <div class="信息项">
        <span class="信息标签">预约时间</span>
        <!-- 多选模式：分行显示每个备选时间 -->
        <span class="信息值" v-if="订单Store.多选时间列表.length > 1">
          <div
            v-for="(项, 索引) in 订单Store.多选时间列表"
            :key="索引"
            :class="索引 === 0 ? '预约时间优先' : '预约时间备选'"
          >
            <!-- 第1个显示"优先时间"，其余显示"第N备选" -->
            {{ 索引 === 0 ? '优先时间' : `第${索引 + 1}备选` }}：{{ 项.date }} {{ 项.time }}
          </div>
        </span>
        <!-- 单选模式：直接显示时间 -->
        <span class="信息值" v-else>{{ 订单Store.预约时间显示 }}</span>
      </div>
    </div>

    <!-- 地址信息 -->
    <div class="白色卡片">
      <div class="卡片标题">地址信息</div>
      <div class="信息项">
        <span class="信息标签">联系人</span>
        <span class="信息值">{{ 订单Store.姓名 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">手机号</span>
        <span class="信息值">{{ 订单Store.手机号 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">服务地址</span>
        <span class="信息值">{{ 订单Store.完整地址 }}</span>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="底部按钮容器">
      <van-button
        type="primary"
        block
        round
        color="linear-gradient(135deg, #e54635, #ff6b35)"
        :loading="提交中"
        loading-text="提交中..."
        @click="提交预约"
      >
        确认预约
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useOrderStore } from '../stores/order'
import { 提交订单API } from '../api/index'

const router = useRouter()
const 订单Store = useOrderStore()
const 提交中 = ref(false)

const 返回上页 = () => router.back()

const 提交预约 = async () => {
  提交中.value = true
  try {
    const 结果 = await 提交订单API({
      card_code: 订单Store.卡密,
      name: 订单Store.姓名,
      phone: 订单Store.手机号,
      province: 订单Store.省份,
      city: 订单Store.城市,
      district: 订单Store.区县,
      street: 订单Store.街道 || '',
      address: 订单Store.详细地址,
      visit_date: 订单Store.预约日期,
      visit_time: 订单Store.预约时间段,
      // 多备选时间列表（有则提交，向下兼容）
      visit_times: 订单Store.多选时间列表.length > 0
        ? JSON.stringify(订单Store.多选时间列表)
        : null,
    })

    if (结果.code === 1) {
      // 跳转到成功页
      router.replace({
        name: 'Success',
        params: { code: 订单Store.卡密 },
        query: 结果.data,
      })
    } else {
      showToast(结果.message || '预约失败')
    }
  } catch {
    showToast('网络错误，请重试')
  } finally {
    提交中.value = false
  }
}
</script>

<style scoped>
.确认页面 {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.白色卡片 {
  background: white;
  border-radius: 12px;
  margin: 12px 16px;
  padding: 16px;
}

.卡片标题 {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.信息项 {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
}

.信息标签 {
  font-size: 14px;
  color: #999;
  flex-shrink: 0;
  margin-right: 12px;
}

.信息值 {
  font-size: 14px;
  color: #333;
  text-align: right;
  flex: 1;
  line-height: 1.5;
}

/* 多选时间第1优先样式 */
.预约时间优先 {
  color: #e54635;
  font-size: 13px;
  margin-bottom: 2px;
}

/* 多选时间备选样式 */
.预约时间备选 {
  color: #999;
  font-size: 13px;
  margin-bottom: 2px;
}

.底部按钮容器 {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
}
</style>
