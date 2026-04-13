/**
 * 阿奇所 SUP 系统本地接口测试脚本
 * 对照官方文档验证所有接口响应格式
 *
 * 运行前准备：
 *   1. 确保 backend 服务已启动：cd backend && node app.js
 *   2. 填写下方 CONFIG 中的 appSecret、merchantKey、userId
 *   3. productNo 可留空，脚本会自动从商品列表取第一个
 *
 * 运行命令：
 *   node backend/test/sup-test.js
 */

'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');

// ============================================================
// 配置区 —— 请填写以下信息后运行
// ============================================================
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  appSecret: '',            // 后台「阿奇所配置」→ AppSecret（32位）
  merchantKey: '',          // 后台「阿奇所配置」→ 商户密钥
  userId: '',               // 后台「阿奇所配置」→ 阿奇所用户ID
  productNo: '',            // 可留空，自动取商品列表第一个
  testOrderNo: `SUP-TEST-${Date.now()}`,
};
// ============================================================

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(CONFIG.baseUrl + path);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch (e) { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function generateSign(params) {
  const keys = Object.keys(params).filter(k => k !== 'sign').sort();
  const query = keys.map(k => `${k}=${params[k] == null ? '' : params[k]}`).join('&');
  const secretStr = CONFIG.appSecret + CONFIG.merchantKey;
  return crypto.createHash('md5').update(secretStr + query + secretStr, 'utf8').digest('hex').toUpperCase();
}

function buildBody(extra) {
  const body = Object.assign({
    userId: CONFIG.userId,
    timestamp: Math.floor(Date.now() / 1000),
    version: '1.0',
  }, extra || {});
  body.sign = generateSign(body);
  return body;
}

let passed = 0;
let failed = 0;

function check(label, condition, hint) {
  if (condition) {
    console.log('  \u2705 ' + label);
    passed++;
  } else {
    console.log('  \u274c ' + label + (hint ? '  -- ' + hint : ''));
    failed++;
  }
}

async function run(name, fn) {
  console.log('\n[' + name + ']');
  try {
    await fn();
  } catch (e) {
    console.log('  \u274c 请求失败: ' + e.message);
    failed++;
  }
}

function sleep(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
}

async function main() {
  console.log('\n========================================');
  console.log('  阿奇所 SUP 系统本地接口测试');
  console.log('========================================');

  if (!CONFIG.appSecret || !CONFIG.merchantKey || !CONFIG.userId) {
    console.log('\n[警告] CONFIG 中 appSecret / merchantKey / userId 未填写！');
    console.log('  请先填写配置后重新运行，否则签名接口将失败。\n');
  }

  let orderOk = false;

  await run('T1: 获取应用ID（匿名接口）', async function() {
    const res = await post('/agisoAcprSupplierApi/app/getAppId', {});
    check('code === 200', res.code === 200, '实际 code=' + res.code);
    check('data.appId 存在', !!(res.data && res.data.appId !== undefined), 'data=' + JSON.stringify(res.data));
    if (res.data && res.data.appId) console.log('  appId = ' + res.data.appId);
  });
  await sleep(100);

  await run('T2: 签名验证', async function() {
    const res = await post('/agisoAcprSupplierApi/product/getList', buildBody({ pageIndex: 1, pageSize: 1 }));
    if (res.code === 401) {
      check('签名验证通过', false, 'appSecret 或 merchantKey 配置错误');
    } else if (res.code === 9999) {
      check('签名验证通过', false, 'SUP接口未开启，请在后台开启 agiso_sup_enabled');
    } else {
      check('签名验证通过（非401/9999）', true);
    }
  });
  await sleep(100);

  await run('T3: 获取商品列表', async function() {
    const res = await post('/agisoAcprSupplierApi/product/getList', buildBody({ pageIndex: 1, pageSize: 20 }));
    check('code === 200', res.code === 200, '实际 code=' + res.code);
    check('data.items 是数组', !!(res.data && Array.isArray(res.data.items)));
    if (res.data && Array.isArray(res.data.items)) {
      console.log('  商品数量: ' + res.data.items.length);
      if (!CONFIG.productNo && res.data.items.length > 0) {
        CONFIG.productNo = res.data.items[0].productNo;
        console.log('  自动选择商品: ' + CONFIG.productNo);
      }
    }
  });
  await sleep(100);

  await run('T4: 获取商品模板', async function() {
    if (!CONFIG.productNo) { console.log('  跳过（无可用商品编号）'); return; }
    const res = await post('/agisoAcprSupplierApi/product/getTemplate', buildBody({ productNo: CONFIG.productNo }));
    check('code === 200', res.code === 200, '实际 code=' + res.code);
    if (res.data) {
      check('apiType === 1（同步发货）', res.data.apiType === 1, '实际=' + res.data.apiType);
      check('productType === 2（卡密）', res.data.productType === 2, '实际=' + res.data.productType);
      check('productCost 是 number', typeof res.data.productCost === 'number', '实际类型=' + typeof res.data.productCost);
    }
  });
  await sleep(100);

  await run('T5: 卡密下单（同步模式）', async function() {
    if (!CONFIG.productNo) { console.log('  跳过（无可用商品编号）'); return; }
    const res = await post('/agisoAcprSupplierApi/order/cardOrder', buildBody({
      orderNo: CONFIG.testOrderNo,
      productNo: CONFIG.productNo,
      buyNum: 1,
    }));
    console.log('  下单响应 code=' + res.code);
    if (res.code === 1230) {
      check('返回库存不足 code=1230', true);
      console.log('  库存不足，跳过后续撤单相关测试');
      return;
    }
    check('code === 200', res.code === 200, '实际 code=' + res.code + ' message=' + res.message);
    if (res.data) {
      check('orderStatus === 20', res.data.orderStatus === 20, '实际=' + res.data.orderStatus);
      check('orderNo 匹配', res.data.orderNo === CONFIG.testOrderNo);
      check('outTradeNo 非空', !!res.data.outTradeNo);
      check('cards 非空（AES加密卡密）', typeof res.data.cards === 'string' && res.data.cards.length > 0);
      check('orderCost 是 number', typeof res.data.orderCost === 'number', '实际类型=' + typeof res.data.orderCost);
      console.log('  orderCost = ' + res.data.orderCost + '（应无末尾无效零，如 10.0 应为 10）');
      if (res.code === 200 && res.data.orderStatus === 20) orderOk = true;
    }
  });
  await sleep(100);

  await run('T6: 防重复下单', async function() {
    if (!orderOk) { console.log('  跳过（T5 未成功）'); return; }
    const res = await post('/agisoAcprSupplierApi/order/cardOrder', buildBody({
      orderNo: CONFIG.testOrderNo,
      productNo: CONFIG.productNo,
      buyNum: 1,
    }));
    check('code === 1250（订单号重复）', res.code === 1250, '实际 code=' + res.code);
    if (res.data) {
      check('orderStatus === 20', res.data.orderStatus === 20);
      check('cards 有值', typeof res.data.cards === 'string' && res.data.cards.length > 0);
    }
  });
  await sleep(100);

  await run('T7: 查询订单', async function() {
    if (!orderOk) { console.log('  跳过（T5 未成功）'); return; }
    const res = await post('/agisoAcprSupplierApi/order/queryOrder', buildBody({ orderNo: CONFIG.testOrderNo }));
    check('code === 200', res.code === 200, '实际 code=' + res.code);
    if (res.data) {
      check('orderStatus === 20', res.data.orderStatus === 20);
      check('failCode 字段存在（文档必填）', 'failCode' in res.data, '当前 data 中无 failCode 字段');
      check('failReason 字段存在（文档必填）', 'failReason' in res.data, '当前 data 中无 failReason 字段');
    }
  });
  await sleep(100);

  await run('T8: 撤单（★核心★ refuseProof 必填验证）', async function() {
    if (!orderOk) { console.log('  跳过（T5 未成功）'); return; }
    const res = await post('/agisoAcprSupplierApi/order/cancelOrder', buildBody({ orderNo: CONFIG.testOrderNo }));
    check('code === 200', res.code === 200, '实际 code=' + res.code);
    if (res.data) {
      check('cancelStatus === 20（撤单成功）', res.data.cancelStatus === 20, '实际=' + res.data.cancelStatus);
      const hasRefuseProof = 'refuseProof' in res.data;
      check(
        'refuseProof 字段存在（官方文档必须返回=是）',
        hasRefuseProof,
        hasRefuseProof ? '' : '缺少此字段导致阿奇所报「货源方没有配置此功能」'
      );
      check('refuseReason 字段存在', 'refuseReason' in res.data);
      console.log('  data: ' + JSON.stringify(res.data));
    }
  });
  await sleep(100);

  await run('T9: 撤单幂等（重复撤单）', async function() {
    if (!orderOk) { console.log('  跳过（T5 未成功）'); return; }
    const res = await post('/agisoAcprSupplierApi/order/cancelOrder', buildBody({ orderNo: CONFIG.testOrderNo }));
    check('code === 200', res.code === 200);
    if (res.data) {
      check('cancelStatus === 20（已撤单仍返回成功）', res.data.cancelStatus === 20);
      check('refuseProof 字段存在', 'refuseProof' in res.data);
    }
  });
  await sleep(100);

  await run('T10: 订阅价格推送', async function() {
    const res = await post('/agisoAcprSupplierApi/product/subscribePriceNotify', buildBody({ productNo: CONFIG.productNo || 'test' }));
    check('code === 200', res.code === 200, '实际 code=' + res.code);
  });
  await sleep(100);

  await run('T11: 取消订阅价格推送', async function() {
    const res = await post('/agisoAcprSupplierApi/product/cancelSubscribePriceNotify', buildBody({ productNo: CONFIG.productNo || 'test' }));
    check('code === 200', res.code === 200, '实际 code=' + res.code);
  });

  console.log('\n========================================');
  console.log('  测试完成：' + passed + ' 通过 / ' + failed + ' 失败');
  console.log('========================================');
  if (failed > 0) {
    console.log('\n如有失败项，请对照上方错误提示检查配置和代码。');
    console.log('T8 失败（refuseProof 缺失）是导致阿奇所报「没有配置此功能」的根本原因。\n');
  } else {
    console.log('\n所有测试通过！SUP 接口符合阿奇所官方文档规范。\n');
  }
}

main().catch(function(e) {
  console.error('测试脚本异常:', e.message);
  process.exit(1);
});
