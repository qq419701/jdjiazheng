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
 * 后台分页查询地区列表（需鉴权）
 * GET /admin/api/regions?name=...&code=...&level=...&page=1&limit=20
 */
const 获取地区列表 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      name,
      code,
      level,
      parent_id,
    } = req.query;

    const 条件 = {};
    if (name) 条件.name = { [Op.like]: `%${name}%` };
    if (code) 条件.code = { [Op.like]: `%${code}%` };
    if (level !== undefined && level !== '') 条件.level = parseInt(level);
    if (parent_id !== undefined && parent_id !== '') 条件.parent_id = parseInt(parent_id);

    const { count, rows } = await Region.findAndCountAll({
      where: 条件,
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
 * 后台查询地区列表（按 parent_id，兼容旧接口）
 * GET /admin/api/regions/list?parent_id=0&page=1&limit=50
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
 * 新增地区（需鉴权）
 * POST /admin/api/regions
 */
const 新增地区 = async (req, res) => {
  try {
    const { name, code, level, parent_id = 0, sort = 0 } = req.body;

    if (!name || !level) {
      return res.json({ code: 0, message: '名称、级别为必填项' });
    }

    // 仅当提供了代码时检查重复
    if (code) {
      const 已存在 = await Region.findOne({ where: { code } });
      if (已存在) {
        return res.json({ code: 0, message: '地区代码已存在' });
      }
    }

    const 地区 = await Region.create({
      name,
      code: code || null,
      level: parseInt(level),
      parent_id: parseInt(parent_id),
      sort: parseInt(sort),
      is_enabled: 1,
    });

    res.json({ code: 1, message: '新增成功', data: 地区 });
  } catch (错误) {
    console.error('新增地区出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 更新地区（需鉴权）
 * PUT /admin/api/regions/:id
 */
const 更新地区 = async (req, res) => {
  try {
    const 地区 = await Region.findByPk(req.params.id);
    if (!地区) {
      return res.json({ code: 0, message: '地区不存在' });
    }

    const { name, code, level, parent_id, sort, is_enabled } = req.body;
    const 更新数据 = {};
    if (name !== undefined) 更新数据.name = name;
    if (code !== undefined) 更新数据.code = code || null;
    if (level !== undefined) 更新数据.level = parseInt(level);
    if (parent_id !== undefined) 更新数据.parent_id = parseInt(parent_id);
    if (sort !== undefined) 更新数据.sort = parseInt(sort);
    if (is_enabled !== undefined) 更新数据.is_enabled = parseInt(is_enabled);

    await 地区.update(更新数据);
    res.json({ code: 1, message: '更新成功', data: 地区 });
  } catch (错误) {
    console.error('更新地区出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 删除地区（需鉴权）
 * DELETE /admin/api/regions/:id
 */
const 删除地区 = async (req, res) => {
  try {
    const 地区 = await Region.findByPk(req.params.id);
    if (!地区) {
      return res.json({ code: 0, message: '地区不存在' });
    }

    await 地区.destroy();
    res.json({ code: 1, message: '删除成功' });
  } catch (错误) {
    console.error('删除地区出错:', 错误);
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

module.exports = { 查询地区, 获取地区列表, 后台查询地区, 新增地区, 更新地区, 删除地区, 切换地区状态 };

