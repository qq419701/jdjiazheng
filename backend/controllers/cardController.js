// 卡密控制器
const { Op } = require('sequelize');
const { Card } = require('../models');
const { 批量生成卡密 } = require('../services/cardService');

/**
 * 获取卡密列表
 * GET /admin/api/cards
 */
const 获取卡密列表 = async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword = '', status, category } = req.query;
    const 条件 = {};

    if (keyword) {
      条件[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status !== undefined && status !== '') 条件.status = parseInt(status);
    if (category) 条件.category = { [Op.like]: `%${category}%` };

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
 * 批量生成卡密
 * POST /admin/api/cards/generate
 */
const 生成卡密 = async (req, res) => {
  try {
    const {
      count = 1,
      category = '日常保洁',
      service_type = '日常保洁',
      service_hours = 2,
      remark = '',
      expired_at = null,
    } = req.body;

    if (count < 1 || count > 1000) {
      return res.json({ code: 0, message: '生成数量必须在1-1000之间' });
    }

    const 结果 = await 批量生成卡密({
      数量: parseInt(count),
      分类: category,
      服务类型: service_type,
      服务时长: parseInt(service_hours),
      备注: remark,
      过期时间: expired_at ? new Date(expired_at) : null,
      创建人ID: req.管理员?.id,
    });

    res.json({
      code: 1,
      message: `成功生成${结果.length}个卡密`,
      data: 结果.map(c => c.code),
    });
  } catch (错误) {
    console.error('生成卡密出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 导出卡密TXT
 * GET /admin/api/cards/export
 */
const 导出卡密 = async (req, res) => {
  try {
    const { status = 0, category } = req.query;
    const 条件 = {};
    if (status !== undefined && status !== '') 条件.status = parseInt(status);
    if (category) 条件.category = category;

    const 卡密列表 = await Card.findAll({
      where: 条件,
      order: [['created_at', 'DESC']],
    });

    const 内容 = 卡密列表.map(c => c.code).join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cards_${Date.now()}.txt"`);
    res.send(内容);
  } catch (错误) {
    console.error('导出卡密出错:', 错误);
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

module.exports = { 获取卡密列表, 生成卡密, 导出卡密, 删除卡密 };
