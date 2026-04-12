// 商品管理控制器（SUP商品管理 / 套餐管理）
const { Op } = require('sequelize');
const { Product, Card } = require('../models');

/**
 * 获取商品列表
 * GET /admin/api/products
 * 支持 business_type 筛选、status 筛选、include_stock=1 返回库存统计
 */
const 获取商品列表 = async (req, res) => {
  try {
    const { business_type, status, include_stock } = req.query;
    const 条件 = {};
    if (business_type) 条件.business_type = business_type;
    if (status !== undefined && status !== '') 条件.status = parseInt(status);

    const 商品列表 = await Product.findAll({
      where: 条件,
      order: [['product_no', 'ASC']],
    });

    // 统计每个商品关联的卡密数量
    const 结果 = await Promise.all(商品列表.map(async (商品) => {
      const 卡密总数 = await Card.count({ where: { product_id: 商品.id } });
      const 数据 = { ...商品.toJSON(), card_count: 卡密总数 };

      // include_stock=1 时额外返回库存细分统计
      if (include_stock === '1' || include_stock === 1) {
        const 未使用数 = await Card.count({ where: { product_id: 商品.id, status: 0 } });
        const 已使用数 = await Card.count({ where: { product_id: 商品.id, status: 1 } });
        const 已失效数 = await Card.count({ where: { product_id: 商品.id, status: 2 } });
        数据.stock_unused = 未使用数;
        数据.stock_used = 已使用数;
        数据.stock_expired = 已失效数;
      }

      return 数据;
    }));

    res.json({ code: 1, message: '获取成功', data: 结果 });
  } catch (错误) {
    console.error('获取商品列表出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 新增商品（套餐）
 * POST /admin/api/products
 * 自动分配商品编号（从1001开始，查最大+1）
 * 支持唯一性检查：
 *   家政：business_type + service_type + service_hours 相同则报错
 *   洗衣：business_type + service_type 相同则报错
 *   充值：business_type + topup_member_name + topup_account_type 相同则报错
 */
const 新增商品 = async (req, res) => {
  try {
    const {
      product_name, business_type, cost_price, status, remark,
      service_type, service_hours,
      topup_account_type, topup_account_label, topup_member_name,
      topup_member_icon, topup_arrival_time, topup_show_expired,
      topup_steps, topup_account_regex, topup_account_error_msg,
      // 三角洲专用字段
      sjz_hafubi_amount, sjz_show_nickname, sjz_show_insurance, sjz_insurance_options,
      sjz_show_is_adult, sjz_adult_options, sjz_show_warehouse, sjz_require_phone,
      sjz_show_login_method, sjz_login_method_options,
    } = req.body;

    if (!product_name || !business_type) {
      return res.json({ code: 0, message: '套餐名称和业务类型为必填项' });
    }

    // 唯一性检查
    let 重复条件 = null;
    if (business_type === 'jiazheng') {
      if (!service_type) return res.json({ code: 0, message: '家政套餐必须填写服务类型' });
      重复条件 = {
        business_type,
        service_type,
        service_hours: parseInt(service_hours) || 0,
      };
    } else if (business_type === 'xiyifu') {
      if (!service_type) return res.json({ code: 0, message: '洗衣套餐必须填写服务类型' });
      重复条件 = { business_type, service_type };
    } else if (business_type === 'topup') {
      if (!topup_member_name) return res.json({ code: 0, message: '充值套餐必须填写会员名称' });
      重复条件 = { business_type, topup_member_name, topup_account_type: topup_account_type || null };
    }

    if (重复条件) {
      const 已存在 = await Product.findOne({ where: 重复条件 });
      if (已存在) {
        return res.json({ code: 0, message: '套餐已存在，请勿重复创建' });
      }
    }

    // 自动分配商品编号：查询当前最大编号+1，从1001开始
    const 最大编号商品 = await Product.findOne({
      order: [['product_no', 'DESC']],
    });
    let 新编号 = '1001';
    if (最大编号商品) {
      const 当前最大 = parseInt(最大编号商品.product_no, 10);
      if (!isNaN(当前最大) && 当前最大 >= 1001) {
        新编号 = String(当前最大 + 1);
      }
    }

    const 商品 = await Product.create({
      product_no: 新编号,
      product_name,
      business_type,
      service_type: service_type || null,
      service_hours: parseInt(service_hours) || 0,
      cost_price: parseFloat(cost_price) || 0,
      status: status !== undefined ? parseInt(status) : 1,
      remark: remark || null,
      topup_account_type: topup_account_type || null,
      topup_account_label: topup_account_label || null,
      topup_member_name: topup_member_name || null,
      topup_member_icon: topup_member_icon || null,
      topup_arrival_time: topup_arrival_time || null,
      topup_show_expired: topup_show_expired ? 1 : 0,
      topup_steps: topup_steps || null,
      topup_account_regex: topup_account_regex || null,
      topup_account_error_msg: topup_account_error_msg || null,
      // 三角洲专用字段
      sjz_hafubi_amount: sjz_hafubi_amount || null,
      sjz_show_nickname: sjz_show_nickname !== undefined ? parseInt(sjz_show_nickname) : 1,
      sjz_show_insurance: sjz_show_insurance !== undefined ? parseInt(sjz_show_insurance) : 1,
      sjz_insurance_options: sjz_insurance_options || '0,1,2,3,4,5,6',
      sjz_show_is_adult: sjz_show_is_adult !== undefined ? parseInt(sjz_show_is_adult) : 0,
      sjz_adult_options: sjz_adult_options || '已成年,未成年',
      sjz_show_warehouse: sjz_show_warehouse !== undefined ? parseInt(sjz_show_warehouse) : 0,
      sjz_require_phone: sjz_require_phone !== undefined ? parseInt(sjz_require_phone) : 1,
      sjz_show_login_method: sjz_show_login_method !== undefined ? parseInt(sjz_show_login_method) : 0,
      sjz_login_method_options: sjz_login_method_options || '扫码',
      created_at: new Date(),
    });

    res.json({ code: 1, message: '套餐新增成功', data: 商品 });
  } catch (错误) {
    console.error('新增商品出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 更新商品（套餐）
 * PUT /admin/api/products/:id
 */
const 更新商品 = async (req, res) => {
  try {
    const 商品 = await Product.findByPk(req.params.id);
    if (!商品) return res.json({ code: 0, message: '套餐不存在' });

    const {
      product_name, business_type, cost_price, status, remark,
      service_type, service_hours,
      topup_account_type, topup_account_label, topup_member_name,
      topup_member_icon, topup_arrival_time, topup_show_expired,
      topup_steps, topup_account_regex, topup_account_error_msg,
      // 三角洲专用字段
      sjz_hafubi_amount, sjz_show_nickname, sjz_show_insurance, sjz_insurance_options,
      sjz_show_is_adult, sjz_adult_options, sjz_show_warehouse, sjz_require_phone,
      sjz_show_login_method, sjz_login_method_options,
    } = req.body;

    const 更新数据 = {};
    if (product_name !== undefined) 更新数据.product_name = product_name;
    if (business_type !== undefined) 更新数据.business_type = business_type;
    if (cost_price !== undefined) 更新数据.cost_price = parseFloat(cost_price) || 0;
    if (status !== undefined) 更新数据.status = parseInt(status);
    if (remark !== undefined) 更新数据.remark = remark || null;
    if (service_type !== undefined) 更新数据.service_type = service_type || null;
    if (service_hours !== undefined) 更新数据.service_hours = parseInt(service_hours) || 0;
    if (topup_account_type !== undefined) 更新数据.topup_account_type = topup_account_type || null;
    if (topup_account_label !== undefined) 更新数据.topup_account_label = topup_account_label || null;
    if (topup_member_name !== undefined) 更新数据.topup_member_name = topup_member_name || null;
    if (topup_member_icon !== undefined) 更新数据.topup_member_icon = topup_member_icon || null;
    if (topup_arrival_time !== undefined) 更新数据.topup_arrival_time = topup_arrival_time || null;
    if (topup_show_expired !== undefined) 更新数据.topup_show_expired = topup_show_expired ? 1 : 0;
    if (topup_steps !== undefined) 更新数据.topup_steps = topup_steps || null;
    if (topup_account_regex !== undefined) 更新数据.topup_account_regex = topup_account_regex || null;
    if (topup_account_error_msg !== undefined) 更新数据.topup_account_error_msg = topup_account_error_msg || null;
    // 三角洲专用字段
    if (sjz_hafubi_amount !== undefined) 更新数据.sjz_hafubi_amount = sjz_hafubi_amount || null;
    if (sjz_show_nickname !== undefined) 更新数据.sjz_show_nickname = parseInt(sjz_show_nickname);
    if (sjz_show_insurance !== undefined) 更新数据.sjz_show_insurance = parseInt(sjz_show_insurance);
    if (sjz_insurance_options !== undefined) 更新数据.sjz_insurance_options = sjz_insurance_options || '0,1,2,3,4,5,6';
    if (sjz_show_is_adult !== undefined) 更新数据.sjz_show_is_adult = parseInt(sjz_show_is_adult);
    if (sjz_adult_options !== undefined) 更新数据.sjz_adult_options = sjz_adult_options || '已成年,未成年';
    if (sjz_show_warehouse !== undefined) 更新数据.sjz_show_warehouse = parseInt(sjz_show_warehouse);
    if (sjz_require_phone !== undefined) 更新数据.sjz_require_phone = parseInt(sjz_require_phone);
    if (sjz_show_login_method !== undefined) 更新数据.sjz_show_login_method = parseInt(sjz_show_login_method);
    if (sjz_login_method_options !== undefined) 更新数据.sjz_login_method_options = sjz_login_method_options || '扫码';

    await 商品.update(更新数据);
    res.json({ code: 1, message: '套餐更新成功', data: 商品 });
  } catch (错误) {
    console.error('更新商品出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

/**
 * 删除商品（套餐）
 * DELETE /admin/api/products/:id
 * 删除前检查是否有关联的未使用卡密（stock_unused > 0），有则禁止删除
 */
const 删除商品 = async (req, res) => {
  try {
    const 商品 = await Product.findByPk(req.params.id);
    if (!商品) return res.json({ code: 0, message: '套餐不存在' });

    // 检查未使用卡密数量
    const 未使用数量 = await Card.count({ where: { product_id: 商品.id, status: 0 } });
    if (未使用数量 > 0) {
      return res.json({ code: 0, message: `该套餐下还有 ${未使用数量} 张未使用卡密，请先处理关联卡密再删除套餐` });
    }

    await 商品.destroy();
    res.json({ code: 1, message: '套餐已删除' });
  } catch (错误) {
    console.error('删除商品出错:', 错误);
    res.status(500).json({ code: -1, message: '服务器错误' });
  }
};

module.exports = { 获取商品列表, 新增商品, 更新商品, 删除商品 };
