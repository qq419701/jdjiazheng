// 奇所SUP签名验证中间件
// 验证奇所平台发过来的请求签名
// 注意：获取应用ID接口是匿名接口，不需要经过此中间件

const { Setting } = require('../models');
const { 验证签名 } = require('../services/agisoService');

/**
 * 奇所SUP签名验证中间件
 * 验证流程：
 *   1. 从数据库读取 agiso_sup_enabled、agiso_app_secret、agiso_merchant_key、agiso_user_id
 *   2. 检查SUP接口总开关
 *   3. 检查 sign 是否存在
 *   4. 验证时间戳（timestamp存在且超过10分钟时返回408，不存在则跳过）
 *   5. 验证签名
 *   6. 验证 userId
 */
const 验证奇所签名 = async (req, res, next) => {
  try {
    const 配置列表 = await Setting.findAll({
      where: {
        key_name: ['agiso_sup_enabled', 'agiso_app_secret', 'agiso_merchant_key', 'agiso_user_id'],
      },
    });

    const 配置 = {};
    配置列表.forEach(项 => {
      配置[项.key_name] = 项.key_value;
    });

    if (配置.agiso_sup_enabled !== '1') {
      return res.json({ code: 9999, message: 'SUP接口未开启' });
    }

    const appSecret = 配置.agiso_app_secret || '';
    const 商户密钥 = 配置.agiso_merchant_key || '';
    const 配置用户ID = 配置.agiso_user_id || '';

    const 请求体 = req.body || {};
    const { userId, sign, timestamp } = 请求体;

    if (!sign) {
      return res.json({ code: 401, message: '签名错误' });
    }

    // 验证时间戳（timestamp存在时才验证，超过10分钟返回408）
    if (timestamp !== undefined && timestamp !== null && timestamp !== '') {
      const 当前时间戳 = Math.floor(Date.now() / 1000);
      const 时间差 = Math.abs(当前时间戳 - Number(timestamp));
      if (时间差 > 600) {
        return res.json({ code: 408, message: '时间戳过期' });
      }
    }

    const 签名有效 = 验证签名(请求体, appSecret, 商户密钥);
    if (!签名有效) {
      return res.json({ code: 401, message: '签名错误' });
    }

    if (配置用户ID && String(userId) !== String(配置用户ID)) {
      return res.json({ code: 1001, message: '无效的平台会员ID' });
    }

    next();
  } catch (错误) {
    console.error('奇所签名验证出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器内部错误' });
  }
};

module.exports = { 验证奇所签名 };