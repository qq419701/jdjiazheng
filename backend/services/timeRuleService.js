// 时间规则引擎服务
const { TimeRule } = require('../models');
const { 安全解析JSON, 获取今天, 获取星期中文 } = require('../utils/helpers');

/**
 * 根据城市名获取匹配的时间规则
 * 优先级：city精确匹配 > tier地区匹配 > global全局
 * @param {string} 城市名 - 用户所在城市
 * @returns {Object} 匹配到的时间规则
 */
const 获取城市规则 = async (城市名) => {
  // 获取所有启用的规则，按排序升序
  const 所有规则 = await TimeRule.findAll({
    where: { is_active: 1 },
    order: [['sort_order', 'ASC']],
  });

  // 1. 按城市精确匹配
  const 城市规则 = 所有规则.find(规则 => {
    if (规则.rule_type !== 'city') return false;
    const 匹配城市列表 = 规则.match_value ? 规则.match_value.split(',').map(c => c.trim()) : [];
    return 匹配城市列表.includes(城市名);
  });
  if (城市规则) return 城市规则;

  // 2. 按地区等级匹配（一线、二线城市等）
  const 地区规则 = 所有规则.find(规则 => {
    if (规则.rule_type !== 'tier') return false;
    const 匹配城市列表 = 规则.match_value ? 规则.match_value.split(',').map(c => c.trim()) : [];
    return 匹配城市列表.some(关键词 => 城市名.includes(关键词) || 关键词.includes(城市名));
  });
  if (地区规则) return 地区规则;

  // 3. 使用全局默认规则
  const 全局规则 = 所有规则.find(规则 => 规则.rule_type === 'global');
  return 全局规则;
};

/**
 * 生成预约时间表
 * @param {string} 城市名 - 用户所在城市
 * @returns {Array} 日期和时间段列表
 */
const 生成预约时间表 = async (城市名 = '') => {
  const 规则 = await 获取城市规则(城市名);

  if (!规则) {
    // 没有规则时返回默认数据
    return 生成默认时间表();
  }

  const 时间段列表 = 安全解析JSON(规则.time_slots, ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);
  const 工作日列表 = 安全解析JSON(规则.work_days, [1, 2, 3, 4, 5, 6, 7]);
  const 锁定天数 = 规则.locked_days || 3;
  const 最远天数 = 规则.max_days || 14;

  const 结果 = [];
  const 今天 = new Date();
  // 转为北京时间
  const 北京今天 = new Date(今天.getTime() + 8 * 60 * 60 * 1000);

  for (let i = 1; i <= 最远天数; i++) {
    const 当前日期 = new Date(北京今天);
    当前日期.setDate(北京今天.getDate() + i);

    // 星期几（1=周一，7=周日）
    const 星期原始 = 当前日期.getDay(); // 0=周日
    const 星期数 = 星期原始 === 0 ? 7 : 星期原始; // 转换为1-7

    // 跳过非工作日
    if (!工作日列表.includes(星期数)) continue;

    const 日期字符串 = 当前日期.toISOString().split('T')[0];
    const 月 = 当前日期.getMonth() + 1;
    const 日 = 当前日期.getDate();
    const 是否约满 = i <= 锁定天数;

    结果.push({
      date: 日期字符串,
      display: `${月}月${日}日`,
      week: 获取星期中文(星期原始),
      is_full: 是否约满,
      // 约满时不返回时间段，否则返回可用时间段
      time_slots: 是否约满 ? [] : 时间段列表.map(时间 => ({
        time: 时间,
        is_full: false,
      })),
    });
  }

  return 结果;
};

/**
 * 生成默认时间表（无规则时使用）
 */
const 生成默认时间表 = () => {
  const 默认时间段 = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const 结果 = [];
  const 今天 = new Date();

  for (let i = 1; i <= 14; i++) {
    const 当前日期 = new Date(今天);
    当前日期.setDate(今天.getDate() + i);

    const 星期原始 = 当前日期.getDay();
    const 日期字符串 = 当前日期.toISOString().split('T')[0];
    const 月 = 当前日期.getMonth() + 1;
    const 日 = 当前日期.getDate();
    const 是否约满 = i <= 3;

    结果.push({
      date: 日期字符串,
      display: `${月}月${日}日`,
      week: 获取星期中文(星期原始),
      is_full: 是否约满,
      time_slots: 是否约满 ? [] : 默认时间段.map(时间 => ({
        time: 时间,
        is_full: false,
      })),
    });
  }

  return 结果;
};

module.exports = { 生成预约时间表, 获取城市规则 };
