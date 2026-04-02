// 工具函数集合

/**
 * 生成随机卡密
 * @param {number} 长度 - 卡密长度，默认16位
 * @returns {string} 大写字母和数字组合的卡密
 */
const 生成卡密 = (长度 = 16) => {
  const 字符集 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let 卡密 = '';
  for (let i = 0; i < 长度; i++) {
    卡密 += 字符集.charAt(Math.floor(Math.random() * 字符集.length));
  }
  return 卡密;
};

/**
 * 生成订单号
 * 格式：JD + 年月日 + 6位随机数
 * @returns {string} 订单号
 */
const 生成订单号 = () => {
  const 日期 = new Date();
  const 年 = 日期.getFullYear();
  const 月 = String(日期.getMonth() + 1).padStart(2, '0');
  const 日 = String(日期.getDate()).padStart(2, '0');
  const 随机数 = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `JD${年}${月}${日}${随机数}`;
};

/**
 * 格式化日期为中文
 * @param {Date|string} 日期 - 日期对象或字符串
 * @returns {string} 格式化后的日期字符串
 */
const 格式化日期 = (日期) => {
  const d = new Date(日期);
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
};

/**
 * 验证手机号格式
 * @param {string} 手机号 - 手机号字符串
 * @returns {boolean} 是否有效
 */
const 验证手机号 = (手机号) => {
  return /^1[3-9]\d{9}$/.test(手机号);
};

/**
 * 安全获取JSON
 * @param {string} 字符串 - JSON字符串
 * @param {*} 默认值 - 解析失败时的默认值
 * @returns {*} 解析结果
 */
const 安全解析JSON = (字符串, 默认值 = null) => {
  try {
    return JSON.parse(字符串);
  } catch {
    return 默认值;
  }
};

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD格式
 */
const 获取今天 = () => {
  const d = new Date();
  // 转换为北京时间
  const 北京时间 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return 北京时间.toISOString().split('T')[0];
};

/**
 * 获取星期几的中文
 * @param {number} 星期数 - 0=周日，1=周一，...，6=周六
 * @returns {string} 中文星期
 */
const 获取星期中文 = (星期数) => {
  const 星期列表 = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return 星期列表[星期数];
};

module.exports = {
  生成卡密,
  生成订单号,
  格式化日期,
  验证手机号,
  安全解析JSON,
  获取今天,
  获取星期中文,
};
