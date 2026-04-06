<template>
  <!-- 洗衣订单管理页面 -->
  <div class="洗衣订单管理">

    <!-- 顶部一键打开洗衣前端按钮 -->
    <el-card class="顶部操作栏" style="margin-bottom: 12px">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
        <el-button type="primary" size="large" @click="打开洗衣前端">
          🌐 预览洗衣前端页面
        </el-button>
        <span v-if="预览链接" style="font-size:13px; color:#409eff">
          {{ 预览链接 }}
          <el-button link @click="复制预览链接">复制</el-button>
        </span>
        <span style="font-size:12px; color:#999">自动使用一个未使用的演示卡密打开前端</span>
        <el-button type="danger" plain size="large" @click="打开卡密作废弹窗">
          🚫 卡密作废
        </el-button>
      </div>
    </el-card>

    <!-- 卡密作废弹窗 -->
    <el-dialog v-model="显示卡密作废弹窗" title="🚫 卡密作废" width="760px" :close-on-click-modal="false">
      <div style="margin-bottom:12px; display:flex; gap:8px">
        <el-input
          v-model="卡密搜索关键词"
          placeholder="输入卡密码（支持模糊匹配）"
          clearable
          style="flex:1"
          @keyup.enter="搜索卡密"
        />
        <el-button type="primary" @click="搜索卡密" :loading="卡密搜索中">搜索</el-button>
      </div>
      <el-table :data="卡密搜索结果" v-loading="卡密搜索中" stripe empty-text="暂无数据，请输入卡密码搜索">
        <el-table-column prop="code" label="卡密码" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'primary' : row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 0 ? '未使用' : row.status === 1 ? '已使用' : '已失效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="service_type" label="服务类型" width="120" />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-' }}</template>
        </el-table-column>
        <el-table-column label="关联订单号" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-tooltip :content="row.status === 1 ? '已使用的卡密不可作废' : row.status === 2 ? '已失效的卡密不可再次作废' : ''" :disabled="row.status === 0">
              <span>
                <el-button
                  type="danger"
                  plain
                  size="small"
                  :disabled="row.status !== 0"
                  @click="确认作废卡密(row)"
                >作废</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="显示卡密作废弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 搜索筛选 -->
    <el-card class="搜索卡片">
      <el-form :inline="true" :model="搜索条件">
        <el-form-item label="关键词">
          <el-input v-model="搜索条件.keyword" placeholder="订单号/姓名/手机/备注" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="搜索条件.city" placeholder="城市" clearable style="width: 100px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="搜索条件.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="待处理" value="0" />
            <el-option label="下单中" value="1" />
            <el-option label="已下单" value="2" />
            <el-option label="失败" value="3" />
            <el-option label="已取消" value="4" />
            <el-option label="已送达" value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="日期范围"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="搜索订单">搜索</el-button>
          <el-button @click="重置筛选">重置</el-button>
          <!-- 导出当前筛选条件下的洗衣订单为CSV文件 -->
          <el-button type="success" @click="导出订单" :loading="导出中">导出CSV</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单表格 -->
    <el-card>
      <el-table :data="订单列表" v-loading="加载中" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <!-- 创建时间列：转换为北京时间 YYYY-MM-DD HH:mm -->
        <el-table-column label="创建时间" width="145">
          <template #default="{ row }">
            <span v-if="row.created_at" class="创建时间">
              {{ 格式化北京时间(row.created_at) }}
            </span>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="city" label="城市" width="80" />
        <el-table-column label="取件时间" width="160">
          <template #default="{ row }">
            {{ row.visit_date }} {{ row.visit_time }}
          </template>
        </el-table-column>
        <el-table-column prop="card_code" label="卡密" width="160" />
        <el-table-column prop="service_type" label="商品名称" width="100" />
        <el-table-column label="洗衣状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.laundry_status" :type="获取洗衣状态类型(row.laundry_status)" size="small">
              {{ row.laundry_status }}
            </el-tag>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="取件快递单号" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.express_order_id" class="快递单号">{{ row.express_order_id }}</span>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="获取状态类型(row.status)" size="small">{{ 获取状态文字(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" width="155">
          <template #default="{ row }">
            <template v-if="row.remark || (row.remark_images && JSON.parse(row.remark_images || '[]').length)">
              <el-popover
                v-if="解析备注图片(row.remark_images).length"
                placement="right"
                trigger="hover"
                width="320"
                :show-after="200"
              >
                <template #reference>
                  <span class="备注摘要">
                    <span>📝🖼️</span>
                    <span v-if="row.remark">{{ row.remark.length > 10 ? row.remark.substring(0, 10) + '…' : row.remark }}</span>
                    <span v-else class="图片备注标签">{{ 解析备注图片(row.remark_images).length }}张图</span>
                  </span>
                </template>
                <div class="备注图片预览">
                  <div v-if="row.remark" class="备注预览文字">{{ row.remark }}</div>
                  <el-image
                    v-for="(图片, 索引) in 解析备注图片(row.remark_images)"
                    :key="索引"
                    :src="图片"
                    style="width:90px;height:90px;object-fit:cover;border-radius:4px;margin:4px"
                    :preview-src-list="解析备注图片(row.remark_images)"
                    :initial-index="索引"
                    fit="cover"
                  />
                </div>
              </el-popover>
              <span v-else-if="row.remark" class="备注摘要">
                <span>📝</span>
                {{ row.remark.length > 15 ? row.remark.substring(0, 15) + '…' : row.remark }}
              </span>
            </template>
            <span v-else class="无值">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="查看详情(row.id)">详情</el-button>
            <el-button size="small" type="info" plain @click="打开备注弹窗(row)">备注</el-button>
            <el-button
              v-if="row.status === 0 || row.status === 3"
              size="small" type="primary"
              @click="触发下单(row.id)"
            >触发下单</el-button>
            <el-button size="small" type="success" plain @click="打开物流弹窗(row)">📋 物流查询</el-button>
            <el-button size="small" type="warning" plain @click="打开修改预约弹窗(row)">✏️ 修改预约</el-button>
            <el-button
              v-if="row.status !== 4"
              size="small" type="danger"
              @click="取消订单(row.id)"
            >取消</el-button>
            <el-button
              v-if="row.status === 3"
              size="small" type="warning"
              @click="执行重置(row.id)"
            >重置</el-button>
            <el-button size="small" @click="复制订单信息(row)">复制</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="当前页"
        v-model:page-size="每页数量"
        :total="总数"
        layout="total, prev, pager, next"
        class="分页器"
        @change="加载订单"
      />
    </el-card>

    <!-- 备注编辑弹窗：支持快捷标签 + 图片上传（粘贴/拖拽/点击） -->
    <el-dialog v-model="显示备注弹窗" title="编辑备注" width="520px" :close-on-click-modal="false">
      <div class="备注弹窗内容">
        <!-- 快捷标签区：点击标签可快速追加到备注 -->
        <p class="快捷标签标题">快捷追加：</p>
        <div class="快捷标签列表">
          <el-tag
            v-for="标签 in 快捷备注标签"
            :key="标签"
            class="快捷标签"
            type="info"
            effect="plain"
            style="cursor: pointer; margin: 4px"
            @click="追加快捷标签(标签)"
          >{{ 标签 }}</el-tag>
        </div>
        <!-- 备注输入框 -->
        <el-input
          v-model="备注文本"
          type="textarea"
          :rows="3"
          placeholder="请输入备注内容（点击上方标签可快速追加）"
          style="margin-top: 12px"
        />
        <!-- 图片上传区域 -->
        <div class="备注图片区">
          <p class="快捷标签标题" style="margin-top:12px">备注图片（可选）：</p>
          <div v-if="备注图片列表.length" class="已上传图片列表">
            <div v-for="(图片, 索引) in 备注图片列表" :key="索引" class="已上传图片项">
              <el-image :src="图片" style="width:80px;height:80px;object-fit:cover;border-radius:4px" fit="cover" :preview-src-list="备注图片列表" :initial-index="索引" />
              <el-button class="删除图片按钮" type="danger" size="small" circle plain @click="删除备注图片(索引)">✕</el-button>
            </div>
          </div>
          <div
            class="图片上传区"
            :class="{ '拖拽悬停': 拖拽中 }"
            @dragover.prevent="拖拽中 = true"
            @dragleave.prevent="拖拽中 = false"
            @drop.prevent="处理拖拽上传"
            @paste.capture="处理粘贴上传"
          >
            <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/*" multiple :on-change="处理文件选择上传">
              <div class="上传提示">
                <span>📷 点击选择 / 拖拽 / 粘贴图片</span>
                <span v-if="图片上传中" class="上传进度">上传中…</span>
              </div>
            </el-upload>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="显示备注弹窗 = false">取消</el-button>
        <el-button @click="清空备注">清空</el-button>
        <el-button type="primary" :loading="备注保存中" @click="保存备注">保存备注</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="显示详情弹窗" title="洗衣订单详情" width="700px">
      <template v-if="当前详情">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ 当前详情.order_no }}</el-descriptions-item>
          <el-descriptions-item label="卡密">{{ 当前详情.card_code }}</el-descriptions-item>
          <el-descriptions-item label="取件人">{{ 当前详情.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ 当前详情.phone }}</el-descriptions-item>
          <el-descriptions-item label="取件地址" :span="2">{{ 当前详情.full_address }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ 当前详情.return_name || 当前详情.name }}</el-descriptions-item>
          <el-descriptions-item label="收件手机">{{ 当前详情.return_phone || 当前详情.phone }}</el-descriptions-item>
          <el-descriptions-item label="收件地址" :span="2">
            <span v-if="(当前详情.return_province || '') + (当前详情.return_city || '') + (当前详情.return_district || '') + (当前详情.return_address || '')">
              {{ (当前详情.return_province || '') + (当前详情.return_city || '') + (当前详情.return_district || '') + (当前详情.return_address || '') }}
            </span>
            <span v-else class="无值">与取件地址相同</span>
          </el-descriptions-item>
          <el-descriptions-item label="取件时间">{{ 当前详情.visit_date }} {{ 当前详情.visit_time }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ 当前详情.service_type }}</el-descriptions-item>
          <el-descriptions-item label="鲸蚁订单号">{{ 当前详情.laundry_order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="洗衣状态">{{ 当前详情.laundry_status || '-' }}</el-descriptions-item>
          <el-descriptions-item label="取件快递单号">{{ 当前详情.express_order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="回寄快递单号">{{ 当前详情.return_waybill_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="洗衣工厂">{{ 当前详情.factory_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工厂代码">{{ 当前详情.factory_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="获取状态类型(当前详情.status)" size="small">{{ 获取状态文字(当前详情.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ 格式化北京时间(当前详情.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ 当前详情.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 预检图片 -->
        <div v-if="当前详情预检图片.length > 0" style="margin-top: 16px">
          <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px">🖼️ 预检图片</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px">
            <el-image
              v-for="(图片, 索引) in 当前详情预检图片"
              :key="索引"
              :src="图片"
              style="width:100px; height:100px; border-radius:4px; object-fit:cover"
              :preview-src-list="当前详情预检图片"
              :initial-index="索引"
              fit="cover"
            />
          </div>
        </div>

        <!-- 操作日志 -->
        <div v-if="当前详情.order_log?.length > 0" style="margin-top: 16px">
          <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px">操作日志</div>
          <el-timeline>
            <el-timeline-item
              v-for="(日志, 索引) in 当前详情.order_log"
              :key="索引"
              :type="日志.状态 === 'success' ? 'success' : (日志.状态 === 'error' ? 'danger' : 'primary')"
              :timestamp="日志.时间"
              placement="top"
            >
              {{ 日志.操作 }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <template #footer>
        <el-button type="primary" @click="显示详情弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 物流查询弹窗：展示鲸蚁实时物流轨迹（快递员信息 + el-timeline 节点） -->
    <el-dialog v-model="显示物流弹窗" title="📋 物流追踪" width="600px" :close-on-click-modal="false">
      <div v-if="物流加载中" style="text-align:center; padding:40px 0">
        <el-icon class="is-loading" style="font-size:32px"><Loading /></el-icon>
        <div style="margin-top:8px; color:#999">正在查询物流信息…</div>
      </div>
      <div v-else-if="物流数据">
        <!-- 快递员信息 -->
        <el-descriptions
          v-if="物流数据.collectorName"
          :column="2" border style="margin-bottom:16px"
        >
          <el-descriptions-item label="快递员">{{ 物流数据.collectorName }}</el-descriptions-item>
          <el-descriptions-item label="快递员电话">{{ 物流数据.collectorPhone }}</el-descriptions-item>
          <el-descriptions-item label="物流单号" :span="2">{{ 物流数据.logisticsNumber }}</el-descriptions-item>
        </el-descriptions>
        <!-- 物流轨迹时间线 -->
        <el-timeline v-if="物流数据.routes && 物流数据.routes.length > 0">
          <el-timeline-item
            v-for="(路由, 索引) in 物流数据.routes"
            :key="索引"
            :timestamp="路由.operationTime"
            placement="top"
          >
            <el-card shadow="never">
              <div style="font-weight:bold">{{ 路由.title }}</div>
              <div style="color:#666; margin-top:4px; font-size:13px">{{ 路由.remark }}</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无物流轨迹" />
      </div>
      <el-empty v-else description="暂无物流信息，请等待鲸蚁分配快递" />
      <template #footer>
        <el-button @click="显示物流弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 修改预约弹窗 -->
    <el-dialog v-model="显示修改预约弹窗" title="✏️ 修改预约信息" width="600px" :close-on-click-modal="false">
      <el-alert
        v-if="修改预约表单.status === 2"
        title="订单已下单，保存后将同步修改到鲸蚁系统"
        type="warning"
        :closable="false"
        style="margin-bottom:16px"
      />
      <el-form :model="修改预约表单" label-width="100px">
        <el-form-item label="预约日期">
          <el-date-picker
            v-model="修改预约表单.visit_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="取件时间段">
          <!-- 修复：时间段动态从API加载，不再硬编码 -->
          <el-select
            v-model="修改预约表单.visit_time_label"
            placeholder="选择时间段"
            style="width:100%"
            :loading="时间段加载中"
          >
            <el-option v-for="段 in 时间段选项" :key="段.label" :label="段.label" :value="段.label" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">取件地址</el-divider>
        <el-form-item label="取件姓名">
          <el-input v-model="修改预约表单.name" placeholder="取件人姓名" />
        </el-form-item>
        <el-form-item label="取件手机">
          <el-input v-model="修改预约表单.phone" placeholder="取件人手机号" />
        </el-form-item>
        <el-form-item label="取件省份">
          <el-input v-model="修改预约表单.province" placeholder="省份" />
        </el-form-item>
        <el-form-item label="取件城市">
          <el-input v-model="修改预约表单.city" placeholder="城市" />
        </el-form-item>
        <el-form-item label="取件区县">
          <el-input v-model="修改预约表单.district" placeholder="区县" />
        </el-form-item>
        <el-form-item label="取件详址">
          <el-input v-model="修改预约表单.address" type="textarea" rows="2" placeholder="取件详细地址" />
        </el-form-item>
        <el-divider content-position="left">收件地址</el-divider>
        <el-form-item label="收件姓名">
          <el-input v-model="修改预约表单.return_name" placeholder="收件人姓名" />
        </el-form-item>
        <el-form-item label="收件手机">
          <el-input v-model="修改预约表单.return_phone" placeholder="收件人手机号" />
        </el-form-item>
        <el-form-item label="收件省份">
          <el-input v-model="修改预约表单.return_province" placeholder="省份" />
        </el-form-item>
        <el-form-item label="收件城市">
          <el-input v-model="修改预约表单.return_city" placeholder="城市" />
        </el-form-item>
        <el-form-item label="收件区县">
          <el-input v-model="修改预约表单.return_district" placeholder="区县" />
        </el-form-item>
        <el-form-item label="收件详址">
          <el-input v-model="修改预约表单.return_address" type="textarea" rows="2" placeholder="详细地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="显示修改预约弹窗 = false">取消</el-button>
        <el-button type="primary" :loading="修改保存中" @click="保存修改预约">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  获取洗衣订单列表API, 获取洗衣订单详情API,
  更新洗衣订单备注API, 上传备注图片API, 触发洗衣API下单, 取消洗衣订单API,
  重置洗衣订单API, 获取设置API, 获取洗衣预览卡密API,
  修改洗衣订单API, 获取洗衣时间段API, 查询洗衣物流API,
  导出洗衣订单API, 订单页搜索洗衣卡密API, 作废洗衣卡密API,
} from '../api/index'

/**
 * 格式化为北京时间 YYYY-MM-DD HH:mm
 */
