<template>
  <!-- 登录页面 -->
  <div class="登录页面">
    <div class="登录卡片">
      <!-- 标题 -->
      <div class="登录标题">
        <span class="标题图标">🏠</span>
        <h2>京东家政代下单系统</h2>
      </div>

      <!-- 登录表单 -->
      <el-form :model="表单" :rules="验证规则" ref="表单引用" @submit.prevent="提交登录">
        <el-form-item prop="username">
          <el-input
            v-model="表单.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="表单.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="提交登录"
          />
        </el-form-item>

        <!-- 图形验证码 -->
        <el-form-item prop="captcha">
          <div class="验证码行">
            <el-input
              v-model="表单.captcha"
              placeholder="请输入验证码"
              size="large"
              style="flex:1"
              @keyup.enter="提交登录"
            />
            <div class="验证码图片容器" @click="刷新验证码" title="点击刷新验证码">
              <img v-if="验证码图片" :src="验证码图片" class="验证码图片" alt="验证码" />
              <div v-else class="验证码占位">加载中…</div>
            </div>
          </div>
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          block
          :loading="登录中"
          @click="提交登录"
          style="width: 100%; background: linear-gradient(135deg, #e54635, #ff6b35); border: none;"
        >
          {{ 登录中 ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { 登录API, 获取验证码API } from '../api/index'

const router = useRouter()
const authStore = useAuthStore()

const 表单引用 = ref(null)
const 登录中 = ref(false)
const 验证码图片 = ref('')
const 验证码Key = ref('')

const 表单 = ref({
  username: '',
  password: '',
  captcha: '',
})

const 验证规则 = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

// 获取/刷新图形验证码
const 刷新验证码 = async () => {
  try {
    const 结果 = await 获取验证码API()
    if (结果.code === 1) {
      验证码图片.value = 结果.data.svg
      验证码Key.value = 结果.data.key
      表单.value.captcha = ''
    }
  } catch {
    // 验证码获取失败时静默降级（不影响登录流程）
  }
}

const 提交登录 = async () => {
  const 是否有效 = await 表单引用.value?.validate().catch(() => false)
  if (!是否有效) return

  登录中.value = true
  try {
    const 结果 = await 登录API({
      username: 表单.value.username,
      password: 表单.value.password,
      captcha_key: 验证码Key.value,
      captcha_text: 表单.value.captcha,
    })
    if (结果.code === 1) {
      authStore.保存登录信息(结果.data)
      ElMessage.success('登录成功')
      // 根据角色和权限决定跳转目标（子账号可能没有 dashboard 权限，避免登录后卡住）
      const role = 结果.data.role
      const permissions = 结果.data.permissions || []
      if (role === 'admin' || role === 'super') {
        router.push({ name: 'Dashboard' })
      } else {
        // 子账号：跳转到第一个有权限的页面，避免登录后卡在"登录中"
        const 路由优先级 = [
          { key: 'dashboard', name: 'Dashboard' },
          { key: 'order_center', name: 'OrderCenter' },
          { key: 'card_workbench', name: 'CardWorkbench' },
          { key: 'template_manager', name: 'TemplateManager' },
          { key: 'business_settings', name: 'BusinessSettings' },
          { key: 'regions', name: 'Regions' },
          { key: 'jd_accounts', name: 'JdAccounts' },
          { key: 'sub_accounts', name: 'SubAccounts' },
        ]
        const 目标 = 路由优先级.find(r => permissions.includes(r.key))
        router.push({ name: 目标 ? 目标.name : 'Login' })
      }
    } else {
      ElMessage.error(结果.message || '登录失败')
      刷新验证码()
    }
  } catch {
    ElMessage.error('网络错误，请重试')
    刷新验证码()
  } finally {
    登录中.value = false
  }
}

onMounted(() => { 刷新验证码() })
</script>

<style scoped>
.登录页面 {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.登录卡片 {
  width: 380px;
  background: white;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.登录标题 {
  text-align: center;
  margin-bottom: 32px;
}

.标题图标 {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.登录标题 h2 {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}

.验证码行 {
  display: flex;
  gap: 10px;
  align-items: center;
}

.验证码图片容器 {
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  height: 40px;
  width: 110px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.验证码图片 {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.验证码占位 {
  color: #aaa;
  font-size: 12px;
}
</style>

