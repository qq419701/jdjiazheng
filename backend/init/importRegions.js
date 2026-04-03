/**
 * importRegions.js
 *
 * 从 modood 格式 CSV 文件导入省市区街道四级数据到 regions 表。
 *
 * CSV 文件路径（位于项目根目录）：
 *   provinces.csv  — 列：code,name
 *   cities.csv     — 列：code,name,provinceCode
 *   areas.csv      — 列：code,name,cityCode
 *   streets.csv    — 列：code,name,areaCode（或 code,name,areaCode,cityCode）
 *
 * 运行方式：
 *   cd /www/wwwroot/jdjiazheng
 *   node backend/init/importRegions.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { QueryTypes } = require('sequelize');
const 数据库连接 = require('../config/database');

// CSV 文件路径（项目根目录）
const ROOT = path.resolve(__dirname, '../../');
const CSV = {
  provinces: path.resolve(ROOT, 'provinces.csv'),
  cities: path.resolve(ROOT, 'cities.csv'),
  areas: path.resolve(ROOT, 'areas.csv'),
  streets: path.resolve(ROOT, 'streets.csv'),
};

// 每批插入条数
const BATCH_SIZE = 500;

// 逐行读取 CSV，跳过标题行，返回 { code, name, parentCode } 数组
async function readCSV(filePath, parentFieldIndex) {
  const rows = [];
  if (!fs.existsSync(filePath)) {
    throw new Error(`找不到文件：${filePath}`);
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let isFirst = true;
  for await (const line of rl) {
    if (isFirst) { isFirst = false; continue; } // 跳过标题行
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(',');
    const row = {
      code: parts[0] ? parts[0].trim() : '',
      name: parts[1] ? parts[1].trim() : '',
      parentCode: (parentFieldIndex !== null && parts[parentFieldIndex]) ? parts[parentFieldIndex].trim() : null,
    };
    if (row.code && row.name) {
      rows.push(row);
    }
  }
  return rows;
}

// 批量插入，每批 BATCH_SIZE 条；返回实际插入行数
async function batchInsert(rows, level, codeToParentId) {
  if (rows.length === 0) return 0;

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const valueParts = [];
    const params = [];

    for (const row of batch) {
      let parentId = 0;
      if (level > 1) {
        if (!codeToParentId.has(row.parentCode)) {
          skipped++;
          continue;
        }
        parentId = codeToParentId.get(row.parentCode);
      }
      valueParts.push('(?, ?, ?, ?, 1, 0)');
      params.push(row.name, level, parentId, row.code);
    }

    if (valueParts.length === 0) continue;

    const sql = `INSERT INTO regions (name, level, parent_id, code, is_enabled, sort) VALUES ${valueParts.join(', ')}`;
    await 数据库连接.query(sql, { replacements: params });
    inserted += valueParts.length;
  }

  if (skipped > 0) {
    console.log(`  ⚠ 已跳过 ${skipped} 条（找不到父级）`);
  }
  return inserted;
}

// 查询已插入数据，建立 code → id 的 Map
async function buildCodeMap(level) {
  const rows = await 数据库连接.query(
    'SELECT id, code FROM regions WHERE level = :level',
    { replacements: { level }, type: QueryTypes.SELECT }
  );
  const map = new Map();
  for (const row of rows) {
    map.set(row.code, row.id);
  }
  return map;
}

async function 导入地区数据() {
  try {
    await 数据库连接.authenticate();
    console.log('数据库连接成功');

    // 清空表
    try {
      await 数据库连接.query('SET FOREIGN_KEY_CHECKS=0');
      await 数据库连接.query('TRUNCATE TABLE regions');
    } finally {
      await 数据库连接.query('SET FOREIGN_KEY_CHECKS=1');
    }
    console.log('已清空 regions 表\n');

    // [1/4] 省级数据
    console.log('[1/4] 正在导入省级数据...');
    const provinces = await readCSV(CSV.provinces, null);
    const insertedProvinces = await batchInsert(provinces, 1, new Map());
    const provinceMap = await buildCodeMap(1);
    console.log(`已导入 ${insertedProvinces} 个省/直辖市/自治区\n`);

    // [2/4] 市级数据
    console.log('[2/4] 正在导入市级数据...');
    const cities = await readCSV(CSV.cities, 2); // provinceCode 在第3列（index 2）
    const insertedCities = await batchInsert(cities, 2, provinceMap);
    const cityMap = await buildCodeMap(2);
    console.log(`已导入 ${insertedCities} 个地级市\n`);

    // [3/4] 区/县数据
    console.log('[3/4] 正在导入区/县数据...');
    const areas = await readCSV(CSV.areas, 2); // cityCode 在第3列（index 2）
    const insertedAreas = await batchInsert(areas, 3, cityMap);
    const areaMap = await buildCodeMap(3);
    console.log(`已导入 ${insertedAreas} 个区/县\n`);

    // [4/4] 街道数据
    console.log('[4/4] 正在导入街道数据...');
    const streets = await readCSV(CSV.streets, 2); // areaCode 在第3列（index 2）
    const insertedStreets = await batchInsert(streets, 4, areaMap);
    console.log(`已导入 ${insertedStreets} 个街道\n`);

    console.log('导入完成！');
    await 数据库连接.close();
    process.exit(0);
  } catch (err) {
    console.error('导入失败:', err);
    try { await 数据库连接.close(); } catch (_) {}
    process.exit(1);
  }
}

导入地区数据();
