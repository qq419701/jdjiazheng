<template>
  <div class="地址页面">
    <van-nav-bar title="填写取件地址 - 优米拉洗衣服务" left-arrow @click-left="返回上页" :border="false" />

    <div class="表单区域">
      <!-- 取件地址 -->
      <div class="区域标题蓝色">📦 取件地址</div>
      <div class="表单卡片">
        <van-form @submit="保存地址" ref="取件表单引用">
          <van-field v-model="取件表单.姓名" label="姓名" placeholder="请输入取件人姓名"
            :rules="[{ required: true, message: '请输入姓名' }]" class="表单项" />
          <van-field v-model="取件表单.手机号" label="手机号" type="tel" placeholder="请输入手机号"
            :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }]"
            class="表单项" />
          <van-field
            v-model="取件地区显示"
            label="省市区"
            placeholder="请选择省市区"
            readonly is-link
            :rules="[{ required: true, message: '请选择省市区' }]"
            @click="打开取件地区选择"
            class="表单项"
          />
          <van-field v-model="取件表单.详细地址" label="详细地址" type="textarea" rows="2" autosize
            placeholder="请输入详细地址" :rules="[{ required: true, message: '请输入详细地址' }]" class="表单项" />
        </van-form>
      </div>

      <!-- 收件地址 -->
      <div class="区域标题蓝色" style="margin-top: 12px">📬 收件地址</div>
      <div class="相同选择栏">
        <van-checkbox v-model="收件与取件相同" shape="square" icon-size="18px" checked-color="#1989fa">
          收件地址与取件地址相同
        </van-checkbox>
      </div>

      <div v-if="!收件与取件相同" class="表单卡片">
        <van-form ref="收件表单引用">
          <van-field v-model="收件表单.姓名" label="姓名" placeholder="请输入收件人姓名" class="表单项" />
          <van-field v-model="收件表单.手机号" label="手机号" type="tel" placeholder="请输入手机号" class="表单项" />
          <van-field
            v-model="收件地区显示"
            label="省市区"
            placeholder="请选择省市区"
            readonly is-link
            @click="打开收件地区选择"
            class="表单项"
          />
          <van-field v-model="收件表单.详细地址" label="详细地址" type="textarea" rows="2" autosize
            placeholder="请输入详细地址" class="表单项" />
        </van-form>
      </div>
    </div>

    <div class="底部按钮容器">
      <van-button type="primary" block round color="linear-gradient(135deg, #1989fa, #4fc3f7)" @click="提交表单">
        保存并继续
      </van-button>
    </div>

    <!-- 地区选择弹窗 -->
    <van-popup v-model:show="显示地区弹窗" position="bottom" round :style="{ height: '60%' }">
      <div class="地区弹窗">
        <div class="弹窗标题栏">
          <span class="取消按钮" @click="显示地区弹窗 = false">取消</span>
          <span class="弹窗标题">选择省市区</span>
          <span class="确认按钮" @click="确认地区选择">确认</span>
        </div>
        <div class="步骤指示器">
          <span v-for="(名, 索引) in ['选省','选市','选区','选街道']" :key="索引"
            :class="['步骤项', { '活跃步骤': 当前步骤 === 索引, '已完成步骤': 当前步骤 > 索引 }]"
            @click="跳转步骤(索引)">{{ 名 }}</span>
        </div>
        <div class="已选路径" v-if="Object.keys(已选地区名).length > 0">
          {{ Object.values(已选地区名).join(' > ') }}
        </div>
        <div class="地区列表容器">
          <div v-if="列表加载中" class="加载提示">
            <van-loading type="spinner" color="#1989fa" /><span>加载中...</span>
          </div>
          <div v-else-if="当前地区列表.length === 0" class="空数据提示">暂无数据</div>
          <div v-else class="地区网格">
            <div v-for="地区 in 当前地区列表" :key="地区.id"
              :class="['地区项', { '选中地区项': 已选地区ID[当前步骤] === 地区.id }]"
              @click="选择地区(地区)">{{ 地区.name }}</div>
          </div>
        </div>
        <div v-if="当前步骤 === 3" class="街道跳过提示">街道为可选，可直接点「确认」跳过</div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLaundryOrderStore } from '../stores/laundryOrder'
