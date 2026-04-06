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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { 登录API } from '../api/index'

const router = useRouter()
const authStore = useAuthStore()

const 表单引用 = ref(null)
const 登录中 = ref(false)

const 表单 = ref({
  username: '',
  password: '',
})

const 验证规则 = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const 提交登录 = async () => {
  const 是否有效 = await 表单引用.value?.validate().catch(() => false)
  if (!是否有效) return

  登录中.value = true
  try {
    const 结果 = await 登录API(表单.value)
    if (结果.code === 1) {
      authStore.保存登录信息(结果.data)
      ElMessage.success('登录成功')
      router.push({ name: 'Dashboard' })
    } else {
      ElMessage.error(结果.message || '登录失败')
    }
  } catch {
    ElMessage.error('网络错误，请重试')
  } finally {
    登录中.value = false
  }
}
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
  width: 360px;
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
</style>
