<template>
  <div class="地址页面">
    <van-nav-bar title="服务信息" left-arrow @click-left="返回上页" :border="false" style="background: white;" />
    <div class="表单卡片">
      <van-form @submit="保存地址" ref="表单引用">
        <van-field v-model="表单数据.姓名" name="姓名" label="姓名" placeholder="请输入姓名" :rules="[{ required: true, message: '请输入姓名' }]" class="表单项" />
        <van-field v-model="表单数据.手机号" name="手机号" label="手机号" type="tel" placeholder="请输入手机号" :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]" class="表单项" />
        <!-- 省市区街道选择（点击打开步骤弹窗） -->
        <van-field
          v-model="地区显示文本"
          name="省市区街"
          label="省市区街"
          placeholder="请选择省市区（街道可选）"
          readonly
          is-link
          :rules="[{ required: true, message: '请选择省市区' }]"
          @click="打开地区选择"
          class="表单项"
        />
        <van-field v-model="表单数据.详细地址" name="详细地址" label="详细地址" placeholder="请输入详细地址（街道、楼栋、门牌号）" :rules="[{ required: true, message: '请输入详细地址' }]" type="textarea" rows="2" autosize class="表单项" />
      </van-form>
    </div>
    <div class="底部按钮容器">
      <van-button type="primary" block round color="linear-gradient(135deg, #e54635, #ff6b35)" @click="提交表单">保存并使用</van-button>
    </div>

    <!-- 地区选择弹窗（步骤式四级联动） -->
    <van-popup v-model:show="显示地区弹窗" position="bottom" round :style="{ height: '60%' }">
      <div class="地区弹窗">
        <!-- 标题栏 -->
        <div class="弹窗标题栏">
          <span class="取消按钮" @click="显示地区弹窗 = false">取消</span>
          <span class="弹窗标题">选择省市区</span>
          <span class="确认按钮" @click="确认地区选择">确认</span>
        </div>

        <!-- 步骤指示器 -->
        <div class="步骤指示器">
          <span
            v-for="(步骤名, 索引) in 步骤列表"
            :key="索引"
            :class="['步骤项', { 活跃步骤: 当前步骤 === 索引, 已完成步骤: 当前步骤 > 索引 }]"
            @click="跳转步骤(索引)"
          >
            {{ 步骤名 }}
          </span>
        </div>

        <!-- 已选路径 -->
        <div class="已选路径" v-if="选中路径.length > 0">
          {{ 选中路径.join(' > ') }}
        </div>

        <!-- 地区列表 -->
        <div class="地区列表容器">
          <div v-if="列表加载中" class="加载提示">
            <van-loading type="spinner" color="#e54635" />
            <span>加载中...</span>
          </div>
          <div v-else-if="当前地区列表.length === 0" class="空数据提示">暂无数据</div>
          <div v-else class="地区网格">
            <div
              v-for="地区 in 当前地区列表"
              :key="地区.id"
              :class="['地区项', { 选中地区项: 已选地区ID[当前步骤] === 地区.id }]"
              @click="选择地区(地区)"
            >
              {{ 地区.name }}
            </div>
          </div>
        </div>

        <!-- 街道步骤提示（可跳过） -->
        <div v-if="当前步骤 === 3" class="街道跳过提示">
          街道为可选，可直接点「确认」跳过
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useOrderStore } from '../stores/order'
import { 查询地区API } from '../api/index'

const router = useRouter()
const 订单Store = useOrderStore()
const 表单引用 = ref(null)

// 表单数据
const 表单数据 = ref({
  姓名: 订单Store.姓名 || '',
  手机号: 订单Store.手机号 || '',
  详细地址: 订单Store.详细地址 || '',
})

// 选中的省市区街道
const 选中省份 = ref(订单Store.省份 || '')
const 选中城市 = ref(订单Store.城市 || '')
const 选中区县 = ref(订单Store.区县 || '')
const 选中街道 = ref(订单Store.街道 || '')

// 地区显示文本（含街道）
const 地区显示文本 = computed(() => {
  if (选中省份.value && 选中城市.value && 选中区县.value) {
    const 部分列表 = [选中省份.value, 选中城市.value, 选中区县.value]
    if (选中街道.value) 部分列表.push(选中街道.value)
    return 部分列表.join(' ')
  }
  return ''
})

// ===== 步骤式地区选择 =====
const 显示地区弹窗 = ref(false)
const 当前步骤 = ref(0) // 0省 1市 2区 3街道
const 步骤列表 = ['选省', '选市', '选区', '选街道']
const 列表加载中 = ref(false)
const 当前地区列表 = ref([])
// 各步骤选中的地区ID
const 已选地区ID = ref({})
// 各步骤选中的地区名称
const 已选地区名 = ref({})
// 选中路径（用于显示面包屑）
const 选中路径 = computed(() => {
  return Object.values(已选地区名.value)
})

