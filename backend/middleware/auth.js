// JWT鉴权中间件
const jwt = require('jsonwebtoken');
const 配置 = require('../config/config');

/**
 * 验证JWT Token的中间件
 * 检查请求头中的Authorization字段
 */
const 验证Token = (req, res, next) => {
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
