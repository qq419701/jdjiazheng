// 京东账号控制器
const { JdAccount } = require('../models');
const { 账号自动登录 } = require('../services/jdAutoOrder');

const 获取账号列表 = async (req, res) => {
  try {
    const 列表 = await JdAccount.findAll({ order: [['created_at', 'DESC']] });
    res.json({ code: 1, message: '获取成功', data: 列表 });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 新增账号 = async (req, res) => {
  try {
    const { nickname, username, password, daily_limit = 20 } = req.body;
    if (!username) return res.json({ code: 0, message: '账号不能为空' });

    const 新账号 = await JdAccount.create({
      nickname,
      username,
      password,
      daily_limit,
      status: 1,
      is_busy: 0,
      use_count: 0,
      created_at: new Date(),
    });
    res.json({ code: 1, message: '新增成功', data: 新账号 });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 更新账号 = async (req, res) => {
  try {
    const 账号 = await JdAccount.findByPk(req.params.id);
    if (!账号) return res.json({ code: 0, message: '账号不存在' });

    await 账号.update(req.body);
    res.json({ code: 1, message: '更新成功' });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 删除账号 = async (req, res) => {
  try {
    const 账号 = await JdAccount.findByPk(req.params.id);
    if (!账号) return res.json({ code: 0, message: '账号不存在' });
    await 账号.destroy();
    res.json({ code: 1, message: '删除成功' });
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

const 触发自动登录 = async (req, res) => {
  try {
    const 结果 = await 账号自动登录(parseInt(req.params.id));
    if (结果.成功) {
      res.json({ code: 1, message: 结果.消息 });
    } else {
      res.json({ code: 0, message: 结果.原因 });
    }
  } catch (错误) {
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 获取账号列表, 新增账号, 更新账号, 删除账号, 触发自动登录 };
