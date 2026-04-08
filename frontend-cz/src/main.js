// 充值H5入口文件
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import router from './router/index'

const app = createApp(App)

// 注册 Pinia 状态管理
app.use(createPinia())

// 注册 Vant 组件库
app.use(Vant)

// 注册路由
app.use(router)

app.mount('#app')
