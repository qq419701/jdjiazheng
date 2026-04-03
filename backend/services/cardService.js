// 卡密生成服务
const { Card } = require('../models');
const { 生成卡密 } = require('../utils/helpers');

/**
 * 批量生成卡密
 * @param {Object} 参数 - 生成参数
 * @param {number} 参数.数量 - 生成数量
 * @param {string} 参数.分类 - 服务分类
 * @param {string} 参数.服务类型 - 服务类型
 * @param {number} 参数.服务时长 - 服务时长（小时）
 * @param {string} 参数.备注 - 备注
 * @param {Date} 参数.过期时间 - 过期时间
 * @param {number} 参数.创建人ID - 管理员ID
 * @returns {Array} 生成的卡密列表
 */
const 批量生成卡密 = async (参数) => {
  const {
    数量 = 1,
    分类 = '日常保洁',
    服务类型 = '日常保洁',
    服务时长 = 2,
    备注 = '',
    过期时间 = null,
    创建人ID = null,
    批次ID = null,
    业务类型 = 'jiazheng',
  } = 参数;

  // 限制单次最大生成数量
  const 实际数量 = Math.min(数量, 1000);
  const 新卡密列表 = [];
  const 已有卡密集合 = new Set();

  // 获取已存在的卡密，避免重复
  const 现有卡密 = await Card.findAll({ attributes: ['code'] });
  现有卡密.forEach(c => 已有卡密集合.add(c.code));

  let 生成数量 = 0;
  let 尝试次数 = 0;
  const 最大尝试次数 = 实际数量 * 10;

  while (生成数量 < 实际数量 && 尝试次数 < 最大尝试次数) {
    尝试次数++;
    const 新卡密 = 生成卡密(16);

    if (!已有卡密集合.has(新卡密)) {
      已有卡密集合.add(新卡密);
      新卡密列表.push({
        code: 新卡密,
        category: 分类,
        service_type: 服务类型,
        service_hours: 服务时长,
        remark: 备注,
        status: 0,
        created_by: 创建人ID,
        batch_id: 批次ID,
        expired_at: 过期时间,
        created_at: new Date(),
        business_type: 业务类型,
      });
      生成数量++;
    }
  }

  // 批量插入数据库
  const 插入结果 = await Card.bulkCreate(新卡密列表);
  return 插入结果;
};

/**
 * 验证卡密是否有效
 * @param {string} 卡密码 - 卡密字符串
 * @returns {Object} 验证结果
 */
const 验证卡密有效性 = async (卡密码) => {
  const 卡密 = await Card.findOne({ where: { code: 卡密码.toUpperCase() } });

  if (!卡密) {
    return { 有效: false, 原因: '卡密不存在' };
  }

  if (卡密.status === 1) {
    return { 有效: false, 原因: '卡密已被使用', 卡密 };
  }

  if (卡密.status === 2) {
    return { 有效: false, 原因: '卡密已失效', 卡密 };
  }

  // 检查是否过期
  if (卡密.expired_at && new Date(卡密.expired_at) < new Date()) {
    return { 有效: false, 原因: '卡密已过期', 卡密 };
  }

  return { 有效: true, 卡密 };
};

module.exports = { 批量生成卡密, 验证卡密有效性 };
