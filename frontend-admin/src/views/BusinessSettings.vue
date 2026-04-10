<template>
  <!-- 业务设置页面（统一管理家政/洗衣/充值/SUP设置） -->
  <div class="业务设置页面" v-loading="加载中">
    <el-tabs v-model="当前Tab" type="border-card">

      <!-- ===== Tab 1：通用设置 ===== -->
      <el-tab-pane label="⚙️ 通用设置" name="general">
        <el-form :model="设置表单" label-width="140px" style="max-width: 640px">
          <el-form-item label="站点域名">
            <el-input v-model="设置表单.site_url" placeholder="http://域名或IP:端口" />
            <div class="字段说明">填写后卡密管理页可一键复制带域名的完整链接</div>
          </el-form-item>
          <el-form-item label="快速跳转">
            <el-button @click="router.push('/admin/regions')">🗺️ 地区管理</el-button>
            <el-button @click="router.push('/admin/sub-accounts')" style="margin-left:8px">👥 子账号管理</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('general')">💾 保存通用设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 2：家政设置 ===== -->
      <el-tab-pane label="🏠 家政设置" name="jiazheng">
        <el-form :model="设置表单" label-width="140px" style="max-width: 680px">
          <el-form-item label="Banner图片URL">
            <el-input v-model="设置表单.banner_url" placeholder="输入Banner图片的URL地址" />
            <div class="字段说明">顶部横幅图片地址，留空显示默认样式</div>
          </el-form-item>
          <el-form-item label="服务类型">
            <el-input v-model="设置表单.service_type" placeholder="如：日常保洁" />
          </el-form-item>
          <el-form-item label="服务时长（小时）">
            <el-input-number v-model="设置表单.service_hours" :min="1" :max="24" />
          </el-form-item>

          <!-- 多备选时间设置分组 -->
          <div class="设置分组标题">── 多备选时间设置 ──</div>

          <el-form-item label="开启多备选时间预约">
            <el-switch
              v-model="设置表单.multi_time_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后客户可选择多个备用时间，提高预约成功率</div>
          </el-form-item>

          <el-form-item label="最多备选次数">
            <el-select v-model="设置表单.multi_time_max_count" style="width: 160px">
              <el-option label="1个（单次预约）" value="1" />
              <el-option label="2个" value="2" />
              <el-option label="3个" value="3" />
            </el-select>
            <div class="字段说明">客户最多可选择几个备用时间点</div>
          </el-form-item>

          <el-form-item label="客户端提示说明">
            <el-input
              v-model="设置表单.multi_time_tip"
              type="textarea"
              :rows="3"
              placeholder="为提高预约成功率，建议选择多个备用时间，客服将按您的优先顺序为您安排。"
            />
            <div class="字段说明">显示在客户时间选择界面顶部的说明文字</div>
          </el-form-item>

          <el-form-item label="至少选择数量">
            <el-select v-model="设置表单.multi_time_min_count" style="width: 200px">
              <el-option label="1个（不强制，推荐）" value="1" />
              <el-option label="2个" value="2" />
              <el-option label="3个" value="3" />
            </el-select>
            <div class="字段说明">客户至少需要选择几个时间才能提交预约（设为1则不强制）</div>
          </el-form-item>

          <el-form-item label="下单须知">
            <el-input
              v-model="设置表单.notice"
              type="textarea"
              :rows="8"
              placeholder="每行一条须知，换行分隔"
            />
          </el-form-item>
          <el-form-item label="自动下单">
            <el-switch
              v-model="设置表单.auto_order_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后，新订单会自动触发京东下单流程</div>
          </el-form-item>

          <!-- 弹窗提醒设置 -->
          <div class="设置分组标题">── 🔔 弹窗提醒设置 ──</div>

          <!-- 家政弹窗1：首页弹窗 -->
          <el-card class="弹窗配置卡片" style="margin-bottom: 16px">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>🏠 家政首页弹窗（popup1）</span>
                <el-switch v-model="设置表单.jz_popup1_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="设置表单.jz_popup1_title" placeholder="温馨提醒" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="设置表单.jz_popup1_content" type="textarea" :rows="3" placeholder="弹窗内容，支持换行" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="设置表单.jz_popup1_icon" placeholder="⚠️" style="width: 100px" />
              <span class="字段说明" style="margin-left:8px">输入Emoji图标</span>
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="设置表单.jz_popup1_title_color" show-alpha />
              <el-input v-model="设置表单.jz_popup1_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="设置表单.jz_popup1_content_color" show-alpha />
              <el-input v-model="设置表单.jz_popup1_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="设置表单.jz_popup1_bg_color" show-alpha />
              <el-input v-model="设置表单.jz_popup1_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="设置表单.jz_popup1_btn_text" placeholder="我知道了" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="设置表单.jz_popup1_btn_color" show-alpha />
              <el-input v-model="设置表单.jz_popup1_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="设置表单.jz_popup1_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="设置表单.jz_popup1_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <!-- 家政弹窗2：选时间弹窗 -->
          <el-card class="弹窗配置卡片" style="margin-bottom: 16px">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>⏰ 家政选时间弹窗（popup2）</span>
                <el-switch v-model="设置表单.jz_popup2_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="设置表单.jz_popup2_title" placeholder="退改签须知" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="设置表单.jz_popup2_content" type="textarea" :rows="3" placeholder="弹窗内容" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="设置表单.jz_popup2_icon" placeholder="📋" style="width: 100px" />
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="设置表单.jz_popup2_title_color" show-alpha />
              <el-input v-model="设置表单.jz_popup2_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="设置表单.jz_popup2_content_color" show-alpha />
              <el-input v-model="设置表单.jz_popup2_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="设置表单.jz_popup2_bg_color" show-alpha />
              <el-input v-model="设置表单.jz_popup2_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="设置表单.jz_popup2_btn_text" placeholder="我已知晓" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="设置表单.jz_popup2_btn_color" show-alpha />
              <el-input v-model="设置表单.jz_popup2_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="设置表单.jz_popup2_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="设置表单.jz_popup2_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('jiazheng')">💾 保存家政设置</el-button>
          </el-form-item>

          <!-- 内嵌家政时间规则管理 -->
          <div class="设置分组标题">── ⏰ 家政时间规则管理 ──</div>
          <div class="内嵌管理区">
            <div class="内嵌操作栏">
              <span style="font-size: 14px; color: #666">时间规则控制各城市预约前多少天显示"已约满"</span>
              <el-button type="primary" size="small" @click="jz新增规则">+ 新增规则</el-button>
            </div>
            <el-table :data="jz时间规则列表" v-loading="jz规则加载中" stripe size="small">
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
                  <el-button size="small" @click="jz编辑规则(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="jz删除规则(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 家政时间规则弹窗 -->
          <el-dialog v-model="jz显示规则弹窗" :title="jz当前编辑ID ? '编辑规则' : '新增规则'" width="560px">
            <el-form :model="jz规则表单" label-width="100px">
              <el-form-item label="规则类型">
                <el-radio-group v-model="jz规则表单.rule_type">
                  <el-radio-button value="city">城市精确匹配</el-radio-button>
                  <el-radio-button value="tier">地区等级匹配</el-radio-button>
                  <el-radio-button value="global">全局默认</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="规则名称">
                <el-input v-model="jz规则表单.rule_name" placeholder="如：一线城市规则" />
              </el-form-item>
              <el-form-item label="匹配城市" v-if="jz规则表单.rule_type !== 'global'">
                <el-input v-model="jz规则表单.match_value" placeholder="多个城市用逗号分隔，如：北京,上海,广州" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="锁定天数">
                <el-input-number v-model="jz规则表单.locked_days" :min="0" :max="30" />
                <span style="margin-left: 8px; color: #999; font-size: 12px">前N天显示"已约满"</span>
              </el-form-item>
              <el-form-item label="最远天数">
                <el-input-number v-model="jz规则表单.max_days" :min="7" :max="60" />
                <span style="margin-left: 8px; color: #999; font-size: 12px">最远可预约天数</span>
              </el-form-item>
              <el-form-item label="优先级">
                <el-input-number v-model="jz规则表单.sort_order" :min="1" :max="99" />
                <span style="margin-left: 8px; color: #999; font-size: 12px">数值越小优先级越高</span>
              </el-form-item>
              <el-form-item label="可选时间段">
                <el-checkbox-group v-model="jz规则表单.选中时间段">
                  <el-checkbox v-for="时间 in jz所有时间段" :key="时间" :label="时间" :value="时间" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="工作日">
                <el-checkbox-group v-model="jz规则表单.选中工作日">
                  <el-checkbox v-for="(名称, 索引) in jz星期名称" :key="索引" :label="名称" :value="索引 + 1" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="是否启用">
                <el-switch v-model="jz规则表单.is_active" :active-value="1" :inactive-value="0" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="jz显示规则弹窗 = false">取消</el-button>
              <el-button type="primary" @click="jz保存规则">保存</el-button>
            </template>
          </el-dialog>

          <!-- 内嵌京东账号管理 -->
          <div class="设置分组标题">── 👤 京东账号管理 ──</div>
          <div class="内嵌管理区">
            <div class="内嵌操作栏">
              <span style="font-size: 14px; color: #666">共 {{ jd账号列表.length }} 个账号</span>
              <el-button type="primary" size="small" @click="jd显示账号弹窗 = true">+ 添加账号</el-button>
            </div>
            <el-table :data="jd账号列表" v-loading="jd账号加载中" stripe size="small">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="nickname" label="备注名" width="120" />
              <el-table-column prop="username" label="账号" width="150" />
              <el-table-column label="账号状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                    {{ row.status === 1 ? '正常' : '异常' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="Cookie状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="jd检查Cookie是否有效(row) ? 'success' : 'warning'" size="small">
                    {{ jd检查Cookie是否有效(row) ? '有效' : '已过期' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="使用状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.is_busy ? 'warning' : 'success'" size="small">
                    {{ row.is_busy ? '使用中' : '空闲' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="use_count" label="今日次数" width="90" />
              <el-table-column prop="daily_limit" label="日限制" width="80" />
              <el-table-column prop="last_used" label="最后使用" width="160" />
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" type="primary" @click="jd触发自动登录(row.id)">自动登录</el-button>
                  <el-button size="small" @click="jd编辑账号(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="jd删除账号(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 京东账号编辑弹窗 -->
          <el-dialog v-model="jd显示账号弹窗" :title="jd编辑中ID ? '编辑账号' : '添加京东账号'" width="400px">
            <el-form :model="jd账号表单" label-width="80px">
              <el-form-item label="备注名">
                <el-input v-model="jd账号表单.nickname" placeholder="如：买家号1" />
              </el-form-item>
              <el-form-item label="账号">
                <el-input v-model="jd账号表单.username" placeholder="京东账号（手机号）" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model="jd账号表单.password" type="password" placeholder="京东密码" show-password />
              </el-form-item>
              <el-form-item label="日限制">
                <el-input-number v-model="jd账号表单.daily_limit" :min="1" :max="100" />
                <span style="margin-left: 8px; color: #999; font-size: 12px">单日最大下单次数</span>
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="jd显示账号弹窗 = false">取消</el-button>
              <el-button type="primary" @click="jd保存账号">保存</el-button>
            </template>
          </el-dialog>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 3：洗衣设置 ===== -->
      <el-tab-pane label="🧺 洗衣设置" name="xiyifu">
        <el-form :model="设置表单" label-width="160px" style="max-width: 680px">
          <el-form-item label="洗衣Banner URL">
            <el-input v-model="设置表单.laundry_banner_url" placeholder="Banner图片地址（可选）" />
            <div class="字段说明">显示在洗衣H5前端顶部的横幅图片</div>
          </el-form-item>
          <el-form-item label="下单须知">
            <el-input
              v-model="设置表单.laundry_notice"
              type="textarea"
              :rows="6"
              placeholder="每行一条须知，换行分隔"
            />
          </el-form-item>
          <el-form-item label="商品名称">
            <el-input v-model="设置表单.laundry_product_name" placeholder="如：任洗一件" />
            <div class="字段说明">显示在洗衣H5前端的默认商品名称</div>
          </el-form-item>
          <el-form-item label="商品价格（分）">
            <el-input-number v-model="设置表单.laundry_product_price" :min="0" style="width: 200px" />
            <div class="字段说明">单位：分，如1000=10元（用于推送到鲸蚁API）</div>
          </el-form-item>
          <el-form-item label="服务内容JSON">
            <el-input
              v-model="设置表单.laundry_service_content"
              type="textarea"
              :rows="6"
              placeholder='[{"icon":"👕","title":"专业洗护","desc":"标准清洗流程"}]'
            />
            <div class="字段说明">JSON格式，每项含 icon/title/desc 三个字段</div>
          </el-form-item>
          <el-form-item label="自动下单">
            <el-switch
              v-model="设置表单.laundry_auto_order_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后，新洗衣订单自动推送到鲸蚁API下单</div>
          </el-form-item>
          <el-form-item label="回调地址">
            <el-input :value="回调地址" readonly />
            <div class="字段说明">将此地址配置到鲸蚁系统，用于接收订单状态回调</div>
          </el-form-item>

          <!-- 鲸蚁API配置 -->
          <div class="设置分组标题">── 🔗 鲸蚁API配置 ──</div>

          <el-form-item label="API基础地址">
            <el-input v-model="设置表单.laundry_api_url" placeholder="如：https://api.jingyishenghua.com" />
            <div class="字段说明">鲸蚁生活系统的API地址</div>
          </el-form-item>
          <el-form-item label="AppID">
            <el-input v-model="设置表单.laundry_app_id" placeholder="在鲸蚁生活系统获取" />
            <div class="字段说明">在鲸蚁生活系统获取</div>
          </el-form-item>
          <el-form-item label="AppSecret">
            <el-input v-model="设置表单.laundry_app_secret" type="password" placeholder="AppSecret" show-password />
            <div class="字段说明">在鲸蚁生活系统获取</div>
          </el-form-item>
          <el-form-item label="TenantID">
            <el-input :value="设置表单.laundry_tenant_id || '（获取Token后自动填充）'" readonly style="background:#f5f5f5" />
            <div class="字段说明">获取Token后自动填充</div>
          </el-form-item>
          <el-form-item label="订单来源类型">
            <el-select v-model="设置表单.laundry_order_type" style="width: 200px">
              <el-option label="微信小程序 (50)" value="50" />
              <el-option label="抖音小程序 (60)" value="60" />
              <el-option label="快手小程序 (70)" value="70" />
            </el-select>
            <div class="字段说明">推送到鲸蚁API的订单来源平台标识，微信小程序填50</div>
          </el-form-item>

          <!-- Token状态 -->
          <div class="设置分组标题">── Token状态 ──</div>
          <el-form-item label="Token状态">
            <el-tag :type="Token状态类型" size="default">{{ Token状态文字 }}</el-tag>
          </el-form-item>
          <el-form-item v-if="Token过期时间文字" label="过期时间">
            <span class="字段只读值">{{ Token过期时间文字 }}</span>
          </el-form-item>
          <el-form-item>
            <el-button type="success" :loading="测试洗衣中" @click="测试洗衣连接">⚡ 测试连接 / 获取Token</el-button>
          </el-form-item>
          <el-alert
            v-if="测试洗衣结果"
            :title="测试洗衣结果.消息"
            :type="测试洗衣结果.成功 ? 'success' : 'error'"
            :closable="false"
            style="margin-bottom: 12px"
          />

          <!-- 弹窗提醒设置 -->
          <div class="设置分组标题">── 🔔 弹窗提醒设置 ──</div>

          <!-- 洗衣弹窗1：首页弹窗 -->
          <el-card class="弹窗配置卡片" style="margin-bottom: 16px">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>🏠 洗衣首页弹窗（popup1）</span>
                <el-switch v-model="设置表单.xi_popup1_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="设置表单.xi_popup1_title" placeholder="温馨提醒" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="设置表单.xi_popup1_content" type="textarea" :rows="3" placeholder="弹窗内容，支持换行" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="设置表单.xi_popup1_icon" placeholder="⚠️" style="width: 100px" />
              <span class="字段说明" style="margin-left:8px">输入Emoji图标</span>
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="设置表单.xi_popup1_title_color" show-alpha />
              <el-input v-model="设置表单.xi_popup1_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="设置表单.xi_popup1_content_color" show-alpha />
              <el-input v-model="设置表单.xi_popup1_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="设置表单.xi_popup1_bg_color" show-alpha />
              <el-input v-model="设置表单.xi_popup1_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="设置表单.xi_popup1_btn_text" placeholder="我知道了" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="设置表单.xi_popup1_btn_color" show-alpha />
              <el-input v-model="设置表单.xi_popup1_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="设置表单.xi_popup1_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="设置表单.xi_popup1_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <!-- 洗衣弹窗2：选时间弹窗 -->
          <el-card class="弹窗配置卡片" style="margin-bottom: 16px">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>⏰ 洗衣选时间弹窗（popup2）</span>
                <el-switch v-model="设置表单.xi_popup2_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="设置表单.xi_popup2_title" placeholder="取件时间说明" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="设置表单.xi_popup2_content" type="textarea" :rows="3" placeholder="弹窗内容" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="设置表单.xi_popup2_icon" placeholder="📦" style="width: 100px" />
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="设置表单.xi_popup2_title_color" show-alpha />
              <el-input v-model="设置表单.xi_popup2_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="设置表单.xi_popup2_content_color" show-alpha />
              <el-input v-model="设置表单.xi_popup2_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="设置表单.xi_popup2_bg_color" show-alpha />
              <el-input v-model="设置表单.xi_popup2_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="设置表单.xi_popup2_btn_text" placeholder="我知道了" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="设置表单.xi_popup2_btn_color" show-alpha />
              <el-input v-model="设置表单.xi_popup2_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="设置表单.xi_popup2_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="设置表单.xi_popup2_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('xiyifu')">💾 保存洗衣设置</el-button>
          </el-form-item>

          <!-- 内嵌洗衣时间规则管理 -->
          <div class="设置分组标题">── ⏰ 洗衣时间规则管理 ──</div>
          <div class="内嵌管理区">
            <div class="内嵌操作栏">
              <span style="font-size: 14px; color: #666">洗衣时间段格式：<strong>09:00-10:00</strong>（含开始和结束时间）</span>
              <el-button type="primary" size="small" @click="xi新增规则">+ 新增时间规则</el-button>
            </div>
            <el-table :data="xi时间规则列表" v-loading="xi规则加载中" stripe size="small">
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
                  {{ xi解析时间段显示(row.time_slots) }}
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
                  <el-button size="small" @click="xi编辑规则(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="xi删除规则(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 洗衣时间规则弹窗 -->
          <el-dialog v-model="xi显示规则弹窗" :title="xi当前编辑ID ? '编辑洗衣时间规则' : '新增洗衣时间规则'" width="580px">
            <el-form :model="xi规则表单" label-width="100px">
              <el-form-item label="规则类型">
                <el-radio-group v-model="xi规则表单.rule_type">
                  <el-radio-button value="city">城市精确匹配</el-radio-button>
                  <el-radio-button value="global">全局默认</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="规则名称">
                <el-input v-model="xi规则表单.rule_name" placeholder="如：全国洗衣时间规则" />
              </el-form-item>
              <el-form-item label="匹配城市" v-if="xi规则表单.rule_type !== 'global'">
                <el-input v-model="xi规则表单.match_value" placeholder="多城市用逗号分隔，如：北京,上海" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="时间段">
                <div class="时间段编辑区">
                  <div v-for="(时间段, 索引) in xi规则表单.时间段列表" :key="索引" class="时间段行">
                    <el-input v-model="xi规则表单.时间段列表[索引]" placeholder="如：09:00-10:00" style="width: 160px" />
                    <el-button type="danger" link @click="xi删除时间段(索引)">删除</el-button>
                  </div>
                  <el-button type="primary" link @click="xi添加时间段">+ 添加时间段</el-button>
                </div>
                <div class="字段说明">格式：09:00-10:00（开始时间-结束时间）</div>
              </el-form-item>
              <el-form-item label="优先级">
                <el-input-number v-model="xi规则表单.sort_order" :min="1" :max="99" />
                <span style="margin-left: 8px; color: #999; font-size: 12px">数值越小优先级越高</span>
              </el-form-item>
              <el-form-item label="是否启用">
                <el-switch v-model="xi规则表单.is_active" :active-value="1" :inactive-value="0" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="xi显示规则弹窗 = false">取消</el-button>
              <el-button type="primary" @click="xi保存规则">保存</el-button>
            </template>
          </el-dialog>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 4：充值设置 ===== -->
      <el-tab-pane label="💳 充值设置" name="topup">
        <el-form :model="设置表单" label-width="150px" style="max-width: 700px">

          <!-- 基本设置 -->
          <div class="设置分组标题">── 🎁 基本设置 ──</div>

          <el-form-item label="Banner图片URL">
            <el-input v-model="设置表单.topup_banner_url" placeholder="充值H5顶部横幅图片URL（可选）" />
          </el-form-item>
          <el-form-item label="顶部主标题">
            <el-input v-model="设置表单.topup_title" placeholder="如：各类会员充值" />
          </el-form-item>
          <el-form-item label="副标题第1行">
            <el-input v-model="设置表单.topup_subtitle1" placeholder="如：专业充值  特惠价格  安全有保障" />
          </el-form-item>
          <el-form-item label="副标题第2行">
            <el-input v-model="设置表单.topup_subtitle2" placeholder="如：快速到账  全程客服  值得信赖" />
          </el-form-item>
          <el-form-item label="下单须知">
            <el-input v-model="设置表单.topup_notice" type="textarea" :rows="5" placeholder="每行一条须知，换行分隔" />
          </el-form-item>
          <el-form-item label="服务内容JSON">
            <el-input v-model="设置表单.topup_service_content" type="textarea" :rows="6" placeholder='[{"icon":"💎","title":"特惠充值","desc":"会员专属优惠"}]' />
            <div class="字段说明">格式：JSON数组，每项含 icon、title、desc 字段</div>
            <el-button size="small" style="margin-top:6px" @click="填入默认服务内容">填入默认服务内容</el-button>
          </el-form-item>

          <!-- 弹窗提醒设置 -->
          <div class="设置分组标题">── 🔔 弹窗提醒设置 ──</div>

          <!-- 充值弹窗1：首页弹窗 -->
          <el-card class="弹窗配置卡片" style="margin-bottom: 16px">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>🏠 充值首页弹窗（popup1）</span>
                <el-switch v-model="设置表单.cz_popup1_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="设置表单.cz_popup1_title" placeholder="安全提醒" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="设置表单.cz_popup1_content" type="textarea" :rows="3" placeholder="弹窗内容，支持换行" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="设置表单.cz_popup1_icon" placeholder="⚠️" style="width: 100px" />
              <span class="字段说明" style="margin-left:8px">输入Emoji图标</span>
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="设置表单.cz_popup1_title_color" show-alpha />
              <el-input v-model="设置表单.cz_popup1_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="设置表单.cz_popup1_content_color" show-alpha />
              <el-input v-model="设置表单.cz_popup1_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="设置表单.cz_popup1_bg_color" show-alpha />
              <el-input v-model="设置表单.cz_popup1_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="设置表单.cz_popup1_btn_text" placeholder="我知道了" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="设置表单.cz_popup1_btn_color" show-alpha />
              <el-input v-model="设置表单.cz_popup1_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="设置表单.cz_popup1_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="设置表单.cz_popup1_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <!-- 充值弹窗2：账号确认弹窗 -->
          <el-card class="弹窗配置卡片" style="margin-bottom: 16px">
            <template #header>
              <div style="display:flex; align-items:center; gap:8px; font-weight:600">
                <span>🔒 充值账号确认弹窗（popup2）</span>
                <el-switch v-model="设置表单.cz_popup2_enabled" active-value="1" inactive-value="0" active-text="启用" inactive-text="关闭" />
              </div>
            </template>
            <el-form-item label="弹窗标题">
              <el-input v-model="设置表单.cz_popup2_title" placeholder="账号确认" />
            </el-form-item>
            <el-form-item label="弹窗内容">
              <el-input v-model="设置表单.cz_popup2_content" type="textarea" :rows="3" placeholder="弹窗内容" />
            </el-form-item>
            <el-form-item label="标题图标">
              <el-input v-model="设置表单.cz_popup2_icon" placeholder="🔒" style="width: 100px" />
            </el-form-item>
            <el-form-item label="标题颜色">
              <el-color-picker v-model="设置表单.cz_popup2_title_color" show-alpha />
              <el-input v-model="设置表单.cz_popup2_title_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="内容颜色">
              <el-color-picker v-model="设置表单.cz_popup2_content_color" show-alpha />
              <el-input v-model="设置表单.cz_popup2_content_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="背景颜色">
              <el-color-picker v-model="设置表单.cz_popup2_bg_color" show-alpha />
              <el-input v-model="设置表单.cz_popup2_bg_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="关闭按钮文字">
              <el-input v-model="设置表单.cz_popup2_btn_text" placeholder="我已确认" style="width: 180px" />
            </el-form-item>
            <el-form-item label="按钮颜色">
              <el-color-picker v-model="设置表单.cz_popup2_btn_color" show-alpha />
              <el-input v-model="设置表单.cz_popup2_btn_color" style="width:130px; margin-left:8px" />
            </el-form-item>
            <el-form-item label="按钮大小">
              <el-select v-model="设置表单.cz_popup2_btn_size" style="width: 160px">
                <el-option label="小 (44px)" value="small" />
                <el-option label="中 (48px)" value="medium" />
                <el-option label="大 (56px)" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动关闭秒数">
              <el-input-number v-model="设置表单.cz_popup2_auto_close" :min="0" :max="60" style="width: 140px" />
              <span class="字段说明" style="margin-left:8px">0 = 不自动关闭</span>
            </el-form-item>
          </el-card>

          <!-- 验证规则 -->
          <div class="设置分组标题">── 🔐 账号验证规则 ──</div>

          <el-form-item label="手机号验证正则">
            <el-input v-model="设置表单.topup_phone_regex" placeholder="默认：^1[3-9]\d{9}$" />
            <div class="字段说明">中国大陆手机号验证正则</div>
          </el-form-item>
          <el-form-item label="微信号验证正则">
            <el-input v-model="设置表单.topup_wechat_regex" placeholder="默认：^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$" />
            <div class="字段说明">微信号验证正则（6-20位，支持字母/数字/下划线，兼容手机号绑定登录）</div>
          </el-form-item>
          <el-form-item label="QQ号验证正则">
            <el-input v-model="设置表单.topup_qq_regex" placeholder="默认：^[1-9]\d{4,10}$" />
            <div class="字段说明">QQ号验证正则（5-11位数字）</div>
          </el-form-item>
          <el-form-item label="邮箱验证正则">
            <el-input v-model="设置表单.topup_email_regex" placeholder="默认：^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" />
            <div class="字段说明">标准邮箱格式验证</div>
          </el-form-item>
          <el-form-item label="自定义最小长度">
            <el-input-number v-model="设置表单.topup_custom_min_len" :min="1" :max="50" style="width:120px" />
            <span style="margin-left:8px; color:#999; font-size:12px">账号类型为"其他"时使用</span>
          </el-form-item>
          <el-form-item label="自定义最大长度">
            <el-input-number v-model="设置表单.topup_custom_max_len" :min="1" :max="200" style="width:120px" />
          </el-form-item>
          <el-form-item>
            <el-button @click="恢复默认验证规则">恢复默认验证规则</el-button>
          </el-form-item>

          <!-- 位置定位 -->
          <div class="设置分组标题">── 📍 位置定位 ──</div>

          <el-form-item label="定位方式">
            <el-radio-group v-model="设置表单.topup_location_mode">
              <el-radio value="ip">IP自动定位（无感知，无需用户操作）</el-radio>
              <el-radio value="gps">弹窗请求定位（先弹窗询问，允许后使用GPS）</el-radio>
              <el-radio value="both">两步走（先IP定位，失败后弹窗请求）【推荐】</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="定位弹窗提示语">
            <el-input v-model="设置表单.topup_location_tip" placeholder="为了更好地为您提供充值服务，需要获取您的所在城市" />
          </el-form-item>
          <el-form-item label="弹窗确认按钮">
            <el-input v-model="设置表单.topup_location_confirm" placeholder="允许获取位置" style="width:200px" />
          </el-form-item>
          <el-form-item label="弹窗取消按钮">
            <el-input v-model="设置表单.topup_location_cancel" placeholder="暂不授权" style="width:200px" />
          </el-form-item>
          <el-form-item label="IP定位接口">
            <el-select v-model="设置表单.topup_ip_provider" style="width: 300px">
              <el-option label="🥇 太平洋优先（推荐，国内最稳）" value="pconline_first" />
              <el-option label="🥈 vore.top优先" value="vore_first" />
              <el-option label="仅太平洋" value="pconline_only" />
              <el-option label="仅vore.top" value="vore_only" />
            </el-select>
            <div class="字段说明">
              两个接口均免费、无需注册、无Key：<br>
              • <b>太平洋</b>：whois.pconline.com.cn — 国内最稳定，无频率限制<br>
              • <b>vore.top</b>：api.vore.top — 国内服务器，无频率限制<br>
              默认"太平洋优先"：先请求太平洋，失败自动切换vore.top
            </div>
          </el-form-item>
          <el-form-item>
            <el-button :loading="测试定位中" @click="测试定位">测试IP定位</el-button>
          </el-form-item>
          <el-form-item v-if="定位测试结果" label="定位测试结果">
            <el-alert :title="`IP: ${定位测试结果.ip} | 城市: ${定位测试结果.full_city || '获取失败'}`" type="success" :closable="false" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('topup')">💾 保存充值设置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- ===== Tab 5：奇所SUP设置 ===== -->
      <el-tab-pane label="🔧 奇所SUP设置" name="agiso_sup">
        <el-form :model="设置表单" label-width="160px" style="max-width: 680px">

          <el-form-item label="SUP接口总开关">
            <el-switch
              v-model="设置表单.agiso_sup_enabled"
              active-value="1"
              inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="字段说明">开启后，奇所平台可调用本系统的标准SUP接口</div>
          </el-form-item>

          <el-form-item label="开放平台应用ID">
            <el-input v-model="设置表单.agiso_app_id" placeholder="在 open.agiso.com 创建应用后获取" />
            <div class="字段说明">在 open.agiso.com 创建应用后获取</div>
          </el-form-item>

          <el-form-item label="开放平台AppSecret">
            <el-input
              v-model="设置表单.agiso_app_secret"
              type="password"
              show-password
              placeholder="32位密钥，用于签名验证和卡密AES加密"
            />
            <div class="字段说明">32位密钥，用于签名验证和卡密AES加密</div>
          </el-form-item>

          <el-form-item label="商户密钥">
            <el-input
              v-model="设置表单.agiso_merchant_key"
              type="password"
              show-password
              placeholder="用于签名计算（MD5源串拼接）"
            />
            <div class="字段说明">用于签名计算（MD5源串拼接）</div>
          </el-form-item>

          <el-form-item label="平台会员ID">
            <el-input v-model="设置表单.agiso_user_id" placeholder="下单方身份校验" />
            <div class="字段说明">奇所分配的平台会员ID，用于校验下单方身份</div>
          </el-form-item>

          <el-form-item label="撤单拒绝凭证图片">
            <div style="display: flex; flex-direction: column; gap: 8px; width: 100%">
              <div style="display: flex; gap: 8px; align-items: center">
                <el-input v-model="设置表单.agiso_refuse_proof" placeholder="撤单失败时返回的凭证图片URL（.jpg/.png/.gif，不超过127k）" style="flex: 1" />
                <el-button :loading="凭证图片上传中" @click="$refs.凭证图片输入.click()">📁 上传图片</el-button>
                <input ref="凭证图片输入" type="file" accept="image/*" style="display: none" @change="处理凭证图片选择" />
              </div>
              <img
                v-if="设置表单.agiso_refuse_proof && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(设置表单.agiso_refuse_proof)"
                :src="设置表单.agiso_refuse_proof"
                style="max-width: 160px; max-height: 80px; border: 1px solid #dcdfe6; border-radius: 4px; object-fit: contain"
                alt="凭证图片预览"
              />
            </div>
            <div class="字段说明">撤单失败（cancelStatus=30）时必须返回的凭证图片URL，须为可公开访问的图片链接</div>
          </el-form-item>

          <el-form-item label="SUP商品配置">
            <div style="font-size: 13px; color: #606266">
              商品管理已独立为单独页面，请前往
              <el-link type="primary" @click="router.push('/admin/products')">【商品管理】</el-link>
              页面进行商品的新增、编辑和管理。
            </div>
          </el-form-item>

          <!-- 接口地址参考（只读展示） -->
          <el-form-item label="接口地址参考">
            <div class="接口地址展示">
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/app/getAppId</code>
                <span class="接口备注">获取应用ID（匿名）</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/product/getList</code>
                <span class="接口备注">获取商品分页列表</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/product/getTemplate</code>
                <span class="接口备注">获取商品模板</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/createPurchase</code>
                <span class="接口备注">卡密下单（奇所标准路径，推荐）</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/cardOrder</code>
                <span class="接口备注">卡密下单（兼容旧路径，两者功能相同）</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/queryOrder</code>
                <span class="接口备注">订单查询</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/get</code>
                <span class="接口备注">订单查询（兼容路径，与 queryOrder 功能相同）</span>
              </div>
              <div class="接口地址行">
                <span class="接口方法">POST</span>
                <code>/agisoAcprSupplierApi/order/cancelOrder</code>
                <span class="接口备注">撤单（退款）</span>
              </div>
            </div>
            <div class="字段说明">以上为奇所平台请求本系统的接口地址，在 open.agiso.com 填写供应商服务地址时使用</div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="保存中" @click="保存设置('agiso_sup')">💾 保存奇所SUP设置</el-button>
          </el-form-item>

        </el-form>
      </el-tab-pane>

    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 获取设置API, 保存设置API, 测试洗衣API连接, 获取规则列表API, 新增规则API, 更新规则API, 删除规则API, 获取洗衣时间规则API, 新增洗衣时间规则API, 更新洗衣时间规则API, 删除洗衣时间规则API, 获取账号列表API, 新增账号API, 更新账号API, 删除账号API, 触发账号登录API, 上传备注图片API } from '../api/index'
import axios from 'axios'

const router = useRouter()
const 加载中 = ref(false)
const 保存中 = ref(false)
const 当前Tab = ref('general')
const 测试洗衣中 = ref(false)
const 测试洗衣结果 = ref(null)
const 测试定位中 = ref(false)
const 定位测试结果 = ref(null)
const 凭证图片上传中 = ref(false)

const 上传凭证图片 = async (文件) => {
  凭证图片上传中.value = true
  try {
    const fd = new FormData()
    fd.append('image', 文件)
    const r = await 上传备注图片API(fd)
    if (r.code === 1 && r.data?.url) {
      设置表单.value.agiso_refuse_proof = r.data.url
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.warning(r.message || '上传失败')
    }
  } catch { ElMessage.error('图片上传失败') } finally { 凭证图片上传中.value = false }
}

const 处理凭证图片选择 = (e) => {
  const 文件 = e.target.files?.[0]
  if (文件) 上传凭证图片(文件)
  e.target.value = ''
}

const 设置表单 = ref({
  // 通用
  site_url: '',
  // 家政
  banner_url: '',
  service_type: '日常保洁',
  service_hours: 2,
  notice: '',
  auto_order_enabled: '1',
  multi_time_enabled: '0',
  multi_time_max_count: '3',
  multi_time_tip: '',
  multi_time_min_count: '1',
  // 家政弹窗1
  jz_popup1_enabled: '0', jz_popup1_title: '温馨提醒',
  jz_popup1_content: '您所在的城市，阿姨接单繁忙，会有一定概率无阿姨接单的情况。',
  jz_popup1_icon: '⚠️', jz_popup1_title_color: '#e54635', jz_popup1_content_color: '#333333',
  jz_popup1_bg_color: '#ffffff', jz_popup1_btn_text: '我知道了', jz_popup1_btn_color: '#e54635',
  jz_popup1_btn_size: 'large', jz_popup1_auto_close: 0,
  // 家政弹窗2
  jz_popup2_enabled: '0', jz_popup2_title: '退改签须知',
  jz_popup2_content: '一旦预约成功，退改签将收取50元的手续费，请确认后再提交。',
  jz_popup2_icon: '📋', jz_popup2_title_color: '#e54635', jz_popup2_content_color: '#333333',
  jz_popup2_bg_color: '#ffffff', jz_popup2_btn_text: '我已知晓', jz_popup2_btn_color: '#e54635',
  jz_popup2_btn_size: 'large', jz_popup2_auto_close: 0,
  // 洗衣
  laundry_banner_url: '', laundry_notice: '', laundry_product_name: '任洗一件',
  laundry_product_price: 0, laundry_service_content: '', laundry_auto_order_enabled: '0',
  laundry_order_type: '50', laundry_api_url: '', laundry_app_id: '', laundry_app_secret: '',
  laundry_tenant_id: '', laundry_token_expire_at: '0',
  // 洗衣弹窗1
  xi_popup1_enabled: '0', xi_popup1_title: '温馨提醒',
  xi_popup1_content: '目前订单量大，可能洗护时间延长，请您耐心等待。',
  xi_popup1_icon: '⚠️', xi_popup1_title_color: '#1989fa', xi_popup1_content_color: '#333333',
  xi_popup1_bg_color: '#ffffff', xi_popup1_btn_text: '我知道了', xi_popup1_btn_color: '#1989fa',
  xi_popup1_btn_size: 'large', xi_popup1_auto_close: 0,
  // 洗衣弹窗2
  xi_popup2_enabled: '0', xi_popup2_title: '取件时间说明',
  xi_popup2_content: '选择的取件时间为预计取件时间，实际可能因物流情况有所延误。',
  xi_popup2_icon: '📦', xi_popup2_title_color: '#1989fa', xi_popup2_content_color: '#333333',
  xi_popup2_bg_color: '#ffffff', xi_popup2_btn_text: '我知道了', xi_popup2_btn_color: '#1989fa',
  xi_popup2_btn_size: 'large', xi_popup2_auto_close: 0,
  // 充值基本
  topup_banner_url: '', topup_title: '各类会员充值',
  topup_subtitle1: '专业充值  特惠价格  安全有保障',
  topup_subtitle2: '快速到账  全程客服  值得信赖',
  topup_notice: '', topup_service_content: '',
  // 充值弹窗1
  cz_popup1_enabled: '0', cz_popup1_title: '安全提醒',
  cz_popup1_content: '务必确保充值账号准确，虚拟商品充错账号不支持退换货。',
  cz_popup1_icon: '⚠️', cz_popup1_title_color: '#667eea', cz_popup1_content_color: '#333333',
  cz_popup1_bg_color: '#ffffff', cz_popup1_btn_text: '我知道了', cz_popup1_btn_color: '#667eea',
  cz_popup1_btn_size: 'large', cz_popup1_auto_close: 0,
  // 充值弹窗2
  cz_popup2_enabled: '0', cz_popup2_title: '账号确认',
  cz_popup2_content: '请再次确认您的充值账号是否正确，虚拟商品一旦充值成功无法退款。',
  cz_popup2_icon: '🔒', cz_popup2_title_color: '#667eea', cz_popup2_content_color: '#333333',
  cz_popup2_bg_color: '#ffffff', cz_popup2_btn_text: '我已确认', cz_popup2_btn_color: '#667eea',
  cz_popup2_btn_size: 'large', cz_popup2_auto_close: 0,
  // 充值验证
  topup_phone_regex: '^1[3-9]\\d{9}$', topup_wechat_regex: '^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$',
  topup_qq_regex: '^[1-9]\\d{4,10}$', topup_email_regex: '',
  topup_custom_min_len: 1, topup_custom_max_len: 50,
  // 充值定位
  topup_location_mode: 'ip', topup_location_tip: '为了更好地为您提供充值服务，需要获取您的所在城市',
  topup_location_confirm: '允许获取位置', topup_location_cancel: '暂不授权',
  topup_ip_provider: 'pconline_first',
  // SUP
  agiso_sup_enabled: '0', agiso_app_id: '', agiso_app_secret: '',
  agiso_merchant_key: '', agiso_user_id: '', agiso_products: '',
  agiso_refuse_proof: '',
})

// 洗衣回调地址（自动拼接 site_url + /api/laundry/callback）
const 回调地址 = computed(() => {
  const 域名 = (设置表单.value.site_url || '').replace(/\/$/, '')
  return 域名 ? `${域名}/api/laundry/callback` : '/api/laundry/callback'
})

const Token过期时间文字 = computed(() => {
  const expireAt = parseInt(设置表单.value.laundry_token_expire_at || '0')
  if (expireAt <= 0) return ''
  return new Date(expireAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
})

const Token状态文字 = computed(() => {
  if (!设置表单.value.laundry_app_id || !设置表单.value.laundry_api_url) return '未配置'
  const expireAt = parseInt(设置表单.value.laundry_token_expire_at || '0')
  if (expireAt > Date.now()) return '有效'
  if (设置表单.value.laundry_tenant_id) return '已过期'
  return '未获取'
})

const Token状态类型 = computed(() => {
  const t = Token状态文字.value
  if (t === '有效') return 'success'
  if (t === '已过期') return 'danger'
  return 'info'
})

const 加载设置 = async () => {
  加载中.value = true
  try {
    const 结果 = await 获取设置API()
    if (结果.code === 1) {
      const 数据 = 结果.data
      设置表单.value = {
        // 通用
        site_url: 数据.site_url || '',
        // 家政
        banner_url: 数据.banner_url || '',
        service_type: 数据.service_type || '日常保洁',
        service_hours: parseInt(数据.service_hours) || 2,
        notice: 数据.notice || '',
        auto_order_enabled: 数据.auto_order_enabled || '1',
        multi_time_enabled: 数据.multi_time_enabled || '0',
        multi_time_max_count: 数据.multi_time_max_count || '3',
        multi_time_tip: 数据.multi_time_tip || '',
        multi_time_min_count: 数据.multi_time_min_count || '1',
        // 家政弹窗1
        jz_popup1_enabled: 数据.jz_popup1_enabled || '0',
        jz_popup1_title: 数据.jz_popup1_title || '温馨提醒',
        jz_popup1_content: 数据.jz_popup1_content || '您所在的城市，阿姨接单繁忙，会有一定概率无阿姨接单的情况。',
        jz_popup1_icon: 数据.jz_popup1_icon || '⚠️',
        jz_popup1_title_color: 数据.jz_popup1_title_color || '#e54635',
        jz_popup1_content_color: 数据.jz_popup1_content_color || '#333333',
        jz_popup1_bg_color: 数据.jz_popup1_bg_color || '#ffffff',
        jz_popup1_btn_text: 数据.jz_popup1_btn_text || '我知道了',
        jz_popup1_btn_color: 数据.jz_popup1_btn_color || '#e54635',
        jz_popup1_btn_size: 数据.jz_popup1_btn_size || 'large',
        jz_popup1_auto_close: parseInt(数据.jz_popup1_auto_close) || 0,
        // 家政弹窗2
        jz_popup2_enabled: 数据.jz_popup2_enabled || '0',
        jz_popup2_title: 数据.jz_popup2_title || '退改签须知',
        jz_popup2_content: 数据.jz_popup2_content || '一旦预约成功，退改签将收取50元的手续费，请确认后再提交。',
        jz_popup2_icon: 数据.jz_popup2_icon || '📋',
        jz_popup2_title_color: 数据.jz_popup2_title_color || '#e54635',
        jz_popup2_content_color: 数据.jz_popup2_content_color || '#333333',
        jz_popup2_bg_color: 数据.jz_popup2_bg_color || '#ffffff',
        jz_popup2_btn_text: 数据.jz_popup2_btn_text || '我已知晓',
        jz_popup2_btn_color: 数据.jz_popup2_btn_color || '#e54635',
        jz_popup2_btn_size: 数据.jz_popup2_btn_size || 'large',
        jz_popup2_auto_close: parseInt(数据.jz_popup2_auto_close) || 0,
        // 洗衣
        laundry_banner_url: 数据.laundry_banner_url || '',
        laundry_notice: 数据.laundry_notice || '',
        laundry_product_name: 数据.laundry_product_name || '任洗一件',
        laundry_product_price: parseInt(数据.laundry_product_price) || 0,
        laundry_service_content: 数据.laundry_service_content || '',
        laundry_auto_order_enabled: 数据.laundry_auto_order_enabled || '0',
        laundry_order_type: 数据.laundry_order_type || '50',
        laundry_api_url: 数据.laundry_api_url || '',
        laundry_app_id: 数据.laundry_app_id || '',
        laundry_app_secret: 数据.laundry_app_secret || '',
        laundry_tenant_id: 数据.laundry_tenant_id || '',
        laundry_token_expire_at: 数据.laundry_token_expire_at || '0',
        // 洗衣弹窗1
        xi_popup1_enabled: 数据.xi_popup1_enabled || '0',
        xi_popup1_title: 数据.xi_popup1_title || '温馨提醒',
        xi_popup1_content: 数据.xi_popup1_content || '目前订单量大，可能洗护时间延长，请您耐心等待。',
        xi_popup1_icon: 数据.xi_popup1_icon || '⚠️',
        xi_popup1_title_color: 数据.xi_popup1_title_color || '#1989fa',
        xi_popup1_content_color: 数据.xi_popup1_content_color || '#333333',
        xi_popup1_bg_color: 数据.xi_popup1_bg_color || '#ffffff',
        xi_popup1_btn_text: 数据.xi_popup1_btn_text || '我知道了',
        xi_popup1_btn_color: 数据.xi_popup1_btn_color || '#1989fa',
        xi_popup1_btn_size: 数据.xi_popup1_btn_size || 'large',
        xi_popup1_auto_close: parseInt(数据.xi_popup1_auto_close) || 0,
        // 洗衣弹窗2
        xi_popup2_enabled: 数据.xi_popup2_enabled || '0',
        xi_popup2_title: 数据.xi_popup2_title || '取件时间说明',
        xi_popup2_content: 数据.xi_popup2_content || '选择的取件时间为预计取件时间，实际可能因物流情况有所延误。',
        xi_popup2_icon: 数据.xi_popup2_icon || '📦',
        xi_popup2_title_color: 数据.xi_popup2_title_color || '#1989fa',
        xi_popup2_content_color: 数据.xi_popup2_content_color || '#333333',
        xi_popup2_bg_color: 数据.xi_popup2_bg_color || '#ffffff',
        xi_popup2_btn_text: 数据.xi_popup2_btn_text || '我知道了',
        xi_popup2_btn_color: 数据.xi_popup2_btn_color || '#1989fa',
        xi_popup2_btn_size: 数据.xi_popup2_btn_size || 'large',
        xi_popup2_auto_close: parseInt(数据.xi_popup2_auto_close) || 0,
        // 充值基本
        topup_banner_url: 数据.topup_banner_url || '',
        topup_title: 数据.topup_title || '各类会员充值',
        topup_subtitle1: 数据.topup_subtitle1 || '专业充值  特惠价格  安全有保障',
        topup_subtitle2: 数据.topup_subtitle2 || '快速到账  全程客服  值得信赖',
        topup_notice: 数据.topup_notice || '',
        topup_service_content: 数据.topup_service_content || '',
        // 充值弹窗1
        cz_popup1_enabled: 数据.cz_popup1_enabled || '0',
        cz_popup1_title: 数据.cz_popup1_title || '安全提醒',
        cz_popup1_content: 数据.cz_popup1_content || '务必确保充值账号准确，虚拟商品充错账号不支持退换货。',
        cz_popup1_icon: 数据.cz_popup1_icon || '⚠️',
        cz_popup1_title_color: 数据.cz_popup1_title_color || '#667eea',
        cz_popup1_content_color: 数据.cz_popup1_content_color || '#333333',
        cz_popup1_bg_color: 数据.cz_popup1_bg_color || '#ffffff',
        cz_popup1_btn_text: 数据.cz_popup1_btn_text || '我知道了',
        cz_popup1_btn_color: 数据.cz_popup1_btn_color || '#667eea',
        cz_popup1_btn_size: 数据.cz_popup1_btn_size || 'large',
        cz_popup1_auto_close: parseInt(数据.cz_popup1_auto_close) || 0,
        // 充值弹窗2
        cz_popup2_enabled: 数据.cz_popup2_enabled || '0',
        cz_popup2_title: 数据.cz_popup2_title || '账号确认',
        cz_popup2_content: 数据.cz_popup2_content || '请再次确认您的充值账号是否正确，虚拟商品一旦充值成功无法退款。',
        cz_popup2_icon: 数据.cz_popup2_icon || '🔒',
        cz_popup2_title_color: 数据.cz_popup2_title_color || '#667eea',
        cz_popup2_content_color: 数据.cz_popup2_content_color || '#333333',
        cz_popup2_bg_color: 数据.cz_popup2_bg_color || '#ffffff',
        cz_popup2_btn_text: 数据.cz_popup2_btn_text || '我已确认',
        cz_popup2_btn_color: 数据.cz_popup2_btn_color || '#667eea',
        cz_popup2_btn_size: 数据.cz_popup2_btn_size || 'large',
        cz_popup2_auto_close: parseInt(数据.cz_popup2_auto_close) || 0,
        // 充值验证
        topup_phone_regex: 数据.topup_phone_regex || '^1[3-9]\\d{9}$',
        topup_wechat_regex: 数据.topup_wechat_regex || '^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$',
        topup_qq_regex: 数据.topup_qq_regex || '^[1-9]\\d{4,10}$',
        topup_email_regex: 数据.topup_email_regex || '',
        topup_custom_min_len: parseInt(数据.topup_custom_min_len) || 1,
        topup_custom_max_len: parseInt(数据.topup_custom_max_len) || 50,
        // 充值定位
        topup_location_mode: 数据.topup_location_mode || 'ip',
        topup_location_tip: 数据.topup_location_tip || '为了更好地为您提供充值服务，需要获取您的所在城市',
        topup_location_confirm: 数据.topup_location_confirm || '允许获取位置',
        topup_location_cancel: 数据.topup_location_cancel || '暂不授权',
        topup_ip_provider: 数据.topup_ip_provider || 'pconline_first',
        // SUP
        agiso_sup_enabled: 数据.agiso_sup_enabled || '0',
        agiso_app_id: 数据.agiso_app_id || '',
        agiso_app_secret: 数据.agiso_app_secret || '',
        agiso_merchant_key: 数据.agiso_merchant_key || '',
        agiso_user_id: 数据.agiso_user_id || '',
        agiso_products: 数据.agiso_products || '',
        agiso_refuse_proof: 数据.agiso_refuse_proof || '',
      }
    }
  } finally {
    加载中.value = false
  }
}

const 保存设置 = async (tabName) => {
  保存中.value = true
  try {
    const 结果 = await 保存设置API(设置表单.value)
    if (结果.code === 1) ElMessage.success('设置保存成功')
    else ElMessage.warning(结果.message || '保存失败')
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    保存中.value = false
  }
}

const 测试洗衣连接 = async () => {
  测试洗衣中.value = true
  测试洗衣结果.value = null
  try {
    const 结果 = await 测试洗衣API连接()
    if (结果.code === 1) {
      测试洗衣结果.value = { 成功: true, 消息: `连接成功！TenantID: ${结果.data?.tenantId}` }
      await 加载设置()
    } else {
      测试洗衣结果.value = { 成功: false, 消息: 结果.message || '连接失败' }
    }
  } catch {
    测试洗衣结果.value = { 成功: false, 消息: '连接失败，请检查API配置' }
  } finally {
    测试洗衣中.value = false
  }
}

const 测试定位 = async () => {
  测试定位中.value = true
  定位测试结果.value = null
  try {
    const 响应 = await axios.get('/api/cz/ip-city')
    const 结果 = 响应.data
    if (结果.code === 1) {
      定位测试结果.value = 结果.data
      ElMessage.success(`定位成功：${结果.data.full_city || '未知城市'}`)
    } else {
      ElMessage.warning('定位失败：' + (结果.message || '未知错误'))
    }
  } catch {
    ElMessage.error('测试定位失败')
  } finally {
    测试定位中.value = false
  }
}

const 恢复默认验证规则 = () => {
  设置表单.value.topup_phone_regex = '^1[3-9]\\d{9}$'
  设置表单.value.topup_wechat_regex = '^[a-zA-Z0-9][a-zA-Z0-9_-]{5,19}$'
  设置表单.value.topup_qq_regex = '^[1-9]\\d{4,10}$'
  设置表单.value.topup_email_regex = ''
  设置表单.value.topup_custom_min_len = 1
  设置表单.value.topup_custom_max_len = 50
  ElMessage.info('已恢复默认验证规则，请保存')
}

const 填入默认服务内容 = () => {
  设置表单.value.topup_service_content = JSON.stringify([
    { icon: '💎', title: '特惠充值', desc: '会员专属优惠价格' },
    { icon: '⚡', title: '极速到账', desc: '1-6小时内到账' },
    { icon: '🔒', title: '安全可靠', desc: '正规渠道100%安全' },
    { icon: '📞', title: '全程客服', desc: '7×24小时在线服务' },
    { icon: '✅', title: '正品保证', desc: '官方直充无风险' },
    { icon: '🎁', title: '多种会员', desc: '优酷/爱奇艺/腾讯视频' },
  ], null, 2)
}

// ===== 家政时间规则（内嵌）=====
const jz时间规则列表 = ref([])
const jz规则加载中 = ref(false)
const jz显示规则弹窗 = ref(false)
const jz当前编辑ID = ref(null)
const jz所有时间段 = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
const jz星期名称 = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const jz默认表单 = () => ({
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
const jz规则表单 = ref(jz默认表单())

const jz加载规则 = async () => {
  jz规则加载中.value = true
  try {
    const 结果 = await 获取规则列表API()
    if (结果.code === 1) jz时间规则列表.value = 结果.data
  } finally {
    jz规则加载中.value = false
  }
}
const jz新增规则 = () => {
  jz当前编辑ID.value = null
  jz规则表单.value = jz默认表单()
  jz显示规则弹窗.value = true
}
const jz编辑规则 = (规则) => {
  jz当前编辑ID.value = 规则.id
  jz规则表单.value = {
    ...规则,
    选中时间段: JSON.parse(规则.time_slots || '[]'),
    选中工作日: JSON.parse(规则.work_days || '[1,2,3,4,5,6,7]'),
  }
  jz显示规则弹窗.value = true
}
const jz保存规则 = async () => {
  const 提交数据 = {
    ...jz规则表单.value,
    time_slots: JSON.stringify(jz规则表单.value.选中时间段),
    work_days: JSON.stringify(jz规则表单.value.选中工作日),
  }
  delete 提交数据.选中时间段
  delete 提交数据.选中工作日
  try {
    if (jz当前编辑ID.value) {
      await 更新规则API(jz当前编辑ID.value, 提交数据)
    } else {
      await 新增规则API(提交数据)
    }
    ElMessage.success('保存成功')
    jz显示规则弹窗.value = false
    jz加载规则()
  } catch {
    ElMessage.error('保存失败')
  }
}
const jz删除规则 = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该规则？', '提示', { type: 'warning' })
    await 删除规则API(id)
    ElMessage.success('删除成功')
    jz加载规则()
  } catch {}
}

// ===== 洗衣时间规则（内嵌）=====
const xi时间规则列表 = ref([])
const xi规则加载中 = ref(false)
const xi显示规则弹窗 = ref(false)
const xi当前编辑ID = ref(null)
const xi默认表单 = () => ({
  rule_type: 'global',
  rule_name: '',
  match_value: '',
  sort_order: 50,
  is_active: 1,
  时间段列表: ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'],
})
const xi规则表单 = ref(xi默认表单())

const xi解析时间段显示 = (time_slots_json) => {
  try {
    const 列表 = JSON.parse(time_slots_json || '[]')
    return 列表.join('、') || '-'
  } catch { return '-' }
}
const xi加载规则 = async () => {
  xi规则加载中.value = true
  try {
    const 结果 = await 获取洗衣时间规则API()
    if (结果.code === 1) xi时间规则列表.value = 结果.data
  } finally { xi规则加载中.value = false }
}
const xi新增规则 = () => {
  xi当前编辑ID.value = null
  xi规则表单.value = xi默认表单()
  xi显示规则弹窗.value = true
}
const xi编辑规则 = (规则) => {
  xi当前编辑ID.value = 规则.id
  xi规则表单.value = {
    ...规则,
    时间段列表: JSON.parse(规则.time_slots || '[]'),
  }
  xi显示规则弹窗.value = true
}
const xi添加时间段 = () => {
  xi规则表单.value.时间段列表.push('')
}
const xi删除时间段 = (索引) => {
  xi规则表单.value.时间段列表.splice(索引, 1)
}
const xi保存规则 = async () => {
  const 有效时间段 = xi规则表单.value.时间段列表.filter(t => t.trim())
  const 提交数据 = {
    rule_type: xi规则表单.value.rule_type,
    rule_name: xi规则表单.value.rule_name,
    match_value: xi规则表单.value.match_value,
    sort_order: xi规则表单.value.sort_order,
    is_active: xi规则表单.value.is_active,
    time_slots: JSON.stringify(有效时间段),
    work_days: '[1,2,3,4,5,6,7]',
    locked_days: 0,
    max_days: 14,
    business_type: 'xiyifu',
  }
  try {
    if (xi当前编辑ID.value) {
      await 更新洗衣时间规则API(xi当前编辑ID.value, 提交数据)
    } else {
      await 新增洗衣时间规则API(提交数据)
    }
    ElMessage.success('保存成功')
    xi显示规则弹窗.value = false
    xi加载规则()
  } catch {
    ElMessage.error('保存失败')
  }
}
const xi删除规则 = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该时间规则？', '提示', { type: 'warning' })
    await 删除洗衣时间规则API(id)
    ElMessage.success('删除成功')
    xi加载规则()
  } catch {}
}

// ===== 京东账号管理（内嵌）=====
const jd账号列表 = ref([])
const jd账号加载中 = ref(false)
const jd显示账号弹窗 = ref(false)
const jd编辑中ID = ref(null)
const jd账号表单 = ref({ nickname: '', username: '', password: '', daily_limit: 20 })

const jd检查Cookie是否有效 = (账号) => {
  if (!账号.cookie || !账号.cookie_expire) return false
  return new Date(账号.cookie_expire) > new Date()
}
const jd加载账号 = async () => {
  jd账号加载中.value = true
  try {
    const 结果 = await 获取账号列表API()
    if (结果.code === 1) jd账号列表.value = 结果.data
  } finally {
    jd账号加载中.value = false
  }
}
const jd编辑账号 = (账号) => {
  jd编辑中ID.value = 账号.id
  jd账号表单.value = { nickname: 账号.nickname, username: 账号.username, password: '', daily_limit: 账号.daily_limit }
  jd显示账号弹窗.value = true
}
const jd保存账号 = async () => {
  if (!jd账号表单.value.username) return ElMessage.error('请输入账号')
  try {
    if (jd编辑中ID.value) {
      await 更新账号API(jd编辑中ID.value, jd账号表单.value)
    } else {
      await 新增账号API(jd账号表单.value)
    }
    ElMessage.success('保存成功')
    jd显示账号弹窗.value = false
    jd编辑中ID.value = null
    jd加载账号()
  } catch {
    ElMessage.error('保存失败')
  }
}
const jd触发自动登录 = async (id) => {
  ElMessage.info('正在启动自动登录，请稍候...')
  const 结果 = await 触发账号登录API(id)
  ElMessage[结果.code === 1 ? 'success' : 'error'](结果.message || (结果.code === 1 ? '登录成功' : '登录失败'))
  jd加载账号()
}
const jd删除账号 = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该账号？', '提示', { type: 'warning' })
    await 删除账号API(id)
    ElMessage.success('删除成功')
    jd加载账号()
  } catch {}
}

onMounted(() => {
  加载设置()
  jz加载规则()
  xi加载规则()
  jd加载账号()
})
</script>

<style scoped>
.业务设置页面 { padding: 0; }

.字段说明 {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.设置分组标题 {
  color: #409eff;
  font-size: 13px;
  font-weight: 500;
  margin: 16px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.弹窗配置卡片 {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.接口地址展示 {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px 16px;
  width: 100%;
}

.内嵌管理区 {
  margin: 12px 0 20px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.内嵌操作栏 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.时间段编辑区 { display: flex; flex-direction: column; gap: 8px; }
.时间段行 { display: flex; align-items: center; gap: 8px; }

.接口方法 {
  background: #409eff;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  min-width: 36px;
  text-align: center;
}

.接口地址行 code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #303133;
  background: #fff;
  border: 1px solid #dcdfe6;
  padding: 2px 6px;
  border-radius: 3px;
  flex: 1;
}

.接口备注 {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.字段只读值 {
  font-size: 13px;
  color: #606266;
}
</style>
