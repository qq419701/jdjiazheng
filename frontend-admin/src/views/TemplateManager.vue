<template>
  <!-- 套餐管理页面 -->
  <div class="套餐管理容器">
    <div class="页面标题">
      <h2>📦 套餐管理</h2>
      <p class="副标题">管理各业务的卡密套餐，SUP编号自动分配，运营人员直接使用</p>
    </div>

    <el-tabs v-model="当前业务类型" type="border-card" @tab-change="切换业务类型">
      <el-tab-pane v-if="moduleStore.家政"  label="🏠 家政套餐"  name="jiazheng" />
      <el-tab-pane v-if="moduleStore.洗衣"  label="🧺 洗衣套餐"  name="xiyifu" />
      <el-tab-pane v-if="moduleStore.充值"  label="💳 充值套餐"  name="topup" />
      <el-tab-pane v-if="moduleStore.三角洲" label="⚔️ 三角洲套餐" name="sjz" />
    </el-tabs>

    <!-- 操作栏 -->
    <div class="操作栏">
      <el-button type="primary" @click="打开新建弹窗">+ 新建套餐</el-button>
    </div>

    <!-- 套餐列表 -->
    <el-table :data="套餐列表" v-loading="加载中" border stripe>
      <el-table-column prop="product_no" label="SUP编号" width="100" />
      <el-table-column prop="product_name" label="套餐名称" min-width="160" />
      <el-table-column label="业务规格" min-width="180">
        <template #default="{ row }">
          <span v-if="当前业务类型 === 'jiazheng'">
            {{ row.service_type || '-' }}
            <el-tag v-if="row.service_hours > 0" size="small" type="info" style="margin-left:4px">{{ row.service_hours }}小时</el-tag>
            <el-tag v-else size="small" type="success" style="margin-left:4px">不限时</el-tag>
          </span>
          <span v-else-if="当前业务类型 === 'xiyifu'">{{ row.service_type || '-' }}</span>
          <span v-else-if="当前业务类型 === 'topup'">
            {{ row.topup_member_name || '-' }}
            <el-tag v-if="row.topup_account_type" size="small" style="margin-left:4px">{{ 账号类型标签(row.topup_account_type) }}</el-tag>
          </span>
          <span v-else-if="当前业务类型 === 'sjz'">
            <el-tag v-if="row.sjz_hafubi_amount" type="warning" size="small">{{ row.sjz_hafubi_amount }}</el-tag>
            <span v-else style="color:#bbb">-</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="cost_price" label="成本价" width="90">
        <template #default="{ row }">¥{{ row.cost_price || 0 }}</template>
      </el-table-column>
      <el-table-column label="库存（未使用）" width="120">
        <template #default="{ row }">
          <el-tag :type="库存样式(row.stock_unused)">{{ row.stock_unused ?? '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 1"
            @change="(v) => 切换状态(row, v)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="打开编辑弹窗(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="删除套餐(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="弹窗可见"
      :title="当前编辑ID ? '编辑套餐' : '新建套餐'"
      width="680px"
      :body-style="{ overflowY: 'auto', maxHeight: '80vh' }"
      @closed="重置表单"
    >
      <el-form ref="表单引用" :model="表单数据" :rules="动态表单规则" label-width="140px">
        <!-- 套餐名称 - 所有业务类型通用 -->
        <el-form-item label="套餐名称" prop="product_name">
          <el-input v-model="表单数据.product_name" placeholder="如：日常保洁2小时家政卡" style="width:280px" />
          <div class="字段提示块">💡 此名称用于内部管理和SUP商品名称，不显示在前端H5</div>
        </el-form-item>

        <!-- ===== 家政专用字段 ===== -->
        <template v-if="当前业务类型 === 'jiazheng'">
          <el-form-item label="服务分类" prop="service_type">
            <el-input v-model="表单数据.service_type" placeholder="如：日常保洁" style="width:280px" />
            <div class="字段提示块">💡 对应前端H5预约页显示的服务分类，如：日常保洁、深度清洁、专项保洁</div>
            <div class="快捷选择行">
              <span class="快捷标签">快捷选择：</span>
              <el-button
                v-for="项 in 家政服务分类快捷"
                :key="项"
                size="small"
                plain
                @click="表单数据.service_type = 项"
              >{{ 项 }}</el-button>
            </div>
          </el-form-item>
          <el-form-item label="服务时长(小时)">
            <el-input-number v-model="表单数据.service_hours" :min="0" :max="24" />
            <div class="字段提示块">💡 生成的卡密会携带此时长信息，影响前端H5预约页显示的服务时长（0=不限时长）</div>
          </el-form-item>
        </template>

        <!-- ===== 洗衣专用字段 ===== -->
        <template v-if="当前业务类型 === 'xiyifu'">
          <el-form-item label="服务类型" prop="service_type">
            <el-input v-model="表单数据.service_type" placeholder="如：任洗一件" style="width:280px" />
            <div class="字段提示块">💡 对应前端H5洗衣页显示的服务名称</div>
            <div class="快捷选择行">
              <span class="快捷标签">快捷选择：</span>
              <el-button
                v-for="项 in 洗衣服务类型快捷"
                :key="项"
                size="small"
                plain
                @click="表单数据.service_type = 项"
              >{{ 项 }}</el-button>
            </div>
          </el-form-item>
          <el-form-item label="到账时间">
            <el-input v-model="表单数据.topup_arrival_time" placeholder="如：1-6小时" style="width:200px" />
            <div class="字段提示块">💡 洗衣服务预计到账时间（可选，填写后显示在前端洗衣H5）</div>
            <div class="快捷选择行">
              <span class="快捷标签">快捷选择：</span>
              <el-button
                v-for="项 in 到账时间快捷"
                :key="项"
                size="small"
                plain
                @click="表单数据.topup_arrival_time = 项"
              >{{ 项 }}</el-button>
            </div>
          </el-form-item>
        </template>

        <!-- ===== 充值专用字段 ===== -->
        <template v-if="当前业务类型 === 'topup'">
          <el-form-item label="充值会员名称" prop="topup_member_name">
            <el-input v-model="表单数据.topup_member_name" placeholder="如：优酷年卡" style="width:280px" />
            <div class="字段提示块">💡 显示在充值H5前端顶部Banner的会员名称，如：优酷年卡、爱奇艺季卡</div>
          </el-form-item>
          <el-form-item label="账号类型">
            <el-select v-model="表单数据.topup_account_type" placeholder="请选择" style="width:180px" @change="自动填充标签">
              <el-option label="手机号" value="phone" />
              <el-option label="微信号" value="wechat" />
              <el-option label="QQ号" value="qq" />
              <el-option label="邮箱" value="email" />
              <el-option label="其他" value="other" />
            </el-select>
            <div class="字段提示块">💡 前端H5充值页会根据此类型对输入账号进行格式校验</div>
          </el-form-item>
          <el-form-item label="账号输入标签">
            <el-input v-model="表单数据.topup_account_label" placeholder="如：请输入手机号" style="width:220px" />
            <el-button size="small" style="margin-left:8px" @click="自动填充标签(表单数据.topup_account_type)">智能填充</el-button>
            <div class="字段提示块">💡 显示在充值H5前端输入框上方的提示文字</div>
          </el-form-item>
          <el-form-item label="预计到账时间">
            <el-input v-model="表单数据.topup_arrival_time" placeholder="如：1-6小时" style="width:200px" />
            <div class="快捷选择行">
              <el-button
                v-for="项 in 充值到账时间快捷"
                :key="项"
                size="small"
                plain
                @click="表单数据.topup_arrival_time = 项"
              >{{ 项 }}</el-button>
            </div>
            <div class="字段提示块">💡 显示在充值H5前端，告知用户预计充值到账时间</div>
          </el-form-item>
          <el-form-item label="显示到期选项">
            <el-switch v-model="表单数据.topup_show_expired" :active-value="1" :inactive-value="0" />
            <div class="字段提示块">💡 开启后，充值H5会显示"会员是否到期"的是/否单选（某些充值不需要此选项）</div>
          </el-form-item>

          <el-divider content-position="left">
            <span style="font-size:12px; color:#999">高级：自定义验证（可选）</span>
          </el-divider>

          <el-form-item label="自定义验证正则">
            <el-input v-model="表单数据.topup_account_regex" placeholder="留空则使用全局验证规则" style="width:300px" />
            <div class="字段提示块">💡 仅在账号类型为"其他"或需要覆盖默认验证时填写，如：^[a-zA-Z0-9]{6,20}$</div>
          </el-form-item>
          <el-form-item label="验证失败提示语">
            <el-input v-model="表单数据.topup_account_error_msg" placeholder="如：请输入正确的游戏账号（6-20位字母数字）" style="width:300px" />
            <div class="字段提示块">💡 账号格式不符合时，前端H5显示的错误提示文字</div>
          </el-form-item>
          <el-form-item label="充值步骤说明">
            <el-input
              v-model="表单数据.topup_steps"
              type="textarea"
              :rows="2"
              placeholder="如：①填写充值账号 ②接听人工客服电话 ③充值成功"
              style="width:300px"
            />
            <el-button size="small" style="margin-left:8px; vertical-align: top" @click="步骤选择弹窗 = true">快捷填充步骤</el-button>
            <div class="字段提示块">💡 显示在充值H5前端的操作步骤引导</div>
          </el-form-item>
          <el-form-item label="会员图标URL">
            <el-input v-model="表单数据.topup_member_icon" placeholder="可选，显示在顶部Banner旁" style="width:300px" />
            <div class="字段提示块">💡 充值H5顶部Banner区域显示的图标图片，建议64x64 PNG</div>
          </el-form-item>
        </template>

        <!-- ===== 三角洲专用字段 ===== -->
        <template v-if="当前业务类型 === 'sjz'">
          <el-form-item label="哈夫币数量">
            <el-input v-model="表单数据.sjz_hafubi_amount" placeholder="如：1000万、3亿、500" style="width:200px" />
            <div class="快捷选择行">
              <span class="快捷标签">快捷选择：</span>
              <el-button v-for="项 in 哈夫币数量快捷" :key="项" size="small" plain @click="表单数据.sjz_hafubi_amount = 项">{{ 项 }}</el-button>
            </div>
            <div class="字段提示块">💡 直接填写展示文字，如"1000万"、"3亿"，显示在H5下单页</div>
          </el-form-item>
          <el-form-item label="要求游戏昵称">
            <el-switch v-model="表单数据.sjz_show_nickname" :active-value="1" :inactive-value="0" />
            <div class="字段提示块">💡 开启后，H5下单页显示游戏昵称输入框</div>
          </el-form-item>
          <el-form-item label="要求保险格数">
            <el-switch v-model="表单数据.sjz_show_insurance" :active-value="1" :inactive-value="0" />
            <div class="字段提示块">💡 开启后，H5下单页显示保险格数选择</div>
          </el-form-item>
          <el-form-item v-if="表单数据.sjz_show_insurance" label="保险格数选项">
            <el-input v-model="表单数据.sjz_insurance_options" placeholder="如：2,4,6,9" style="width:200px" />
            <div class="快捷选择行">
              <span class="快捷标签">快捷选择：</span>
              <el-button v-for="项 in 保险格数选项快捷" :key="项" size="small" plain @click="表单数据.sjz_insurance_options = 项">{{ 项 }}</el-button>
            </div>
            <div class="字段提示块">💡 用英文逗号分隔的数字，表示显示哪几格选项</div>
          </el-form-item>
          <el-form-item label="要求成年认证">
            <el-switch v-model="表单数据.sjz_show_is_adult" :active-value="1" :inactive-value="0" />
            <div class="字段提示块">💡 开启后，H5下单页显示是否成年选择</div>
          </el-form-item>
          <el-form-item v-if="表单数据.sjz_show_is_adult" label="成年认证选项">
            <el-input v-model="表单数据.sjz_adult_options" placeholder="如：已成年,未成年" style="width:200px" />
            <div class="字段提示块">💡 用英文逗号分隔，如"已成年,未成年"</div>
          </el-form-item>
          <el-form-item label="要求仓库截图">
            <el-switch v-model="表单数据.sjz_show_warehouse" :active-value="1" :inactive-value="0" />
            <div class="字段提示块">💡 开启后，H5下单页显示仓库截图上传（最多3张）</div>
          </el-form-item>
          <el-form-item label="必填手机号">
            <el-switch v-model="表单数据.sjz_require_phone" :active-value="1" :inactive-value="0" />
            <div class="字段提示块">💡 关闭后，手机号变为非必填（排在表单最后）</div>
          </el-form-item>
          <el-form-item label="要求上号方式">
            <el-switch v-model="表单数据.sjz_show_login_method" :active-value="1" :inactive-value="0" />
            <div class="字段提示块">💡 开启后，H5下单页显示上号方式选择</div>
          </el-form-item>
          <el-form-item v-if="表单数据.sjz_show_login_method" label="上号方式选项">
            <el-input v-model="表单数据.sjz_login_method_options" placeholder="如：扫码,账密" style="width:200px" />
            <div class="快捷选择行">
              <span class="快捷标签">快捷选择：</span>
              <el-button v-for="项 in 上号方式快捷" :key="项" size="small" plain @click="表单数据.sjz_login_method_options = 项">{{ 项 }}</el-button>
            </div>
            <div class="字段提示块">💡 用英文逗号分隔，如"扫码,账密"</div>
          </el-form-item>
        </template>

        <!-- 通用字段 -->
        <el-form-item label="成本价（元）">
          <el-input-number v-model="表单数据.cost_price" :min="0" :precision="2" :step="1" />
          <div class="字段提示块">⚠️ 使用SUP系统必须设置成本价（不能为0），否则奇所平台验收不通过。建议按实际采购成本填写，如无特殊要求可填1。</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="表单数据.remark" type="textarea" :rows="2" placeholder="内部备注（可选）" style="width:300px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="表单数据.status" :active-value="1" :inactive-value="0" />
          <span class="字段提示">{{ 表单数据.status === 1 ? '启用' : '禁用' }}</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="弹窗可见 = false">取消</el-button>
        <el-button type="primary" :loading="提交中" @click="提交表单">
          {{ 当前编辑ID ? '保存修改' : '确认新建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 步骤快捷填充弹窗 -->
    <el-dialog v-model="步骤选择弹窗" title="快捷填充步骤" width="500px">
      <div style="display:flex; flex-direction:column; gap:10px">
        <el-button
          v-for="步骤 in 步骤快捷选项"
          :key="步骤"
          plain
          style="text-align:left; height:auto; white-space:normal; padding:10px 16px"
          @click="快捷填充步骤(步骤)"
        >{{ 步骤 }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取套餐列表API, 新增套餐API, 更新套餐API, 删除套餐API } from '../api/index'
import { useModuleStore } from '../stores/module'

const moduleStore = useModuleStore()

// ===== 状态 =====
const 当前业务类型 = ref('jiazheng')
const 套餐列表 = ref([])
const 加载中 = ref(false)
const 弹窗可见 = ref(false)
const 当前编辑ID = ref(null)
const 提交中 = ref(false)
const 表单引用 = ref(null)

const 步骤快捷选项 = [
  '①填写充值账号 ②接听人工客服电话 ③充值成功',
  '①填写账号 ②等待客服联系 ③48小时内充值',
  '①填写账号 ②在线充值 ③即时到账',
]
const 步骤选择弹窗 = ref(false)

const 家政服务分类快捷 = ['日常保洁', '深度清洁', '专项保洁', '开荒保洁', '玻璃清洁']
const 洗衣服务类型快捷 = ['任洗一件', '任洗两件', '任洗三件', '床品套件', '大件清洗']
const 到账时间快捷 = ['当天', '1-3天', '3-5天', '5-7天']
const 充值到账时间快捷 = ['1小时内', '1-6小时', '24小时内', '即时到账']
const 哈夫币数量快捷 = ['500万', '1000万', '3000万', '1亿', '3亿']
const 保险格数选项快捷 = ['0,1,2,3,4,5,6', '2,4,6,9', '0,3,6']
const 上号方式快捷 = ['扫码', '扫码,账密', '扫码,账密,其他']

const 表单数据 = reactive({
  product_name: '',
  service_type: '',
  service_hours: 0,
  cost_price: 1,
  status: 1,
  remark: '',
  topup_account_type: '',
  topup_account_label: '',
  topup_member_name: '',
  topup_member_icon: '',
  topup_arrival_time: '',
  topup_show_expired: 0,
  topup_steps: '',
  topup_account_regex: '',
  topup_account_error_msg: '',
  // 三角洲套餐字段
  sjz_hafubi_amount: '',
  sjz_show_nickname: 1,
  sjz_show_insurance: 1,
  sjz_insurance_options: '0,1,2,3,4,5,6',
  sjz_show_is_adult: 0,
  sjz_adult_options: '已成年,未成年',
  sjz_show_warehouse: 0,
  sjz_require_phone: 1,
  sjz_show_login_method: 0,
  sjz_login_method_options: '扫码',
})

// 表单验证规则（根据业务类型动态计算）
const 动态表单规则 = computed(() => {
  const 规则 = {
    product_name: [{ required: true, message: '请填写套餐名称', trigger: 'blur' }],
  }
  if (当前业务类型.value === 'jiazheng') {
    规则.service_type = [{ required: true, message: '请填写服务分类', trigger: 'blur' }]
  } else if (当前业务类型.value === 'xiyifu') {
    规则.service_type = [{ required: true, message: '请填写服务类型', trigger: 'blur' }]
  } else if (当前业务类型.value === 'topup') {
    规则.topup_member_name = [{ required: true, message: '请填写充值会员名称', trigger: 'blur' }]
  }
  return 规则
})

// ===== 数据加载 =====
const 加载套餐列表 = async () => {
  加载中.value = true
  try {
    const 响应 = await 获取套餐列表API({ business_type: 当前业务类型.value })
    套餐列表.value = 响应?.data || []
  } catch {
    ElMessage.error('加载套餐列表失败')
  } finally {
    加载中.value = false
  }
}

const 切换业务类型 = () => {
  表单引用.value?.clearValidate()
  加载套餐列表()
}

// ===== 工具函数 =====
const 账号类型标签 = (type) => {
  const map = { phone: '手机号', wechat: '微信号', qq: 'QQ号', email: '邮箱', other: '其他' }
  return map[type] || type
}

const 库存样式 = (stock) => {
  if (stock === undefined || stock === null) return 'info'
  if (stock === 0) return 'danger'
  if (stock < 10) return 'warning'
  return 'success'
}

// 选择账号类型时自动填充标签
const 自动填充标签 = (type) => {
  const map = { phone: '请输入手机号', wechat: '请输入微信号', qq: '请输入QQ号', email: '请输入邮箱地址', other: '请输入账号' }
  表单数据.topup_account_label = map[type] || ''
}

const 快捷填充步骤 = (步骤) => {
  表单数据.topup_steps = 步骤
  步骤选择弹窗.value = false
}

// ===== 弹窗操作 =====
const 打开新建弹窗 = () => {
  当前编辑ID.value = null
  重置表单()
  弹窗可见.value = true
}

const 打开编辑弹窗 = (行) => {
  当前编辑ID.value = 行.id
  Object.assign(表单数据, {
    product_name: 行.product_name || '',
    service_type: 行.service_type || '',
    service_hours: 行.service_hours || 0,
    cost_price: 行.cost_price || 0,
    status: 行.status ?? 1,
    remark: 行.remark || '',
    topup_account_type: 行.topup_account_type || '',
    topup_account_label: 行.topup_account_label || '',
    topup_member_name: 行.topup_member_name || '',
    topup_member_icon: 行.topup_member_icon || '',
    topup_arrival_time: 行.topup_arrival_time || '',
    topup_show_expired: 行.topup_show_expired || 0,
    topup_steps: 行.topup_steps || '',
    topup_account_regex: 行.topup_account_regex || '',
    topup_account_error_msg: 行.topup_account_error_msg || '',
    // 三角洲套餐字段
    sjz_hafubi_amount: 行.sjz_hafubi_amount || '',
    sjz_show_nickname: 行.sjz_show_nickname != null ? 行.sjz_show_nickname : 1,
    sjz_show_insurance: 行.sjz_show_insurance != null ? 行.sjz_show_insurance : 1,
    sjz_insurance_options: 行.sjz_insurance_options || '0,1,2,3,4,5,6',
    sjz_show_is_adult: 行.sjz_show_is_adult != null ? 行.sjz_show_is_adult : 0,
    sjz_adult_options: 行.sjz_adult_options || '已成年,未成年',
    sjz_show_warehouse: 行.sjz_show_warehouse != null ? 行.sjz_show_warehouse : 0,
    sjz_require_phone: 行.sjz_require_phone != null ? 行.sjz_require_phone : 1,
    sjz_show_login_method: 行.sjz_show_login_method != null ? 行.sjz_show_login_method : 0,
    sjz_login_method_options: 行.sjz_login_method_options || '扫码',
  })
  弹窗可见.value = true
}

const 重置表单 = () => {
  Object.assign(表单数据, {
    product_name: '', service_type: '', service_hours: 0,
    cost_price: 1, status: 1, remark: '',
    topup_account_type: '', topup_account_label: '', topup_member_name: '',
    topup_member_icon: '', topup_arrival_time: '', topup_show_expired: 0,
    topup_steps: '', topup_account_regex: '', topup_account_error_msg: '',
    // 三角洲字段默认值
    sjz_hafubi_amount: '', sjz_show_nickname: 1, sjz_show_insurance: 1,
    sjz_insurance_options: '0,1,2,3,4,5,6',
    sjz_show_is_adult: 0, sjz_adult_options: '已成年,未成年',
    sjz_show_warehouse: 0, sjz_require_phone: 1,
    sjz_show_login_method: 0, sjz_login_method_options: '扫码',
  })
  表单引用.value?.clearValidate()
}

const 提交表单 = async () => {
  // 手动校验必填字段
  if (!表单数据.product_name?.trim()) {
    ElMessage.warning('请填写套餐名称')
    return
  }
  if ((当前业务类型.value === 'jiazheng' || 当前业务类型.value === 'xiyifu') && !表单数据.service_type?.trim()) {
    ElMessage.warning('请填写服务分类')
    return
  }
  if (当前业务类型.value === 'topup' && !表单数据.topup_member_name?.trim()) {
    ElMessage.warning('请填写充值会员名称')
    return
  }
  提交中.value = true
  try {
    const 数据 = { ...表单数据, business_type: 当前业务类型.value }
    let 响应
    if (当前编辑ID.value) {
      响应 = await 更新套餐API(当前编辑ID.value, 数据)
    } else {
      响应 = await 新增套餐API(数据)
    }
    const 结果 = 响应
    if (结果?.code === 1) {
      ElMessage.success(结果.message || (当前编辑ID.value ? '套餐更新成功' : '套餐新建成功'))
      弹窗可见.value = false
      加载套餐列表()
    } else {
      ElMessage.warning(结果?.message || '操作失败')
    }
  } catch {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    提交中.value = false
  }
}

// ===== 状态切换 =====
const 切换状态 = async (行, 启用) => {
  try {
    await 更新套餐API(行.id, { status: 启用 ? 1 : 0 })
    行.status = 启用 ? 1 : 0
    ElMessage.success(启用 ? '套餐已启用' : '套餐已禁用')
  } catch {
    ElMessage.error('状态切换失败')
  }
}

// ===== 删除 =====
const 删除套餐 = async (行) => {
  await ElMessageBox.confirm(
    `确定要删除套餐「${行.product_name}」吗？\n注意：如有未使用卡密将无法删除。`,
    '确认删除',
    { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
  )
  try {
    const 响应 = await 删除套餐API(行.id)
    if (响应?.code === 1) {
      ElMessage.success('套餐已删除')
      加载套餐列表()
    } else {
      ElMessage.warning(响应?.message || '删除失败')
    }
  } catch {
    ElMessage.error('删除失败，请稍后重试')
  }
}

// 业务开关加载完成后，确保默认选中的业务类型是已开启的
watch(() => moduleStore.已加载, (loaded) => {
  if (!loaded) return
  const 已开启业务类型 = moduleStore.已开启业务列表.map(b => b.type)
  if (!已开启业务类型.includes(当前业务类型.value)) {
    当前业务类型.value = 已开启业务类型[0] || 'jiazheng'
    加载套餐列表()
  }
}, { immediate: true })

onMounted(() => {
  加载套餐列表()
})
</script>

<style scoped>
.套餐管理容器 {
  padding: 0;
}

.页面标题 {
  margin-bottom: 20px;
}

.页面标题 h2 {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 6px 0;
}

.副标题 {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.操作栏 {
  margin: 16px 0;
  display: flex;
  justify-content: flex-end;
}

.字段提示 {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.字段提示块 {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.快捷选择行 {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.快捷标签 {
  font-size: 12px;
  color: #909399;
}
</style>
