// 奇所SUP系统数据库迁移脚本
// 为 cards 表新增3个SUP相关字段：
//   - agiso_order_no  VARCHAR(64)  NULL        奇所平台订单号
//   - sup_status      TINYINT      DEFAULT 0   SUP发货状态：0未发货 1已发货 2已撤单
//   - sup_product_no  VARCHAR(50)  NULL        SUP商品编号
// 使用 IF NOT EXISTS 判断，字段已存在则跳过

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const 数据库连接 = require('../config/database');

/**
 * 执行SUP字段迁移
 * 逐一检查字段是否存在，不存在则新增
 */
const 执行迁移 = async () => {
  console.log('开始执行SUP系统数据库迁移...');

  try {
    // 测试数据库连接
    await 数据库连接.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取当前 cards 表的字段列表
    const [字段列表] = await 数据库连接.query('SHOW COLUMNS FROM `cards`');
    const 已有字段名 = 字段列表.map(列 => 列.Field);
    console.log('📋 当前cards表字段：', 已有字段名.join(', '));

    // 新增字段定义列表
    const 待新增字段 = [
      {
        字段名: 'agiso_order_no',
        SQL语句: 'ALTER TABLE `cards` ADD COLUMN `agiso_order_no` VARCHAR(64) NULL COMMENT \'奇所平台订单号（用于撤单和查单）\'',
      },
      {
        字段名: 'sup_status',
        SQL语句: 'ALTER TABLE `cards` ADD COLUMN `sup_status` TINYINT DEFAULT 0 COMMENT \'SUP发货状态：0未发货 1已发货 2已撤单\'',
      },
      {
        字段名: 'sup_product_no',
        SQL语句: 'ALTER TABLE `cards` ADD COLUMN `sup_product_no` VARCHAR(50) NULL COMMENT \'SUP商品编号（下单时的productNo）\'',
      },
    ];

    // 逐一检查并新增字段
    for (const 字段 of 待新增字段) {
      if (已有字段名.includes(字段.字段名)) {
        console.log(`ℹ️  字段 ${字段.字段名} 已存在，跳过`);
      } else {
        await 数据库连接.query(字段.SQL语句);
        console.log(`✅ 字段 ${字段.字段名} 新增成功`);
      }
    }

    console.log('\n🎉 SUP系统数据库迁移完成！');
    console.log('新增字段说明：');
    console.log('  agiso_order_no  - 奇所平台订单号（用于撤单和查单）');
    console.log('  sup_status      - SUP发货状态：0未发货 1已发货 2已撤单');
    console.log('  sup_product_no  - SUP商品编号（下单时的productNo）');
    process.exit(0);
  } catch (错误) {
    console.error('❌ 数据库迁移失败:', 错误.message);
    process.exit(1);
  }
};

执行迁移();
