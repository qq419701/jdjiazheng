// 洗衣服务控制器（预留接口，待对接飞书云文档订单API和快递API）

/**
 * 触发洗衣订单API下单（对接飞书云文档订单API）
 * POST /admin/api/laundry/orders/:id/place-order
 */
const 触发洗衣下单 = async (req, res) => {
  res.json({ code: 1, message: '接口预留，待对接', data: null });
};

/**
 * 查询洗衣订单状态
 * GET /admin/api/laundry/orders/:id/status
 */
const 查询洗衣订单状态 = async (req, res) => {
  res.json({ code: 1, message: '接口预留，待对接', data: null });
};

/**
 * 触发快递上门取件（对接快递API）
 * POST /admin/api/laundry/orders/:id/express-pickup
 */
const 触发快递取件 = async (req, res) => {
  res.json({ code: 1, message: '接口预留，待对接', data: null });
};

/**
 * 查询快递状态
 * GET /admin/api/laundry/orders/:id/express-status
 */
const 查询快递状态 = async (req, res) => {
  res.json({ code: 1, message: '接口预留，待对接', data: null });
};

module.exports = { 触发洗衣下单, 查询洗衣订单状态, 触发快递取件, 查询快递状态 };
