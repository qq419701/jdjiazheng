# 京东家政预约代下单系统

一套完整的京东家政代预约下单系统，包含客户H5预约页面和后台管理系统。

## 访问地址

| 用途 | 地址 |
|------|------|
| 客户预约页面 | `http://你的域名/{卡密}` 例如：`http://域名/TJR93VDP9Q3Q9984` |
| 后台管理 | `http://你的域名/admin` |
| 默认账号 | admin / admin123 |

## 部署教程

👉 详见 [docs/宝塔部署教程.md](docs/宝塔部署教程.md)

## 核心功能

- ✅ H5预约页面（对标京东家政同行）
- ✅ 卡密生成与管理
- ✅ 预约时间规则配置（按城市/地区/全局设置锁定天数）
- ✅ 订单管理
- ✅ 京东账号管理（Cookie池）
- ✅ Puppeteer自动下单引擎
- ✅ 数据看板

## 修改代码后重新构建

```bash
# 修改H5前端后
cd frontend-h5 && npm install && npm run build

# 修改后台管理后
cd frontend-admin && npm install && npm run build

# 重启服务
pm2 restart jdjiazheng
```

## 技术栈

- 后端：Node.js + Express + Sequelize + MySQL
- 前端H5：Vue3 + Vant4
- 后台管理：Vue3 + Element Plus
- 自动化：Puppeteer