import { 查询地区API } from '../api/index'

const router = useRouter()
const 洗衣Store = useLaundryOrderStore()
const 取件表单引用 = ref(null)

// 收件与取件相同（默认true）
const 收件与取件相同 = ref(洗衣Store.收件与取件相同 ?? true)

// 取件表单
const 取件表单 = ref({
  姓名: 洗衣Store.取件姓名 || '',
  手机号: 洗衣Store.取件手机 || '',
  详细地址: 洗衣Store.取件详细地址 || '',
})
const 取件省份 = ref(洗衣Store.取件省份 || '')
const 取件城市 = ref(洗衣Store.取件城市 || '')
const 取件区县 = ref(洗衣Store.取件区县 || '')
const 取件街道 = ref(洗衣Store.取件街道 || '')

const 取件地区显示 = computed(() => {
  if (取件省份.value && 取件城市.value && 取件区县.value) {
    return [取件省份.value, 取件城市.value, 取件区县.value, 取件街道.value].filter(Boolean).join(' ')
  }
  return ''
})

// 收件表单
const 收件表单 = ref({
  姓名: 洗衣Store.收件姓名 || '',
  手机号: 洗衣Store.收件手机 || '',
  详细地址: 洗衣Store.收件详细地址 || '',
})
const 收件省份 = ref(洗衣Store.收件省份 || '')
const 收件城市 = ref(洗衣Store.收件城市 || '')
const 收件区县 = ref(洗衣Store.收件区县 || '')
const 收件街道 = ref(洗衣Store.收件街道 || '')

const 收件地区显示 = computed(() => {
  if (收件省份.value && 收件城市.value && 收件区县.value) {
    return [收件省份.value, 收件城市.value, 收件区县.value, 收件街道.value].filter(Boolean).join(' ')
  }
  return ''
})

// ===== 地区选择弹窗 =====
const 显示地区弹窗 = ref(false)
const 当前选择类型 = ref('取件') // '取件' 或 '收件'
const 当前步骤 = ref(0)
const 列表加载中 = ref(false)
const 当前地区列表 = ref([])
const 已选地区ID = ref({})
const 已选地区名 = ref({})

const 加载地区列表 = async (parent_id) => {
  列表加载中.value = true
  当前地区列表.value = []
  try {
    const 结果 = await 查询地区API(parent_id)
    if (结果.code === 1) 当前地区列表.value = 结果.data
  } catch {
    showToast('加载地区失败')
  } finally {
    列表加载中.value = false
  }
}

const 打开取件地区选择 = async () => {
  当前选择类型.value = '取件'
  当前步骤.value = 0
  已选地区ID.value = {}
  已选地区名.value = {}
  显示地区弹窗.value = true
  await 加载地区列表(0)
}

const 打开收件地区选择 = async () => {
  当前选择类型.value = '收件'
  当前步骤.value = 0
  已选地区ID.value = {}
  已选地区名.value = {}
  显示地区弹窗.value = true
  await 加载地区列表(0)
}

const 选择地区 = async (地区) => {
  已选地区ID.value[当前步骤.value] = 地区.id
  已选地区名.value[当前步骤.value] = 地区.name
  for (let i = 当前步骤.value + 1; i <= 3; i++) {
    delete 已选地区ID.value[i]
    delete 已选地区名.value[i]
  }
  if (当前步骤.value < 3) {
    当前步骤.value++
    await 加载地区列表(地区.id)
  }
}

const 跳转步骤 = async (目标步骤) => {
  if (目标步骤 >= 当前步骤.value) return
  当前步骤.value = 目标步骤
  for (let i = 目标步骤; i <= 3; i++) {
    delete 已选地区ID.value[i]
    delete 已选地区名.value[i]
  }
  const 父级ID = 目标步骤 === 0 ? 0 : 已选地区ID.value[目标步骤 - 1] || 0
  await 加载地区列表(父级ID)
}

