<template>
  <!-- 统一订单中心 -->
  <div class="订单中心">

    <!-- 顶部工具栏 -->
    <el-card style="margin-bottom: 12px">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
        <!-- 预览前端下拉 -->
        <el-dropdown @command="打开前端预览">
          <el-button type="primary">🌐 预览前端 <el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="jiazheng">🏠 家政前端</el-dropdown-item>
              <el-dropdown-item command="xiyifu">🧺 洗衣前端</el-dropdown-item>
              <el-dropdown-item command="topup">💳 充值前端</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 卡密作废下拉 -->
        <el-dropdown @command="打开卡密作废弹窗">
          <el-button type="danger" plain>🚫 卡密作废 <el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="jiazheng">家政卡密作废</el-dropdown-item>
              <el-dropdown-item command="xiyifu">洗衣卡密作废</el-dropdown-item>
              <el-dropdown-item command="topup">充值卡密作废</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 导出CSV下拉 -->
        <el-dropdown @command="导出订单">
          <el-button type="success" :loading="导出中">📊 导出CSV <el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="jiazheng">导出家政订单</el-dropdown-item>
              <el-dropdown-item command="xiyifu">导出洗衣订单</el-dropdown-item>
              <el-dropdown-item command="topup">导出充值订单</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <span v-if="预览链接" style="font-size:13px; color:#409eff">
          {{ 预览链接 }}
          <el-button link @click="复制预览链接">复制</el-button>
        </span>
      </div>
    </el-card>

    <!-- 共用：卡密作废弹窗 -->
    <el-dialog
      v-model="显示卡密作废弹窗"
      :title="`🚫 卡密作废 - ${卡密作废业务 === 'jiazheng' ? '家政' : 卡密作废业务 === 'xiyifu' ? '洗衣' : '充值'}`"
      width="760px"
      :close-on-click-modal="false"
    >
      <div style="margin-bottom:12px; display:flex; gap:8px">
        <el-input v-model="卡密搜索关键词" placeholder="输入卡密码（支持模糊匹配）" clearable style="flex:1" @keyup.enter="搜索卡密" />
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
        <el-table-column label="服务/会员类型" width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.service_type || row.topup_member_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.created_at ? 格式化北京时间(row.created_at) : '-' }}</template>
        </el-table-column>
        <el-table-column label="关联订单号" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-tooltip
              :content="row.status === 1 ? '已使用的卡密不可作废' : row.status === 2 ? '已失效的卡密不可再次作废' : ''"
              :disabled="row.status === 0"
            >
              <span>
                <el-button type="danger" plain size="small" :disabled="row.status !== 0" @click="确认作废卡密(row)">作废</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="显示卡密作废弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝退款预警横幅 -->
    <el-alert
      v-if="拒绝退款订单数 > 0"
      :title="`⚠️ 当前有 ${拒绝退款订单数} 个订单被SUP拒绝退款，需客服人工处理`"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom:12px; cursor:pointer;"
      @click="快速筛选拒绝退款订单"
    >
      <template #default>
        <span>点击此处快速筛选所有拒绝退款订单</span>
      </template>
    </el-alert>

    <!-- 自定义 Tab 切换栏 -->
    <div class="订单Tab栏">
      <div
        v-for="tab in Tab列表"
        :key="tab.key"
        :class="['Tab按钮', { 'Tab激活': 当前Tab === tab.key, 'Tab禁用': tab.disabled }]"
        @click="!tab.disabled && 切换Tab(tab.key)"
      >
        <span class="Tab图标">{{ tab.icon }}</span>
        <span class="Tab文字">{{ tab.label }}</span>
        <span v-if="tab.badge" class="Tab角标">{{ tab.badge }}</span>
        <span v-if="tab.disabled" class="Tab即将上线">即将上线</span>
      </div>
    </div>

      <!-- ============ 家政订单 内容 ============ -->
      <div v-show="当前Tab === 'jiazheng'">

        <!-- 家政筛选行 -->
        <el-card class="搜索卡片">
          <el-form :inline="true" :model="jz搜索条件">
            <el-form-item label="关键词">
              <el-input v-model="jz搜索条件.keyword" placeholder="可搜索：订单号 / 姓名 / 手机号 / 卡密 / 城市 / 备注" clearable style="width:360px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="jz搜索条件.status" clearable placeholder="全部状态" style="width:130px">
                <el-option label="待处理" value="0" />
                <el-option label="处理中" value="1" />
                <el-option label="服务中" value="2" />
                <el-option label="已完成" value="3" />
                <el-option label="已取消" value="4" />
                <el-option label="失败" value="5" />
                <el-option label="拒绝退款" value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker v-model="jz日期范围" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="jz搜索">搜索</el-button>
              <el-button @click="jz重置">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 家政表格 -->
        <el-card>
          <el-table :data="jz订单列表" v-loading="jz加载中" stripe :row-class-name="获取订单行样式">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="创建时间" width="145">
              <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="80" />
            <el-table-column prop="phone" label="手机号" width="120" />
            <el-table-column prop="city" label="城市" width="80" />
            <!-- 预约时间：支持多选时间展示优先/备选 -->
            <el-table-column label="预约时间" width="185">
              <template #default="{ row }">
                <template v-if="解析多选时间(row.visit_times).length > 0">
                  <div v-for="(项, 索引) in 解析多选时间(row.visit_times)" :key="索引" style="font-size:12px; line-height:1.6">
                    <span>{{ ['🥇','🥈','🥉'][索引] || `${索引+1}.` }}</span>
                    {{ 项.date }} {{ 项.time }}
                    <el-tag v-if="索引 === 0" size="small" type="success" effect="plain" style="margin-left:2px;font-size:10px">优先</el-tag>
                    <el-tag v-else size="small" type="info" effect="plain" style="margin-left:2px;font-size:10px">备选</el-tag>
                  </div>
                </template>
                <template v-else>
                  <span>{{ row.visit_date }} {{ row.visit_time }}</span>
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="service_type" label="服务类型" width="100" show-overflow-tooltip />
            <el-table-column prop="card_code" label="卡密" width="150" show-overflow-tooltip v-if="false" />
            <el-table-column label="电商单号" width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.ecommerce_order_no" style="color:#409eff;font-size:12px;font-weight:500">{{ row.ecommerce_order_no }}</span>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <!-- 备注列：hover图片预览 -->
            <el-table-column label="备注" width="155">
              <template #default="{ row }">
                <template v-if="row.remark || 解析备注图片(row.remark_images).length">
                  <el-popover v-if="解析备注图片(row.remark_images).length" placement="right" trigger="hover" width="320" :show-after="200">
                    <template #reference>
                      <span class="备注摘要">
                        <span>📝🖼️</span>
                        <span v-if="row.remark">{{ row.remark.length > 12 ? row.remark.substring(0, 12) + '…' : row.remark }}</span>
                        <span v-else style="color:#999;font-size:12px">{{ 解析备注图片(row.remark_images).length }}张图</span>
                      </span>
                    </template>
                    <div>
                      <div v-if="row.remark" style="font-size:13px;color:#333;margin-bottom:8px">{{ row.remark }}</div>
                      <el-image v-for="(图片, 索引) in 解析备注图片(row.remark_images)" :key="索引" :src="图片" style="width:90px;height:90px;object-fit:cover;border-radius:4px;margin:4px" :preview-src-list="解析备注图片(row.remark_images)" :initial-index="索引" fit="cover" />
                    </div>
                  </el-popover>
                  <span v-else class="备注摘要">
                    <span>📝</span>
                    {{ row.remark.length > 20 ? row.remark.substring(0, 20) + '…' : row.remark }}
                  </span>
                </template>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <!-- 状态列：失败时显示查看原因 -->
            <el-table-column label="状态" width="130">
              <template #default="{ row }">
                <el-tag :type="jz获取状态类型(row.status)" size="small">{{ jz获取状态文字(row.status) }}</el-tag>
                <el-button v-if="row.status === 5 && row.fail_reason" link size="small" style="color:#f56c6c;font-size:11px;padding:0 2px" @click="查看家政失败原因(row)">查看原因</el-button>
              </template>
            </el-table-column>
            <!-- 操作列 -->
            <el-table-column label="操作" width="390" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="jz查看详情(row.id)">详情</el-button>
                <el-button size="small" type="info" plain @click="打开备注弹窗(row, 'jiazheng')">备注</el-button>
                <el-button v-if="row.status === 0 || row.status === 5" size="small" type="primary" @click="jz触发下单(row.id)">自动下单</el-button>
                <el-button v-if="row.status === 0 || row.status === 1" size="small" type="success" @click="jz手动标记(row, 2)">服务中</el-button>
                <el-button v-if="row.status === 2" size="small" type="success" @click="jz手动标记(row, 3)">完成</el-button>
                <el-button v-if="row.status === 0 || row.status === 1 || row.status === 2" size="small" type="danger" plain @click="jz标记预约失败(row)">标记失败</el-button>
                <el-button v-if="row.status === 0" size="small" type="info" plain @click="jz标记取消(row.id)">取消</el-button>
                <el-button v-if="row.status === 5" size="small" type="warning" plain @click="jz执行重置(row.id)">重置</el-button>
                <el-button v-if="row.status !== 4 && row.status !== 6" size="small" type="warning" @click="jz申请退款(row)">申请退款</el-button>
                <el-button v-if="row.status === 6" size="small" type="danger" @click="jz确认退款完成(row)">确认退款完成</el-button>
                <el-button size="small" @click="jz复制订单(row)">复制</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="jz当前页" v-model:page-size="jz每页数量" :total="jz总数" layout="total, prev, pager, next" class="分页器" @change="加载家政订单" />
        </el-card>
      </div>

      <!-- ============ 洗衣订单 内容 ============ -->
      <div v-show="当前Tab === 'xiyifu'">

        <!-- 洗衣筛选行 -->
        <el-card class="搜索卡片">
          <el-form :inline="true" :model="xi搜索条件">
            <el-form-item label="关键词">
              <el-input v-model="xi搜索条件.keyword" placeholder="可搜索：订单号 / 姓名 / 手机 / 卡密 / 城市 / 快递单号 / 备注" clearable style="width:360px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="xi搜索条件.status" clearable placeholder="全部状态" style="width:130px">
                <el-option label="待处理" value="0" />
                <el-option label="处理中" value="1" />
                <el-option label="服务中" value="2" />
                <el-option label="已完成" value="3" />
                <el-option label="已取消" value="4" />
                <el-option label="失败" value="5" />
                <el-option label="拒绝退款" value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker v-model="xi日期范围" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="xi搜索">搜索</el-button>
              <el-button @click="xi重置">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 洗衣表格 -->
        <el-card>
          <el-table :data="xi订单列表" v-loading="xi加载中" stripe :row-class-name="获取订单行样式">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="创建时间" width="145">
              <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="80" />
            <el-table-column prop="phone" label="手机号" width="120" />
            <el-table-column prop="city" label="城市" width="80" />
            <el-table-column label="取件时间" width="155">
              <template #default="{ row }">{{ row.visit_date }} {{ row.visit_time }}</template>
            </el-table-column>
            <el-table-column prop="service_type" label="商品名称" width="100" show-overflow-tooltip />
            <el-table-column label="洗衣状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.laundry_status" :type="获取洗衣状态类型(row.laundry_status)" size="small">{{ row.laundry_status }}</el-tag>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <el-table-column label="取件快递单号" width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.express_order_id || '-' }}</template>
            </el-table-column>
            <el-table-column prop="card_code" label="卡密" width="150" show-overflow-tooltip v-if="false" />
            <el-table-column label="电商单号" width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.ecommerce_order_no" style="color:#409eff;font-size:12px;font-weight:500">{{ row.ecommerce_order_no }}</span>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <!-- 备注列 -->
            <el-table-column label="备注" width="155">
              <template #default="{ row }">
                <template v-if="row.remark || 解析备注图片(row.remark_images).length">
                  <el-popover v-if="解析备注图片(row.remark_images).length" placement="right" trigger="hover" width="320" :show-after="200">
                    <template #reference>
                      <span class="备注摘要">
                        <span>📝🖼️</span>
                        <span v-if="row.remark">{{ row.remark.length > 10 ? row.remark.substring(0, 10) + '…' : row.remark }}</span>
                        <span v-else style="color:#999;font-size:12px">{{ 解析备注图片(row.remark_images).length }}张图</span>
                      </span>
                    </template>
                    <div>
                      <div v-if="row.remark" style="font-size:13px;color:#333;margin-bottom:8px">{{ row.remark }}</div>
                      <el-image v-for="(图片, 索引) in 解析备注图片(row.remark_images)" :key="索引" :src="图片" style="width:90px;height:90px;object-fit:cover;border-radius:4px;margin:4px" :preview-src-list="解析备注图片(row.remark_images)" :initial-index="索引" fit="cover" />
                    </div>
                  </el-popover>
                  <span v-else class="备注摘要">
                    <span>📝</span>
                    {{ row.remark.length > 15 ? row.remark.substring(0, 15) + '…' : row.remark }}
                  </span>
                </template>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <!-- 状态列 -->
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="xi获取状态类型(row.status)" size="small">{{ xi获取状态文字(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <!-- 操作列 -->
            <el-table-column label="操作" width="440" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="xi查看详情(row.id)">详情</el-button>
                <el-button size="small" type="info" plain @click="打开备注弹窗(row, 'xiyifu')">备注</el-button>
                <el-button size="small" type="success" plain @click="xi打开物流弹窗(row)">📋 物流</el-button>
                <el-button size="small" type="warning" plain @click="xi打开修改预约弹窗(row)">✏️ 修改</el-button>
                <el-button v-if="row.status === 0 || row.status === 5" size="small" type="primary" @click="xi触发下单(row.id)">触发下单</el-button>
                <el-button v-if="row.status !== 4" size="small" type="danger" plain @click="xi取消订单(row.id)">取消</el-button>
                <el-button v-if="row.status === 5" size="small" type="warning" plain @click="xi执行重置(row.id)">重置</el-button>
                <el-button v-if="row.status !== 4 && row.status !== 6" size="small" type="warning" @click="xi申请退款(row)">申请退款</el-button>
                <el-button v-if="row.status === 6" size="small" type="danger" @click="xi确认退款完成(row)">确认退款完成</el-button>
                <el-button size="small" @click="xi复制订单(row)">复制</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="xi当前页" v-model:page-size="xi每页数量" :total="xi总数" layout="total, prev, pager, next" class="分页器" @change="加载洗衣订单" />
        </el-card>
      </div>

      <!-- ============ 充值订单 内容 ============ -->
      <div v-show="当前Tab === 'topup'">

        <!-- 充值筛选行 -->
        <el-card class="搜索卡片">
          <el-form :inline="true" :model="tp搜索条件">
            <el-form-item label="关键词">
              <el-input v-model="tp搜索条件.keyword" placeholder="可搜索：订单号 / 充值账号 / 卡密 / 城市 / 备注" clearable style="width:360px" />
            </el-form-item>
            <el-form-item label="充值会员">
              <el-input v-model="tp搜索条件.member_name" placeholder="如：优酷年卡" clearable style="width:120px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="tp搜索条件.status" clearable placeholder="全部状态" style="width:130px">
                <el-option label="待处理" value="0" />
                <el-option label="处理中" value="1" />
                <el-option label="服务中" value="2" />
                <el-option label="已完成" value="3" />
                <el-option label="已取消" value="4" />
                <el-option label="失败" value="5" />
                <el-option label="拒绝退款" value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker v-model="tp日期范围" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:240px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="tp搜索">搜索</el-button>
              <el-button @click="tp重置">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 充值表格 -->
        <el-card>
          <el-table :data="tp订单列表" v-loading="tp加载中" stripe :row-class-name="获取订单行样式">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column label="创建时间" width="145">
              <template #default="{ row }">{{ 格式化北京时间(row.created_at) }}</template>
            </el-table-column>
            <!-- 充值账号：明文显示+📋复制 -->
            <el-table-column label="充值账号" width="165">
              <template #default="{ row }">
                <div v-if="row.topup_account" style="display:flex;align-items:center;gap:2px">
                  <span style="font-family:monospace;font-size:13px">
                    {{ row.topup_account }}
                  </span>
                  <el-button link size="small" style="color:#409eff;padding:0 2px;min-height:auto" title="复制充值账号" @click="tp复制账号(row)">📋</el-button>
                </div>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <el-table-column label="账号类型" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.topup_account_type" size="small" type="info">{{ 账号类型中文(row.topup_account_type) }}</el-tag>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <el-table-column label="充值会员" width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ row.topup_member_name || '-' }}</template>
            </el-table-column>
            <el-table-column label="登录城市" width="110" show-overflow-tooltip>
              <template #default="{ row }">{{ row.login_city || '-' }}</template>
            </el-table-column>
            <el-table-column label="预计到账" width="100">
              <template #default="{ row }">{{ row.topup_arrival_time || '-' }}</template>
            </el-table-column>
            <el-table-column label="会员到期" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.topup_is_expired === 1" type="danger" size="small">已到期</el-tag>
                <el-tag v-else-if="row.topup_is_expired === 0" type="success" size="small">未到期</el-tag>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="card_code" label="卡密" width="150" show-overflow-tooltip v-if="false" />
            <el-table-column label="电商单号" width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.ecommerce_order_no" style="color:#409eff;font-size:12px;font-weight:500">{{ row.ecommerce_order_no }}</span>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="tp获取状态类型(row.status)" size="small">{{ tp获取状态文字(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <!-- 备注列 -->
            <el-table-column label="备注" width="155">
              <template #default="{ row }">
                <template v-if="row.remark || 解析备注图片(row.remark_images).length">
                  <el-popover v-if="解析备注图片(row.remark_images).length" placement="right" trigger="hover" width="320" :show-after="200">
                    <template #reference>
                      <span class="备注摘要">
                        <span>📝🖼️</span>
                        <span v-if="row.remark">{{ row.remark.length > 10 ? row.remark.substring(0, 10) + '…' : row.remark }}</span>
                        <span v-else style="color:#999;font-size:12px">{{ 解析备注图片(row.remark_images).length }}张图</span>
                      </span>
                    </template>
                    <div>
                      <div v-if="row.remark" style="font-size:13px;color:#333;margin-bottom:8px">{{ row.remark }}</div>
                      <el-image v-for="(图片, 索引) in 解析备注图片(row.remark_images)" :key="索引" :src="图片" style="width:90px;height:90px;object-fit:cover;border-radius:4px;margin:4px" :preview-src-list="解析备注图片(row.remark_images)" :initial-index="索引" fit="cover" />
                    </div>
                  </el-popover>
                  <span v-else class="备注摘要">
                    <span>📝</span>
                    {{ row.remark.length > 15 ? row.remark.substring(0, 15) + '…' : row.remark }}
                  </span>
                </template>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>
            <!-- 操作列 -->
            <el-table-column label="操作" width="360" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="tp查看详情(row.id)">详情</el-button>
                <el-button size="small" type="info" plain @click="打开备注弹窗(row, 'topup')">备注</el-button>
                <el-button v-if="row.status === 0" size="small" type="success" plain @click="tp标记完成(row)">标记完成</el-button>
                <el-button v-if="row.status !== 4 && row.status !== 6" size="small" type="warning" plain @click="tp申请退款(row)">申请退款</el-button>
                <el-button v-if="row.status === 6" size="small" type="danger" @click="tp确认退款完成(row)">确认退款完成</el-button>
                <!-- 复制下拉：仅账号 / 完整信息 -->
                <el-dropdown @command="(cmd) => tp处理复制命令(cmd, row)" trigger="click">
                  <el-button size="small">复制 <el-icon><ArrowDown /></el-icon></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="account">📋 仅复制充值账号</el-dropdown-item>
                      <el-dropdown-item command="full">📋 复制完整订单信息</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="tp当前页" v-model:page-size="tp每页数量" :total="tp总数" layout="total, prev, pager, next" class="分页器" @change="加载充值订单" />
        </el-card>
      </div>

    <!-- ============ 共用：备注弹窗 ============ -->
    <el-dialog v-model="显示备注弹窗" title="编辑备注" width="520px" :close-on-click-modal="false">
      <div class="备注弹窗内容">
        <p class="快捷标签标题">快捷追加：</p>
        <div class="快捷标签列表">
          <el-tag
            v-for="标签 in 当前快捷备注标签"
            :key="标签"
            type="info"
            effect="plain"
            style="cursor:pointer;margin:4px"
            @click="追加快捷标签(标签)"
          >{{ 标签 }}</el-tag>
        </div>
        <el-input v-model="备注表单.内容" type="textarea" :rows="3" placeholder="请输入备注内容（点击上方标签可快速追加）" style="margin-top:12px" />
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

    <!-- 家政：失败原因输入弹窗 -->
    <el-dialog v-model="显示失败原因输入弹窗" title="填写失败原因" width="400px" :close-on-click-modal="false">
      <el-input v-model="失败原因表单.原因" type="textarea" rows="4" placeholder="请填写失败原因（可选）" />
      <template #footer>
        <el-button @click="显示失败原因输入弹窗 = false">取消</el-button>
        <el-button type="danger" @click="jz确认标记失败">确认标记失败</el-button>
      </template>
    </el-dialog>

    <!-- 家政：查看失败原因弹窗 -->
    <el-dialog v-model="显示查看失败原因弹窗" title="失败原因" width="400px">
      <p style="white-space:pre-wrap;color:#333">{{ 当前查看失败原因 }}</p>
      <template #footer>
        <el-button type="primary" @click="显示查看失败原因弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 洗衣：订单详情弹窗 -->
    <el-dialog v-model="显示洗衣详情弹窗" title="洗衣订单详情" width="700px">
      <template v-if="洗衣详情数据">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ 洗衣详情数据.order_no }}</el-descriptions-item>
          <el-descriptions-item label="卡密">{{ 洗衣详情数据.card_code }}</el-descriptions-item>
          <el-descriptions-item v-if="洗衣详情数据.ecommerce_order_no" label="电商平台单号" :span="2">
            <span style="color:#409eff;font-weight:600;font-size:14px">{{ 洗衣详情数据.ecommerce_order_no }}</span>
            <el-tag size="small" type="info" style="margin-left:8px">电商单号</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="取件人">{{ 洗衣详情数据.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ 洗衣详情数据.phone }}</el-descriptions-item>
          <el-descriptions-item label="取件地址" :span="2">{{ 洗衣详情数据.full_address }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ 洗衣详情数据.return_name || 洗衣详情数据.name }}</el-descriptions-item>
          <el-descriptions-item label="收件手机">{{ 洗衣详情数据.return_phone || 洗衣详情数据.phone }}</el-descriptions-item>
          <el-descriptions-item label="收件地址" :span="2">
            <span v-if="(洗衣详情数据.return_province || '') + (洗衣详情数据.return_city || '') + (洗衣详情数据.return_district || '') + (洗衣详情数据.return_address || '')">
              {{ (洗衣详情数据.return_province || '') + (洗衣详情数据.return_city || '') + (洗衣详情数据.return_district || '') + (洗衣详情数据.return_address || '') }}
            </span>
            <span v-else style="color:#bbb">与取件地址相同</span>
          </el-descriptions-item>
          <el-descriptions-item label="取件时间">{{ 洗衣详情数据.visit_date }} {{ 洗衣详情数据.visit_time }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ 洗衣详情数据.service_type }}</el-descriptions-item>
          <el-descriptions-item label="鲸蚁订单号">{{ 洗衣详情数据.laundry_order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="洗衣状态">{{ 洗衣详情数据.laundry_status || '-' }}</el-descriptions-item>
          <el-descriptions-item label="取件快递单号">{{ 洗衣详情数据.express_order_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="回寄快递单号">{{ 洗衣详情数据.return_waybill_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="洗衣工厂">{{ 洗衣详情数据.factory_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工厂代码">{{ 洗衣详情数据.factory_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="xi获取状态类型(洗衣详情数据.status)" size="small">{{ xi获取状态文字(洗衣详情数据.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ 格式化北京时间(洗衣详情数据.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ 洗衣详情数据.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <!-- 预检图片 -->
        <div v-if="xi详情预检图片.length" style="margin-top:16px">
          <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:8px">🖼️ 预检图片</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <el-image v-for="(图片, 索引) in xi详情预检图片" :key="索引" :src="图片" style="width:100px;height:100px;border-radius:4px;object-fit:cover" :preview-src-list="xi详情预检图片" :initial-index="索引" fit="cover" />
          </div>
        </div>
        <!-- 操作日志 -->
        <div v-if="洗衣详情数据.order_log?.length" style="margin-top:16px">
          <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:8px">操作日志</div>
          <el-timeline>
            <el-timeline-item v-for="(日志, 索引) in 洗衣详情数据.order_log" :key="索引" :type="日志.状态 === 'success' ? 'success' : (日志.状态 === 'error' ? 'danger' : 'primary')" :timestamp="日志.时间" placement="top">
              {{ 日志.操作 }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <template #footer>
        <el-button type="primary" @click="显示洗衣详情弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 洗衣：物流查询弹窗 -->
    <el-dialog v-model="显示物流弹窗" title="📋 物流追踪" width="600px" :close-on-click-modal="false">
      <div v-if="物流加载中" style="text-align:center;padding:40px 0">
        <div style="color:#999;font-size:14px">正在查询物流信息…</div>
      </div>
      <div v-else-if="物流信息 && (物流信息.collectorName || (物流信息.routes && 物流信息.routes.length))">
        <el-descriptions v-if="物流信息.collectorName" :column="2" border style="margin-bottom:16px">
          <el-descriptions-item label="快递员">{{ 物流信息.collectorName }}</el-descriptions-item>
          <el-descriptions-item label="快递员电话">{{ 物流信息.collectorPhone }}</el-descriptions-item>
          <el-descriptions-item label="物流单号" :span="2">{{ 物流信息.logisticsNumber }}</el-descriptions-item>
        </el-descriptions>
        <el-timeline v-if="物流信息.routes && 物流信息.routes.length">
          <el-timeline-item v-for="(路由, 索引) in 物流信息.routes" :key="索引" :timestamp="路由.operationTime" placement="top">
            <el-card shadow="never">
              <div style="font-weight:bold">{{ 路由.title }}</div>
              <div style="color:#666;margin-top:4px;font-size:13px">{{ 路由.remark }}</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无物流轨迹" />
      </div>
      <el-empty v-else description="暂无物流信息，请等待快递分配" />
      <template #footer>
        <el-button @click="显示物流弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 洗衣：修改预约弹窗 -->
    <el-dialog v-model="显示修改预约弹窗" title="✏️ 修改预约信息" width="600px" :close-on-click-modal="false">
      <el-form :model="修改预约表单" label-width="100px">
        <el-form-item label="预约日期">
          <el-date-picker v-model="修改预约表单.visit_date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="取件时间段">
          <el-input v-model="修改预约表单.visit_time" placeholder="如：09:00-10:00" style="width:100%" />
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
        <el-button type="primary" :loading="修改保存中" @click="xi保存修改预约">保存</el-button>
      </template>
    </el-dialog>

    <!-- 充值：订单详情弹窗 -->
    <el-dialog v-model="显示充值详情弹窗" title="充值订单详情" width="700px">
      <template v-if="充值详情数据">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ 充值详情数据.order_no }}</el-descriptions-item>
          <el-descriptions-item label="卡密">{{ 充值详情数据.card_code }}</el-descriptions-item>
          <el-descriptions-item v-if="充值详情数据.ecommerce_order_no" label="电商平台单号" :span="2">
            <span style="color:#409eff;font-weight:600;font-size:14px">{{ 充值详情数据.ecommerce_order_no }}</span>
            <el-tag size="small" type="info" style="margin-left:8px">电商单号</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="充值账号">
            {{ 充值详情数据.topup_account || '-' }}
            <el-button v-if="充值详情数据.topup_account" link size="small" style="margin-left:6px;color:#409eff" @click="复制到剪贴板(充值详情数据.topup_account, '账号已复制')">📋 复制</el-button>
          </el-descriptions-item>
          <el-descriptions-item label="账号类型">{{ 账号类型中文(充值详情数据.topup_account_type) }}</el-descriptions-item>
          <el-descriptions-item label="充值会员">{{ 充值详情数据.topup_member_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计到账时间">{{ 充值详情数据.topup_arrival_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="会员是否到期">
            <el-tag v-if="充值详情数据.topup_is_expired === 1" type="danger" size="small">已到期</el-tag>
            <el-tag v-else-if="充值详情数据.topup_is_expired === 0" type="success" size="small">未到期</el-tag>
            <span v-else style="color:#bbb">-（未填写/不适用）</span>
          </el-descriptions-item>
          <el-descriptions-item label="登录城市">{{ 充值详情数据.login_city || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录IP">{{ 充值详情数据.login_ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="tp获取状态类型(充值详情数据.status)" size="small">{{ tp获取状态文字(充值详情数据.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ 格式化北京时间(充值详情数据.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ 充值详情数据.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <!-- 操作日志 -->
        <div v-if="充值详情数据.order_log?.length" style="margin-top:16px">
          <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:8px">操作日志</div>
          <el-timeline>
            <el-timeline-item v-for="(日志, 索引) in 充值详情数据.order_log" :key="索引" :type="日志.状态 === 'success' ? 'success' : (日志.状态 === 'error' ? 'danger' : 'primary')" :timestamp="日志.时间" placement="top">
              {{ 日志.操作 }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
      <template #footer>
        <el-button type="primary" @click="显示充值详情弹窗 = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 家政：订单详情弹窗 -->
    <el-dialog
      v-model="显示家政详情弹窗"
      title="🏠 家政订单详情"
      width="860px"
      :close-on-click-modal="false"
    >
      <div v-loading="家政详情加载中" style="min-height:200px">
        <el-row :gutter="16" v-if="家政详情数据.id">
          <el-col :span="16">
            <el-descriptions title="客户信息" :column="2" border>
              <el-descriptions-item label="订单编号">{{ 家政详情数据.order_no }}</el-descriptions-item>
              <el-descriptions-item label="卡密">{{ 家政详情数据.card_code }}</el-descriptions-item>
              <el-descriptions-item v-if="家政详情数据.ecommerce_order_no" label="电商平台单号" :span="2">
                <span style="color:#409eff;font-weight:600;font-size:14px">{{ 家政详情数据.ecommerce_order_no }}</span>
                <el-tag size="small" type="info" style="margin-left:8px">电商单号</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="姓名">{{ 家政详情数据.name }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ 家政详情数据.phone }}</el-descriptions-item>
              <el-descriptions-item label="服务地址" :span="2">{{ 家政详情数据.full_address }}</el-descriptions-item>
              <el-descriptions-item label="服务类型">{{ 家政详情数据.service_type }}</el-descriptions-item>
              <el-descriptions-item label="服务时长">{{ 家政详情数据.service_hours }}小时</el-descriptions-item>
              <el-descriptions-item label="预约时间" :span="2">
                <template v-if="解析多选时间(家政详情数据.visit_times).length > 0">
                  <div v-for="(项, 索引) in 解析多选时间(家政详情数据.visit_times)" :key="索引" style="font-size:13px;line-height:1.8">
                    {{ ['🥇','🥈','🥉'][索引] || `${索引+1}.` }} {{ 项.date }} {{ 项.time }}
                    <el-tag v-if="索引 === 0" type="danger" size="small">优先</el-tag>
                    <el-tag v-else type="info" size="small">备选</el-tag>
                  </div>
                </template>
                <template v-else>{{ 家政详情数据.visit_date }} {{ 家政详情数据.visit_time }}</template>
              </el-descriptions-item>
              <el-descriptions-item v-if="家政详情数据.remark" label="备注" :span="2">
                <span style="white-space:pre-wrap;color:#555">{{ 家政详情数据.remark }}</span>
              </el-descriptions-item>
            </el-descriptions>
            <el-descriptions title="下单状态" :column="2" border style="margin-top:16px">
              <el-descriptions-item label="状态">
                <el-tag :type="jz获取状态类型(家政详情数据.status)">{{ jz获取状态文字(家政详情数据.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="下单方式">{{ 家政详情数据.auto_order ? '自动下单' : '手动下单' }}</el-descriptions-item>
              <el-descriptions-item label="京东订单号">{{ 家政详情数据.jd_order_id || '暂无' }}</el-descriptions-item>
              <el-descriptions-item label="使用账号ID">{{ 家政详情数据.jd_account_id || '暂无' }}</el-descriptions-item>
              <el-descriptions-item v-if="家政详情数据.fail_reason" label="失败原因" :span="2">
                <span style="color:#F56C6C">{{ 家政详情数据.fail_reason }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="8">
            <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:8px">操作日志</div>
            <el-timeline v-if="家政详情日志.length > 0">
              <el-timeline-item
                v-for="(日志, 索引) in 家政详情日志"
                :key="索引"
                :type="日志.状态 === 'success' ? 'success' : 日志.状态 === 'error' ? 'danger' : 'primary'"
                :timestamp="日志.时间"
                placement="top"
              >{{ 日志.操作 }}</el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无操作日志" />
          </el-col>
        </el-row>
        <el-empty v-else-if="!家政详情加载中" description="暂无数据" />
      </div>
      <template #footer>
        <el-button @click="显示家政详情弹窗 = false">关闭</el-button>
        <el-button
          v-if="家政详情数据.status === 0 || 家政详情数据.status === 5"
          type="primary"
          @click="jz触发下单(家政详情数据.id); 显示家政详情弹窗 = false"
        >🤖 自动下单</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  获取订单列表API, 获取订单详情API, 更新订单状态API, 触发自动下单API, 重置订单API, 更新订单备注API,
  上传备注图片API, 导出家政订单API, 订单页搜索家政卡密API, 作废卡密API,
  申请退款API, 确认退款完成API, 获取家政预览卡密API,
  获取洗衣订单列表API, 获取洗衣订单详情API, 触发洗衣API下单, 取消洗衣订单API,
  重置洗衣订单API, 修改洗衣订单API, 查询洗衣物流API, 更新洗衣订单备注API,
  申请洗衣退款API, 确认洗衣退款完成API, 导出洗衣订单API, 订单页搜索洗衣卡密API, 作废洗衣卡密API,
  获取洗衣预览卡密API,
  获取充值订单列表API, 获取充值订单详情API, 更新充值订单状态API, 更新充值订单备注API,
  申请充值退款API, 确认充值退款完成API, 导出充值订单API, 订单页搜索充值卡密API, 作废充值卡密API,
  获取充值预览卡密API,
  统一获取卡密列表API,
  获取设置API, 获取订单角标数量API
} from '../api/index'

const router = useRouter()

// ==================== 工具函数 ====================

// 格式化北京时间 YYYY-MM-DD HH:mm
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

// 解析备注图片JSON数组
const 解析备注图片 = (imagesJson) => {
  if (!imagesJson) return []
  try { return JSON.parse(imagesJson) } catch { return [] }
}

// 解析多选时间（按优先级排序）
const 解析多选时间 = (visitTimes) => {
  if (!visitTimes) return []
  try {
    const 列表 = JSON.parse(visitTimes)
    if (!Array.isArray(列表) || 列表.length === 0) return []
    return [...列表].sort((a, b) => (a.priority || 0) - (b.priority || 0))
  } catch { return [] }
}

// 带降级的复制函数（兼容非HTTPS环境）
const 复制到剪贴板 = (文本, 提示 = '复制成功') => {
  const fallback = () => {
    const el = document.createElement('textarea')
    el.value = 文本
    el.style.cssText = 'position:fixed;opacity:0;top:-9999px;left:-9999px'
    document.body.appendChild(el)
    el.focus()
    el.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch {}
    document.body.removeChild(el)
    if (ok) ElMessage.success(提示)
    else ElMessage.error('复制失败，请手动复制')
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(文本).then(() => ElMessage.success(提示), () => fallback())
  } else {
    fallback()
  }
}

// 安全JSON解析
const 安全解析JSON = (str, 默认值) => {
  if (!str) return 默认值
  try { return JSON.parse(str) } catch { return 默认值 }
}

// ==================== 状态工具 ====================

const jz获取状态类型 = (status) => {
  const m = { 0: 'info', 1: 'primary', 2: 'success', 3: 'success', 4: 'info', 5: 'danger', 6: 'warning' }
  return m[status] || 'info'
}
const jz获取状态文字 = (status) => {
  const m = { 0: '待处理', 1: '处理中', 2: '服务中', 3: '已完成', 4: '已取消', 5: '失败', 6: '拒绝退款' }
  return m[status] || '未知'
}

const xi获取状态类型 = (status) => {
  const m = { 0: 'info', 1: 'primary', 2: 'success', 3: 'success', 4: 'info', 5: 'danger', 6: 'warning' }
  return m[status] || 'info'
}
const xi获取状态文字 = (status) => {
  const m = { 0: '待处理', 1: '处理中', 2: '服务中', 3: '已完成', 4: '已取消', 5: '失败', 6: '拒绝退款' }
  return m[status] || '未知'
}

const 获取洗衣状态类型 = (laundryStatus) => {
  if (['取消', '已取消'].includes(laundryStatus)) return 'danger'
  if (['已送达', '完成'].includes(laundryStatus)) return 'success'
  if (['已分配', '已取件', '已入厂', '已回寄'].includes(laundryStatus)) return 'primary'
  return 'info'
}

const tp获取状态类型 = (status) => {
  const m = { 0: 'info', 1: 'primary', 2: 'success', 3: 'success', 4: 'info', 5: 'danger', 6: 'warning' }
  return m[status] || 'info'
}
const tp获取状态文字 = (status) => {
  const m = { 0: '待处理', 1: '处理中', 2: '服务中', 3: '已完成', 4: '已取消', 5: '失败', 6: '拒绝退款' }
  return m[status] || '未知'
}

// 账号脱敏显示
const 脱敏账号 = (account, accountType) => {
  if (!account) return '-'
  if (account.length <= 4) return account
  if (accountType === 'phone') return account.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  const start = Math.max(1, Math.floor(account.length * 0.3))
  const end = Math.max(start + 1, Math.floor(account.length * 0.7))
  return account.slice(0, start) + '****' + account.slice(end)
}

const 账号类型中文 = (type) => {
  const m = { phone: '手机号', wechat: '微信号', qq: 'QQ号', email: '邮箱', other: '其他' }
  return m[type] || type || '-'
}

// ==================== 共享状态 ====================

const 当前Tab = ref('jiazheng')
const 站点域名 = ref('')
const 预览链接 = ref('')
const 角标数量 = ref({ jiazheng: 0, xiyifu: 0, topup: 0 })
const 导出中 = ref(false)
const 拒绝退款订单数 = ref(0)

// 加载拒绝退款(status=6)订单总数（统计全部业务类型）
const 加载拒绝退款订单数 = async () => {
  try {
    const [r1, r2, r3] = await Promise.allSettled([
      获取订单列表API({ business_type: 'jiazheng', status: 6, page: 1, limit: 1 }),
      获取洗衣订单列表API({ status: 6, page: 1, limit: 1 }),
      获取充值订单列表API({ status: 6, page: 1, limit: 1 }),
    ])
    let total = 0
    if (r1.status === 'fulfilled' && r1.value?.code === 1) total += r1.value.data?.total || 0
    if (r2.status === 'fulfilled' && r2.value?.code === 1) total += r2.value.data?.total || 0
    if (r3.status === 'fulfilled' && r3.value?.code === 1) total += r3.value.data?.total || 0
    拒绝退款订单数.value = total
  } catch {}
}

// 订单行样式：status=6 的订单高亮为橙色
const 获取订单行样式 = ({ row }) => {
  return row.status === 6 ? '拒绝退款行' : ''
}

// 快速筛选拒绝退款订单（切换到家政Tab并筛选status=6）
const 快速筛选拒绝退款订单 = async () => {
  const [r1, r2, r3] = await Promise.allSettled([
    获取订单列表API({ business_type: 'jiazheng', status: 6, page: 1, limit: 1 }),
    获取洗衣订单列表API({ status: 6, page: 1, limit: 1 }),
    获取充值订单列表API({ status: 6, page: 1, limit: 1 }),
  ])
  const jz数量 = (r1.status === 'fulfilled' && r1.value?.code === 1) ? (r1.value.data?.total || 0) : 0
  const xi数量 = (r2.status === 'fulfilled' && r2.value?.code === 1) ? (r2.value.data?.total || 0) : 0
  const tp数量 = (r3.status === 'fulfilled' && r3.value?.code === 1) ? (r3.value.data?.total || 0) : 0

  if (jz数量 > 0) {
    jz搜索条件.value.status = '6'
    当前Tab.value = 'jiazheng'
    jz当前页.value = 1
    加载家政订单()
  } else if (xi数量 > 0) {
    xi搜索条件.value.status = '6'
    当前Tab.value = 'xiyifu'
    xi当前页.value = 1
    加载洗衣订单()
  } else if (tp数量 > 0) {
    tp搜索条件.value.status = '6'
    当前Tab.value = 'topup'
    tp当前页.value = 1
    加载充值订单()
  } else {
    jz搜索条件.value.status = '6'
    当前Tab.value = 'jiazheng'
    jz当前页.value = 1
    加载家政订单()
  }
}

// Tab 列表（含第4个空调订单预留位）
const Tab列表 = computed(() => [
  { key: 'jiazheng', icon: '🏠', label: '家政订单', badge: 角标数量.value.jiazheng || 0 },
  { key: 'xiyifu', icon: '🧺', label: '洗衣订单', badge: 角标数量.value.xiyifu || 0 },
  { key: 'topup', icon: '💳', label: '充值订单', badge: 角标数量.value.topup || 0 },
  { key: 'aircon', icon: '❄️', label: '空调订单', badge: 0, disabled: true },
])

// ==================== 卡密作废（共享） ====================

const 显示卡密作废弹窗 = ref(false)
const 卡密作废业务 = ref('jiazheng')
const 卡密搜索关键词 = ref('')
const 卡密搜索结果 = ref([])
const 卡密搜索中 = ref(false)

const 打开卡密作废弹窗 = (businessType) => {
  卡密作废业务.value = businessType
  卡密搜索关键词.value = ''
  卡密搜索结果.value = []
  显示卡密作废弹窗.value = true
}

const 搜索卡密 = async () => {
  if (!卡密搜索关键词.value.trim()) { ElMessage.warning('请输入卡密码'); return }
  卡密搜索中.value = true
  const 业务 = 卡密作废业务.value
  const 旧接口Map = {
    jiazheng: 订单页搜索家政卡密API,
    xiyifu: 订单页搜索洗衣卡密API,
    topup: 订单页搜索充值卡密API,
  }
  try {
    const [旧结果, 新结果] = await Promise.allSettled([
      旧接口Map[业务](卡密搜索关键词.value.trim()),
      统一获取卡密列表API({ keyword: 卡密搜索关键词.value.trim(), business_type: 业务, limit: 20, page: 1 }),
    ])
    let 结果列表 = []
    if (旧结果.status === 'fulfilled' && 旧结果.value?.code === 1) {
      结果列表 = [...(旧结果.value.data || [])]
    }
    if (新结果.status === 'fulfilled' && 新结果.value?.code === 1) {
      const 新卡密列表 = 新结果.value.data?.list || []
      const 已有codes = new Set(结果列表.map(c => c.code))
      新卡密列表.forEach(c => {
        if (!已有codes.has(c.code)) 结果列表.push(c)
      })
    }
    卡密搜索结果.value = 结果列表
    if (!结果列表.length) ElMessage.info('未找到匹配的卡密')
  } catch { ElMessage.error('搜索卡密失败') } finally { 卡密搜索中.value = false }
}

const 确认作废卡密 = async (行) => {
  const voidApiMap = {
    jiazheng: 作废卡密API,
    xiyifu: 作废洗衣卡密API,
    topup: 作废充值卡密API,
  }
  try {
    await ElMessageBox.confirm(
      `确定要作废卡密 ${行.code} 吗？作废后客户将无法使用该卡密，且操作不可逆。`,
      '确认作废',
      { confirmButtonText: '确认作废', cancelButtonText: '取消', type: 'warning' }
    )
    const 结果 = await voidApiMap[卡密作废业务.value](行.id)
    if (结果.code === 1) {
      ElMessage.success(`卡密 ${行.code} 已作废`)
      卡密搜索结果.value = []
    } else {
      ElMessage.warning(结果.message || '作废失败')
    }
  } catch (e) { if (e !== 'cancel') ElMessage.error('作废失败，请重试') }
}

// ==================== 预览前端 ====================

const 打开前端预览 = async (businessType) => {
  const apiMap = {
    jiazheng: 获取家政预览卡密API,
    xiyifu: 获取洗衣预览卡密API,
    topup: 获取充值预览卡密API,
  }
  const pathMap = { jiazheng: '/', xiyifu: '/xi/', topup: '/cz/' }
  try {
    const 结果 = await apiMap[businessType]()
    if (结果.code === 1 && 结果.data?.code) {
      const 链接 = `${站点域名.value || ''}${pathMap[businessType]}${结果.data.code}`
      预览链接.value = 链接
      window.open(链接, '_blank')
    } else {
      ElMessage.warning(结果.message || '请先生成对应卡密')
    }
  } catch { ElMessage.error('获取预览卡密失败') }
}

const 复制预览链接 = () => {
  if (预览链接.value) 复制到剪贴板(预览链接.value, '链接已复制')
}

// ==================== 导出CSV ====================

const 导出订单 = async (businessType) => {
  const exportApiMap = {
    jiazheng: () => 导出家政订单API({ ...jz搜索条件.value, ...(jz日期范围.value?.length === 2 ? { date_start: jz日期范围.value[0], date_end: jz日期范围.value[1] } : {}) }),
    xiyifu: () => 导出洗衣订单API({ ...xi搜索条件.value, ...(xi日期范围.value?.length === 2 ? { date_start: xi日期范围.value[0], date_end: xi日期范围.value[1] } : {}) }),
    topup: () => 导出充值订单API({ ...tp搜索条件.value, ...(tp日期范围.value?.length === 2 ? { date_start: tp日期范围.value[0], date_end: tp日期范围.value[1] } : {}) }),
  }
  const nameMap = { jiazheng: '家政', xiyifu: '洗衣', topup: '充值' }
  导出中.value = true
  try {
    const 响应 = await exportApiMap[businessType]()
    const url = window.URL.createObjectURL(new Blob([响应]))
    const a = document.createElement('a')
    a.href = url
    a.download = `${nameMap[businessType]}订单_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch { ElMessage.error('导出失败') } finally { 导出中.value = false }
}

// ==================== Tab 切换 ====================

const 切换Tab = (tabName) => {
  当前Tab.value = tabName
  if (tabName === 'jiazheng' && jz订单列表.value.length === 0) 加载家政订单()
  if (tabName === 'xiyifu' && xi订单列表.value.length === 0) 加载洗衣订单()
  if (tabName === 'topup' && tp订单列表.value.length === 0) 加载充值订单()
}

// ==================== 家政订单状态 ====================

const jz搜索条件 = ref({ keyword: '', status: '' })
const jz日期范围 = ref([])
const jz订单列表 = ref([])
const jz总数 = ref(0)
const jz当前页 = ref(1)
const jz每页数量 = ref(20)
const jz加载中 = ref(false)

// 家政：失败原因弹窗
const 显示失败原因输入弹窗 = ref(false)
const 失败原因表单 = ref({ 原因: '' })
const 当前失败行 = ref(null)

// 家政：查看失败原因弹窗
const 显示查看失败原因弹窗 = ref(false)
const 当前查看失败原因 = ref('')

// 家政：订单详情弹窗
const 显示家政详情弹窗 = ref(false)
const 家政详情数据 = ref({})
const 家政详情日志 = ref([])
const 家政详情加载中 = ref(false)

const 加载家政订单 = async () => {
  jz加载中.value = true
  try {
    const 参数 = {
      business_type: 'jiazheng',
      page: jz当前页.value,
      limit: jz每页数量.value,
      ...jz搜索条件.value,
    }
    if (jz日期范围.value?.length === 2) {
      参数.date_start = jz日期范围.value[0]
      参数.date_end = jz日期范围.value[1]
    }
    const 结果 = await 获取订单列表API(参数)
    if (结果.code === 1) {
      jz订单列表.value = 结果.data.list || 结果.data.rows || []
      jz总数.value = 结果.data.total || 结果.data.count || 0
    }
  } catch { ElMessage.error('加载家政订单失败') } finally { jz加载中.value = false }
}

const jz搜索 = () => { jz当前页.value = 1; 加载家政订单() }
const jz重置 = () => {
  jz搜索条件.value = { keyword: '', status: '' }
  jz日期范围.value = []
  jz当前页.value = 1
  加载家政订单()
}

const jz查看详情 = async (id) => {
  显示家政详情弹窗.value = true
  家政详情加载中.value = true
  家政详情数据.value = {}
  家政详情日志.value = []
  try {
    const 结果 = await 获取订单详情API(id)
    if (结果.code === 1) {
      家政详情数据.value = 结果.data
      家政详情日志.value = Array.isArray(结果.data.order_log) ? 结果.data.order_log : []
    }
  } catch {
    ElMessage.error('加载详情失败')
  } finally {
    家政详情加载中.value = false
  }
}

const jz触发下单 = async (id) => {
  try {
    const 结果 = await 触发自动下单API(id)
    if (结果.code === 1) { ElMessage.success('已触发自动下单'); 加载家政订单() }
    else ElMessage.warning(结果.message || '触发失败')
  } catch { ElMessage.error('操作失败') }
}

const jz手动标记 = async (行, 状态) => {
  const 文字Map = { 2: '服务中', 3: '已完成' }
  try {
    await ElMessageBox.confirm(`确认将订单标记为"${文字Map[状态]}"？`, '确认', { type: 'success' })
    const 结果 = await 更新订单状态API(行.id, { status: 状态 })
    if (结果.code === 1) { ElMessage.success('状态已更新'); 加载家政订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const jz标记预约失败 = (行) => {
  当前失败行.value = 行
  失败原因表单.value.原因 = ''
  显示失败原因输入弹窗.value = true
}

const jz确认标记失败 = async () => {
  if (!当前失败行.value) return
  try {
    const 结果 = await 更新订单状态API(当前失败行.value.id, { status: 5, fail_reason: 失败原因表单.value.原因 })
    if (结果.code === 1) {
      ElMessage.success('已标记为失败')
      显示失败原因输入弹窗.value = false
      加载家政订单()
    } else {
      ElMessage.warning(结果.message || '操作失败')
    }
  } catch { ElMessage.error('操作失败') }
}

const 查看家政失败原因 = (行) => {
  当前查看失败原因.value = 行.fail_reason || '（无原因）'
  显示查看失败原因弹窗.value = true
}

const jz标记取消 = async (id) => {
  try {
    await ElMessageBox.confirm('确认取消该订单？', '确认', { type: 'warning' })
    const 结果 = await 更新订单状态API(id, { status: 4 })
    if (结果.code === 1) { ElMessage.success('订单已取消'); 加载家政订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const jz执行重置 = async (id) => {
  try {
    await ElMessageBox.confirm('重置订单后状态将变为"待处理"，确认继续？', '确认重置', { type: 'warning' })
    const 结果 = await 重置订单API(id)
    if (结果.code === 1) { ElMessage.success('订单已重置'); 加载家政订单() }
    else ElMessage.warning(结果.message || '重置失败')
  } catch {}
}

const jz申请退款 = async (行) => {
  try {
    await ElMessageBox.confirm('申请退款后订单状态改为"退款处理中"，确认继续？', '申请退款', { type: 'warning' })
    const 结果 = await 申请退款API(行.id)
    if (结果.code === 1) { ElMessage.success('已申请退款'); 加载家政订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const jz确认退款完成 = async (行) => {
  try {
    await ElMessageBox.confirm('确认退款完成后，卡密将被作废，订单状态改为"已取消"。确认继续？', '确认退款完成', { confirmButtonText: '确认退款完成', cancelButtonText: '取消', type: 'warning' })
    const 结果 = await 确认退款完成API(行.id)
    if (结果.code === 1) { ElMessage.success('退款完成，卡密已作废'); 加载家政订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const jz复制订单 = (行) => {
  const 文本 = [
    `姓名：${行.name || '-'}`,
    `手机：${行.phone || '-'}`,
    `城市：${行.city || '-'}`,
    `服务：${行.service_type || '-'}`,
    `卡密：${行.card_code || '-'}`,
    `订单号：${行.order_no || '-'}`,
  ].join('\n')
  复制到剪贴板(文本, '订单信息已复制')
}

// ==================== 洗衣订单状态 ====================

const xi搜索条件 = ref({ keyword: '', status: '' })
const xi日期范围 = ref([])
const xi订单列表 = ref([])
const xi总数 = ref(0)
const xi当前页 = ref(1)
const xi每页数量 = ref(20)
const xi加载中 = ref(false)

const 显示洗衣详情弹窗 = ref(false)
const 洗衣详情数据 = ref(null)

const 显示物流弹窗 = ref(false)
const 物流信息 = ref(null)
const 物流加载中 = ref(false)
const 当前物流订单 = ref(null)

const 显示修改预约弹窗 = ref(false)
const 修改预约表单 = ref({ visit_date: '', visit_time: '' })
const 当前修改订单 = ref(null)
const 修改保存中 = ref(false)

// 计算洗衣详情预检图片
const xi详情预检图片 = computed(() => {
  if (!洗衣详情数据.value?.laundry_images) return []
  const 图片 = 洗衣详情数据.value.laundry_images
  if (Array.isArray(图片)) return 图片
  try { return JSON.parse(图片) } catch { return [] }
})

const 加载洗衣订单 = async () => {
  xi加载中.value = true
  try {
    const 参数 = {
      page: xi当前页.value,
      limit: xi每页数量.value,
      ...xi搜索条件.value,
    }
    if (xi日期范围.value?.length === 2) {
      参数.date_start = xi日期范围.value[0]
      参数.date_end = xi日期范围.value[1]
    }
    const 结果 = await 获取洗衣订单列表API(参数)
    if (结果.code === 1) {
      xi订单列表.value = 结果.data.list || 结果.data.rows || []
      xi总数.value = 结果.data.total || 结果.data.count || 0
    }
  } catch { ElMessage.error('加载洗衣订单失败') } finally { xi加载中.value = false }
}

const xi搜索 = () => { xi当前页.value = 1; 加载洗衣订单() }
const xi重置 = () => {
  xi搜索条件.value = { keyword: '', status: '' }
  xi日期范围.value = []
  xi当前页.value = 1
  加载洗衣订单()
}

const xi查看详情 = async (id) => {
  try {
    const 结果 = await 获取洗衣订单详情API(id)
    if (结果.code === 1) {
      洗衣详情数据.value = { ...结果.data, order_log: 安全解析JSON(结果.data.order_log, []) }
      显示洗衣详情弹窗.value = true
    }
  } catch { ElMessage.error('获取详情失败') }
}

const xi触发下单 = async (id) => {
  try {
    const 结果 = await 触发洗衣API下单(id)
    if (结果.code === 1) { ElMessage.success('已触发下单'); 加载洗衣订单() }
    else ElMessage.warning(结果.message || '触发失败')
  } catch { ElMessage.error('操作失败') }
}

const xi取消订单 = async (id) => {
  try {
    await ElMessageBox.confirm('确认取消该洗衣订单？', '确认', { type: 'warning' })
    const 结果 = await 取消洗衣订单API(id)
    if (结果.code === 1) { ElMessage.success('订单已取消'); 加载洗衣订单() }
    else ElMessage.warning(结果.message || '取消失败')
  } catch {}
}

const xi执行重置 = async (id) => {
  try {
    await ElMessageBox.confirm('重置订单后状态将变为"待处理"，确认继续？', '确认重置', { type: 'warning' })
    const 结果 = await 重置洗衣订单API(id)
    if (结果.code === 1) { ElMessage.success('订单已重置'); 加载洗衣订单() }
    else ElMessage.warning(结果.message || '重置失败')
  } catch {}
}

const xi申请退款 = async (行) => {
  try {
    await ElMessageBox.confirm('申请退款后订单状态改为"退款处理中"，确认继续？', '申请退款', { type: 'warning' })
    const 结果 = await 申请洗衣退款API(行.id)
    if (结果.code === 1) { ElMessage.success('已申请退款'); 加载洗衣订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const xi确认退款完成 = async (行) => {
  try {
    await ElMessageBox.confirm('确认退款完成后，卡密将被作废，订单状态改为"已取消"。确认继续？', '确认退款完成', { confirmButtonText: '确认退款完成', cancelButtonText: '取消', type: 'warning' })
    const 结果 = await 确认洗衣退款完成API(行.id)
    if (结果.code === 1) { ElMessage.success('退款完成，卡密已作废'); 加载洗衣订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const xi打开物流弹窗 = async (行) => {
  当前物流订单.value = 行
  物流信息.value = null
  显示物流弹窗.value = true
  物流加载中.value = true
  try {
    const 结果 = await 查询洗衣物流API(行.id)
    if (结果.code === 1) 物流信息.value = 结果.data
    else ElMessage.warning(结果.message || '暂无物流信息')
  } catch { ElMessage.error('查询物流失败') } finally { 物流加载中.value = false }
}

const xi打开修改预约弹窗 = (行) => {
  当前修改订单.value = 行
  修改预约表单.value = {
    visit_date: 行.visit_date || '',
    visit_time: 行.visit_time || '',
    name: 行.name || '',
    phone: 行.phone || '',
    province: 行.province || '',
    city: 行.city || '',
    district: 行.district || '',
    address: 行.address || '',
    return_name: 行.return_name || '',
    return_phone: 行.return_phone || '',
    return_province: 行.return_province || '',
    return_city: 行.return_city || '',
    return_district: 行.return_district || '',
    return_address: 行.return_address || '',
  }
  显示修改预约弹窗.value = true
}

const xi保存修改预约 = async () => {
  if (!当前修改订单.value) return
  修改保存中.value = true
  try {
    const 结果 = await 修改洗衣订单API(当前修改订单.value.id, 修改预约表单.value)
    if (结果.code === 1) {
      ElMessage.success('修改成功')
      显示修改预约弹窗.value = false
      加载洗衣订单()
    } else {
      ElMessage.warning(结果.message || '修改失败')
    }
  } catch { ElMessage.error('保存失败') } finally { 修改保存中.value = false }
}

const xi复制订单 = (行) => {
  const 文本 = [
    `姓名：${行.name || '-'}`,
    `手机：${行.phone || '-'}`,
    `城市：${行.city || '-'}`,
    `取件时间：${行.visit_date || '-'} ${行.visit_time || ''}`,
    `商品：${行.service_type || '-'}`,
    `卡密：${行.card_code || '-'}`,
    `订单号：${行.order_no || '-'}`,
  ].join('\n')
  复制到剪贴板(文本, '订单信息已复制')
}

// ==================== 充值订单状态 ====================

const tp搜索条件 = ref({ keyword: '', member_name: '', status: '' })
const tp日期范围 = ref([])
const tp订单列表 = ref([])
const tp总数 = ref(0)
const tp当前页 = ref(1)
const tp每页数量 = ref(20)
const tp加载中 = ref(false)
const tp账号显示状态 = ref({})

const 显示充值详情弹窗 = ref(false)
const 充值详情数据 = ref(null)

const 加载充值订单 = async () => {
  tp加载中.value = true
  try {
    const 参数 = {
      page: tp当前页.value,
      limit: tp每页数量.value,
      ...tp搜索条件.value,
    }
    if (tp日期范围.value?.length === 2) {
      参数.date_start = tp日期范围.value[0]
      参数.date_end = tp日期范围.value[1]
    }
    const 结果 = await 获取充值订单列表API(参数)
    if (结果.code === 1) {
      tp订单列表.value = (结果.data.list || 结果.data.rows || []).map(o => ({
        ...o,
        order_log: 安全解析JSON(o.order_log, []),
      }))
      tp总数.value = 结果.data.total || 结果.data.count || 0
    }
  } catch { ElMessage.error('加载充值订单失败') } finally { tp加载中.value = false }
}

const tp搜索 = () => { tp当前页.value = 1; 加载充值订单() }
const tp重置 = () => {
  tp搜索条件.value = { keyword: '', member_name: '', status: '' }
  tp日期范围.value = []
  tp当前页.value = 1
  加载充值订单()
}

const tp查看详情 = async (id) => {
  try {
    const 结果 = await 获取充值订单详情API(id)
    if (结果.code === 1) {
      充值详情数据.value = { ...结果.data, order_log: 安全解析JSON(结果.data.order_log, []) }
      显示充值详情弹窗.value = true
    }
  } catch { ElMessage.error('获取详情失败') }
}

const tp标记完成 = async (行) => {
  try {
    await ElMessageBox.confirm('确认将此充值订单标记为已完成？', '确认', { type: 'success' })
    const 结果 = await 更新充值订单状态API(行.id, { status: 2 })
    if (结果.code === 1) { ElMessage.success('已标记为完成'); 加载充值订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const tp申请退款 = async (行) => {
  try {
    await ElMessageBox.confirm('申请退款后订单状态改为"退款处理中"，确认继续？', '申请退款', { type: 'warning' })
    const 结果 = await 申请充值退款API(行.id)
    if (结果.code === 1) { ElMessage.success('已申请退款'); 加载充值订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const tp确认退款完成 = async (行) => {
  try {
    await ElMessageBox.confirm('确认退款完成后，卡密将被作废，订单状态改为"已取消"。确认继续？', '确认退款完成', { confirmButtonText: '确认退款完成', cancelButtonText: '取消', type: 'warning' })
    const 结果 = await 确认充值退款完成API(行.id)
    if (结果.code === 1) { ElMessage.success('退款完成，卡密已作废'); 加载充值订单() }
    else ElMessage.warning(结果.message || '操作失败')
  } catch {}
}

const tp切换账号显示 = (id) => {
  tp账号显示状态.value[id] = !tp账号显示状态.value[id]
}

const tp复制账号 = (行) => {
  if (!行.topup_account) { ElMessage.warning('无充值账号'); return }
  复制到剪贴板(行.topup_account, `账号已复制`)
}

const tp处理复制命令 = (命令, 行) => {
  if (命令 === 'account') {
    tp复制账号(行)
  } else if (命令 === 'full') {
    const 文本 = [
      `充值账号：${行.topup_account || '-'}`,
      `账号类型：${账号类型中文(行.topup_account_type)}`,
      `充值会员：${行.topup_member_name || '-'}`,
      `预计到账：${行.topup_arrival_time || '-'}`,
      `登录城市：${行.login_city || '-'}`,
      `卡密：${行.card_code || '-'}`,
      `订单号：${行.order_no || '-'}`,
    ].join('\n')
    复制到剪贴板(文本, '订单信息已复制')
  }
}

// ==================== 共用备注弹窗 ====================

const 显示备注弹窗 = ref(false)
const 当前备注订单 = ref(null)
const 当前备注业务 = ref('jiazheng')
const 备注表单 = ref({ 内容: '' })
const 备注图片列表 = ref([])
const 图片上传中 = ref(false)
const 备注保存中 = ref(false)
const 拖拽中 = ref(false)

// 快捷标签按业务区分
const 快捷备注标签Map = {
  jiazheng: ['已联系客户', '需改期', '客户催单', '特殊要求', '已安排师傅', '客户已确认'],
  xiyifu: ['已取件', '已入厂', '质检中', '已回寄', '客户投诉', '特殊处理'],
  topup: ['账号已确认', '充值处理中', '已完成充值', '账号有误', '需验证', '客户已收到'],
}
const 当前快捷备注标签 = computed(() => 快捷备注标签Map[当前备注业务.value] || [])

const 打开备注弹窗 = (行, 业务) => {
  当前备注订单.value = 行
  当前备注业务.value = 业务
  备注表单.value.内容 = 行.remark || ''
  备注图片列表.value = 解析备注图片(行.remark_images)
  显示备注弹窗.value = true
}

const 追加快捷标签 = (标签) => {
  备注表单.value.内容 = 备注表单.value.内容 ? `${备注表单.value.内容}；${标签}` : 标签
}

const 清空备注 = () => {
  备注表单.value.内容 = ''
  备注图片列表.value = []
}

const 删除备注图片 = (索引) => { 备注图片列表.value.splice(索引, 1) }

const 上传图片 = async (file) => {
  图片上传中.value = true
  try {
    const fd = new FormData()
    fd.append('image', file)
    const r = await 上传备注图片API(fd)
    if (r.code === 1 && r.data?.url) 备注图片列表.value.push(r.data.url)
    else ElMessage.warning(r.message || '上传失败')
  } catch { ElMessage.error('图片上传失败') } finally { 图片上传中.value = false }
}

const 处理文件选择上传 = (file) => { if (file?.raw) 上传图片(file.raw) }

const 处理拖拽上传 = (e) => {
  拖拽中.value = false
  Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/')).forEach(f => 上传图片(f))
}

const 处理粘贴上传 = (e) => {
  Array.from(e.clipboardData?.items || []).filter(i => i.type.startsWith('image/')).forEach(item => {
    const blob = item.getAsFile()
    if (blob) 上传图片(blob)
  })
}

const 保存备注 = async () => {
  备注保存中.value = true
  const id = 当前备注订单.value.id
  const 内容 = 备注表单.value.内容
  const 图片 = 备注图片列表.value
  const apiMap = {
    jiazheng: () => 更新订单备注API(id, 内容, 图片),
    xiyifu: () => 更新洗衣订单备注API(id, { remark: 内容, remark_images: JSON.stringify(图片) }),
    topup: () => 更新充值订单备注API(id, { remark: 内容, remark_images: JSON.stringify(图片) }),
  }
  try {
    const 结果 = await apiMap[当前备注业务.value]()
    if (结果.code === 1) {
      ElMessage.success('备注保存成功')
      显示备注弹窗.value = false
      if (当前备注业务.value === 'jiazheng') 加载家政订单()
      else if (当前备注业务.value === 'xiyifu') 加载洗衣订单()
      else 加载充值订单()
    } else {
      ElMessage.warning(结果.message || '保存失败')
    }
  } catch { ElMessage.error('保存失败') } finally { 备注保存中.value = false }
}

// 备注弹窗开启时监听全局粘贴
watch(显示备注弹窗, (val) => {
  if (val) document.addEventListener('paste', 处理粘贴上传)
  else document.removeEventListener('paste', 处理粘贴上传)
})

// ==================== 初始化 ====================

onMounted(async () => {
  // 加载站点域名
  try {
    const r = await 获取设置API()
    if (r.code === 1) 站点域名.value = (r.data.site_url || '').replace(/\/$/, '')
  } catch {}

  // 加载角标数量
  try {
    const r = await 获取订单角标数量API()
    if (r.code === 1) 角标数量.value = r.data
  } catch {}

  // 加载拒绝退款订单数
  加载拒绝退款订单数()

  // 加载默认Tab数据
  加载家政订单()
})
</script>

<style scoped>
.订单中心 { padding: 0; }
.搜索卡片 { margin-bottom: 12px; }
.分页器 { margin-top: 16px; justify-content: flex-end; }
.备注摘要 { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: default; }
.快捷标签标题 { font-size: 13px; color: #666; margin-bottom: 4px; }
.快捷标签列表 { display: flex; flex-wrap: wrap; }
.备注图片区 { margin-top: 8px; }
.已上传图片列表 { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.已上传图片项 { position: relative; }
.删除图片按钮 { position: absolute; top: -8px; right: -8px; }
.图片上传区 { border: 2px dashed #ddd; border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.图片上传区:hover, .图片上传区.拖拽悬停 { border-color: #409eff; }
.上传提示 { display: flex; flex-direction: column; gap: 4px; color: #999; font-size: 13px; }
.上传进度 { color: #409eff; }

/* ===== 自定义订单Tab栏样式 ===== */
.订单Tab栏 {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  background: #f0f2f5;
  border-radius: 12px;
  padding: 4px;
}
.Tab按钮 {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  min-height: 64px;
}
.Tab按钮:hover:not(.Tab禁用):not(.Tab激活) {
  background: rgba(255,255,255,0.6);
}
.Tab激活 {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.Tab禁用 {
  cursor: not-allowed;
  opacity: 0.45;
}
.Tab图标 {
  font-size: 22px;
  margin-bottom: 3px;
  transition: transform 0.2s;
  display: block;
}
.Tab激活 .Tab图标 {
  transform: scale(1.15);
}
.Tab文字 {
  font-size: 13px;
  color: #888;
  font-weight: 400;
  transition: color 0.2s, font-weight 0.2s;
}
.Tab激活 .Tab文字 {
  color: #1989fa;
  font-weight: 700;
}
.Tab角标 {
  position: absolute;
  top: 6px;
  right: 12px;
  background: #f56c6c;
  color: white;
  border-radius: 10px;
  font-size: 11px;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
  line-height: 16px;
}
.Tab即将上线 {
  font-size: 10px;
  color: #bbb;
  margin-top: 2px;
  display: block;
}
.Tab激活::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: #1989fa;
}

/* ===== 拒绝退款订单行高亮 ===== */
:deep(.拒绝退款行) {
  background-color: #fff3e0 !important;
}
:deep(.拒绝退款行:hover > td) {
  background-color: #ffe0b2 !important;
}
</style>
