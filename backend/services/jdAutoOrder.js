// 京东自动下单引擎
// 使用Puppeteer自动化操作京东H5页面
const fs = require('fs');
const { JdAccount, Order } = require('../models');
const { 安全解析JSON } = require('../utils/helpers');
const 配置 = require('../config/config');

// 跟踪正在进行中的登录会话，key=账号ID，value=Browser实例
const 进行中的登录会话 = new Map();

// Cookie有效期（30天）
const Cookie有效期毫秒 = 30 * 24 * 60 * 60 * 1000;

/**
 * 查找系统中可用的 Chrome/Chromium 可执行路径
 * 按优先级依次尝试：环境变量 > 常见系统路径 > 不传（让puppeteer自行查找）
 * @returns {string|undefined} 可执行文件路径，未找到则返回 undefined
 */
const 查找Chrome路径 = () => {
  const 候选路径 = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/local/bin/chromium',
  ].filter(Boolean);

  for (const 路径 of 候选路径) {
    try {
      if (fs.existsSync(路径)) {
        return 路径;
      }
    } catch {
      // 忽略访问错误，继续尝试下一个
    }
  }
  return undefined;
};

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
    await 订单.update({ status: 3, fail_reason: '没有可用的京东账号' });
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
      const ChromePath = 查找Chrome路径();
      const 启动选项 = {
        headless: 配置.Puppeteer.无头模式,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--window-size=414,896',
        ],
        defaultViewport: { width: 414, height: 896 },
      };
      if (ChromePath) {
        启动选项.executablePath = ChromePath;
      }
      浏览器 = await puppeteer.launch(启动选项);

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

      // 访问京东我的页面，验证Cookie是否有效
      await 页面.goto('https://home.m.jd.com/myJd/newhome.action', {
        waitUntil: 'networkidle2',
        timeout: 配置.Puppeteer.超时时间,
      });

      const 验证URL = 页面.url();
      let 跳转到登录页 = false;
      try {
        const { hostname } = new URL(验证URL);
        跳转到登录页 = hostname === 'passport.jd.com';
      } catch {
        // URL解析失败时保守处理，视为需要重新登录
        跳转到登录页 = true;
      }
      if (跳转到登录页) {
        // Cookie已过期，将账号标记为异常
        await 使用账号.update({ status: 0 });
        throw new Error('Cookie已过期，请重新登录');
      }

      await 添加操作日志(订单ID, '登录状态验证通过', 'info');

      // 记录本次处理的订单信息
      const 地址信息 = [订单.province, 订单.city, 订单.district, 订单.street, 订单.address]
        .filter(Boolean)
        .join('');
      await 添加操作日志(
        订单ID,
        `订单信息：收货人 ${订单.name}（${订单.phone}），地址：${地址信息}，服务：${订单.service_type}，时间：${订单.visit_date} ${订单.visit_time}`,
        'info',
      );

      // 自动化下单流程尚未实现，将订单重置为待处理，由人工完成后续操作
      await 订单.update({
        status: 0,
        jd_account_id: 使用账号.id,
        auto_order: 1,
      });

      await 使用账号.update({
        is_busy: 0,
        last_used: new Date(),
      });

      await 添加操作日志(订单ID, '自动下单功能开发中，请人工处理', 'info');

      await 浏览器.close();
      浏览器 = null;
      return { 成功: false, 原因: '自动下单功能开发中，请人工处理' };

    } catch (错误) {
      await 添加操作日志(订单ID, `第${重试次数}次下单失败：${错误.message}`, 'error');

      if (浏览器) {
        await 浏览器.close().catch(() => {});
        浏览器 = null;
      }

      if (重试次数 >= 最大重试) {
        // 最终失败
        await 订单.update({
          status: 3,
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
 * 后台轮询检测登录状态，登录成功后保存Cookie
 * @param {Browser} 浏览器实例
 * @param {Page} 页面实例
 * @param {Object} 账号 - JdAccount实例
 * @param {number} 账号ID
 */
const 后台轮询登录状态 = async (浏览器实例, 页面实例, 账号, 账号ID) => {
  const 开始时间 = Date.now();
  const 超时毫秒 = 120 * 1000; // 最多等待120秒

  try {
    while (Date.now() - 开始时间 < 超时毫秒) {
      await new Promise(r => setTimeout(r, 2000));

      try {
        const Cookie列表 = await 页面实例.cookies();
        // 检测京东主要登录凭证Cookie（pt_key + pt_pin）
        const 已有ptKey = Cookie列表.some(c => c.name === 'pt_key' && c.value);
        const 已有ptPin = Cookie列表.some(c => c.name === 'pt_pin' && c.value);

        if (已有ptKey && 已有ptPin) {
          await 账号.update({
            cookie: JSON.stringify(Cookie列表),
            cookie_expire: new Date(Date.now() + Cookie有效期毫秒),
            status: 1,
          });
          break;
        }

        // 也检测URL跳转（已离开登录页则视为登录成功）
        const 当前URL = 页面实例.url();
        let 仍在登录页 = true;
        try {
          const { hostname } = new URL(当前URL);
          仍在登录页 = hostname === 'passport.jd.com';
        } catch {
          // URL解析失败，保守处理，继续等待
        }
        if (!仍在登录页) {
          const 全部Cookie = await 页面实例.cookies();
          await 账号.update({
            cookie: JSON.stringify(全部Cookie),
            cookie_expire: new Date(Date.now() + Cookie有效期毫秒),
            status: 1,
          });
          break;
        }
      } catch {
        // 页面可能已关闭或发生异常，结束轮询
      }
    }
  } finally {
    进行中的登录会话.delete(账号ID);
    await 浏览器实例.close().catch(() => {});
  }
};

/**
 * 触发京东账号自动登录并保存Cookie
 * 以无头模式打开浏览器，截取二维码返回给前端，后台轮询检测登录成功
 * @param {number} 账号ID - 京东账号ID
 * @returns {Object} 登录结果（包含二维码base64数据）
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

  // 若该账号已有进行中的登录会话，先关闭旧的
  if (进行中的登录会话.has(账号ID)) {
    const 旧浏览器 = 进行中的登录会话.get(账号ID);
    await 旧浏览器.close().catch(() => {});
    进行中的登录会话.delete(账号ID);
  }

  let 浏览器 = null;
  try {
    const ChromePath登录 = 查找Chrome路径();
    const 登录启动选项 = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--window-size=1280,800',
      ],
      defaultViewport: { width: 1280, height: 800 },
    };
    if (ChromePath登录) {
      登录启动选项.executablePath = ChromePath登录;
    }
    浏览器 = await puppeteer.launch(登录启动选项);
    进行中的登录会话.set(账号ID, 浏览器);

    const 页面 = await 浏览器.newPage();
    await 页面.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    );

    // 打开京东登录页（PC扫码登录）
    await 页面.goto('https://passport.jd.com/new/login.aspx', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 尝试切换到扫码登录选项卡（若当前显示的是账号密码登录）
    const QR码切换选择器列表 = [
      'a[href*="qr"]',
      '.login-tab-r a',
      '.login-tab a:last-child',
      'a.tab-r',
    ];
    for (const 选择器 of QR码切换选择器列表) {
      try {
        const 按钮 = await 页面.$(选择器);
        if (按钮) {
          await 按钮.click();
          await new Promise(r => setTimeout(r, 1500));
          break;
        }
      } catch {
        // 忽略，继续尝试下一个选择器
      }
    }

    // 等待二维码出现，依次尝试常见选择器
    const QR码图片选择器列表 = [
      '.login-qrcode-img',
      '.login-qrcode img',
      '#qrcode img',
      '.qrcode img',
      'img.qrcode',
      'img[src*="qrcode"]',
    ];
    let QR码元素 = null;
    for (const 选择器 of QR码图片选择器列表) {
      try {
        QR码元素 = await 页面.waitForSelector(选择器, { timeout: 5000 });
        if (QR码元素) break;
      } catch {
        // 继续尝试下一个选择器
      }
    }

    // 截图获取二维码（优先截取元素，否则截取整个页面）
    let 截图Buffer;
    if (QR码元素) {
      截图Buffer = await QR码元素.screenshot();
    } else {
      截图Buffer = await 页面.screenshot({ fullPage: false });
    }

    // 转为base64供前端展示（无需写磁盘）
    const 二维码Base64 = `data:image/png;base64,${截图Buffer.toString('base64')}`;

    // 启动后台轮询（不等待，异步执行）
    后台轮询登录状态(浏览器, 页面, 账号, 账号ID).catch(() => {
      进行中的登录会话.delete(账号ID);
    });

    return {
      成功: true,
      需要扫码: true,
      二维码: 二维码Base64,
      消息: '请用手机扫描二维码登录',
    };

  } catch (错误) {
    进行中的登录会话.delete(账号ID);
    if (浏览器) await 浏览器.close().catch(() => {});
    return { 成功: false, 原因: 错误.message };
  }
};

module.exports = { 执行自动下单, 账号自动登录 };
