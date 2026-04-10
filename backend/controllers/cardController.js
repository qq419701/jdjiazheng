// 卡密控制器
const { Op } = require('sequelize');
const { Card, CardBatch, Product } = require('../models');
const { 批量生成卡密 } = require('../services/cardService');

/**
 * 获取卡密列表
 * GET /admin/api/cards
 */
const 获取卡密列表 = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status, category, batch_id, business_type } = req.query;
    const 条件 = {};

    if (keyword) {
      条件[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined && status !== '') 条件.status = parseInt(status);
    if (category) 条件.category = { [Op.like]: `%${category}%` };
    if (batch_id !== undefined && batch_id !== '') 条件.batch_id = parseInt(batch_id);
    if (business_type) 条件.business_type = business_type;

    const { count, rows } = await Card.findAndCountAll({
      where: 条件,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: { total: count, page: parseInt(page), limit: parseInt(limit), list: rows },
    });
  } catch (错误) {
    console.error('获取卡密列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 批量生成卡密（先创建批次记录）
 * POST /admin/api/cards/generate
 */
const 生成卡密 = async (req, res) => {
  try {
    const {
      count = 1,
      category = '日常保洁',
      service_type,
      service_hours,
      remark = '',
      expired_at = null,
      business_type,
      product_id,
    } = req.body;

    // 若传入 product_id，从商品表查询并自动填充服务信息
    let 最终service_type = service_type || '日常保洁';
    let 最终service_hours = service_hours !== undefined ? parseInt(service_hours) : 2;
    let 最终business_type = business_type || 'jiazheng';
    let 最终product_id = product_id ? parseInt(product_id) : null;

    if (product_id) {
      const 商品 = await Product.findByPk(parseInt(product_id));
      if (!商品) {
        return res.json({ code: 0, message: '指定商品不存在' });
      }
      最终service_type = 商品.service_type || 最终service_type;
      最终service_hours = 商品.service_hours !== undefined ? 商品.service_hours : 最终service_hours;
      最终business_type = 商品.business_type || 最终business_type;
      最终product_id = 商品.id;
    }

    if (count < 1 || count > 1000) {
      return res.json({ code: 0, message: '生成数量必须在1-1000之间' });
    }

    // 先创建批次记录
    const 批次号 = 'BATCH' + Date.now();
    const 批次 = await CardBatch.create({
      batch_no: 批次号,
      category: category || 最终service_type,
      service_type: 最终service_type,
      service_hours: 最终service_hours,
      count: parseInt(count),
      remark,
      created_by: req.管理员?.id,
      created_at: new Date(),
      business_type: 最终business_type,
      product_id: 最终product_id,
    });

    const 结果 = await 批量生成卡密({
      数量: parseInt(count),
      分类: category || 最终service_type,
      服务类型: 最终service_type,
      服务时长: 最终service_hours,
      备注: remark,
      过期时间: expired_at ? new Date(expired_at) : null,
      创建人ID: req.管理员?.id,
      批次ID: 批次.id,
      业务类型: 最终business_type,
      商品ID: 最终product_id,
    });

    res.json({
      code: 1,
      message: `成功生成${结果.length}个卡密`,
      data: {
        codes: 结果.map(c => c.code),
        batch_no: 批次号,
        batch_id: 批次.id,
      },
    });
  } catch (错误) {
    console.error('生成卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 导出卡密TXT
 * GET /admin/api/cards/export
 * 支持 status、category、business_type 过滤
 * Bug修复：原接口缺少 business_type 过滤，会把家政和洗衣卡密混在一起导出
 */
const 导出卡密 = async (req, res) => {
  try {
    const { status, category, business_type } = req.query;
    const 条件 = {};
    // 状态过滤（不传时默认导出全部状态）
    if (status !== undefined && status !== '') 条件.status = parseInt(status);
    if (category) 条件.category = category;
    // 修复：按业务类型过滤，防止家政和洗衣卡密混用
    if (business_type) 条件.business_type = business_type;

    const 卡密列表 = await Card.findAll({
      where: 条件,
      order: [['created_at', 'DESC']],
    });

    const 内容 = 卡密列表.map(c => c.code).join('\n');

    // 根据业务类型生成对应的文件名
    const 业务名称 = business_type === 'xiyifu' ? '洗衣' : (business_type === 'jiazheng' ? '家政' : '全部');
    const 文件名 = `${业务名称}卡密_${Date.now()}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(文件名)}"`);
    res.send(内容);
  } catch (错误) {
    console.error('导出卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 作废卡密（将状态设为2-已失效）
 * PUT /admin/api/cards/:id/invalidate
 * PUT /admin/api/laundry-cards/:id/invalidate（路由层强制 business_type='xiyifu'）
 */
const 作废卡密 = async (req, res) => {
  try {
    const 卡密 = await Card.findByPk(req.params.id);
    if (!卡密) return res.json({ code: 0, message: '卡密不存在' });
    if (卡密.status === 1) return res.json({ code: 0, message: '已使用的卡密不能作废' });
    if (卡密.status === 2) return res.json({ code: 0, message: '该卡密已经是失效状态' });

    await 卡密.update({ status: 2, invalidated_at: new Date() });
  } catch (错误) {
    console.error('作废卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 删除卡密
 * DELETE /admin/api/cards/:id
 */
const 删除卡密 = async (req, res) => {
  try {
    const 卡密 = await Card.findByPk(req.params.id);
    if (!卡密) return res.json({ code: 0, message: '卡密不存在' });
    if (卡密.status === 1) return res.json({ code: 0, message: '已使用的卡密不能删除' });

    await 卡密.destroy();
    res.json({ code: 1, message: '删除成功' });
  } catch (错误) {
    console.error('删除卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取批次列表
 * GET /admin/api/card-batches
 */
const 获取批次列表 = async (req, res) => {
  try {
    const { business_type } = req.query;
    const 条件 = {};
    if (business_type) 条件.business_type = business_type;

    const 批次列表 = await CardBatch.findAll({
      where: 条件,
      order: [['created_at', 'DESC']],
    });

    // 统计每个批次的实际卡密数量
    const 批次数据 = await Promise.all(批次列表.map(async (批次) => {
      const [实际数量, 已用数量, 未用数量] = await Promise.all([
        Card.count({ where: { batch_id: 批次.id } }),
        Card.count({ where: { batch_id: 批次.id, status: 1 } }),
        Card.count({ where: { batch_id: 批次.id, status: 0 } }),
      ]);
      return {
        ...批次.toJSON(),
        actual_count: 实际数量,
        used_count: 已用数量,
        unused_count: 未用数量,
      };
    }));

    res.json({ code: 1, message: '获取成功', data: 批次数据 });
  } catch (错误) {
    console.error('获取批次列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 获取某批次的所有卡密
 * GET /admin/api/card-batches/:id/cards
 */
const 获取批次卡密 = async (req, res) => {
  try {
    const 批次 = await CardBatch.findByPk(req.params.id);
    if (!批次) return res.json({ code: 0, message: '批次不存在' });

    const 卡密列表 = await Card.findAll({
      where: { batch_id: req.params.id },
      order: [['created_at', 'ASC']],
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: { 批次: 批次.toJSON(), 卡密列表: 卡密列表 },
    });
  } catch (错误) {
    console.error('获取批次卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 删除批次
 * DELETE /admin/api/card-batches/:id
 */
const 删除批次 = async (req, res) => {
  try {
    const 批次 = await CardBatch.findByPk(req.params.id);
    if (!批次) return res.json({ code: 0, message: '批次不存在' });

    // 1. 已使用的卡密(status=1)：保留卡密记录，但 batch_id 置为 null（脱离批次）
    await Card.update({ batch_id: null }, { where: { batch_id: 批次.id, status: 1 } });

    // 2. 未使用的卡密(status=0)和已失效的卡密(status=2)：直接删除
    await Card.destroy({ where: { batch_id: 批次.id, status: { [Op.ne]: 1 } } });

    // 3. 删除批次记录
    await 批次.destroy();

    res.json({ code: 1, message: '批次已删除，已使用的卡密已保留至系统' });
  } catch (错误) {
    console.error('删除批次出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 统一获取卡密列表（支持三业务混合查询）
 * GET /admin/api/unified-cards
 */
const 统一获取卡密列表 = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status, business_type } = req.query;
    const 条件 = {};

    if (keyword) {
      条件[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
        { service_type: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined && status !== '') 条件.status = parseInt(status);
    if (business_type && business_type !== '') 条件.business_type = business_type;

    const { count, rows } = await Card.findAndCountAll({
      where: 条件,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    // 计算每张卡密的链接前缀
    const 列表 = rows.map(卡密 => {
      let link_prefix = '';
      if (卡密.business_type === 'xiyifu') link_prefix = '/xi/';
      else if (卡密.business_type === 'topup') link_prefix = '/cz/';
      else link_prefix = '/';
      return { ...卡密.toJSON(), link_prefix };
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: { total: count, page: parseInt(page), limit: parseInt(limit), list: 列表 },
    });
  } catch (错误) {
    console.error('统一获取卡密列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 统一获取批次列表（支持三业务混合查询）
 * GET /admin/api/unified-batches
 */
const 统一获取批次列表 = async (req, res) => {
  try {
    const { business_type } = req.query;
    const 条件 = {};
    if (business_type && business_type !== '') 条件.business_type = business_type;

    const 批次列表 = await CardBatch.findAll({
      where: 条件,
      order: [['created_at', 'DESC']],
    });

    const 批次数据 = await Promise.all(批次列表.map(async (批次) => {
      const [实际数量, 已用数量, 未用数量] = await Promise.all([
        Card.count({ where: { batch_id: 批次.id } }),
        Card.count({ where: { batch_id: 批次.id, status: 1 } }),
        Card.count({ where: { batch_id: 批次.id, status: 0 } }),
      ]);
      return {
        ...批次.toJSON(),
        actual_count: 实际数量,
        used_count: 已用数量,
        unused_count: 未用数量,
      };
    }));

    res.json({ code: 1, message: '获取成功', data: 批次数据 });
  } catch (错误) {
    console.error('统一获取批次列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 统一获取卡密统计（三业务各自的总/未用/已用/已失效数）
 * GET /admin/api/unified-stats
 */
const 统一获取卡密统计 = async (req, res) => {
  try {
    const 业务类型列表 = ['jiazheng', 'xiyifu', 'topup'];
    const 统计数据 = {};

    await Promise.all(业务类型列表.map(async (业务类型) => {
      const [总数, 未用数, 已用数, 已失效数] = await Promise.all([
        Card.count({ where: { business_type: 业务类型 } }),
        Card.count({ where: { business_type: 业务类型, status: 0 } }),
        Card.count({ where: { business_type: 业务类型, status: 1 } }),
        Card.count({ where: { business_type: 业务类型, status: 2 } }),
      ]);
      统计数据[业务类型] = { total: 总数, unused: 未用数, used: 已用数, expired: 已失效数 };
    }));

    res.json({ code: 1, message: '获取成功', data: 统计数据 });
  } catch (错误) {
    console.error('统一获取卡密统计出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 获取卡密列表, 生成卡密, 导出卡密, 作废卡密, 删除卡密, 获取批次列表, 获取批次卡密, 删除批次, 统一获取卡密列表, 统一获取批次列表, 统一获取卡密统计 };
