/**
 * importRegionsFromCSV.js
 *
 * 从 modood 格式 CSV 文件导入省市区街道数据到 regions 表。
 *
 * CSV 文件路径（位于项目根目录）：
 *   provinces.csv  — 列：code,name
 *   cities.csv     — 列：code,name,provinceCode
 *   areas.csv      — 列：code,name,cityCode
 *   streets.csv    — 列：code,name,areaCode,cityCode（默认跳过，数据量极大）
 *
 * 运行方式：
 *   cd /www/wwwroot/jdjiazheng
 *   node backend/init/importRegionsFromCSV.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

// ──────────────────────────────────────────────
// 数据库连接池
// ──────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jdjiazheng',
  waitForConnections: true,
  connectionLimit: 5,
});

// ──────────────────────────────────────────────
// CSV 文件路径（项目根目录）
// ──────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '../../');
const CSV = {
  provinces: path.resolve(ROOT, 'provinces.csv'),
  cities: path.resolve(ROOT, 'cities.csv'),
  areas: path.resolve(ROOT, 'areas.csv'),
  streets: path.resolve(ROOT, 'streets.csv'),
};

// ──────────────────────────────────────────────
// 工具：逐行读取 CSV，跳过标题行
// 返回：{ code, name, parentCode } 数组
// parentField: 'provinceCode' | 'cityCode' | 'areaCode' | null
// ──────────────────────────────────────────────
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
  for await (const line of rl) {
    if (isFirst) { isFirst = false; continue; } // 跳过标题行
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(',');
    const row = {
      code: parts[0] ? parts[0].trim() : '',
      name: parts[1] ? parts[1].trim() : '',
      parentCode: (parentField && parts[2]) ? parts[2].trim() : null,
    };
    if (row.code && row.name) {
      rows.push(row);
    }
  }
  return rows;
}

// ──────────────────────────────────────────────
// 工具：批量插入并返回影响行数
// ──────────────────────────────────────────────
async function batchInsert(rows, level, codeToParentId) {
  if (rows.length === 0) return 0;

  const values = [];
  const params = [];
  let skipped = 0;

  for (const row of rows) {
    let parentId = 0;
    if (level > 1) {
      if (!codeToParentId.has(row.parentCode)) {
        console.warn(`  ⚠ 跳过 [${row.code}] ${row.name}：找不到父级 code=${row.parentCode}`);
        skipped++;
        continue;
      }
      parentId = codeToParentId.get(row.parentCode);
    }
    values.push('(?, ?, ?, ?, 0, 1)');
    params.push(row.name, row.code, level, parentId);
  }

  if (values.length === 0) return 0;

  const sql = `INSERT INTO regions (name, code, level, parent_id, sort, is_enabled) VALUES ${values.join(', ')}`;
  await pool.query(sql, params);
  if (skipped > 0) {
    console.log(`  已跳过 ${skipped} 条（找不到父级）`);
  }
  return values.length;
}

// ──────────────────────────────────────────────
// 工具：查询已插入数据，建立 code → id Map
// ──────────────────────────────────────────────
async function buildCodeMap(level) {
  const [rows] = await pool.query('SELECT id, code FROM regions WHERE level = ?', [level]);
  const map = new Map();
  for (const row of rows) {
    map.set(row.code, row.id);
  }
  return map;
}

// ──────────────────────────────────────────────
// 主流程
// ──────────────────────────────────────────────
async function main() {
  // 1. 清空旧数据，重置自增 ID
  console.log('正在清空 regions 表...');
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE regions');
  } finally {
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  }
  console.log('regions 表已清空\n');

  // ── [1/4] 省级数据 ──────────────────────────
  console.log('[1/4] 正在导入省级数据...');
  const provinces = await readCSV(CSV.provinces, null);
  const insertedProvinces = await batchInsert(provinces, 1, new Map());
  const provinceMap = await buildCodeMap(1);
  console.log(`已导入 ${insertedProvinces} 个省/直辖市/自治区\n`);

  // ── [2/4] 市级数据 ──────────────────────────
  console.log('[2/4] 正在导入市级数据...');
  const cities = await readCSV(CSV.cities, 'provinceCode');
  const insertedCities = await batchInsert(cities, 2, provinceMap);
  const cityMap = await buildCodeMap(2);
  console.log(`已导入 ${insertedCities} 个地级市\n`);

  // ── [3/4] 区/县数据 ─────────────────────────
  console.log('[3/4] 正在导入区/县数据...');
  const areas = await readCSV(CSV.areas, 'cityCode');
  const insertedAreas = await batchInsert(areas, 3, cityMap);
  // const areaMap = await buildCodeMap(3); // 街道导入时才需要
  console.log(`已导入 ${insertedAreas} 个区/县\n`);

  // ── [4/4] 街道数据（默认跳过，数据量过大） ──
  console.log('[4/4] 街道数据已跳过（数据量过大，如需导入请取消注释）');
  /*
  console.log('[4/4] 正在导入街道数据...');
  const areaMap = await buildCodeMap(3);
  const streets = await readCSV(CSV.streets, 'areaCode');
  const insertedStreets = await batchInsert(streets, 4, areaMap);
  console.log(`已导入 ${insertedStreets} 个街道\n`);
  */

  console.log('\n导入完成！');
  await pool.end();
}

main().catch(async err => {
  console.error('导入失败:', err);
  try { await pool.end(); } catch (_) {}
  process.exit(1);
});
