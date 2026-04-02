<template>
  <!-- 预约成功页 -->
  <div class="成功页面">
    <div class="成功内容">
      <div class="成功图标">✅</div>
      <div class="成功标题">预约成功！</div>
      <div class="成功描述">商家将尽快联系您安排服务</div>

      <!-- 订单信息 -->
      <div class="订单卡片">
        <div class="订单行">
          <span class="订单标签">订单编号</span>
          <span class="订单值">{{ 订单信息.order_no }}</span>
        </div>
        <div class="订单行">
          <span class="订单标签">服务类型</span>
          <span class="订单值">{{ 订单信息.service_type }}</span>
        </div>
        <div class="订单行">
          <span class="订单标签">服务时长</span>
          <span class="订单值">{{ 订单信息.service_hours }}小时</span>
        </div>
        <div class="订单行">
          <span class="订单标签">预约时间</span>
          <span class="订单值">{{ 订单信息.visit_date }} {{ 订单信息.visit_time }}</span>
        </div>
        <div class="订单行">
          <span class="订单标签">服务地址</span>
          <span class="订单值地址">{{ 订单信息.full_address }}</span>
        </div>
        <div class="订单行">
          <span class="订单标签">联系人</span>
          <span class="订单值">{{ 订单信息.name }} {{ 订单信息.phone }}</span>
        </div>
      </div>

      <div class="温馨提示">
        <div class="提示标题">温馨提示</div>
        <div class="提示内容">请保持手机畅通，等待客服确认</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
// 从路由参数获取订单信息
const 订单信息 = ref(route.query || {})
</script>

<style scoped>
.成功页面 {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px 16px;
}

.成功内容 {
  text-align: center;
}

.成功图标 {
  font-size: 70px;
  margin-bottom: 16px;
  margin-top: 20px;
}

.成功标题 {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.成功描述 {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.订单卡片 {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.订单行 {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.订单行:last-child {
  border-bottom: none;
}

.订单标签 {
  font-size: 13px;
  color: #999;
  flex-shrink: 0;
  margin-right: 12px;
}

.订单值 {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.订单值地址 {
  font-size: 13px;
  color: #333;
  text-align: right;
  flex: 1;
  line-height: 1.5;
}

.温馨提示 {
  background: #fff8f0;
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid #ff6b35;
}

.提示标题 {
  font-size: 13px;
  font-weight: 600;
  color: #ff6b35;
  margin-bottom: 4px;
}

.提示内容 {
  font-size: 12px;
  color: #999;
}
</style>
