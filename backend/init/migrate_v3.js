// 数据库迁移脚本 v3 - 为 admins 表添加 remark 字段
// 执行方式: node backend/init/migrate_v3.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const 数据库连接 = require('../config/database');

const 迁移 = async () => {
  try {
    await 数据库连接.authenticate();
    console.log('✅ 数据库连接成功');

    const queryInterface = 数据库连接.getQueryInterface();
    const { DataTypes } = require('sequelize');

    // admins 表添加 remark 列
    try {
      await queryInterface.addColumn('admins', 'remark', {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: '备注信息',
        after: 'last_login',
      });
      console.log('✅ admins.remark 列已添加');
    } catch (e) {
      if (e.message.includes('Duplicate column')) console.log('ℹ️ admins.remark 已存在，跳过');
      else throw e;
    }

    console.log('\n✅ 迁移完成！');
    process.exit(0);
  } catch (错误) {
    console.error('❌ 迁移失败:', 错误.message);
    process.exit(1);
  }
};

迁移();
