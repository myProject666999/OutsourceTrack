const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const debug = require('debug')('ot:ratio');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_input_output_ratio');
    const rows = await db.query('SELECT r.*, rm.code as raw_code, rm.name as raw_name, rm.unit as raw_unit, pm.code as product_code, pm.name as product_name, pm.unit as product_unit FROM ot_input_output_ratio r LEFT JOIN ot_material rm ON r.raw_material_id = rm.id LEFT JOIN ot_material pm ON r.product_material_id = pm.id ORDER BY r.id DESC LIMIT ? OFFSET ?', [Number(pageSize), Number(offset)]);
    debug('List ratios: total=%d', totalRows.cnt);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.get('/all', async (req, res, next) => {
  try {
    const rows = await db.query('SELECT r.*, rm.code as raw_code, rm.name as raw_name, rm.unit as raw_unit, pm.code as product_code, pm.name as product_name, pm.unit as product_unit FROM ot_input_output_ratio r LEFT JOIN ot_material rm ON r.raw_material_id = rm.id LEFT JOIN ot_material pm ON r.product_material_id = pm.id ORDER BY r.id');
    success(res, rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await db.queryOne('SELECT r.*, rm.code as raw_code, rm.name as raw_name, rm.unit as raw_unit, pm.code as product_code, pm.name as product_name, pm.unit as product_unit FROM ot_input_output_ratio r LEFT JOIN ot_material rm ON r.raw_material_id = rm.id LEFT JOIN ot_material pm ON r.product_material_id = pm.id WHERE r.id = ?', [req.params.id]);
    if (!row) return fail(res, '投入产出比不存在', 404);
    success(res, row);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { raw_material_id, product_material_id, ratio, process_name, remark } = req.body;
    if (!raw_material_id || !product_material_id || ratio === undefined) return fail(res, '原材料、成品和比例不能为空');
    const existing = await db.queryOne('SELECT id FROM ot_input_output_ratio WHERE raw_material_id = ? AND product_material_id = ?', [raw_material_id, product_material_id]);
    if (existing) return fail(res, '该原材料-成品组合已存在投入产出比');
    const result = await db.insert('INSERT INTO ot_input_output_ratio (raw_material_id, product_material_id, ratio, process_name, remark) VALUES (?, ?, ?, ?, ?)', [raw_material_id, product_material_id, ratio, process_name || null, remark || null]);
    debug('Create ratio: id=%d', result.insertId);
    success(res, { id: result.insertId }, '创建成功');
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { raw_material_id, product_material_id, ratio, process_name, remark } = req.body;
    const existing = await db.queryOne('SELECT id FROM ot_input_output_ratio WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '投入产出比不存在', 404);
    await db.update('UPDATE ot_input_output_ratio SET raw_material_id=IFNULL(?,raw_material_id), product_material_id=IFNULL(?,product_material_id), ratio=IFNULL(?,ratio), process_name=IFNULL(?,process_name), remark=IFNULL(?,remark) WHERE id=?', [raw_material_id, product_material_id, ratio, process_name, remark, req.params.id]);
    debug('Update ratio: id=%d', req.params.id);
    success(res, null, '更新成功');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.queryOne('SELECT id FROM ot_input_output_ratio WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '投入产出比不存在', 404);
    await db.deleteRows('DELETE FROM ot_input_output_ratio WHERE id = ?', [req.params.id]);
    debug('Delete ratio: id=%d', req.params.id);
    success(res, null, '删除成功');
  } catch (err) { next(err); }
});

module.exports = router;