const 格式化北京时间 = (isoStr) => {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  return fmt.format(d).replace(', ', ' ')
}

/**
 * 解析备注图片JSON数组
 */
const 解析备注图片 = (imagesJson) => {
  if (!imagesJson) return []
  try { return JSON.parse(imagesJson) } catch { return [] }
}

// 站点域名
const 站点域名 = ref('')
const 预览链接 = ref('')

// 搜索条件
const 搜索条件 = ref({ keyword: '', city: '', status: '' })
const 日期范围 = ref(null)

// 表格数据
const 加载中 = ref(false)
const 导出中 = ref(false)  // 导出订单时的loading状态
const 订单列表 = ref([])
const 总数 = ref(0)
const 当前页 = ref(1)
const 每页数量 = ref(20)

// 卡密作废弹窗
const 显示卡密作废弹窗 = ref(false)
const 卡密搜索关键词 = ref('')
const 卡密搜索结果 = ref([])
const 卡密搜索中 = ref(false)

const 打开卡密作废弹窗 = () => {
  卡密搜索关键词.value = ''
  卡密搜索结果.value = []
  显示卡密作废弹窗.value = true
}

const 搜索卡密 = async () => {
  if (!卡密搜索关键词.value.trim()) {
    ElMessage.warning('请输入卡密码')
    return
  }
  卡密搜索中.value = true
  try {
    const 结果 = await 订单页搜索洗衣卡密API(卡密搜索关键词.value.trim())
    if (结果.code === 1) {
      卡密搜索结果.value = 结果.data || []
      if (卡密搜索结果.value.length === 0) ElMessage.info('未找到匹配的卡密')
    } else {
      ElMessage.warning(结果.message || '搜索失败')
    }
  } catch {
    ElMessage.error('搜索卡密失败，请重试')
  } finally {
    卡密搜索中.value = false
  }
}

