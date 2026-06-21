const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const debug = require('debug')('ot:warehouse');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, type, status } = req.query;
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
    if (status !== undefined && status !== '') {
      where += ' AND status = ?';
      params.push(Number(status));
    }
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_warehouse WHERE ' + where, params);
    const rows = await db.query('SELECT * FROM ot_warehouse WHERE ' + where + ' ORDER BY id', [...params]);
    debug('List warehouses: total=%d', totalRows.cnt);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.get('/all', async (req, res, next) => {
  try {
    const rows = await db.query('SELECT * FROM ot_warehouse WHERE status = 1 ORDER BY id');
    success(res, rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, name, type, status } = req.body;
    if (!code || !name) return fail(res, '编码和名称不能为空');
    const existing = await db.queryOne('SELECT id FROM ot_warehouse WHERE code = ?', [code]);
    if (existing) return fail(res, '仓库编码已存在');
    const result = await db.insert('INSERT INTO ot_warehouse (code, name, type, status) VALUES (?, ?, ?, ?)', [code, name, type || 1, status !== undefined ? status : 1]);
    debug('Create warehouse: id=%d', result.insertId);
    success(res, { id: result.insertId }, '创建成功');
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { code, name, type, status } = req.body;
    const existing = await db.queryOne('SELECT id FROM ot_warehouse WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '仓库不存在', 404);
    await db.update('UPDATE ot_warehouse SET code=IFNULL(?,code), name=IFNULL(?,name), type=IFNULL(?,type), status=IFNULL(?,status) WHERE id=?', [code, name, type, status, req.params.id]);
    debug('Update warehouse: id=%d', req.params.id);
    success(res, null, '更新成功');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.queryOne('SELECT id FROM ot_warehouse WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '仓库不存在', 404);
    await db.update('UPDATE ot_warehouse SET status = 0 WHERE id = ?', [req.params.id]);
    success(res, null, '已停用');
  } catch (err) { next(err); }
});

module.exports = router;
