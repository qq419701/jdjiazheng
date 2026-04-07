// 奇所SUP系统工具服务
// 提供签名验证和卡密AES加密功能
// 签名规则：除sign外所有参数按ASCII排序拼接QueryString，前后追加 AppSecret+商户密钥，MD5后转大写
// 卡密加密：AES/ECB/PKCS7Padding/256位，密钥为AppSecret（32位）

const crypto = require('crypto');

/**
 * 验证奇所签名
 * 签名算法：
 *   1. 除 sign 字段外，所有参数（包括空值参数）按字段名ASCII码从小到大排序
 *   2. 拼接成 key1=value1&key2=value2 格式字符串
 *   3. 前后各追加 AppSecret + 商户密钥 的拼接字符串
 *   4. 整个字符串做MD5，转32位大写
 * @param {Object} 请求参数 - 包含sign的完整请求体
 * @param {string} appSecret - 开放平台AppSecret（32位）
 * @param {string} 商户密钥 - 商户密钥
 * @returns {boolean} 签名是否正确
 */
const 验证签名 = (请求参数, appSecret, 商户密钥) => {
  // 获取传入的签名值
  const 传入签名 = 请求参数.sign;
  if (!传入签名) return false;

  // 过滤掉 sign 字段，保留其余所有参数（包括空值）
  const 参数键列表 = Object.keys(请求参数)
    .filter(key => key !== 'sign')
    .sort(); // 按ASCII码从小到大排序

  // 拼接 key=value&key=value 格式字符串
  const 查询字符串 = 参数键列表
    .map(key => `${key}=${请求参数[key] ?? ''}`)
    .join('&');

  // 前后追加 AppSecret+商户密钥
  const 密钥串 = appSecret + 商户密钥;
  const 待签名字符串 = 密钥串 + 查询字符串 + 密钥串;

  // MD5用于奇所API规定的签名算法（非安全存储），为协议要求，不可替换
  const 计算签名 = crypto
    .createHash('md5')
    .update(待签名字符串, 'utf8')
    .digest('hex')
    .toUpperCase();

  return 计算签名 === 传入签名.toUpperCase();
};

/**
 * AES/ECB/PKCS7Padding 加密卡密信息
 * 算法：AES-256-ECB（等价于AES/ECB/PKCS7Padding/256位）
 * 密钥：AppSecret（32字符=256位）
 * 输出：Base64字符串
 * @param {Array} 卡密列表 - [{cardNo, cardPwd, expireTime}]
 * @param {string} appSecret - 32位AppSecret作为密钥
 * @returns {string} Base64加密后的字符串
 */
const 加密卡密 = (卡密列表, appSecret) => {
  // JSON序列化卡密数组
  const 明文 = JSON.stringify(卡密列表);
  // 密钥必须是32字节（256位）
  const 密钥 = Buffer.from(appSecret, 'utf8');
  // 使用 AES-256-ECB 模式，ECB模式第三个参数传 null
  const cipher = crypto.createCipheriv('aes-256-ecb', 密钥, null);
  // setAutoPadding(true) 默认启用 PKCS7 填充
  cipher.setAutoPadding(true);
  const 加密后 = Buffer.concat([cipher.update(明文, 'utf8'), cipher.final()]);
  return 加密后.toString('base64');
};

module.exports = { 验证签名, 加密卡密 };
