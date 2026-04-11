// 数据库初始化脚本
// 建表并插入默认数据
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const 数据库连接 = require('../config/database');
const { Admin, TimeRule, Setting, Card } = require('../models');

/**
 * 执行字段迁移（如果字段不存在则添加）
 */
const 执行字段迁移 = async () => {
  try {
    const [结果] = await 数据库连接.query("SHOW COLUMNS FROM `cards` LIKE 'product_id'");
    if (结果.length === 0) {
      await 数据库连接.query("ALTER TABLE `cards` ADD COLUMN `product_id` INT NULL COMMENT '关联商品ID' AFTER `sup_product_no`");
      console.log('✅ cards 表新增 product_id 字段');
    }
  } catch (e) {
    console.log('ℹ️ cards.product_id 迁移跳过:', e.message);
  }
  try {
    const [结果] = await 数据库连接.query("SHOW COLUMNS FROM `card_batches` LIKE 'product_id'");
    if (结果.length === 0) {
      await 数据库连接.query("ALTER TABLE `card_batches` ADD COLUMN `product_id` INT NULL COMMENT '关联商品ID'");
      console.log('✅ card_batches 表新增 product_id 字段');
    }
  } catch (e) {
    console.log('ℹ️ card_batches.product_id 迁移跳过:', e.message);
  }
  // 创建 SUP 日志表（幂等，已存在则跳过）
  try {
    await 数据库连接.query(`
      CREATE TABLE IF NOT EXISTS \`sup_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`log_type\` VARCHAR(30) NOT NULL COMMENT '日志类型',
        \`order_no\` VARCHAR(64) NULL COMMENT '阿奇所订单号',
        \`ecommerce_order_no\` VARCHAR(100) NULL COMMENT '电商平台订单号',
        \`out_trade_no\` VARCHAR(64) NULL COMMENT '我方outTradeNo',
        \`card_code\` VARCHAR(20) NULL COMMENT '关联卡密码',
        \`product_no\` VARCHAR(20) NULL COMMENT '商品编号',
        \`buy_num\` INT NULL COMMENT '购买数量',
        \`user_id\` VARCHAR(50) NULL COMMENT '奇所平台userId',
        \`request_data\` TEXT NULL COMMENT '请求数据JSON',
        \`response_data\` TEXT NULL COMMENT '响应数据JSON',
        \`status_code\` INT NULL COMMENT '响应code',
        \`order_status\` INT NULL COMMENT '下单状态',
        \`order_cost\` DECIMAL(14,4) NULL COMMENT '订单成本',
        \`cancel_status\` INT NULL COMMENT '撤单状态',
        \`result\` VARCHAR(20) DEFAULT 'unknown' COMMENT '结果',
        \`error_msg\` TEXT NULL COMMENT '错误信息',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        INDEX \`idx_order_no\` (\`order_no\`),
        INDEX \`idx_out_trade_no\` (\`out_trade_no\`),
        INDEX \`idx_log_type\` (\`log_type\`),
        INDEX \`idx_result\` (\`result\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='阿奇所SUP操作日志表'
    `);
    console.log('✅ sup_logs 表确认存在（已创建或已存在）');
  } catch (e) {
    console.log('ℹ️ sup_logs 表迁移跳过:', e.message);
  }
  // cards 表新增 used_at 字段
  try {
    const [r] = await 数据库连接.query("SHOW COLUMNS FROM `cards` LIKE 'used_at'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `cards` ADD COLUMN `used_at` DATETIME NULL COMMENT '卡密使用时间' AFTER `status`");
      console.log('✅ cards 表新增 used_at 字段');
    }
  } catch (e) {
    console.log('ℹ️ cards.used_at 迁移跳过:', e.message);
  }
  // cards 表新增 invalidated_at 字段
  try {
    const [r] = await 数据库连接.query("SHOW COLUMNS FROM `cards` LIKE 'invalidated_at'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `cards` ADD COLUMN `invalidated_at` DATETIME NULL COMMENT '卡密作废时间' AFTER `used_at`");
      console.log('✅ cards 表新增 invalidated_at 字段');
    }
  } catch (e) {
    console.log('ℹ️ cards.invalidated_at 迁移跳过:', e.message);
  }
  // cards 表新增 ecommerce_order_no 字段
  try {
    const [r] = await 数据库连接.query("SHOW COLUMNS FROM `cards` LIKE 'ecommerce_order_no'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `cards` ADD COLUMN `ecommerce_order_no` VARCHAR(100) NULL COMMENT '电商平台订单号' AFTER `agiso_order_no`");
      console.log('✅ cards 表新增 ecommerce_order_no 字段');
    }
  } catch (e) {
    console.log('ℹ️ cards.ecommerce_order_no 迁移跳过:', e.message);
  }
  // cards 表新增索引 idx_ecommerce_order_no
  try {
    const [r] = await 数据库连接.query("SHOW INDEX FROM `cards` WHERE Key_name = 'idx_ecommerce_order_no'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `cards` ADD INDEX `idx_ecommerce_order_no` (`ecommerce_order_no`)");
      console.log('✅ cards 表新增索引 idx_ecommerce_order_no');
    }
  } catch (e) {
    console.log('ℹ️ cards.idx_ecommerce_order_no 索引跳过:', e.message);
  }
  // sup_logs 表新增 ecommerce_order_no 字段
  try {
    const [r] = await 数据库连接.query("SHOW COLUMNS FROM `sup_logs` LIKE 'ecommerce_order_no'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `sup_logs` ADD COLUMN `ecommerce_order_no` VARCHAR(100) NULL COMMENT '电商平台订单号' AFTER `order_no`");
      console.log('✅ sup_logs 表新增 ecommerce_order_no 字段');
    }
  } catch (e) {
    console.log('ℹ️ sup_logs.ecommerce_order_no 迁移跳过:', e.message);
  }
  // sup_logs 表新增 card_code 字段
  try {
    const [r] = await 数据库连接.query("SHOW COLUMNS FROM `sup_logs` LIKE 'card_code'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `sup_logs` ADD COLUMN `card_code` VARCHAR(20) NULL COMMENT '关联卡密码' AFTER `out_trade_no`");
      console.log('✅ sup_logs 表新增 card_code 字段');
    }
  } catch (e) {
    console.log('ℹ️ sup_logs.card_code 迁移跳过:', e.message);
  }
  // sup_logs 表新增索引 idx_ecommerce_order_no
  try {
    const [r] = await 数据库连接.query("SHOW INDEX FROM `sup_logs` WHERE Key_name = 'idx_ecommerce_order_no'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `sup_logs` ADD INDEX `idx_ecommerce_order_no` (`ecommerce_order_no`)");
      console.log('✅ sup_logs 表新增索引 idx_ecommerce_order_no');
    }
  } catch (e) {
    console.log('ℹ️ sup_logs.idx_ecommerce_order_no 索引跳过:', e.message);
  }
  // sup_logs 表新增索引 idx_card_code
  try {
    const [r] = await 数据库连接.query("SHOW INDEX FROM `sup_logs` WHERE Key_name = 'idx_card_code'");
    if (r.length === 0) {
      await 数据库连接.query("ALTER TABLE `sup_logs` ADD INDEX `idx_card_code` (`card_code`)");
      console.log('✅ sup_logs 表新增索引 idx_card_code');
    }
  } catch (e) {
    console.log('ℹ️ sup_logs.idx_card_code 索引跳过:', e.message);
  }
  // 迁移1：orders 表新增 ecommerce_order_no 字段
  try {
    const [结果] = await 数据库连接.query("SHOW COLUMNS FROM `orders` LIKE 'ecommerce_order_no'");
    if (结果.length === 0) {
      await 数据库连接.query("ALTER TABLE `orders` ADD COLUMN `ecommerce_order_no` VARCHAR(100) NULL COMMENT '电商平台订单号（从卡密的ecommerce_order_no自动带入，如小红书单号P791381403338389551）' AFTER `login_ip`");
      await 数据库连接.query("ALTER TABLE `orders` ADD INDEX `idx_ecommerce_order_no` (`ecommerce_order_no`)");
      console.log('✅ orders 表新增 ecommerce_order_no 字段');
    }
  } catch (e) {
    console.log('ℹ️ orders.ecommerce_order_no 迁移跳过:', e.message);
  }
  // 迁移2：修复历史 cards 数据，ecommerce_order_no 去掉 -数字 后缀
  try {
    await 数据库连接.query(`
      UPDATE cards
      SET ecommerce_order_no = REGEXP_REPLACE(agiso_order_no, '-[0-9]+$', '')
      WHERE agiso_order_no IS NOT NULL
        AND (ecommerce_order_no IS NULL OR ecommerce_order_no = agiso_order_no)
    `);
    console.log('✅ cards 历史数据 ecommerce_order_no 修复完成（去掉 -XX 后缀）');
  } catch (e) {
    console.log('ℹ️ cards.ecommerce_order_no 历史数据修复跳过:', e.message);
  }
  // 迁移3：修复历史 sup_logs 数据，card_code 从 cards 表补充
  try {
    await 数据库连接.query(`
      UPDATE sup_logs sl
      JOIN cards c ON c.agiso_order_no = sl.order_no
      SET sl.card_code = c.code
      WHERE sl.card_code IS NULL AND sl.order_no IS NOT NULL
    `);
    console.log('✅ sup_logs 历史数据 card_code 修复完成');
  } catch (e) {
    console.log('ℹ️ sup_logs.card_code 历史数据修复跳过:', e.message);
  }
  // 迁移4：修复历史 sup_logs 数据，ecommerce_order_no 去掉 -数字 后缀
  try {
    await 数据库连接.query(`
      UPDATE sup_logs
      SET ecommerce_order_no = REGEXP_REPLACE(order_no, '-[0-9]+$', '')
      WHERE order_no IS NOT NULL
        AND (ecommerce_order_no IS NULL OR ecommerce_order_no = order_no)
    `);
    console.log('✅ sup_logs 历史数据 ecommerce_order_no 修复完成（去掉 -XX 后缀）');
  } catch (e) {
    console.log('ℹ️ sup_logs.ecommerce_order_no 历史数据修复跳过:', e.message);
  }
  // 迁移5：修复历史 orders 数据，从关联卡密补充 ecommerce_order_no
  try {
    await 数据库连接.query(`
      UPDATE orders o
      JOIN cards c ON c.code = o.card_code
      SET o.ecommerce_order_no = c.ecommerce_order_no
      WHERE o.ecommerce_order_no IS NULL
        AND c.ecommerce_order_no IS NOT NULL
    `);
    console.log('✅ orders 历史数据 ecommerce_order_no 修复完成');
  } catch (e) {
    console.log('ℹ️ orders.ecommerce_order_no 历史数据修复跳过:', e.message);
  }
};

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

    // 执行字段迁移（新增 product_id 等字段）
    await 执行字段迁移();

    // 创建默认管理员
    const 管理员数量 = await Admin.count();
    if (管理员数量 === 0) {
      const 默认密码 = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
      const 加密密码 = await bcrypt.hash(默认密码, 10);
      await Admin.create({
        username: 'admin',
        password: 加密密码,
        role: 'super',
        is_active: 1,
        created_at: new Date(),
      });
      console.log('✅ 默认管理员创建成功（用户名: admin）');
      console.log('⚠️  请尽快登录后修改默认密码');
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
          key_name: 'site_url',
          key_value: '',
          description: '站点域名，用于生成卡密完整链接，如 http://yourdomain.com',
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

    // 逐条插入洗衣和快递API默认配置（findOrCreate保证全新部署时也能初始化）
    const 洗衣快递默认配置 = [
      { key_name: 'laundry_banner_url',       key_value: '',                          description: '洗衣服Banner图片URL' },
      { key_name: 'laundry_title',             key_value: '优米拉洗衣服务',              description: '洗衣H5顶部主标题' },
      { key_name: 'laundry_subtitle1',         key_value: '京东快递免费取送 专业洗护',    description: '洗衣H5顶部副标题第1行' },
      { key_name: 'laundry_subtitle2',         key_value: '',                          description: '洗衣H5顶部副标题第2行' },
      { key_name: 'laundry_notice',           key_value: '1. 请在取件时间段内保持手机畅通\n2. 快递员上门取衣后将送往工厂洗护\n3. 洗护完成后将寄回您填写的收件地址', description: '洗衣下单须知' },
      { key_name: 'laundry_product_name',     key_value: '任洗一件',                  description: '洗衣商品名称' },
      { key_name: 'laundry_product_price',    key_value: '0',                         description: '洗衣商品价格（分）' },
      { key_name: 'laundry_service_content',  key_value: JSON.stringify([{ icon: '👕', title: '专业洗护', desc: '标准清洗流程，精心护理每件衣物' }]), description: '洗衣服务内容JSON' },
      // 修复：laundry_auto_order_enabled 默认关闭，防止全新部署未配置API时误触发
      { key_name: 'laundry_auto_order_enabled', key_value: '0',                       description: '洗衣自动下单开关（0=关闭，1=开启）' },
      // 修复：laundry_order_type 对应鲸蚁API平台来源值（50=微信，60=抖音，70=快手）
      { key_name: 'laundry_order_type',       key_value: '50',                        description: '推送到鲸蚁API的订单来源平台（50=微信，60=抖音，70=快手）' },
      { key_name: 'laundry_api_url',          key_value: '',                          description: '鲸蚁洗衣API基础地址' },
      { key_name: 'laundry_app_id',           key_value: '',                          description: '鲸蚁洗衣AppID' },
      { key_name: 'laundry_app_secret',       key_value: '',                          description: '鲸蚁洗衣AppSecret' },
      { key_name: 'laundry_out_token',        key_value: '',                          description: '鲸蚁固定out-token（可选，优先于动态access_token）' },
    ];
    for (const 配置项 of 洗衣快递默认配置) {
      await Setting.findOrCreate({
        where: { key_name: 配置项.key_name },
        defaults: { ...配置项, updated_at: new Date() },
      });
    }
    console.log('✅ 洗衣API默认配置初始化完成（共', 洗衣快递默认配置.length, '项）');

    // 奇所SUP系统默认配置（标准SUP接口对接阿奇索开放平台）
    const 奇所SUP默认配置 = [
      { key_name: 'agiso_app_id',       key_value: '',  description: '奇所开放平台应用ID（在open.agiso.com创建应用后获取）' },
      { key_name: 'agiso_app_secret',   key_value: '',  description: '奇所开放平台AppSecret（32位，用于签名验证和AES加密卡密）' },
      { key_name: 'agiso_merchant_key', key_value: '',  description: '奇所商户密钥（用于签名计算）' },
      { key_name: 'agiso_user_id',      key_value: '',  description: '奇所平台会员ID（校验下单方身份）' },
      { key_name: 'agiso_sup_enabled',  key_value: '0', description: 'SUP接口总开关（0=关闭，1=开启）' },
      { key_name: 'agiso_products',     key_value: '',  description: 'SUP商品列表配置（JSON数组，留空则自动从卡密表生成）' },
      { key_name: 'agiso_refuse_proof', key_value: '',  description: '撤单失败时的拒绝凭证图片URL（必须是可访问的.jpg/.png/.gif，不超过127k）' },
    ];
    for (const 配置项 of 奇所SUP默认配置) {
      await Setting.findOrCreate({
        where: { key_name: 配置项.key_name },
        defaults: { ...配置项, updated_at: new Date() },
      });
    }
    console.log('✅ 奇所SUP默认配置初始化完成（共', 奇所SUP默认配置.length, '项）');

    // 三角洲企业微信默认配置
    const 三角洲企微默认配置 = [
      // ===== 基本开关 =====
      { key_name: 'qywx_enabled',            key_value: '0', description: '企业微信总开关（0=关闭，1=开启）。开启后提交订单时自动生成专属联系我二维码/链接。' },
      { key_name: 'qywx_corpid',             key_value: '',  description: '企业微信企业ID（CorpID）。在企业微信管理后台"我的企业"页面可以找到。' },
      { key_name: 'qywx_secret',             key_value: '',  description: '企业微信客户联系Secret。在管理后台 → 客户联系 → API → 开启API 后获取，用于调用客户联系接口。' },
      // ===== 回调验证 =====
      { key_name: 'qywx_token',              key_value: '',  description: '企业微信回调验证Token（自定义字符串）。在管理后台配置"接收事件服务器"时填写，用于验证回调请求合法性。' },
      { key_name: 'qywx_encoding_aes_key',   key_value: '',  description: '企业微信回调加密密钥EncodingAESKey（43位随机字符串）。配置接收事件服务器时自动生成或手动填写。' },
      // ===== 加好友模式 =====
      { key_name: 'qywx_add_friend_mode',    key_value: 'link', description: '添加好友展示方式：link=仅展示跳转链接（适合手机端直接跳转），qrcode=仅展示二维码（适合截图扫码），both=链接和二维码都展示。' },
      // ===== 员工分配 =====
      { key_name: 'qywx_user_ids',           key_value: '',  description: '接待员工的企业微信UserID列表，多个用英文逗号分隔，例如：user001,user002,user003。每个订单会按照分配模式分配给其中一名员工。' },
      { key_name: 'qywx_user_assign_mode',   key_value: 'round_robin', description: '员工分配模式：round_robin=轮询分配（按订单号均匀分配，保证每个员工接单量均衡），first=固定第一个员工（适合单人运营）。' },
      // ===== 加好友后自动操作 =====
      { key_name: 'qywx_remark_template',    key_value: '三角洲客户_{order_no}', description: '客户添加好友后自动备注的模板。可用变量：{order_no}订单号，{phone}手机号，{player_name}游戏昵称，{product_name}套餐名，{insurance}保险格数，{date}当前日期。例如：三角洲_{order_no}_{phone}' },
      { key_name: 'qywx_welcome_template',   key_value: '您好！已收到您的三角洲哈夫币充值需求，稍后为您安排服务。', description: '客户添加好友后自动发送的欢迎语模板。可用变量同备注模板。注意：欢迎语只能在客户添加好友后20秒内发送，之后无效。' },
      // ===== 自动建群 =====
      { key_name: 'qywx_auto_group',         key_value: '0', description: '是否在客户添加好友后自动创建服务群（0=不建群，1=自动建群）。建群成功后订单状态变为"已建群"。' },
      { key_name: 'qywx_group_name_template',key_value: '三角洲服务_{order_no}', description: '自动建群时的群名称模板。可用变量同备注模板。例如：{player_name}的哈夫币服务群' },
      { key_name: 'qywx_group_remark_template', key_value: '', description: '建群成功后更新群名称的模板（二次确认群名，可用于加入更多订单信息）。留空则不更新。可用变量同备注模板。' },
      // ===== 退款/撤单后自动操作 =====
      { key_name: 'qywx_refund_remark_template',    key_value: '', description: '退款或撤单完成后，自动修改客户备注的模板。留空则不更新备注。可用变量：{order_no},{phone},{player_name},{product_name},{date},{status_text}（已退款），{refund_reason}（退款原因）。例如：【已退款】三角洲_{order_no}' },
      { key_name: 'qywx_refund_group_name_template', key_value: '', description: '退款或撤单完成后，自动修改服务群名称的模板。留空则不更新群名称。可用变量同退款备注模板。例如：【已退款】{player_name}的服务群' },
    ];
    for (const 配置项 of 三角洲企微默认配置) {
      await Setting.findOrCreate({
        where: { key_name: 配置项.key_name },
        defaults: { ...配置项, updated_at: new Date() },
      });
    }
    console.log('✅ 三角洲企业微信默认配置初始化完成（共', 三角洲企微默认配置.length, '项）');

    // 后台自定义标题/名称默认配置
    const 后台自定义配置 = [
      { key_name: 'admin_site_title', key_value: '京东家政代下单系统', description: '后台登录页系统标题' },
      { key_name: 'admin_site_name',  key_value: '京东代下单系统',    description: '后台左侧导航栏系统名称' },
    ]
    for (const 配置项 of 后台自定义配置) {
      await Setting.findOrCreate({
        where: { key_name: 配置项.key_name },
        defaults: { ...配置项, updated_at: new Date() },
      })
    }
    console.log('✅ 后台自定义标题/名称默认配置初始化完成')

    console.log('\n🎉 数据库初始化完成！');
    console.log('管理员账号：admin');
    console.log('管理员密码：可通过环境变量 ADMIN_DEFAULT_PASSWORD 设置（首次初始化时生效）');
    process.exit(0);
  } catch (错误) {
    console.error('❌ 数据库初始化失败:', 错误.message);
    process.exit(1);
  }
};

初始化数据库();