const 确认作废卡密 = async (行) => {
  try {
    await ElMessageBox.confirm(
      `确定要作废卡密 ${行.code} 吗？作废后客户将无法使用该卡密，且操作不可逆。`,
      '确认作废',
      { confirmButtonText: '确认作废', cancelButtonText: '取消', type: 'warning' }
    )
    const 结果 = await 作废洗衣卡密API(行.id)
    if (结果.code === 1) {
      ElMessage.success(`卡密 ${行.code} 已作废`)
      卡密搜索结果.value = []
      加载订单()
    } else {
      ElMessage.warning(结果.message || '作废失败')
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('作废失败，请重试')
  }
}

// 备注弹窗
const 显示备注弹窗 = ref(false)
const 备注文本 = ref('')
const 当前备注订单 = ref(null)
const 备注保存中 = ref(false)
// 备注图片相关
const 备注图片列表 = ref([])
const 图片上传中 = ref(false)
const 拖拽中 = ref(false)

// 快捷备注标签列表（点击一键追加，洗衣订单专用）
const 快捷备注标签 = ['已联系客户', '需改期', '客户催单', '已安排取件', '已回寄', '客户已确认']

// 快捷标签追加到备注内容（使用中文分号分隔）
const 追加快捷标签 = (标签文字) => {
  备注文本.value = 备注文本.value ? `${备注文本.value}；${标签文字}` : 标签文字
}

// 清空备注输入（同时清空图片）
const 清空备注 = () => {
  备注文本.value = ''
  备注图片列表.value = []
}

// 删除某张备注图片
const 删除备注图片 = (索引) => {
  备注图片列表.value.splice(索引, 1)
}

// 上传单张图片文件到服务器
const 上传单张图片 = async (文件) => {
  const formData = new FormData()
  formData.append('image', 文件)
  const 结果 = await 上传备注图片API(formData)
  if (结果.code === 1 && 结果.data?.url) {
    备注图片列表.value.push(结果.data.url)
  } else {
    ElMessage.warning(结果.message || '图片上传失败')
  }
}

const 处理文件选择上传 = async (文件对象) => {
  图片上传中.value = true
  try { await 上传单张图片(文件对象.raw) }
  catch { ElMessage.error('图片上传失败，请重试') }
  finally { 图片上传中.value = false }
}

const 处理拖拽上传 = async (事件) => {
  拖拽中.value = false
  const 文件列表 = Array.from(事件.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'))
  if (!文件列表.length) return
  图片上传中.value = true
  try { for (const 文件 of 文件列表) await 上传单张图片(文件) }
  catch { ElMessage.error('图片上传失败，请重试') }
  finally { 图片上传中.value = false }
}

const 处理粘贴上传 = async (事件) => {
  const items = Array.from(事件.clipboardData?.items || []).filter(item => item.type.startsWith('image/'))
  if (!items.length) return
  图片上传中.value = true
  try { for (const 项 of items) { const f = 项.getAsFile(); if (f) await 上传单张图片(f) } }
  catch { ElMessage.error('图片上传失败，请重试') }
  finally { 图片上传中.value = false }
}

// 备注弹窗打开时挂载全局粘贴监听，关闭时移除，确保 Ctrl+V 粘贴图片生效
watch(显示备注弹窗, (val) => {
  if (val) document.addEventListener('paste', 处理粘贴上传)
  else document.removeEventListener('paste', 处理粘贴上传)
})

// 详情弹窗
const 显示详情弹窗 = ref(false)
const 当前详情 = ref(null)

// 当前详情预检图片（计算属性）
const 当前详情预检图片 = computed(() => {
  if (!当前详情.value?.laundry_images) return []
  const 图片 = 当前详情.value.laundry_images
  if (Array.isArray(图片)) return 图片
  try { return JSON.parse(图片) } catch { return [] }
})

// 物流查询弹窗
const 显示物流弹窗 = ref(false)
const 当前物流订单 = ref(null)
const 物流数据 = ref(null)
const 物流加载中 = ref(false)

// 修改预约弹窗
const 显示修改预约弹窗 = ref(false)
const 修改预约表单 = ref({})
const 修改保存中 = ref(false)

// 时间段选项（动态从API加载，初始为空，打开弹窗时加载）
const 时间段选项 = ref([])
const 时间段加载中 = ref(false)

// 加载时间段列表（调用公开API动态获取）
const 加载时间段选项 = async (城市 = '') => {
  时间段加载中.value = true
  try {
    const 结果 = await 获取洗衣时间段API({ city: 城市 })
    if (结果.code === 1 && Array.isArray(结果.data)) {
      时间段选项.value = 结果.data
    }
  } catch {
    // 加载失败时保留默认兜底时间段，并打印警告便于排查
    console.warn('动态加载时间段失败，使用默认时间段')
    时间段选项.value = [
      { label: '09:00-10:00', start: '09:00:00', end: '10:00:00' },
      { label: '10:00-11:00', start: '10:00:00', end: '11:00:00' },
      { label: '11:00-12:00', start: '11:00:00', end: '12:00:00' },
      { label: '14:00-15:00', start: '14:00:00', end: '15:00:00' },
      { label: '15:00-16:00', start: '15:00:00', end: '16:00:00' },
      { label: '16:00-17:00', start: '16:00:00', end: '17:00:00' },
    ]
  } finally {
    时间段加载中.value = false
  }
}

// 加载设置
const 加载站点域名 = async () => {
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      站点域名.value = (结果.data.site_url || '').replace(/\/$/, '')
    }
  } catch {}
}

