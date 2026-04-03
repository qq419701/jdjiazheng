/**
 * importRegionsFromCSV.js
 *
 * 从 modood 格式 CSV 文件导入省市区街道数据到 regions 表。
 *
 * CSV 文件格式：
 *   provinces.csv  — 列：code,name
 *   cities.csv     — 列：code,name,provinceCode
 *   areas.csv      — 列：code,name,cityCode,provinceCode
 *   streets.csv    — 列：code,name,areaCode,provinceCode,cityCode
 *
 * 运行方式（在项目根目录执行）：
 *   cd /www/wwwroot/jdjiazheng
 *   DB_HOST=localhost DB_PORT=3306 DB_NAME=jdjiazheng DB_USER=jdjiazheng DB_PASSWORD=xxx node backend/init/importRegionsFromCSV.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jdjiazheng',
  waitForConnections: true,
  connectionLimit: 5,
});

const ROOT = path.resolve(__dirname, '../../');
const CSV = {
  provinces: path.resolve(ROOT, 'provinces.csv'),
  cities: path.resolve(ROOT, 'cities.csv'),
  areas: path.resolve(ROOT, 'areas.csv'),
  streets: path.resolve(ROOT, 'streets.csv'),
};

async function readCSV(filePath, parentField) {
  const rows = [];
  if (!fs.existsSync(filePath)) {
    throw new Error(`找不到文件：${filePath}`);
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let isFirst = true;
  let parentColIndex = 2;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isFirst) {
      isFirst = false;
      if (parentField) {
        const headerCols = trimmed.split(',').map(c => c.trim().replace(/"/g, ''));
        const idx = headerCols.indexOf(parentField);
        if (idx !== -1) parentColIndex = idx;
      }
      continue;
    }

    const parts = trimmed.split(',').map(p => p.trim().replace(/"/g, ''));
    const row = {
      code: parts[0] || '',
      name: parts[1] || '',
      parentCode: (parentField && parts[parentColIndex]) ? parts[parentColIndex] : null,
    };
    if (row.code && row.name) {
      rows.push(row);
    }
  }
  return rows;
}

async function batchInsert(rows, level, codeToParentId) {
  if (rows.length === 0) return 0;

  const allValues = [];
  const allParams = [];
  let skipped = 0;

  for (const row of rows) {
    let parentId = 0;
    if (level > 1) {
      if (!codeToParentId.has(row.parentCode)) {
        skipped++;
        continue;
      }
      parentId = codeToParentId.get(row.parentCode);
    }
    allValues.push('(?, ?, ?, ?, 0, 1)');
    allParams.push(row.name, row.code, level, parentId);
  }

  if (allValues.length === 0) return 0;

  const BATCH_SIZE = 500;
  const PARAMS_PER_ROW = 4;
  for (let i = 0; i < allValues.length; i += BATCH_SIZE) {
    const batchValues = allValues.slice(i, i + BATCH_SIZE);
    const batchParams = allParams.slice(i * PARAMS_PER_ROW, (i + BATCH_SIZE) * PARAMS_PER_ROW);
    const sql = `INSERT INTO regions (name, code, level, parent_id, sort, is_enabled) VALUES ${batchValues.join(', ')}`;
    await pool.query(sql, batchParams);
    process.stdout.write(`\r  已插入 ${Math.min(i + BATCH_SIZE, allValues.length)}/${allValues.length} 条...`);
  }
  process.stdout.write('\n');

  if (skipped > 0) {
    console.log(`  已跳过 ${skipped} 条（找不到父级）`);
  }
  return allValues.length;
}

async function buildCodeMap(level) {
  const [rows] = await pool.query('SELECT id, code FROM regions WHERE level = ?', [level]);
  const map = new Map();
  for (const row of rows) {
    map.set(row.code, row.id);
  }
  return map;
}

async function main() {
  console.log('正在清空 regions 表...');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE regions');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('regions 表已清空\n');

  console.log('[1/4] 正在导入省级数据...');
  const provinces = await readCSV(CSV.provinces, null);
  const insertedProvinces = await batchInsert(provinces, 1, new Map());
  const provinceMap = await buildCodeMap(1);
  console.log(`已导入 ${insertedProvinces} 个省/直辖市/自治区\n`);

  console.log('[2/4] 正在导入市级数据...');
  const cities = await readCSV(CSV.cities, 'provinceCode');
  const insertedCities = await batchInsert(cities, 2, provinceMap);
  const cityMap = await buildCodeMap(2);
  console.log(`已导入 ${insertedCities} 个地级市\n`);

  console.log('[3/4] 正在导入区/县数据...');
  const areas = await readCSV(CSV.areas, 'cityCode');
  const insertedAreas = await batchInsert(areas, 3, cityMap);
  const areaMap = await buildCodeMap(3);
  console.log(`已导入 ${insertedAreas} 个区/县\n`);

  console.log('[4/4] 正在导入街道数据（数据量较大，请耐心等待）...');
  const streets = await readCSV(CSV.streets, 'areaCode');
  const insertedStreets = await batchInsert(streets, 4, areaMap);
  console.log(`已导入 ${insertedStreets} 个街道\n`);

  console.log('\n✅ 导入完成！');
  await pool.end();
}

main().catch(async err => {
  console.error('导入失败:', err);
  try { await pool.end(); } catch (_) {}
  process.exit(1);
});