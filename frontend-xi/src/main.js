// 洗衣服H5前端入口
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import router from './router/index'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Vant)
app.mount('#app')