// 打开洗衣前端（获取一个未使用的洗衣卡密）
const 打开洗衣前端 = async () => {
  try {
    const 结果 = await 获取洗衣预览卡密API()
    if (结果.code === 1 && 结果.data?.code) {
      const 链接 = `${站点域名.value || ''}/xi/${结果.data.code}`
      预览链接.value = 链接
      window.open(链接, '_blank')
    } else {
      ElMessage.warning(结果.message || '请先生成洗衣卡密')
    }
  } catch {
    ElMessage.error('获取预览卡密失败，请重试')
  }
}

// 复制预览链接
const 复制预览链接 = async () => {
  if (!预览链接.value) return
  try {
    await navigator.clipboard.writeText(预览链接.value)
    ElMessage.success('链接已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// 加载订单
const 加载订单 = async () => {
  加载中.value = true
  try {
    const 参数 = {
      page: 当前页.value,
      limit: 每页数量.value,
      ...搜索条件.value,
    }
    if (日期范围.value) {
      参数.date_start = 日期范围.value[0]
      参数.date_end = 日期范围.value[1]
    }
    const 结果 = await 获取洗衣订单列表API(参数)
    if (结果.code === 1) {
      订单列表.value = 结果.data.list
      总数.value = 结果.data.total
    }
  } finally {
    加载中.value = false
  }
}

const 搜索订单 = () => { 当前页.value = 1; 加载订单() }
const 重置筛选 = () => {
  搜索条件.value = { keyword: '', city: '', status: '' }
  日期范围.value = null
  当前页.value = 1
  加载订单()
}

/**
 * 导出洗衣订单为CSV文件（携带当前所有筛选条件）
 * 通过axios携带Token认证后触发浏览器下载
 */
const 导出订单 = async () => {
  导出中.value = true
  try {
    // 构建与加载列表相同的查询参数（不包含分页）
    const 参数 = { ...搜索条件.value }
    if (日期范围.value) {
      参数.date_start = 日期范围.value[0]
      参数.date_end = 日期范围.value[1]
    }
    const blob = await 导出洗衣订单API(参数)
    // 创建临时下载链接触发浏览器下载
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8' }))
    const 链接 = document.createElement('a')
    链接.href = url
    链接.setAttribute('download', `洗衣订单_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`)
    document.body.appendChild(链接)
    链接.click()
    document.body.removeChild(链接)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败，请重试')
  } finally {
    导出中.value = false
  }
}

// 查看详情
const 查看详情 = async (id) => {
  try {
    const 结果 = await 获取洗衣订单详情API(id)
    if (结果.code === 1) {
      当前详情.value = 结果.data
      显示详情弹窗.value = true
    }
  } catch {
    ElMessage.error('获取详情失败')
  }
}

// 打开备注弹窗
const 打开备注弹窗 = (订单) => {
  当前备注订单.value = 订单
  备注文本.value = 订单.remark || ''
  备注图片列表.value = 解析备注图片(订单.remark_images)
  显示备注弹窗.value = true
}

// 保存备注（调用洗衣订单备注API，包含图片）
const 保存备注 = async () => {
  if (!当前备注订单.value) return
  备注保存中.value = true
  try {
    await 更新洗衣订单备注API(当前备注订单.value.id, {
      remark: 备注文本.value,
      remark_images: JSON.stringify(备注图片列表.value),
    })
    ElMessage.success('备注已保存')
    显示备注弹窗.value = false
    加载订单()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    备注保存中.value = false
  }
}

// 触发下单
const 触发下单 = async (id) => {
  try {
    const 结果 = await 触发洗衣API下单(id)
    ElMessage.success(结果.message || '下单任务已启动')
    setTimeout(加载订单, 3000)
  } catch {
    ElMessage.error('操作失败')
  }
}

// 取消订单
const 取消订单 = async (id) => {
  try {
    await ElMessageBox.confirm('确认取消此洗衣订单？', '提示', { type: 'warning' })
    const 结果 = await 取消洗衣订单API(id)
    ElMessage.success(结果.message || '已取消')
    加载订单()
  } catch {}
}

// 重置订单
const 执行重置 = async (id) => {
  try {
    await 重置洗衣订单API(id)
    ElMessage.success('订单已重置')
    加载订单()
  } catch {
    ElMessage.error('重置失败')
  }
}

// 物流查询：调用鲸蚁API获取实时物流轨迹并弹窗展示
const 打开物流弹窗 = async (订单) => {
  当前物流订单.value = 订单
  物流数据.value = null
  物流加载中.value = true
  显示物流弹窗.value = true
  try {
    const res = await 查询洗衣物流API(订单.id)
    if (res.data.code === 1) {
      物流数据.value = res.data.data
    } else {
      ElMessage.warning(res.data.message || '暂无物流信息')
      显示物流弹窗.value = false
    }
  } catch (e) {
    ElMessage.error('查询失败')
    显示物流弹窗.value = false
  } finally {
    物流加载中.value = false
  }
}

// 修改预约
const 打开修改预约弹窗 = (订单) => {
  修改预约表单.value = {
    id: 订单.id,
    status: 订单.status,
    visit_date: 订单.visit_date || '',
    visit_time_label: 订单.visit_time || '',
    visit_time_start: 订单.visit_time_start || '',
    visit_time_end: 订单.visit_time_end || '',
    // 取件地址
    name: 订单.name || '',
    phone: 订单.phone || '',
    province: 订单.province || '',
    city: 订单.city || '',
    district: 订单.district || '',
    address: 订单.address || '',
    // 收件地址
    return_name: 订单.return_name || '',
    return_phone: 订单.return_phone || '',
    return_province: 订单.return_province || '',
    return_city: 订单.return_city || '',
    return_district: 订单.return_district || '',
    return_address: 订单.return_address || '',
  }
  // 修复：动态加载时间段（根据订单城市查询）
  加载时间段选项(订单.city || '')
  显示修改预约弹窗.value = true
}

const 保存修改预约 = async () => {
  修改保存中.value = true
  try {
    // 解析时间段（时间段选项现在是动态加载的 ref）
    const 选中时间段 = 时间段选项.value.find(段 => 段.label === 修改预约表单.value.visit_time_label)
    const 请求数据 = {
      visit_date: 修改预约表单.value.visit_date,
      visit_time: 修改预约表单.value.visit_time_label,
      visit_time_start: 选中时间段?.start || 修改预约表单.value.visit_time_start,
      visit_time_end: 选中时间段?.end || 修改预约表单.value.visit_time_end,
      // 取件地址
      name: 修改预约表单.value.name,
      phone: 修改预约表单.value.phone,
      province: 修改预约表单.value.province,
      city: 修改预约表单.value.city,
      district: 修改预约表单.value.district,
      address: 修改预约表单.value.address,
      // 收件地址
      return_name: 修改预约表单.value.return_name,
      return_phone: 修改预约表单.value.return_phone,
      return_province: 修改预约表单.value.return_province,
      return_city: 修改预约表单.value.return_city,
      return_district: 修改预约表单.value.return_district,
      return_address: 修改预约表单.value.return_address,
    }
    const 结果 = await 修改洗衣订单API(修改预约表单.value.id, 请求数据)
    ElMessage.success(结果.message || '修改成功')
    显示修改预约弹窗.value = false
    加载订单()
  } catch {
    ElMessage.error('修改失败，请重试')
  } finally {
    修改保存中.value = false
  }
}

// 复制订单信息
const copyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(resolve).catch(reject)
      return
    }
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.focus()
    el.select()
    try {
      document.execCommand('copy') ? resolve() : reject()
      document.body.removeChild(el)
    } catch (e) { document.body.removeChild(el); reject(e) }
  })
}

