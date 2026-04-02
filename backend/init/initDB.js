// 数据库初始化脚本
// 建表并插入默认数据
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const 数据库连接 = require('../config/database');
const { Admin, TimeRule, Setting, Card } = require('../models');

/**
 * 初始化数据库
 * 创建所有表并插入默认数据
 */
const 初始化数据库 = async () => {
  console.log('开始初始化数据库...');

  try {
    // 测试数据库连接
    await 数据库连接.authenticate();
    console.log('✅ 数据库连接成功');

    // 同步所有模型（创建表）
    // 使用 force: false 避免删除现有数据，仅创建不存在的表
    await 数据库连接.sync({ alter: false });
    console.log('✅ 数据库表创建完成（如需更新表结构，请手动执行ALTER语句）');

    // 创建默认管理员
    const 管理员数量 = await Admin.count();
    if (管理员数量 === 0) {
      const 默认密码 = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
      const 加密密码 = await bcrypt.hash(默认密码, 10);
      await Admin.create({
        username: 'admin',
        password: 加密密码,
        role: 'super',
        created_at: new Date(),
      });
      console.log('✅ 默认管理员创建成功（用户名: admin，密码: admin123）');
    } else {
      console.log('ℹ️ 管理员已存在，跳过创建');
    }

    // 创建默认时间规则
    const 规则数量 = await TimeRule.count();
    if (规则数量 === 0) {
      const 默认时间段 = JSON.stringify(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']);
      const 工作日 = JSON.stringify([1, 2, 3, 4, 5, 6, 7]);

      await TimeRule.bulkCreate([
        {
          rule_type: 'tier',
          rule_name: '一线城市规则',
          match_value: '北京,上海,广州,深圳',
          locked_days: 4,
          time_slots: 默认时间段,
          work_days: 工作日,
          max_days: 14,
          is_active: 1,
          sort_order: 1,
          created_at: new Date(),
        },
        {
          rule_type: 'tier',
          rule_name: '二线城市规则',
          match_value: '成都,杭州,武汉,南京,西安,重庆,天津,苏州,长沙,郑州',
          locked_days: 3,
          time_slots: 默认时间段,
          work_days: 工作日,
          max_days: 14,
          is_active: 1,
          sort_order: 2,
          created_at: new Date(),
        },
        {
          rule_type: 'global',
          rule_name: '全局默认规则',
          match_value: null,
          locked_days: 2,
          time_slots: 默认时间段,
          work_days: 工作日,
          max_days: 14,
          is_active: 1,
          sort_order: 99,
          created_at: new Date(),
        },
      ]);
      console.log('✅ 默认时间规则创建成功（3条）');
    } else {
      console.log('ℹ️ 时间规则已存在，跳过创建');
    }

    // 创建默认系统设置
    const 设置数量 = await Setting.count();
    if (设置数量 === 0) {
      await Setting.bulkCreate([
        {
          key_name: 'banner_url',
          key_value: '',
          description: 'Banner图片URL',
          updated_at: new Date(),
        },
        {
          key_name: 'service_type',
          key_value: '日常保洁',
          description: '服务类型',
          updated_at: new Date(),
        },
        {
          key_name: 'service_hours',
          key_value: '2',
          description: '服务时长（小时）',
          updated_at: new Date(),
        },
        {
          key_name: 'notice',
          key_value: '1. 预约成功后，客服将在24小时内联系您确认服务时间\n2. 服务当天请保持手机畅通\n3. 请提前清理贵重物品\n4. 服务范围：室内日常清洁，不含高空作业\n5. 如需取消，请提前24小时联系客服',
          description: '下单须知',
          updated_at: new Date(),
        },
        {
          key_name: 'service_content',
          key_value: JSON.stringify([
            { icon: '🏆', title: '清洁标准流程', desc: '专业培训标准作业流程' },
            { icon: '✨', title: '清洁彻底高效', desc: '专业工具深度彻底清洁' },
            { icon: '📦', title: '分格收纳卫生', desc: '分类收纳整洁干净卫生' },
          ]),
          description: '服务内容展示',
          updated_at: new Date(),
        },
        {
          key_name: 'auto_order_enabled',
          key_value: '1',
          description: '是否开启自动下单',
          updated_at: new Date(),
        },
      ]);
      console.log('✅ 默认系统设置创建成功');
    } else {
      console.log('ℹ️ 系统设置已存在，跳过创建');
    }

    console.log('\n🎉 数据库初始化完成！');
    console.log('管理员账号：admin');
    console.log('管理员密码：admin123');
    process.exit(0);
  } catch (错误) {
    console.error('❌ 数据库初始化失败:', 错误.message);
    process.exit(1);
  }
};

初始化数据库();
