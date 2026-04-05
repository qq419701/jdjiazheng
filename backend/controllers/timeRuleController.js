// 时间规则控制器
const { TimeRule } = require('../models');

const 获取规则列表 = async (req, res) => {
  try {
    const 条件 = {};
    if (req.query.business_type) {
      条件.business_type = req.query.business_type;
    }
    const 列表 = await TimeRule.findAll({ where: 条件, order: [['sort_order', 'ASC']] });
    res.json({ code: 1, message: '获取成功', data: 列表 });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 新增规则 = async (req, res) => {
  try {
    const 新规则 = await TimeRule.create({ ...req.body, created_at: new Date() });
    res.json({ code: 1, message: '新增成功', data: 新规则 });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 更新规则 = async (req, res) => {
  try {
    const 规则 = await TimeRule.findByPk(req.params.id);
    if (!规则) return res.json({ code: 0, message: '规则不存在' });
    await 规则.update(req.body);
    res.json({ code: 1, message: '更新成功' });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 删除规则 = async (req, res) => {
  try {
    const 规则 = await TimeRule.findByPk(req.params.id);
    if (!规则) return res.json({ code: 0, message: '规则不存在' });
    await 规则.destroy();
    res.json({ code: 1, message: '删除成功' });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 获取规则列表, 新增规则, 更新规则, 删除规则 };
