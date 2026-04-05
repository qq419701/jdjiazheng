<template>
  <div class="确认页面">
    <van-nav-bar title="确认预约" left-arrow @click-left="返回上页" :border="false" />

    <!-- 洗护商品 -->
    <div class="白色卡片">
      <div class="卡片标题">洗护商品</div>
      <div class="信息项">
        <span class="信息标签">商品名称</span>
        <span class="信息值">{{ 洗衣Store.商品名称 }}</span>
      </div>
    </div>

    <!-- 取件信息 -->
    <div class="白色卡片">
      <div class="卡片标题">取件信息</div>
      <div class="信息项">
        <span class="信息标签">取件人</span>
        <span class="信息值">{{ 洗衣Store.取件姓名 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">手机号</span>
        <span class="信息值">{{ 洗衣Store.取件手机 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">取件地址</span>
        <span class="信息值">{{ 洗衣Store.完整取件地址 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">取件时间</span>
        <span class="信息值蓝色">{{ 洗衣Store.取件时间显示 }}</span>
      </div>
    </div>

    <!-- 收件信息 -->
    <div class="白色卡片">
      <div class="卡片标题">
        收件信息
        <span v-if="洗衣Store.收件与取件相同" class="同地址标签">与取件相同</span>
      </div>
      <div class="信息项">
        <span class="信息标签">收件人</span>
        <span class="信息值">{{ 洗衣Store.实际收件姓名 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">手机号</span>
        <span class="信息值">{{ 洗衣Store.实际收件手机 }}</span>
      </div>
      <div class="信息项">
        <span class="信息标签">收件地址</span>
        <span class="信息值">{{ 洗衣Store.完整收件地址 }}</span>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="底部按钮容器">
      <van-button
        type="primary"
        block
        round
        color="linear-gradient(135deg, #1989fa, #4fc3f7)"
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
import { useLaundryOrderStore } from '../stores/laundryOrder'
import { 提交洗衣订单API } from '../api/index'

const router = useRouter()
const 洗衣Store = useLaundryOrderStore()
const 提交中 = ref(false)

const 返回上页 = () => router.back()

const 提交预约 = async () => {
  提交中.value = true
  try {
    const 结果 = await 提交洗衣订单API({
      card_code: 洗衣Store.卡密,
      name: 洗衣Store.取件姓名,
      phone: 洗衣Store.取件手机,
      province: 洗衣Store.取件省份,
      city: 洗衣Store.取件城市,
      district: 洗衣Store.取件区县,
      street: 洗衣Store.取件街道 || '',
      address: 洗衣Store.取件详细地址,
      return_name: 洗衣Store.实际收件姓名,
      return_phone: 洗衣Store.实际收件手机,
      return_province: 洗衣Store.实际收件省份,
      return_city: 洗衣Store.实际收件城市,
      return_district: 洗衣Store.实际收件区县,
      return_address: 洗衣Store.实际收件详细地址,
      visit_date: 洗衣Store.取件日期,
      visit_time_label: 洗衣Store.取件时间标签,
      visit_time_start: 洗衣Store.取件时间开始,
      visit_time_end: 洗衣Store.取件时间结束,
    })

    if (结果.code === 1) {
      router.replace({
        name: 'Success',
        params: { code: 洗衣Store.卡密 },
        query: 结果.data,
      })
    } else {
      showToast(结果.message || '预约失败，请重试')
    }
  } catch {
    showToast('网络错误，请重试')
  } finally {
    提交中.value = false
  }
}
</script>

<style scoped>
.确认页面 { min-height: 100vh; background: #f5f5f5; padding-bottom: 80px; }
.白色卡片 { background: white; border-radius: 12px; margin: 12px 16px; padding: 16px; }
.卡片标题 { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 8px; }
.同地址标签 { font-size: 12px; color: #1989fa; background: #e8f4fd; padding: 2px 8px; border-radius: 10px; font-weight: 400; }
.信息项 { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; }
.信息标签 { font-size: 14px; color: #999; flex-shrink: 0; margin-right: 12px; }
.信息值 { font-size: 14px; color: #333; text-align: right; flex: 1; line-height: 1.5; }
.信息值蓝色 { font-size: 14px; color: #1989fa; text-align: right; flex: 1; }
.底部按钮容器 { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: white; box-shadow: 0 -2px 10px rgba(0,0,0,0.08); }
</style>
