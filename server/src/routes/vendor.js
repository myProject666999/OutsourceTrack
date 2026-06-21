const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const debug = require('debug')('ot:vendor');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;
    let where = '1=1';
    const params = [];
    if (keyword) {
      where += ' AND (code LIKE ? OR name LIKE ? OR contact_person LIKE ?)';
      params.push('%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%');
    }
    if (status !== undefined && status !== '') {
      where += ' AND status = ?';
      params.push(Number(status));
    }
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_vendor WHERE ' + where, params);
    const rows = await db.query('SELECT * FROM ot_vendor WHERE ' + where + ' ORDER BY id DESC LIMIT ? OFFSET ?', [...params, Number(pageSize), Number(offset)]);
    debug('List vendors: total=%d, page=%d', totalRows.cnt, page);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await db.queryOne('SELECT * FROM ot_vendor WHERE id = ?', [req.params.id]);
    if (!row) return fail(res, '外协厂不存在', 404);
    success(res, row);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, name, contact_person, contact_phone, address, status } = req.body;
    if (!code || !name) return fail(res, '编码和名称不能为空');
    const existing = await db.queryOne('SELECT id FROM ot_vendor WHERE code = ?', [code]);
    if (existing) return fail(res, '外协厂编码已存在');
    const result = await db.insert('INSERT INTO ot_vendor (code, name, contact_person, contact_phone, address, status) VALUES (?, ?, ?, ?, ?, ?)', [code, name, contact_person || null, contact_phone || null, address || null, status !== undefined ? status : 1]);
    debug('Create vendor: id=%d, code=%s', result.insertId, code);
    success(res, { id: result.insertId }, '创建成功');
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { code, name, contact_person, contact_phone, address, status } = req.body;
    const existing = await db.queryOne('SELECT id FROM ot_vendor WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '外协厂不存在', 404);
    if (code && code !== existing.code) {
      const dup = await db.queryOne('SELECT id FROM ot_vendor WHERE code = ? AND id != ?', [code, req.params.id]);
      if (dup) return fail(res, '外协厂编码已存在');
    }
    await db.update('UPDATE ot_vendor SET code=IFNULL(?,code), name=IFNULL(?,name), contact_person=IFNULL(?,contact_person), contact_phone=IFNULL(?,contact_phone), address=IFNULL(?,address), status=IFNULL(?,status) WHERE id=?', [code, name, contact_person, contact_phone, address, status, req.params.id]);
    debug('Update vendor: id=%d', req.params.id);
    success(res, null, '更新成功');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.queryOne('SELECT id FROM ot_vendor WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '外协厂不存在', 404);
    await db.update('UPDATE ot_vendor SET status = 0 WHERE id = ?', [req.params.id]);
    debug('Delete(deactivate) vendor: id=%d', req.params.id);
    success(res, null, '已停用');
  } catch (err) { next(err); }
});

module.exports = router;