// 加载某父级下的地区数据
const 加载地区列表 = async (parent_id) => {
  列表加载中.value = true
  当前地区列表.value = []
  try {
    const 结果 = await 查询地区API(parent_id)
    if (结果.code === 1) {
      当前地区列表.value = 结果.data
    } else {
      showToast('加载地区失败')
    }
  } catch (错误) {
    console.error('加载地区出错:', 错误)
    showToast('网络错误，请重试')
  } finally {
    列表加载中.value = false
  }
}

// 打开地区选择弹窗（重置到省级）
const 打开地区选择 = async () => {
  当前步骤.value = 0
  已选地区ID.value = {}
  已选地区名.value = {}
  显示地区弹窗.value = true
  // 加载省级数据（parent_id=0）
  await 加载地区列表(0)
}

// 选择某个地区
const 选择地区 = async (地区) => {
  // 记录当前步骤选择
  已选地区ID.value[当前步骤.value] = 地区.id
  已选地区名.value[当前步骤.value] = 地区.name
  // 清除后续步骤的选择
  for (let i = 当前步骤.value + 1; i <= 3; i++) {
    delete 已选地区ID.value[i]
    delete 已选地区名.value[i]
  }

  // 前三步（省市区）选完后自动进入下一步
  if (当前步骤.value < 3) {
    当前步骤.value++
    await 加载地区列表(地区.id)
  }
  // 街道步骤选择后不自动跳转（等用户点确认）
}

// 跳转到某一步骤（只能回退到已完成的步骤）
const 跳转步骤 = async (目标步骤) => {
  if (目标步骤 >= 当前步骤.value) return // 不能跳到未完成的步骤
  当前步骤.value = 目标步骤
  // 清除该步骤及之后的选择
  for (let i = 目标步骤; i <= 3; i++) {
    delete 已选地区ID.value[i]
    delete 已选地区名.value[i]
  }
  // 加载该步骤的父级数据
  const 父级ID = 目标步骤 === 0 ? 0 : 已选地区ID.value[目标步骤 - 1] || 0
  await 加载地区列表(父级ID)
}

// 确认地区选择
const 确认地区选择 = () => {
  // 至少需要选到区（步骤2）
  if (!已选地区名.value[0] || !已选地区名.value[1] || !已选地区名.value[2]) {
    showToast('请至少选择到区/县')
    return
  }
  选中省份.value = 已选地区名.value[0]
  选中城市.value = 已选地区名.value[1]
  选中区县.value = 已选地区名.value[2]
  选中街道.value = 已选地区名.value[3] || ''
  显示地区弹窗.value = false
}

const 返回上页 = () => router.back()

const 提交表单 = async () => {
  try { await 表单引用.value?.submit() } catch (e) {}
}

// 保存地址信息到Store
const 保存地址 = () => {
  if (!选中省份.value || !选中城市.value || !选中区县.value) {
    showToast('请选择省市区')
    return
  }
  订单Store.保存地址({
    姓名: 表单数据.value.姓名,
    手机号: 表单数据.value.手机号,
    省份: 选中省份.value,
    城市: 选中城市.value,
    区县: 选中区县.value,
    街道: 选中街道.value,
    详细地址: 表单数据.value.详细地址,
  })
  showToast('保存成功')
  router.back()
}
</script>

<style scoped>
.地址页面 { min-height: 100vh; background: #f5f5f5; padding-bottom: 80px; }
.表单卡片 { background: white; border-radius: 12px; margin: 12px 16px; overflow: hidden; }
.表单项 { padding: 14px 16px; }
.底部按钮容器 { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: white; box-shadow: 0 -2px 10px rgba(0,0,0,0.08); }

/* 地区弹窗样式 */
.地区弹窗 { display: flex; flex-direction: column; height: 100%; }
.弹窗标题栏 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.弹窗标题 { font-size: 16px; font-weight: 600; color: #333; }
.取消按钮 { font-size: 14px; color: #999; cursor: pointer; padding: 4px 8px; }
.确认按钮 { font-size: 14px; color: #e54635; font-weight: 600; cursor: pointer; padding: 4px 8px; }

/* 步骤指示器 */
.步骤指示器 {
  display: flex;
  padding: 10px 12px;
  gap: 8px;
  border-bottom: 1px solid #f5f5f5;
  flex-shrink: 0;
}
.步骤项 {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: #999;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
}
.活跃步骤 { background: #e54635; color: white; }
.已完成步骤 { background: #fff0ee; color: #e54635; }

/* 已选路径 */
.已选路径 {
  padding: 8px 16px;
  font-size: 12px;
  color: #888;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

/* 地区列表 */
.地区列表容器 { flex: 1; overflow-y: auto; padding: 8px 12px; }
.加载提示 { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 40px 0; color: #999; font-size: 14px; }
.空数据提示 { text-align: center; padding: 40px 0; color: #ccc; font-size: 14px; }
.地区网格 { display: flex; flex-wrap: wrap; gap: 8px; }
.地区项 {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.15s;
  border: 1.5px solid transparent;
}
.地区项:active { opacity: 0.7; }
.选中地区项 { background: #fff0ee; color: #e54635; border-color: #e54635; font-weight: 500; }

/* 街道跳过提示 */
.街道跳过提示 {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: #aaa;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
</style>
