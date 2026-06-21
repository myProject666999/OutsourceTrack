const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const { deleteCachedBalance, deleteCachedVendorBalance } = require('../db/redis');
const debug = require('debug')('ot:receipt');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, order_id, vendor_id, start_date, end_date } = req.query;
    const offset = (page - 1) * pageSize;
    let where = '1=1';
    const params = [];
    if (order_id) {
      where += ' AND rr.order_id = ?';
      params.push(Number(order_id));
    }
    if (vendor_id) {
      where += ' AND o.vendor_id = ?';
      params.push(Number(vendor_id));
    }
    if (start_date) {
      where += ' AND rr.receipt_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      where += ' AND rr.receipt_date <= ?';
      params.push(end_date);
    }
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_receipt_record rr LEFT JOIN ot_outsource_order o ON rr.order_id = o.id WHERE ' + where, params);
    const rows = await db.query('SELECT rr.*, o.order_no, v.name as vendor_name, m.code as material_code, m.name as material_name, m.unit as material_unit, w.name as warehouse_name FROM ot_receipt_record rr LEFT JOIN ot_outsource_order o ON rr.order_id = o.id LEFT JOIN ot_vendor v ON o.vendor_id = v.id LEFT JOIN ot_material m ON rr.material_id = m.id LEFT JOIN ot_warehouse w ON rr.warehouse_id = w.id WHERE ' + where + ' ORDER BY rr.id DESC LIMIT ? OFFSET ?', [...params, Number(pageSize), Number(offset)]);
    debug('List receipts: total=%d', totalRows.cnt);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { order_id, items } = req.body;
    if (!order_id) return fail(res, '订单ID不能为空');
    if (!items || !items.length) return fail(res, '收货明细不能为空');
    const order = await db.queryOne('SELECT * FROM ot_outsource_order WHERE id = ?', [order_id]);
    if (!order) return fail(res, '订单不存在', 404);
    if (order.status < 1) return fail(res, '订单未下达，不能收货');

    const result = await db.transaction(async (conn) => {
      const insertedIds = [];
      for (const item of items) {
        const { order_item_id, material_id, receipt_qty, qualified_qty, unqualified_qty, receipt_date, received_by, warehouse_id, remark } = item;
        if (!order_item_id || !material_id || !receipt_qty || !receipt_date) continue;
        const qQty = qualified_qty !== undefined ? qualified_qty : receipt_qty;
        const uQty = unqualified_qty !== undefined ? unqualified_qty : 0;
        const [res] = await conn.execute('INSERT INTO ot_receipt_record (order_id, order_item_id, material_id, receipt_qty, qualified_qty, unqualified_qty, receipt_date, received_by, warehouse_id, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [order_id, order_item_id, material_id, receipt_qty, qQty, uQty, receipt_date, received_by || null, warehouse_id || null, remark || null]);
        insertedIds.push(res.insertId);
        const [orderItemRows] = await conn.execute('SELECT order_qty, received_qty, qualified_qty as old_qualified FROM ot_order_item WHERE id = ?', [order_item_id]);
        const oi = orderItemRows[0];
        const newReceivedQty = +(Number(oi.received_qty) + Number(receipt_qty)).toFixed(4);
        const newQualifiedQty = +(Number(oi.old_qualified) + Number(qQty)).toFixed(4);
        const newUnqualifiedQty = +(newReceivedQty - newQualifiedQty).toFixed(4);
        let newStatus = 2;
        if (newReceivedQty >= Number(oi.order_qty)) newStatus = 3;
        await conn.execute('UPDATE ot_order_item SET received_qty = ?, qualified_qty = ?, unqualified_qty = ?, status = ? WHERE id = ?', [newReceivedQty, newQualifiedQty, newUnqualifiedQty, newStatus, order_item_id]);
      }
      const [allItems] = await conn.execute('SELECT status FROM ot_order_item WHERE order_id = ?', [order_id]);
      const allReceived = allItems.every(i => i.status >= 3);
      const anyReceived = allItems.some(i => i.status >= 2);
      const newOrderStatus = allReceived ? 3 : (anyReceived ? 2 : order.status);
      if (newOrderStatus !== order.status) {
        await conn.execute('UPDATE ot_outsource_order SET status = ? WHERE id = ?', [newOrderStatus, order_id]);
      }
      return insertedIds;
    });

    await deleteCachedBalance(order_id);
    await deleteCachedVendorBalance(order.vendor_id);
    debug('Create receipt records: order_id=%d, count=%d', order_id, result.length);
    success(res, { ids: result }, '收货成功');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const record = await db.queryOne('SELECT * FROM ot_receipt_record WHERE id = ?', [req.params.id]);
    if (!record) return fail(res, '收货记录不存在', 404);
    const order = await db.queryOne('SELECT * FROM ot_outsource_order WHERE id = ?', [record.order_id]);
    await db.transaction(async (conn) => {
      await conn.execute('UPDATE ot_order_item SET received_qty = received_qty - ?, qualified_qty = qualified_qty - ?, unqualified_qty = unqualified_qty - ? WHERE id = ?', [record.receipt_qty, record.qualified_qty, record.unqualified_qty, record.order_item_id]);
      await conn.execute('DELETE FROM ot_receipt_record WHERE id = ?', [req.params.id]);
    });
    await deleteCachedBalance(record.order_id);
    if (order) await deleteCachedVendorBalance(order.vendor_id);
    debug('Delete receipt record: id=%d', req.params.id);
    success(res, null, '删除成功');
  } catch (err) { next(err); }
});

module.exports = router;
