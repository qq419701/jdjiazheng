# 京东代下单系统

一套完整的京东代预约下单系统，支持**京东家政**和**京东洗衣服**两种业务类型，包含客户H5预约页面和后台管理系统。

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
- ✅ **双业务类型**：京东家政 / 京东洗衣服
- ✅ 卡密生成与管理（按业务类型区分）
- ✅ 预约时间规则配置（按城市/地区/全局设置锁定天数）
- ✅ 订单管理（按业务类型区分）
- ✅ 京东账号管理（Cookie池）
- ✅ Puppeteer自动下单引擎
- ✅ 数据看板
- ✅ 地区管理（省市区街道四级联动）
- ✅ 洗衣API配置预留（对接飞书云文档订单API和快递API）

## 修改代码后重新构建

```bash
# 修改H5前端后
cd frontend-h5 && npm install && npm run build

# 修改后台管理后
cd frontend-admin && npm install && npm run build

# 重启服务
pm2 restart jdjiazheng
```

## 数据库迁移（从旧版升级）

如果已有运行中的数据库，需运行迁移脚本添加新字段：

```bash
cd backend
node scripts/addBusinessTypeColumns.js
```

## 洗衣API配置说明

1. 登录后台管理 → 系统设置 → 洗衣API设置
2. 填写以下配置项：
   - `洗衣订单API地址`：飞书云文档订单API接口地址
   - `洗衣API AppID` / `AppSecret` / `Token`：认证信息
   - `快递API地址` / `Key` / `Secret`：快递API认证信息
3. 开启「洗衣自动下单」和「洗衣自动取件」开关

> ⚠️ 洗衣API接口为预留扩展，需对接飞书云文档API后方可使用。

## 技术栈

- 后端：Node.js + Express + Sequelize + MySQL
- 前端H5：Vue3 + Vant4
- 后台管理：Vue3 + Element Plus
- 自动化：Puppeteer
