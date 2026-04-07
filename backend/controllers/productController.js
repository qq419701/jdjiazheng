// 商品管理控制器（SUP商品管理）
const { Op } = require('sequelize');
const { Product, Card } = require('../models');

/**
 * 获取商品列表
 * GET /admin/api/products
 * 支持 business_type 筛选、status 筛选
 */
const 获取商品列表 = async (req, res) => {
  try {
    const { business_type, status } = req.query;
    const 条件 = {};
    if (business_type) 条件.business_type = business_type;
    if (status !== undefined && status !== '') 条件.status = parseInt(status);

    const 商品列表 = await Product.findAll({
      where: 条件,
      order: [['product_no', 'ASC']],
    });

    // 统计每个商品关联的卡密数量
    const 结果 = await Promise.all(商品列表.map(async (商品) => {
      const 卡密数量 = await Card.count({ where: { product_id: 商品.id } });
      return { ...商品.toJSON(), card_count: 卡密数量 };
    }));

    res.json({ code: 1, message: '获取成功', data: 结果 });
  } catch (错误) {
    console.error('获取商品列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 新增商品
 * POST /admin/api/products
 * 自动分配商品编号（从1001开始，查最大+1）
 */
const 新增商品 = async (req, res) => {
  try {
    const { product_name, business_type, service_type, service_hours, cost_price, status, remark } = req.body;

    if (!product_name || !business_type) {
      return res.json({ code: 0, message: '商品名称和业务类型为必填项' });
    }

    // 自动分配商品编号：查询当前最大编号+1，从1001开始
    const 最大编号商品 = await Product.findOne({
      order: [['product_no', 'DESC']],
    });
    let 新编号 = '1001';
    if (最大编号商品) {
      const 当前最大 = parseInt(最大编号商品.product_no, 10);
      if (!isNaN(当前最大) && 当前最大 >= 1001) {
        新编号 = String(当前最大 + 1);
      }
    }

    const 商品 = await Product.create({
      product_no: 新编号,
      product_name,
      business_type,
      service_type: service_type || '',
      service_hours: parseInt(service_hours) || 0,
      cost_price: parseFloat(cost_price) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      remark: remark || null,
      created_at: new Date(),
    });

    res.json({ code: 1, message: '商品新增成功', data: 商品 });
  } catch (错误) {
    console.error('新增商品出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 更新商品
 * PUT /admin/api/products/:id
 */
const 更新商品 = async (req, res) => {
  try {
    const 商品 = await Product.findByPk(req.params.id);
    if (!商品) return res.json({ code: 0, message: '商品不存在' });

    const { product_name, business_type, service_type, service_hours, cost_price, status, remark } = req.body;

    const 更新数据 = {};
    if (product_name !== undefined) 更新数据.product_name = product_name;
    if (business_type !== undefined) 更新数据.business_type = business_type;
    if (service_type !== undefined) 更新数据.service_type = service_type;
    if (service_hours !== undefined) 更新数据.service_hours = parseInt(service_hours) || 0;
    if (cost_price !== undefined) 更新数据.cost_price = parseFloat(cost_price) || 0;
    if (status !== undefined) 更新数据.status = parseInt(status);
    if (remark !== undefined) 更新数据.remark = remark || null;

    await 商品.update(更新数据);
    res.json({ code: 1, message: '商品更新成功', data: 商品 });
  } catch (错误) {
    console.error('更新商品出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 删除商品
 * DELETE /admin/api/products/:id
 * 删除前检查是否有关联卡密，有则禁止删除
 */
const 删除商品 = async (req, res) => {
  try {
    const 商品 = await Product.findByPk(req.params.id);
    if (!商品) return res.json({ code: 0, message: '商品不存在' });

    const 关联卡密数量 = await Card.count({ where: { product_id: 商品.id } });
    if (关联卡密数量 > 0) {
      return res.json({ code: 0, message: `该商品下有 ${关联卡密数量} 张卡密，请先删除关联卡密再删除商品` });
    }

    await 商品.destroy();
    res.json({ code: 1, message: '商品已删除' });
  } catch (错误) {
    console.error('删除商品出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 获取商品列表, 新增商品, 更新商品, 删除商品 };
