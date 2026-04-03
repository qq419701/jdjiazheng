// 给已有数据库表添加 business_type 等新字段的迁移脚本
// 使用方法：node scripts/addBusinessTypeColumns.js
require('dotenv').config();
const 数据库连接 = require('../config/database');

async function migrate() {
  try {
    await 数据库连接.authenticate();
    console.log('数据库连接成功');

    const queries = [
      "ALTER TABLE cards ADD COLUMN IF NOT EXISTS business_type VARCHAR(20) DEFAULT 'jiazheng' COMMENT '业务类型'",
      "ALTER TABLE card_batches ADD COLUMN IF NOT EXISTS business_type VARCHAR(20) DEFAULT 'jiazheng' COMMENT '业务类型'",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_type VARCHAR(20) DEFAULT 'jiazheng' COMMENT '业务类型'",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS laundry_order_id VARCHAR(100) NULL COMMENT '洗衣订单ID'",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS express_order_id VARCHAR(100) NULL COMMENT '快递单号'",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS express_company VARCHAR(50) NULL COMMENT '快递公司'",
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS laundry_status VARCHAR(50) NULL COMMENT '洗衣订单状态'",
    ];

    for (const sql of queries) {
      try {
        await 数据库连接.query(sql);
        console.log('✅ 执行成功:', sql.substring(0, 60) + '...');
      } catch (e) {
        console.log('⚠️  跳过（字段已存在）:', e.message);
      }
    }

    console.log('\n✅ 迁移完成！');
    process.exit(0);
  } catch (err) {
    console.error('❌ 迁移失败:', err);
    process.exit(1);
  }
}

migrate();
