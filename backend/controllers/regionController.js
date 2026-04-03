// 地区控制器（省市区街道四级联动）
const { Op } = require('sequelize');
const { Region } = require('../models');

/**
 * 查询地区列表（前台公开接口，无需鉴权）
 * GET /api/regions?parent_id=0
 * 返回指定父级下所有已启用的地区
 */
const 查询地区 = async (req, res) => {
  try {
    const parent_id = parseInt(req.query.parent_id) || 0;

    const 列表 = await Region.findAll({
      where: { parent_id, is_enabled: 1 },
      attributes: ['id', 'name', 'level'],
      order: [['sort', 'ASC'], ['id', 'ASC']],
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: 列表,
    });
  } catch (错误) {
    console.error('查询地区出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 后台查询地区列表（需鉴权，带分页）
 * GET /admin/api/regions?parent_id=0&page=1&limit=50
 */
const 后台查询地区 = async (req, res) => {
  try {
    const {
      parent_id = 0,
      page = 1,
      limit = 50,
    } = req.query;

    const { count, rows } = await Region.findAndCountAll({
      where: { parent_id: parseInt(parent_id) },
      order: [['sort', 'ASC'], ['id', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      code: 1,
      message: '获取成功',
      data: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        list: rows,
      },
    });
  } catch (错误) {
    console.error('后台查询地区出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 切换地区启用状态（需鉴权）
 * PUT /admin/api/regions/:id/toggle
 */
const 切换地区状态 = async (req, res) => {
  try {
    const 地区 = await Region.findByPk(req.params.id);
    if (!地区) {
      return res.json({ code: 0, message: '地区不存在' });
    }

    // 切换启用/禁用状态
    const 新状态 = 地区.is_enabled === 1 ? 0 : 1;
    await 地区.update({ is_enabled: 新状态 });

    res.json({
      code: 1,
      message: 新状态 === 1 ? '已启用' : '已禁用',
      data: { is_enabled: 新状态 },
    });
  } catch (错误) {
    console.error('切换地区状态出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 查询地区, 后台查询地区, 切换地区状态 };
