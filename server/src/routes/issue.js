const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const { deleteCachedBalance, deleteCachedVendorBalance } = require('../db/redis');
const debug = require('debug')('ot:issue');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, order_id, vendor_id, start_date, end_date } = req.query;
    const offset = (page - 1) * pageSize;
    let where = '1=1';
    const params = [];
    if (order_id) {
      where += ' AND ir.order_id = ?';
      params.push(Number(order_id));
    }
    if (vendor_id) {
      where += ' AND o.vendor_id = ?';
      params.push(Number(vendor_id));
    }
    if (start_date) {
      where += ' AND ir.issue_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      where += ' AND ir.issue_date <= ?';
      params.push(end_date);
    }
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_issue_record ir LEFT JOIN ot_outsource_order o ON ir.order_id = o.id WHERE ' + where, params);
    const rows = await db.query('SELECT ir.*, o.order_no, v.name as vendor_name, m.code as material_code, m.name as material_name, m.unit as material_unit, w.name as warehouse_name FROM ot_issue_record ir LEFT JOIN ot_outsource_order o ON ir.order_id = o.id LEFT JOIN ot_vendor v ON o.vendor_id = v.id LEFT JOIN ot_material m ON ir.material_id = m.id LEFT JOIN ot_warehouse w ON ir.warehouse_id = w.id WHERE ' + where + ' ORDER BY ir.id DESC LIMIT ? OFFSET ?', [...params, Number(pageSize), Number(offset)]);
    debug('List issues: total=%d', totalRows.cnt);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { order_id, items } = req.body;
    if (!order_id) return fail(res, '订单ID不能为空');
    if (!items || !items.length) return fail(res, '发料明细不能为空');
    const order = await db.queryOne('SELECT * FROM ot_outsource_order WHERE id = ?', [order_id]);
    if (!order) return fail(res, '订单不存在', 404);
    if (order.status < 1) return fail(res, '订单未下达，不能发料');

    const result = await db.transaction(async (conn) => {
      const insertedIds = [];
      for (const item of items) {
        const { order_item_id, material_id, issue_qty, issue_date, issue_by, warehouse_id, remark } = item;
        if (!order_item_id || !material_id || !issue_qty || !issue_date) continue;
        const [res] = await conn.execute('INSERT INTO ot_issue_record (order_id, order_item_id, material_id, issue_qty, issue_date, issue_by, warehouse_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [order_id, order_item_id, material_id, issue_qty, issue_date, issue_by || null, warehouse_id || null, remark || null]);
        insertedIds.push(res.insertId);
        await conn.execute('UPDATE ot_order_item SET issued_qty = issued_qty + ?, status = CASE WHEN status < 1 THEN 1 ELSE status END WHERE id = ?', [issue_qty, order_item_id]);
      }
      return insertedIds;
    });

    await deleteCachedBalance(order_id);
    await deleteCachedVendorBalance(order.vendor_id);
    debug('Create issue records: order_id=%d, count=%d', order_id, result.length);
    success(res, { ids: result }, '发料成功');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const record = await db.queryOne('SELECT * FROM ot_issue_record WHERE id = ?', [req.params.id]);
    if (!record) return fail(res, '发料记录不存在', 404);
    const order = await db.queryOne('SELECT * FROM ot_outsource_order WHERE id = ?', [record.order_id]);
    await db.transaction(async (conn) => {
      await conn.execute('UPDATE ot_order_item SET issued_qty = issued_qty - ? WHERE id = ?', [record.issue_qty, record.order_item_id]);
      await conn.execute('DELETE FROM ot_issue_record WHERE id = ?', [req.params.id]);
    });
    await deleteCachedBalance(record.order_id);
    if (order) await deleteCachedVendorBalance(order.vendor_id);
    debug('Delete issue record: id=%d', req.params.id);
    success(res, null, '删除成功');
  } catch (err) { next(err); }
});

module.exports = router;
