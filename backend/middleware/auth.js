// JWT鉴权中间件
const jwt = require('jsonwebtoken');
const 配置 = require('../config/config');

/**
 * 验证JWT Token的中间件
 * 检查请求头中的Authorization字段
 */
const 验证Token = (req, res, next) => {
  // 获取Token：优先从请求头读取，其次从查询参数读取（用于导出下载场景）
  const token = (req.headers.authorization || '').replace('Bearer ', '') || req.query.token;
  
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: '未登录，请先登录',
    });
  }
  
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
