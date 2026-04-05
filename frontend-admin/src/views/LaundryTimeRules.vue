<template>
  <!-- 洗衣时间规则管理 -->
  <div class="时间规则页面">
    <el-card class="操作栏">
      <el-row justify="space-between" align="middle">
        <span style="font-size: 14px; color: #666">
          洗衣时间段格式：<strong>09:00-10:00</strong>（含开始和结束时间）
        </span>
        <el-button type="primary" @click="新增规则">+ 新增时间规则</el-button>
      </el-row>
    </el-card>

    <el-card>
      <el-table :data="规则列表" v-loading="加载中" stripe>
        <el-table-column prop="sort_order" label="优先级" width="70" />
        <el-table-column label="规则类型" width="100">
          <template #default="{ row }">
            <el-tag :type="{ city: 'primary', tier: 'warning', global: 'info' }[row.rule_type]" size="small">
              {{ { city: '城市精确', tier: '地区等级', global: '全局默认' }[row.rule_type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rule_name" label="规则名称" width="150" />
        <el-table-column prop="match_value" label="匹配城市" show-overflow-tooltip />
        <el-table-column label="时间段" show-overflow-tooltip>
          <template #default="{ row }">
            {{ 解析时间段显示(row.time_slots) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button size="small" @click="编辑规则(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="删除规则(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="显示弹窗" :title="当前编辑ID ? '编辑洗衣时间规则' : '新增洗衣时间规则'" width="580px">
      <el-form :model="规则表单" label-width="100px">
        <el-form-item label="规则类型">
          <el-radio-group v-model="规则表单.rule_type">
            <el-radio-button value="city">城市精确匹配</el-radio-button>
            <el-radio-button value="global">全局默认</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="规则名称">
          <el-input v-model="规则表单.rule_name" placeholder="如：全国洗衣时间规则" />
        </el-form-item>
        <el-form-item label="匹配城市" v-if="规则表单.rule_type !== 'global'">
          <el-input v-model="规则表单.match_value" placeholder="多城市用逗号分隔，如：北京,上海" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="时间段">
          <div class="时间段编辑区">
            <div v-for="(时间段, 索引) in 规则表单.时间段列表" :key="索引" class="时间段行">
              <el-input v-model="规则表单.时间段列表[索引]" placeholder="如：09:00-10:00" style="width: 160px" />
              <el-button type="danger" link @click="删除时间段(索引)">删除</el-button>
            </div>
            <el-button type="primary" link @click="添加时间段">+ 添加时间段</el-button>
          </div>
          <div class="字段说明">格式：09:00-10:00（开始时间-结束时间）</div>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="规则表单.sort_order" :min="1" :max="99" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">数值越小优先级越高</span>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="规则表单.is_active" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示弹窗 = false">取消</el-button>
        <el-button type="primary" @click="保存规则">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取洗衣时间规则API, 新增洗衣时间规则API, 更新洗衣时间规则API, 删除洗衣时间规则API } from '../api/index'

const 加载中 = ref(false)
const 规则列表 = ref([])
const 显示弹窗 = ref(false)
const 当前编辑ID = ref(null)

const 默认表单 = () => ({
  rule_type: 'global',
  rule_name: '',
  match_value: '',
  sort_order: 50,
  is_active: 1,
  时间段列表: ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'],
})

const 规则表单 = ref(默认表单())

const 解析时间段显示 = (time_slots_json) => {
  try {
    const 列表 = JSON.parse(time_slots_json || '[]')
    return 列表.join('、') || '-'
  } catch { return '-' }
}

const 加载规则 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取洗衣时间规则API()
    if (结果.code === 1) 规则列表.value = 结果.data
  } finally { 加载中.value = false }
}

const 新增规则 = () => {
  当前编辑ID.value = null
  规则表单.value = 默认表单()
  显示弹窗.value = true
}

const 编辑规则 = (规则) => {
  当前编辑ID.value = 规则.id
  规则表单.value = {
    ...规则,
    时间段列表: JSON.parse(规则.time_slots || '[]'),
  }
  显示弹窗.value = true
}

const 添加时间段 = () => {
  规则表单.value.时间段列表.push('')
}
const 删除时间段 = (索引) => {
  规则表单.value.时间段列表.splice(索引, 1)
}

const 保存规则 = async () => {
  // 过滤空时间段
  const 有效时间段 = 规则表单.value.时间段列表.filter(t => t.trim())
  const 提交数据 = {
    rule_type: 规则表单.value.rule_type,
    rule_name: 规则表单.value.rule_name,
    match_value: 规则表单.value.match_value,
    sort_order: 规则表单.value.sort_order,
    is_active: 规则表单.value.is_active,
    time_slots: JSON.stringify(有效时间段),
    work_days: '[1,2,3,4,5,6,7]',
    locked_days: 0,
    max_days: 14,
    business_type: 'xiyifu',
  }
  try {
    if (当前编辑ID.value) {
      await 更新洗衣时间规则API(当前编辑ID.value, 提交数据)
    } else {
      await 新增洗衣时间规则API(提交数据)
    }
    ElMessage.success('保存成功')
    显示弹窗.value = false
    加载规则()
  } catch {
    ElMessage.error('保存失败')
  }
}

const 删除规则 = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该时间规则？', '提示', { type: 'warning' })
    await 删除洗衣时间规则API(id)
    ElMessage.success('删除成功')
    加载规则()
  } catch {}
}

onMounted(() => 加载规则())
</script>

<style scoped>
.操作栏 { margin-bottom: 16px; }
.时间段编辑区 { display: flex; flex-direction: column; gap: 8px; }
.时间段行 { display: flex; align-items: center; gap: 8px; }
.字段说明 { font-size: 12px; color: #999; margin-top: 4px; }
</style>
