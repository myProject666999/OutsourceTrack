const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const debug = require('debug')('ot:material');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, type, category, status } = req.query;
    const offset = (page - 1) * pageSize;
    let where = '1=1';
    const params = [];
    if (keyword) {
      where += ' AND (code LIKE ? OR name LIKE ?)';
      params.push('%' + keyword + '%', '%' + keyword + '%');
    }
    if (type !== undefined && type !== '') {
      where += ' AND type = ?';
      params.push(Number(type));
    }
    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (status !== undefined && status !== '') {
      where += ' AND status = ?';
      params.push(Number(status));
    }
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_material WHERE ' + where, params);
    const rows = await db.query('SELECT * FROM ot_material WHERE ' + where + ' ORDER BY id DESC LIMIT ? OFFSET ?', [...params, Number(pageSize), Number(offset)]);
    debug('List materials: total=%d', totalRows.cnt);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.get('/all', async (req, res, next) => {
  try {
    const { type } = req.query;
    let where = 'status = 1';
    const params = [];
    if (type !== undefined && type !== '') {
      where += ' AND type = ?';
      params.push(Number(type));
    }
    const rows = await db.query('SELECT * FROM ot_material WHERE ' + where + ' ORDER BY id', params);
    success(res, rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await db.queryOne('SELECT * FROM ot_material WHERE id = ?', [req.params.id]);
    if (!row) return fail(res, '物料不存在', 404);
    success(res, row);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, name, spec, unit, type, category, status } = req.body;
    if (!code || !name || !unit || type === undefined) return fail(res, '编码、名称、单位、类型不能为空');
    const existing = await db.queryOne('SELECT id FROM ot_material WHERE code = ?', [code]);
    if (existing) return fail(res, '物料编码已存在');
    const result = await db.insert('INSERT INTO ot_material (code, name, spec, unit, type, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [code, name, spec || null, unit, type, category || null, status !== undefined ? status : 1]);
    debug('Create material: id=%d, code=%s', result.insertId, code);
    success(res, { id: result.insertId }, '创建成功');
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { code, name, spec, unit, type, category, status } = req.body;
    const existing = await db.queryOne('SELECT id FROM ot_material WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '物料不存在', 404);
    if (code && code !== existing.code) {
      const dup = await db.queryOne('SELECT id FROM ot_material WHERE code = ? AND id != ?', [code, req.params.id]);
      if (dup) return fail(res, '物料编码已存在');
    }
    await db.update('UPDATE ot_material SET code=IFNULL(?,code), name=IFNULL(?,name), spec=IFNULL(?,spec), unit=IFNULL(?,unit), type=IFNULL(?,type), category=IFNULL(?,category), status=IFNULL(?,status) WHERE id=?', [code, name, spec, unit, type, category, status, req.params.id]);
    debug('Update material: id=%d', req.params.id);
    success(res, null, '更新成功');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.queryOne('SELECT id FROM ot_material WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '物料不存在', 404);
    await db.update('UPDATE ot_material SET status = 0 WHERE id = ?', [req.params.id]);
    debug('Delete(deactivate) material: id=%d', req.params.id);
    success(res, null, '已停用');
  } catch (err) { next(err); }
});

module.exports = router;
