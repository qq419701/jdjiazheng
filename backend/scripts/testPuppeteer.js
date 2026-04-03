/**
 * Puppeteer / Chrome 环境诊断脚本
 *
 * 用法：
 *   cd /www/wwwroot/jdjiazheng/backend
 *   node scripts/testPuppeteer.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 在目录树中递归查找 Chrome/Chromium 可执行文件（限制深度）
 * @param {string} 目录 - 起始目录
 * @param {number} 深度 - 当前递归深度
 * @returns {string|null} 找到的可执行文件路径，未找到返回 null
 */
const 查找缓存可执行 = (目录, 深度 = 0) => {
  if (深度 > 4) return null;
  let 条目;
  try {
    条目 = fs.readdirSync(目录);
  } catch {
    return null;
  }
  for (const 条 of 条目) {
    const 完整路径 = path.join(目录, 条);
    if (条 === 'chrome' || 条 === 'chromium' || 条 === 'chrome-linux' || 条 === 'chrome.exe') {
      try {
        const stat = fs.statSync(完整路径);
        if (stat.isFile()) return 完整路径;
        if (stat.isDirectory()) {
          const 内部结果 = 查找缓存可执行(完整路径, 深度 + 1);
          if (内部结果) return 内部结果;
        }
      } catch {
        // 忽略无法访问的路径
      }
    }
  }
  return null;
};

// ─── 1. 检测所有可能的 Chrome/Chromium 路径 ────────────────────────────────────
console.log('=== [1/4] 检测系统 Chrome/Chromium 路径 ===');

const 候选路径 = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/local/bin/chromium',
].filter(Boolean);

let 可用路径 = null;

for (const p of 候选路径) {
  try {
    const 存在 = fs.existsSync(p);
    console.log(`  ${存在 ? '✅' : '❌'} ${p}`);
    if (存在 && !可用路径) {
      可用路径 = p;
    }
  } catch (e) {
    console.log(`  ❓ ${p} (无法访问: ${e.message})`);
  }
}

// ─── 2. 检测 puppeteer 缓存路径 ───────────────────────────────────────────────
console.log('\n=== [2/4] 检测 puppeteer 缓存路径 ===');

const 缓存目录 = '/root/.cache/puppeteer';
console.log(`  缓存目录: ${缓存目录}`);

if (fs.existsSync(缓存目录)) {
  console.log('  ✅ 缓存目录存在');
  try {
    const 子目录 = fs.readdirSync(缓存目录);
    if (子目录.length > 0) {
      console.log(`  📦 已缓存内容: ${子目录.join(', ')}`);
      // 尝试找到缓存中的 chrome 可执行文件
      for (const 子 of 子目录) {
        const 子路径 = path.join(缓存目录, 子);
        try {
          const 找到 = 查找缓存可执行(子路径);
          if (找到 && !可用路径) {
            console.log(`  🎯 发现缓存中的 Chrome: ${找到}`);
            可用路径 = 找到;
          }
        } catch {
          // 忽略无法读取的子目录
        }
      }
    } else {
      console.log('  ⚠️  缓存目录为空（Chrome 未下载）');
    }
  } catch (e) {
    console.log(`  ⚠️  无法读取缓存目录: ${e.message}`);
  }
} else {
  console.log('  ❌ 缓存目录不存在（Chrome 未通过 puppeteer 下载）');
}

// ─── 3. 尝试启动浏览器 ────────────────────────────────────────────────────────
async function 运行诊断() {
  console.log('\n=== [3/4] 尝试启动浏览器 ===');

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
    console.log(`  ✅ puppeteer 模块加载成功（版本: ${require('../node_modules/puppeteer/package.json').version}）`);
  } catch (e) {
    console.error(`  ❌ puppeteer 模块加载失败: ${e.message}`);
    console.log('\n=== [4/4] 修复建议 ===');
    console.log('  请先安装 puppeteer：');
    console.log('    cd /www/wwwroot/jdjiazheng/backend && npm install puppeteer');
    process.exit(1);
  }

  const 公共参数 = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
  ];

  // 构造要尝试的启动配置列表
  const 尝试列表 = [];
  if (可用路径) {
    尝试列表.push({ label: `系统路径: ${可用路径}`, executablePath: 可用路径 });
  }
  // 最后尝试不传 executablePath（让 puppeteer 自行查找）
  尝试列表.push({ label: 'puppeteer 默认路径', executablePath: undefined });

  let 启动成功 = false;
  let 成功浏览器 = null;

  for (const { label, executablePath } of 尝试列表) {
    console.log(`\n  ▶ 尝试: ${label}`);
    const 选项 = {
      headless: true,
      args: 公共参数,
      defaultViewport: { width: 414, height: 896 },
    };
    if (executablePath) {
      选项.executablePath = executablePath;
    }

    try {
      const 浏览器 = await puppeteer.launch(选项);
      console.log('  ✅ 浏览器启动成功！');
      成功浏览器 = 浏览器;
      启动成功 = true;
      break;
    } catch (e) {
      console.log(`  ❌ 启动失败: ${e.message.split('\n')[0]}`);
    }
  }

  // ─── 4. 如果启动成功，访问百度并截图 ─────────────────────────────────────────
  console.log('\n=== [4/4] 诊断结果 ===');

  if (启动成功 && 成功浏览器) {
    try {
      const 页面 = await 成功浏览器.newPage();
      console.log('  📄 正在打开 https://www.baidu.com ...');
      await 页面.goto('https://www.baidu.com', { waitUntil: 'networkidle2', timeout: 30000 });
      const 标题 = await 页面.title();
      console.log(`  📰 页面标题: ${标题}`);
      const 截图路径 = '/tmp/test_screenshot.png';
      await 页面.screenshot({ path: 截图路径, fullPage: false });
      console.log(`  📸 截图已保存至: ${截图路径}`);
      await 成功浏览器.close();
    } catch (e) {
      console.log(`  ⚠️  截图失败（浏览器启动正常，但网络访问出错）: ${e.message}`);
      try { await 成功浏览器.close(); } catch { /* 忽略 */ }
    }

    console.log('\n  ✅ Puppeteer 环境正常，可以运行自动下单');
    if (可用路径) {
      console.log(`  💡 使用的 Chrome 路径: ${可用路径}`);
      console.log('     可将此路径设为环境变量: CHROME_PATH=' + 可用路径);
    }
  } else {
    console.log('  ❌ 无法启动浏览器，请按以下步骤修复：');
    console.log('\n  方案 A — 让 puppeteer 下载自己的 Chromium：');
    console.log('    cd /www/wwwroot/jdjiazheng/backend');
    console.log('    npx puppeteer browsers install chrome');
    console.log('\n  方案 B — 安装系统 Chromium（适合 Ubuntu/Debian）：');
    console.log('    apt-get install -y chromium-browser');
    console.log('     或');
    console.log('    apt-get install -y chromium');
    console.log('\n  安装完成后再次运行本脚本进行验证。');
    process.exit(1);
  }
}

运行诊断().catch((e) => {
  console.error('诊断脚本出错:', e);
  process.exit(1);
});
