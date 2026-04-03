// 洗衣API服务封装（预留，待对接飞书云文档订单API和快递API）

/**
 * 调用飞书云文档订单API下单
 * TODO: 对接 飞书云文档 订单API
 * 接口文档：https://nncqnit5fze3.feishu.cn/wiki/...（订单API）
 * 需要配置：laundry_api_url, laundry_api_key, laundry_app_id 等
 */
const 调用洗衣订单API = async (orderData) => {
  // TODO: 对接 飞书云文档 订单API
  throw new Error('洗衣订单API尚未配置，请在系统设置中填写API密钥');
};

/**
 * 调用快递API取件
 * TODO: 对接 飞书云文档 快递API
 */
const 调用快递取件API = async (orderData) => {
  // TODO: 对接 飞书云文档 快递API
  throw new Error('快递API尚未配置，请在系统设置中填写API密钥');
};

module.exports = { 调用洗衣订单API, 调用快递取件API };
