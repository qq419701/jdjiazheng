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
          <el-form-item label="快速跳转">
            <el-button @click="router.push('/admin/time-rules')">⏰ 时间规则管理</el-button>
            <el-button @click="router.push('/admin/jd-accounts')" style="margin-left:8px">👤 京东账号管理</el-button>
          </el-form-item>
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
          <el-form-item label="快速跳转">
            <el-button @click="router.push('/admin/laundry-time-rules')">⏰ 洗衣时间规则</el-button>
          </el-form-item>
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
import { ElMessage } from 'element-plus'
import { 获取设置API, 保存设置API, 测试洗衣API连接 } from '../api/index'
import axios from 'axios'

const router = useRouter()
const 加载中 = ref(false)
const 保存中 = ref(false)
const 当前Tab = ref('general')
const 测试洗衣中 = ref(false)
const 测试洗衣结果 = ref(null)
const 测试定位中 = ref(false)
const 定位测试结果 = ref(null)

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

onMounted(() => 加载设置())
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

.接口地址行 {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
}

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
