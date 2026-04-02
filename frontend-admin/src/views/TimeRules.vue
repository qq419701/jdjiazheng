<template>
  <!-- 时间规则管理 -->
  <div class="时间规则页面">
    <el-card class="操作栏">
      <el-row justify="space-between" align="middle">
        <span style="font-size: 14px; color: #666">
          时间规则控制各城市预约前多少天显示"已约满"
        </span>
        <el-button type="primary" @click="新增规则">+ 新增规则</el-button>
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
        <el-table-column prop="locked_days" label="锁定天数" width="90" />
        <el-table-column prop="max_days" label="最远天数" width="90" />
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
    <el-dialog v-model="显示弹窗" :title="当前编辑ID ? '编辑规则' : '新增规则'" width="560px">
      <el-form :model="规则表单" label-width="100px">
        <el-form-item label="规则类型">
          <el-radio-group v-model="规则表单.rule_type">
            <el-radio-button value="city">城市精确匹配</el-radio-button>
            <el-radio-button value="tier">地区等级匹配</el-radio-button>
            <el-radio-button value="global">全局默认</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="规则名称">
          <el-input v-model="规则表单.rule_name" placeholder="如：一线城市规则" />
        </el-form-item>
        <el-form-item label="匹配城市" v-if="规则表单.rule_type !== 'global'">
          <el-input
            v-model="规则表单.match_value"
            placeholder="多个城市用逗号分隔，如：北京,上海,广州"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="锁定天数">
          <el-input-number v-model="规则表单.locked_days" :min="0" :max="30" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">前N天显示"已约满"</span>
        </el-form-item>
        <el-form-item label="最远天数">
          <el-input-number v-model="规则表单.max_days" :min="7" :max="60" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">最远可预约天数</span>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="规则表单.sort_order" :min="1" :max="99" />
          <span style="margin-left: 8px; color: #999; font-size: 12px">数值越小优先级越高</span>
        </el-form-item>
        <el-form-item label="可选时间段">
          <el-checkbox-group v-model="规则表单.选中时间段">
            <el-checkbox
              v-for="时间 in 所有时间段"
              :key="时间"
              :label="时间"
              :value="时间"
            />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="工作日">
          <el-checkbox-group v-model="规则表单.选中工作日">
            <el-checkbox v-for="(名称, 索引) in 星期名称" :key="索引" :label="名称" :value="索引 + 1" />
          </el-checkbox-group>
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
import { 获取规则列表API, 新增规则API, 更新规则API, 删除规则API } from '../api/index'

const 加载中 = ref(false)
const 规则列表 = ref([])
const 显示弹窗 = ref(false)
const 当前编辑ID = ref(null)

const 所有时间段 = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
const 星期名称 = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const 默认表单 = () => ({
  rule_type: 'city',
  rule_name: '',
  match_value: '',
  locked_days: 3,
  max_days: 14,
  sort_order: 50,
  is_active: 1,
  选中时间段: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
  选中工作日: [1, 2, 3, 4, 5, 6, 7],
})

const 规则表单 = ref(默认表单())

const 加载规则 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取规则列表API()
    if (结果.code === 1) 规则列表.value = 结果.data
  } finally {
    加载中.value = false
  }
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
    选中时间段: JSON.parse(规则.time_slots || '[]'),
    选中工作日: JSON.parse(规则.work_days || '[1,2,3,4,5,6,7]'),
  }
  显示弹窗.value = true
}

const 保存规则 = async () => {
  const 提交数据 = {
    ...规则表单.value,
    time_slots: JSON.stringify(规则表单.value.选中时间段),
    work_days: JSON.stringify(规则表单.value.选中工作日),
  }
  delete 提交数据.选中时间段
  delete 提交数据.选中工作日

  if (当前编辑ID.value) {
    await 更新规则API(当前编辑ID.value, 提交数据)
  } else {
    await 新增规则API(提交数据)
  }
  ElMessage.success('保存成功')
  显示弹窗.value = false
  加载规则()
}

const 删除规则 = async (id) => {
  await ElMessageBox.confirm('确认删除该规则？', '提示', { type: 'warning' })
  await 删除规则API(id)
  ElMessage.success('删除成功')
  加载规则()
}

onMounted(() => 加载规则())
</script>

<style scoped>
.操作栏 { margin-bottom: 16px; }
</style>
