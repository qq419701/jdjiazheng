// 数据库迁移脚本 v2 - 为现有部署添加新字段
// 执行方式: node backend/init/migrate_v2.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const 数据库连接 = require('../config/database');

const 迁移 = async () => {
  try {
    await 数据库连接.authenticate();
    console.log('✅ 数据库连接成功');

    const queryInterface = 数据库连接.getQueryInterface();
    const { DataTypes } = require('sequelize');

    // 1. orders 表添加 remark_images 列
    try {
      await queryInterface.addColumn('orders', 'remark_images', {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '备注图片JSON数组（管理员上传的图片URL列表）',
        after: 'remark',
      });
      console.log('✅ orders.remark_images 列已添加');
    } catch (e) {
      if (e.message.includes('Duplicate column')) console.log('ℹ️ orders.remark_images 已存在，跳过');
      else throw e;
    }

    // 2. admins 表添加 nickname / permissions / is_active 列
    try {
      await queryInterface.addColumn('admins', 'nickname', {
        type: DataTypes.STRING(50), allowNull: true, comment: '昵称/显示名', after: 'username',
      });
      console.log('✅ admins.nickname 列已添加');
    } catch (e) {
      if (e.message.includes('Duplicate column')) console.log('ℹ️ admins.nickname 已存在，跳过');
      else throw e;
    }

    try {
      await queryInterface.addColumn('admins', 'permissions', {
        type: DataTypes.TEXT, allowNull: true, comment: '权限列表JSON（仅sub角色生效）', after: 'role',
      });
      console.log('✅ admins.permissions 列已添加');
    } catch (e) {
      if (e.message.includes('Duplicate column')) console.log('ℹ️ admins.permissions 已存在，跳过');
      else throw e;
    }

    try {
      await queryInterface.addColumn('admins', 'is_active', {
        type: DataTypes.TINYINT, defaultValue: 1, comment: '是否启用：1启用 0禁用', after: 'permissions',
      });
      console.log('✅ admins.is_active 列已添加');
    } catch (e) {
      if (e.message.includes('Duplicate column')) console.log('ℹ️ admins.is_active 已存在，跳过');
      else throw e;
    }

    // 3. admins.role ENUM 添加 'sub' 值
    try {
      await 数据库连接.query("ALTER TABLE admins MODIFY COLUMN role ENUM('super','admin','sub') DEFAULT 'admin' COMMENT '角色'");
      console.log("✅ admins.role ENUM 已更新（添加 'sub'）");
    } catch (e) {
      console.log('ℹ️ admins.role ENUM 更新跳过:', e.message);
    }

    console.log('\n🎉 迁移完成！');
    process.exit(0);
  } catch (错误) {
    console.error('❌ 迁移失败:', 错误.message);
    process.exit(1);
  }
};

迁移();
