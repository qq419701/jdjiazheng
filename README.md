# 京东家政预约代下单系统

一套完整的京东家政预约代下单工具，包含前端H5预约页面、后台管理系统和后端API服务。

## 功能特性

- 🏠 **前端H5预约**：客户通过卡密链接访问，填写地址和预约时间
- 🖥️ **后台管理**：订单管理、卡密生成、京东账号管理、时间规则配置
- 🤖 **自动下单**：Puppeteer自动化操作京东平台完成下单
- ⏰ **灵活时间规则**：按城市/地区自定义约满天数
- 🎫 **卡密系统**：批量生成16位卡密，适配阿奇所发货软件

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Node.js + Express + Sequelize + MySQL |
| 前端H5 | Vue3 + Vant4 + Pinia |
| 后台管理 | Vue3 + Element Plus + ECharts |
| 自动化 | Puppeteer |
| 认证 | JWT |

## 快速启动

### 1. 环境准备
- Node.js 18+
- MySQL 5.7+

### 2. 后端启动
```bash
cd backend
cp .env.example .env        # 配置环境变量
npm install                 # 安装依赖
node init/initDB.js         # 初始化数据库
npm start                   # 启动服务（端口5500）
```

### 3. 前端H5开发
```bash
cd frontend-h5
npm install
npm run dev                 # 开发服务器（端口3000）
npm run build               # 构建生产版本
```

### 4. 后台管理开发
```bash
cd frontend-admin
npm install
npm run dev                 # 开发服务器（端口3001）
npm run build               # 构建生产版本
```

## 访问地址

| 地址 | 说明 |
|------|------|
| `http://localhost:5500/link/{卡密}` | 前端H5预约页面 |
| `http://localhost:5500/admin` | 后台管理（构建后） |
| `http://localhost:3000/link/{卡密}` | 前端H5开发模式 |
| `http://localhost:3001/admin` | 后台管理开发模式 |

## 默认账号

- 管理员账号：`admin`
- 管理员密码：`admin123`

## 目录结构

```
jdjiazheng/
├── docs/                    # 文档
│   ├── 需求文档.md
│   ├── 技术文档.md
│   └── 宝塔部署教程.md
├── backend/                 # 后端（Node.js + Express）
├── frontend-h5/             # 前端H5（Vue3 + Vant4）
├── frontend-admin/          # 后台管理（Vue3 + Element Plus）
└── README.md
```

## 文档

- [需求文档](docs/需求文档.md)
- [技术文档](docs/技术文档.md)
- [宝塔部署教程](docs/宝塔部署教程.md)

## 卡密使用说明

1. 登录后台管理 → **卡密管理** → **批量生成卡密**
2. 设置服务分类、数量后点击生成
3. 复制卡密到阿奇所发货软件进行自动发货
4. 客户收到卡密后访问：`https://你的域名/link/{卡密}`

## 时间规则说明

系统支持按城市/地区配置预约前约满天数：
- **一线城市**（北京/上海/广州/深圳）：前4天约满
- **二线城市**（成都/杭州/武汉等）：前3天约满
- **其他城市**：前2天约满

可在后台 **时间规则** 页面自定义配置。

## License

MIT