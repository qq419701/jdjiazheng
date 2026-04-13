# SUP 系统接口测试

对照阿奇所官方文档，自动验证所有 SUP 接口的响应格式。

## 运行步骤

**1. 启动后端服务**

```bash
cd backend
node app.js
```

**2. 填写配置**

编辑 `sup-test.js` 顶部的 `CONFIG`：

| 配置项 | 说明 | 来源 |
|---|---|---|
| `appSecret` | AppSecret（32位） | 后台「系统设置 → 阿奇所配置」 |
| `merchantKey` | 商户密钥 | 同上 |
| `userId` | 阿奇所用户ID | 同上 |
| `productNo` | 商品编号 | 可留空，自动获取 |

**3. 运行测试**

```bash
node backend/test/sup-test.js
```

## 测试项说明

| 测试 | 接口 | 检查内容 |
|---|---|---|
| T1 | getAppId | 返回 appId |
| T2 | 签名验证 | appSecret/merchantKey 正确性 |
| T3 | getList | 商品列表格式 |
| T4 | getTemplate | apiType=1, productType=2 |
| T5 | cardOrder | 下单成功，cards/orderCost 格式 |
| T6 | cardOrder（重复） | 防重复 code=1250 |
| T7 | queryOrder | failCode/failReason 字段存在 |
| **T8** | **cancelOrder ★** | **refuseProof 必须存在（官方文档必填字段）** |
| T9 | cancelOrder（重复） | 撤单幂等 |
| T10 | subscribePriceNotify | 订阅价格推送 |
| T11 | cancelSubscribePriceNotify | 取消订阅 |

## T8 核心说明

阿奇所官方文档「撤销下单接口」响应参数中，`data.refuseProof` 的「必须返回」列为**「是」**。

即使 `cancelStatus=20`（撤单成功），响应体中也必须包含 `refuseProof` 字段（空字符串 `""`）。

缺少此字段会导致阿奇所平台报：
- 「执行退款处理失败：暂不支持同意退款处理」
- 「货源方没有配置此功能」
