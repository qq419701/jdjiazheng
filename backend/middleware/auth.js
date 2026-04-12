// JWT鉴权中间件
const jwt = require('jsonwebtoken');
const 配置 = require('../config/config');

/**
 * 验证JWT Token的中间件
 * 检查请求头中的Authorization字段
 * 若角色为 vendor，额外从数据库加载绑定批次ID列表
 */
const 验证Token = async (req, res, next) => {
  // 获取请求头中的Token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未登录，请先登录',
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // 验证Token
    const 解码数据 = jwt.verify(token, 配置.JWT密钥);

    // vendor角色：加载绑定批次ID列表，用于后续订单查询过滤
    if (解码数据.role === 'vendor') {
      const Admin = require('../models/Admin');
      const 管理员信息 = await Admin.findByPk(解码数据.id, {
        attributes: ['vendor_batch_ids', 'vendor_business_types', 'is_active'],
      });
      // 检查供货商账号是否仍有效
      if (!管理员信息 || !管理员信息.is_active) {
        return res.status(401).json({ code: 401, message: '账号已被禁用，请联系管理员' });
      }
      // 解析供货商绑定的批次ID列表（JSON数组）
      try {
        解码数据.vendor_batch_ids = JSON.parse(管理员信息.vendor_batch_ids || '[]');
      } catch {
        解码数据.vendor_batch_ids = [];
      }
      // 解析供货商可见的业务类型（逗号分隔字符串转数组）
      解码数据.vendor_business_types = (管理员信息.vendor_business_types || '').split(',').filter(Boolean);
    }

    req.管理员 = 解码数据;
    next();
  } catch (错误) {
    return res.status(401).json({
      code: 401,
      message: 'Token已过期或无效，请重新登录',
    });
  }
};

module.exports = { 验证Token };
