// 数据库迁移：新增多备选时间字段
// 执行命令：node scripts/addVisitTimesColumn.js
//
// 用途：为 orders 表添加 visit_times 字段，用于存储多备选预约时间（JSON格式）
// 注意：MySQL 5.7 不支持 ALTER TABLE ADD COLUMN IF NOT EXISTS，脚本已处理兼容性

const db = require('../config/database');

async function migrate() {
  try {
    // 连接数据库
    await db.authenticate();
    console.log('✅ 数据库连接成功');

    // 查询 orders 表中是否已存在 visit_times 列
    const [columns] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'visit_times'
    `);

    if (columns.length > 0) {
      // 字段已存在，无需重复添加
      console.log('ℹ️  visit_times 字段已存在，无需迁移');
    } else {
      // 字段不存在，执行 ALTER TABLE 添加字段
      await db.query(`
        ALTER TABLE orders
        ADD COLUMN visit_times TEXT NULL
        COMMENT '多备选预约时间（JSON数组格式：[{date:"2024-01-19",time:"09:00",priority:1},...]）'
      `);
      console.log('✅ visit_times 字段添加成功');
    }

    console.log('✅ 迁移完成');
    process.exit(0);
  } catch (错误) {
    console.error('❌ 迁移失败:', 错误.message);
    process.exit(1);
  }
}

migrate();
