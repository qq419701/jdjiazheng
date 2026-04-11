// 京东自动下单引擎
// 使用Puppeteer自动化操作京东H5页面
const { JdAccount, Order } = require('../models');
const { 安全解析JSON } = require('../utils/helpers');
const 配置 = require('../config/config');

/**
 * 从账号池获取可用的京东账号
 * 优先取最久未使用的空闲账号
 * @returns {Object|null} 可用账号或null
 */
const 获取可用账号 = async () => {
  const 可用账号 = await JdAccount.findOne({
    where: {
      is_busy: 0,
      status: 1,
    },
    order: [
      ['last_used', 'ASC'], // 优先最久未使用的
    ],
  });
  return 可用账号;
};

/**
 * 添加操作日志到订单
 * @param {number} 订单ID - 订单ID
 * @param {string} 操作 - 操作描述
 * @param {string} 状态 - success/error/info
 */
const 添加操作日志 = async (订单ID, 操作, 状态 = 'info') => {
  const 订单 = await Order.findByPk(订单ID);
  if (!订单) return;

  const 现有日志 = 安全解析JSON(订单.order_log, []);
  现有日志.push({
    时间: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    操作,
    状态,
  });

  await 订单.update({ order_log: JSON.stringify(现有日志) });
};

/**
 * 执行自动下单流程
 * @param {number} 订单ID - 要下单的订单ID
 * @returns {Object} 下单结果
 */
const 执行自动下单 = async (订单ID) => {
  let puppeteer;
  let 浏览器 = null;
  let 使用账号 = null;

  try {
    // 动态加载Puppeteer（避免未安装时报错）
    puppeteer = require('puppeteer');
  } catch (错误) {
    return {
      成功: false,
      原因: 'Puppeteer未安装，请执行：npm install puppeteer',
    };
  }

  // 获取订单信息
  const 订单 = await Order.findByPk(订单ID);
  if (!订单) {
    return { 成功: false, 原因: '订单不存在' };
  }

  // 更新订单状态为下单中
  await 订单.update({ status: 1 });
  await 添加操作日志(订单ID, '开始自动下单流程', 'info');

  // 获取可用账号
  使用账号 = await 获取可用账号();
  if (!使用账号) {
    await 订单.update({ status: 5, fail_reason: '没有可用的京东账号' });
    await 添加操作日志(订单ID, '没有可用的京东账号', 'error');
    return { 成功: false, 原因: '没有可用的京东账号' };
  }

  // 标记账号为使用中
  await 使用账号.update({ is_busy: 1 });
  await 添加操作日志(订单ID, `使用京东账号：${使用账号.nickname || 使用账号.username}`, 'info');

  let 重试次数 = 0;
  const 最大重试 = 配置.最大重试次数;

  while (重试次数 < 最大重试) {
    重试次数++;
    try {
      await 添加操作日志(订单ID, `第${重试次数}次尝试下单`, 'info');

      // 启动浏览器
      浏览器 = await puppeteer.launch({
        headless: 配置.Puppeteer.无头模式,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=414,896',
        ],
        defaultViewport: { width: 414, height: 896 },
      });

      const 页面 = await 浏览器.newPage();

      // 设置移动端User-Agent
      await 页面.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');

      // 注入Cookie
      if (使用账号.cookie) {
        const Cookie列表 = 安全解析JSON(使用账号.cookie, []);
        if (Cookie列表.length > 0) {
          await 页面.setCookie(...Cookie列表);
        }
      }

      // 访问京东收货地址页面，添加客户地址
      await 页面.goto('https://newaddress.m.jd.com/newAddress/add', {
        waitUntil: 'networkidle2',
        timeout: 配置.Puppeteer.超时时间,
      });

      await 添加操作日志(订单ID, '已打开京东收货地址页面', 'info');

      // 等待页面加载
      await 页面.waitForTimeout(2000);

      // 这里根据京东实际页面结构进行操作
      // 注意：京东页面结构可能随时变化，需要根据实际情况调整
      // 以下为示例代码，需要根据实际页面元素调整选择器

      // TODO: 根据实际京东页面结构完善自动化操作
      // 1. 填写收货人姓名
      // 2. 填写手机号
      // 3. 选择省市区
      // 4. 填写详细地址
      // 5. 保存地址

      // 模拟下单成功（实际需要完善Puppeteer操作）
      const 模拟订单号 = `JD${Date.now()}`;
      
      // 更新订单状态为已下单
      await 订单.update({
        status: 2,
        jd_order_id: 模拟订单号,
        jd_account_id: 使用账号.id,
        ordered_at: new Date(),
        auto_order: 1,
      });

      // 更新账号使用记录
      await 使用账号.update({
        is_busy: 0,
        last_used: new Date(),
        use_count: (使用账号.use_count || 0) + 1,
      });

      await 添加操作日志(订单ID, `下单成功，京东订单号：${模拟订单号}`, 'success');

      await 浏览器.close();
      return { 成功: true, 订单号: 模拟订单号 };

    } catch (错误) {
      await 添加操作日志(订单ID, `第${重试次数}次下单失败：${错误.message}`, 'error');

      if (浏览器) {
        await 浏览器.close().catch(() => {});
        浏览器 = null;
      }

      if (重试次数 >= 最大重试) {
        // 最终失败
        await 订单.update({
          status: 5,
          fail_reason: `自动下单失败（已重试${最大重试}次）：${错误.message}`,
        });

        if (使用账号) {
          await 使用账号.update({ is_busy: 0 });
        }

        return { 成功: false, 原因: 错误.message };
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

/**
 * 触发京东账号自动登录并保存Cookie
 * @param {number} 账号ID - 京东账号ID
 * @returns {Object} 登录结果
 */
const 账号自动登录 = async (账号ID) => {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    return { 成功: false, 原因: 'Puppeteer未安装' };
  }

  const 账号 = await JdAccount.findByPk(账号ID);
  if (!账号) {
    return { 成功: false, 原因: '账号不存在' };
  }

  let 浏览器 = null;
  try {
    浏览器 = await puppeteer.launch({
      headless: false, // 登录时不使用无头模式，方便手动操作验证码
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 414, height: 896 },
    });

    const 页面 = await 浏览器.newPage();
    await 页面.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15');

    // 打开京东登录页
    await 页面.goto('https://passport.jd.com/new/login.aspx', {
      waitUntil: 'networkidle2',
    });

    // 等待用户手动登录（60秒超时）
    await 页面.waitForNavigation({ timeout: 60000 }).catch(() => {});

    // 获取Cookie
    const Cookie列表 = await 浏览器.cookies();

    // 保存Cookie到数据库
    await 账号.update({
      cookie: JSON.stringify(Cookie列表),
      cookie_expire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天有效期
      status: 1,
    });

    await 浏览器.close();
    return { 成功: true, 消息: 'Cookie保存成功' };

  } catch (错误) {
    if (浏览器) await 浏览器.close().catch(() => {});
    return { 成功: false, 原因: 错误.message };
  }
};

module.exports = { 执行自动下单, 账号自动登录 };