const 复制订单信息 = async (订单) => {
  const 文本 = `订单号：${订单.order_no}\n取件人：${订单.name}\n手机：${订单.phone}\n取件时间：${订单.visit_date} ${订单.visit_time}\n商品：${订单.service_type || '-'}`
  try {
    await copyToClipboard(文本)
    ElMessage.success('已复制订单信息')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 状态文字/类型
const 获取状态文字 = (status) => {
  const 映射 = ['待处理', '下单中', '已下单', '失败', '已取消', '', '已送达']
  return 映射[status] || `状态${status}`
}
const 获取状态类型 = (status) => {
  const 映射 = ['warning', 'primary', 'success', 'danger', 'info', '', 'success']
  return 映射[status] || ''
}
const 获取洗衣状态类型 = (洗衣状态) => {
  const 映射 = {
    '已分配': 'primary', '已取件': 'warning', '已入厂': '',
    '预检中': 'warning', '已回寄': 'primary', '已送达': 'success', '质检中': 'info', '已取消': 'danger',
  }
  return 映射[洗衣状态] || 'info'
}

onMounted(() => {
  加载站点域名()
  加载订单()
})

onBeforeUnmount(() => {
  document.removeEventListener('paste', 处理粘贴上传)
})
</script>

<style scoped>
.搜索卡片, .顶部操作栏 { margin-bottom: 16px; }
.前端链接提示 { margin-left: 12px; font-size: 12px; color: #999; }
.分页器 { margin-top: 16px; justify-content: center; }
.鲸蚁订单号, .快递单号 { font-size: 12px; color: #409eff; font-family: monospace; }
.无值 { color: #ccc; font-size: 12px; }
.备注摘要 { font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px; }
/* 创建时间列样式 */
.创建时间 { font-size: 12px; color: #888; }
/* 订单号截断 */
.订单号截断 { font-size: 12px; color: #555; font-family: monospace; cursor: default; }
/* 备注图片预览 */
.备注图片预览 { display: flex; flex-wrap: wrap; gap: 6px; max-width: 300px; }
.备注预览文字 { width: 100%; font-size: 12px; color: #555; margin-bottom: 6px; word-break: break-all; }
.图片备注标签 { color: #409eff; font-size: 12px; }
/* 备注弹窗内容样式 */
.备注弹窗内容 { padding: 0 4px; }
.快捷标签标题 { color: #666; font-size: 13px; margin-bottom: 6px; }
.快捷标签列表 { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
.快捷标签:hover { background: #ecf5ff; border-color: #409eff; }
.备注图片区 { margin-top: 4px; }
.已上传图片列表 { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.已上传图片项 { position: relative; display: inline-block; }
.删除图片按钮 { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; font-size: 10px; padding: 0; }
.图片上传区 { border: 2px dashed #dcdfe6; border-radius: 6px; padding: 12px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.图片上传区:hover, .拖拽悬停 { border-color: #409eff; background: #ecf5ff; }
.上传提示 { color: #aaa; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
.上传进度 { color: #409eff; }
</style>