const 确认地区选择 = () => {
  if (!已选地区名.value[0] || !已选地区名.value[1] || !已选地区名.value[2]) {
    showToast('请至少选择到区/县')
    return
  }
  if (当前选择类型.value === '取件') {
    取件省份.value = 已选地区名.value[0]
    取件城市.value = 已选地区名.value[1]
    取件区县.value = 已选地区名.value[2]
    取件街道.value = 已选地区名.value[3] || ''
  } else {
    收件省份.value = 已选地区名.value[0]
    收件城市.value = 已选地区名.value[1]
    收件区县.value = 已选地区名.value[2]
    收件街道.value = 已选地区名.value[3] || ''
  }
  显示地区弹窗.value = false
}

const 返回上页 = () => router.back()

const 提交表单 = async () => {
  try { await 取件表单引用.value?.submit() } catch {}
}

const 保存地址 = () => {
  if (!取件省份.value || !取件城市.value || !取件区县.value) {
    showToast('请选择取件省市区')
    return
  }
  if (!收件与取件相同.value) {
    if (!收件省份.value || !收件城市.value || !收件区县.value || !收件表单.value.详细地址) {
      showToast('请填写完整收件地址')
      return
    }
  }
  洗衣Store.保存取件地址({
    姓名: 取件表单.value.姓名,
    手机号: 取件表单.value.手机号,
    省份: 取件省份.value,
    城市: 取件城市.value,
    区县: 取件区县.value,
    街道: 取件街道.value,
    详细地址: 取件表单.value.详细地址,
  })
  洗衣Store.收件与取件相同 = 收件与取件相同.value
  if (!收件与取件相同.value) {
    洗衣Store.保存收件地址({
      姓名: 收件表单.value.姓名 || 取件表单.value.姓名,
      手机号: 收件表单.value.手机号 || 取件表单.value.手机号,
      省份: 收件省份.value,
      城市: 收件城市.value,
      区县: 收件区县.value,
      街道: 收件街道.value,
      详细地址: 收件表单.value.详细地址,
    })
  }
  showToast('保存成功')
  router.back()
}
</script>

<style scoped>
.地址页面 { min-height: 100vh; background: #f5f5f5; padding-bottom: 80px; }
.表单区域 { padding: 12px 16px; }
.区域标题蓝色 { font-size: 14px; font-weight: 600; color: #1989fa; margin-bottom: 8px; padding-left: 4px; }
.表单卡片 { background: white; border-radius: 12px; overflow: hidden; }
.表单项 { padding: 14px 16px; }
.相同选择栏 { background: white; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; }
.底部按钮容器 { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: white; box-shadow: 0 -2px 10px rgba(0,0,0,0.08); }

/* 地区弹窗 */
.地区弹窗 { display: flex; flex-direction: column; height: 100%; }
.弹窗标题栏 { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.弹窗标题 { font-size: 16px; font-weight: 600; color: #333; }
.取消按钮 { font-size: 14px; color: #999; cursor: pointer; padding: 4px 8px; }
.确认按钮 { font-size: 14px; color: #1989fa; font-weight: 600; cursor: pointer; padding: 4px 8px; }
.步骤指示器 { display: flex; padding: 10px 12px; gap: 8px; border-bottom: 1px solid #f5f5f5; flex-shrink: 0; }
.步骤项 { padding: 4px 12px; border-radius: 20px; font-size: 13px; color: #999; background: #f5f5f5; cursor: pointer; }
.活跃步骤 { background: #1989fa; color: white; }
.已完成步骤 { background: #e8f4fd; color: #1989fa; }
.已选路径 { padding: 8px 16px; font-size: 12px; color: #888; background: #fafafa; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.地区列表容器 { flex: 1; overflow-y: auto; padding: 8px 12px; }
.加载提示 { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 40px 0; color: #999; font-size: 14px; }
.空数据提示 { text-align: center; padding: 40px 0; color: #ccc; font-size: 14px; }
.地区网格 { display: flex; flex-wrap: wrap; gap: 8px; }
.地区项 { padding: 8px 14px; border-radius: 6px; font-size: 14px; color: #333; background: #f5f5f5; cursor: pointer; border: 1.5px solid transparent; }
.选中地区项 { background: #e8f4fd; color: #1989fa; border-color: #1989fa; font-weight: 500; }
.街道跳过提示 { padding: 8px 16px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #f0f0f0; flex-shrink: 0; }
</style>
