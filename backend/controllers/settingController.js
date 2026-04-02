// 系统设置控制器
const { Setting } = require('../models');

const 获取所有设置 = async (req, res) => {
  try {
    const 列表 = await Setting.findAll();
    const 设置对象 = {};
    列表.forEach(s => { 设置对象[s.key_name] = s.key_value; });
    res.json({ code: 1, message: '获取成功', data: 设置对象 });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 批量更新设置 = async (req, res) => {
  try {
    const 设置数据 = req.body;
    for (const [键名, 值] of Object.entries(设置数据)) {
      await Setting.upsert({
        key_name: 键名,
        key_value: typeof 值 === 'object' ? JSON.stringify(值) : String(值),
        updated_at: new Date(),
      });
    }
    res.json({ code: 1, message: '保存成功' });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 获取所有设置, 批量更新设置 };
