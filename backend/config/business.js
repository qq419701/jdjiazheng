/**
 * 业务模块开关配置
 * ============================================================
 * 配置方式：在服务器的 backend/.env 文件中修改以下变量
 * 修改后执行 pm2 restart <进程名> 重启后端即可生效
 *
 * 变量说明：
 *   BUSINESS_JIAZHENG_ENABLED=true   🏠 家政业务开关
 *   BUSINESS_XIYIFU_ENABLED=true     🧺 洗衣业务开关
 *   BUSINESS_TOPUP_ENABLED=true      💳 充值业务开关
 *   BUSINESS_SJZ_ENABLED=true        ⚔️  三角洲业务开关
 *
 * 效果：
 *   - 关闭某业务 → 该业务 H5 卡密验证接口返回"业务未开放"，用户无法下单
 *   - 关闭某业务 → 后台管理订单中心该业务Tab消失
 *   - 关闭某业务 → 卡密工作台该业务分组消失
 *   - 关闭某业务 → 数据看板该业务统计卡片消失
 * ============================================================
 */

/**
 * 解析环境变量为布尔值
 * 支持：true / false / 1 / 0（不区分大小写）
 * 默认值：true（未配置时默认开启，防止漏配导致业务消失）
 * @param {string} envKey - 环境变量名
 * @returns {boolean}
 */
function 解析业务开关(envKey) {
  const val = process.env[envKey];
  if (val === undefined || val === null || val === '') return true; // 未配置默认开启
  return !['false', '0', 'off', 'no'].includes(val.toLowerCase().trim());
}

// ===== 各业务开关状态 =====
const 业务开关 = {
  /** 🏠 家政业务是否开启（对应 .env: BUSINESS_JIAZHENG_ENABLED） */
  家政: 解析业务开关('BUSINESS_JIAZHENG_ENABLED'),
  /** 🧺 洗衣业务是否开启（对应 .env: BUSINESS_XIYIFU_ENABLED） */
  洗衣: 解析业务开关('BUSINESS_XIYIFU_ENABLED'),
  /** 💳 充值业务是否开启（对应 .env: BUSINESS_TOPUP_ENABLED） */
  充值: 解析业务开关('BUSINESS_TOPUP_ENABLED'),
  /** ⚔️ 三角洲业务是否开启（对应 .env: BUSINESS_SJZ_ENABLED） */
  三角洲: 解析业务开关('BUSINESS_SJZ_ENABLED'),
};

// 启动时打印开关状态，便于运维确认
console.log('📋 业务模块开关状态：');
console.log(`   🏠 家政：${业务开关.家政 ? '✅ 开启' : '❌ 关闭'}`);
console.log(`   🧺 洗衣：${业务开关.洗衣 ? '✅ 开启' : '❌ 关闭'}`);
console.log(`   💳 充值：${业务开关.充值 ? '✅ 开启' : '❌ 关闭'}`);
console.log(`   ⚔️  三角洲：${业务开关.三角洲 ? '✅ 开启' : '❌ 关闭'}`);

module.exports = 业务开关;
