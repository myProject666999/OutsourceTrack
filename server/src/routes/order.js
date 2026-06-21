const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const { deleteCachedBalance, deleteCachedVendorBalance } = require('../db/redis');
const debug = require('debug')('ot:order');

function generateOrderNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return 'WX' + y + m + d + seq;
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword, vendor_id, status, start_date, end_date } = req.query;
    const offset = (page - 1) * pageSize;
    let where = '1=1';
    const params = [];
    if (keyword) {
      where += ' AND (o.order_no LIKE ? OR v.name LIKE ?)';
      params.push('%' + keyword + '%', '%' + keyword + '%');
    }
    if (vendor_id) {
      where += ' AND o.vendor_id = ?';
      params.push(Number(vendor_id));
    }
    if (status !== undefined && status !== '') {
      where += ' AND o.status = ?';
      params.push(Number(status));
    }
    if (start_date) {
      where += ' AND o.order_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      where += ' AND o.order_date <= ?';
      params.push(end_date);
    }
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_outsource_order o LEFT JOIN ot_vendor v ON o.vendor_id = v.id WHERE ' + where, params);
    const rows = await db.query('SELECT o.*, v.name as vendor_name FROM ot_outsource_order o LEFT JOIN ot_vendor v ON o.vendor_id = v.id WHERE ' + where + ' ORDER BY o.id DESC LIMIT ? OFFSET ?', [...params, Number(pageSize), Number(offset)]);
    debug('List orders: total=%d', totalRows.cnt);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await db.queryOne('SELECT o.*, v.name as vendor_name, v.code as vendor_code FROM ot_outsource_order o LEFT JOIN ot_vendor v ON o.vendor_id = v.id WHERE o.id = ?', [req.params.id]);
    if (!order) return fail(res, '订单不存在', 404);
    const items = await db.query('SELECT oi.*, m.code as product_code, m.name as product_name, m.spec as product_spec, m.unit as product_unit, rm.code as raw_code, rm.name as raw_name, rm.unit as raw_unit FROM ot_order_item oi LEFT JOIN ot_material m ON oi.material_id = m.id LEFT JOIN ot_material rm ON oi.raw_material_id = rm.id WHERE oi.order_id = ?', [req.params.id]);
    order.items = items;
    success(res, order);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { vendor_id, order_date, delivery_date, remark, created_by, items } = req.body;
    if (!vendor_id || !order_date || !delivery_date) return fail(res, '外协厂、下单日期、交货日期不能为空');
    if (!items || !items.length) return fail(res, '订单明细不能为空');
    const order_no = generateOrderNo();
    const result = await db.transaction(async (conn) => {
      const [orderResult] = await conn.execute('INSERT INTO ot_outsource_order (order_no, vendor_id, order_date, delivery_date, remark, created_by) VALUES (?, ?, ?, ?, ?, ?)', [order_no, vendor_id, order_date, delivery_date, remark || null, created_by || null]);
      const orderId = orderResult.insertId;
      let totalAmount = 0;
      for (const item of items) {
        const { material_id, raw_material_id, process_content, order_qty, input_output_ratio, unit_price, delivery_date: itemDeliveryDate, remark: itemRemark } = item;
        if (!material_id || !raw_material_id || !order_qty) continue;
        const ratio = input_output_ratio || null;
        const expectedQty = ratio ? +(order_qty * ratio).toFixed(4) : null;
        const amount = unit_price ? +(order_qty * unit_price).toFixed(2) : null;
        if (amount) totalAmount += amount;
        await conn.execute('INSERT INTO ot_order_item (order_id, material_id, raw_material_id, process_content, order_qty, input_output_ratio, expected_product_qty, unit_price, amount, delivery_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [orderId, material_id, raw_material_id, process_content || null, order_qty, ratio, expectedQty, unit_price || null, amount, itemDeliveryDate || delivery_date, itemRemark || null]);
      }
      if (totalAmount > 0) {
        await conn.execute('UPDATE ot_outsource_order SET total_amount = ? WHERE id = ?', [totalAmount, orderId]);
      }
      return { orderId, order_no };
    });
    debug('Create order: id=%d, order_no=%s', result.orderId, result.order_no);
    success(res, { id: result.orderId, order_no: result.order_no }, '创建成功');
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { vendor_id, order_date, delivery_date, remark, status, items } = req.body;
    const existing = await db.queryOne('SELECT * FROM ot_outsource_order WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '订单不存在', 404);
    if (existing.status >= 2) return fail(res, '订单已部分收货，不可修改');
    await db.transaction(async (conn) => {
      await conn.execute('UPDATE ot_outsource_order SET vendor_id=IFNULL(?,vendor_id), order_date=IFNULL(?,order_date), delivery_date=IFNULL(?,delivery_date), remark=IFNULL(?,remark), status=IFNULL(?,status) WHERE id=?', [vendor_id, order_date, delivery_date, remark, status, req.params.id]);
      if (items && items.length) {
        await conn.execute('DELETE FROM ot_order_item WHERE order_id = ?', [req.params.id]);
        for (const item of items) {
          const { material_id, raw_material_id, process_content, order_qty, input_output_ratio, unit_price, delivery_date: itemDeliveryDate, remark: itemRemark } = item;
          if (!material_id || !raw_material_id || !order_qty) continue;
          const ratio = input_output_ratio || null;
          const expectedQty = ratio ? +(order_qty * ratio).toFixed(4) : null;
          const amount = unit_price ? +(order_qty * unit_price).toFixed(2) : null;
          await conn.execute('INSERT INTO ot_order_item (order_id, material_id, raw_material_id, process_content, order_qty, input_output_ratio, expected_product_qty, unit_price, amount, delivery_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.params.id, material_id, raw_material_id, process_content || null, order_qty, ratio, expectedQty, unit_price || null, amount, itemDeliveryDate || delivery_date, itemRemark || null]);
        }
      }
    });
    await deleteCachedBalance(req.params.id);
    await deleteCachedVendorBalance(existing.vendor_id);
    debug('Update order: id=%d', req.params.id);
    success(res, null, '更新成功');
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status === undefined) return fail(res, '状态不能为空');
    const existing = await db.queryOne('SELECT * FROM ot_outsource_order WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '订单不存在', 404);
    await db.update('UPDATE ot_outsource_order SET status = ? WHERE id = ?', [status, req.params.id]);
    await deleteCachedBalance(req.params.id);
    await deleteCachedVendorBalance(existing.vendor_id);
    debug('Update order status: id=%d, status=%d', req.params.id, status);
    success(res, null, '状态更新成功');
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await db.queryOne('SELECT * FROM ot_outsource_order WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '订单不存在', 404);
    if (existing.status >= 1) return fail(res, '已下达的订单不能删除');
    await db.transaction(async (conn) => {
      await conn.execute('DELETE FROM ot_order_item WHERE order_id = ?', [req.params.id]);
      await conn.execute('DELETE FROM ot_outsource_order WHERE id = ?', [req.params.id]);
    });
    await deleteCachedBalance(req.params.id);
    debug('Delete order: id=%d', req.params.id);
    success(res, null, '删除成功');
  } catch (err) { next(err); }
});

module.exports = router;
