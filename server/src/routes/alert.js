const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const debug = require('debug')('ot:alert');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, alert_type, status, vendor_id } = req.query;
    const offset = (page - 1) * pageSize;
    let where = '1=1';
    const params = [];
    if (alert_type !== undefined && alert_type !== '') {
      where += ' AND a.alert_type = ?';
      params.push(Number(alert_type));
    }
    if (status !== undefined && status !== '') {
      where += ' AND a.status = ?';
      params.push(Number(status));
    }
    if (vendor_id) {
      where += ' AND a.vendor_id = ?';
      params.push(Number(vendor_id));
    }
    const totalRows = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_alert a WHERE ' + where, params);
    const rows = await db.query('SELECT a.*, o.order_no, v.name as vendor_name FROM ot_alert a LEFT JOIN ot_outsource_order o ON a.order_id = o.id LEFT JOIN ot_vendor v ON a.vendor_id = v.id WHERE ' + where + ' ORDER BY a.id DESC LIMIT ? OFFSET ?', [...params, Number(pageSize), Number(offset)]);
    debug('List alerts: total=%d', totalRows.cnt);
    paginate(res, rows, totalRows.cnt, page, pageSize);
  } catch (err) { next(err); }
});

router.post('/generate', async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    debug('Generate alerts for date=%s', today);
    const overdueOrders = await db.query('SELECT o.id as order_id, o.vendor_id, oi.id as order_item_id FROM ot_outsource_order o JOIN ot_order_item oi ON o.id = oi.order_id WHERE o.status >= 1 AND o.status < 3 AND o.delivery_date < ? AND oi.status < 3', [today]);
    let overdueCount = 0;
    for (const item of overdueOrders) {
      const existing = await db.queryOne('SELECT id FROM ot_alert WHERE order_id = ? AND order_item_id = ? AND alert_type = 1 AND status = 0', [item.order_id, item.order_item_id]);
      if (!existing) {
        await db.insert('INSERT INTO ot_alert (order_id, order_item_id, vendor_id, alert_type, alert_date, remark) VALUES (?, ?, ?, 1, ?, ?)', [item.order_id, item.order_item_id, item.vendor_id, today, '超期未交货']);
        overdueCount++;
      }
    }

    const config = require('../config');
    const orderItems = await db.query('SELECT oi.id as order_item_id, oi.order_id, o.vendor_id, oi.issued_qty, oi.qualified_qty, oi.input_output_ratio, oi.expected_product_qty FROM ot_order_item oi JOIN ot_outsource_order o ON oi.order_id = o.id WHERE o.status >= 1 AND oi.issued_qty > 0 AND oi.input_output_ratio IS NOT NULL AND oi.expected_product_qty IS NOT NULL');
    let lossCount = 0;
    for (const item of orderItems) {
      const expectedQty = +(item.issued_qty * item.input_output_ratio).toFixed(4);
      const actualQty = +item.qualified_qty;
      if (expectedQty > 0 && actualQty >= 0) {
        const lossRate = (expectedQty - actualQty) / expectedQty;
        if (lossRate > config.alert.abnormalLossThreshold && actualQty > 0) {
          const existing = await db.queryOne('SELECT id FROM ot_alert WHERE order_id = ? AND order_item_id = ? AND alert_type = 2 AND status = 0', [item.order_id, item.order_item_id]);
          if (!existing) {
            await db.insert('INSERT INTO ot_alert (order_id, order_item_id, vendor_id, alert_type, alert_date, remark) VALUES (?, ?, ?, 2, ?, ?)', [item.order_id, item.order_item_id, item.vendor_id, today, '异常损耗，损耗率' + (lossRate * 100).toFixed(2) + '%']);
            lossCount++;
          }
        }
      }
    }
    debug('Generated alerts: overdue=%d, loss=%d', overdueCount, lossCount);
    success(res, { overdueCount, lossCount }, '预警生成完成');
  } catch (err) { next(err); }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status === undefined) return fail(res, '状态不能为空');
    const existing = await db.queryOne('SELECT * FROM ot_alert WHERE id = ?', [req.params.id]);
    if (!existing) return fail(res, '预警记录不存在', 404);
    await db.update('UPDATE ot_alert SET status = ? WHERE id = ?', [status, req.params.id]);
    debug('Update alert status: id=%d, status=%d', req.params.id, status);
    success(res, null, '状态更新成功');
  } catch (err) { next(err); }
});

module.exports = router;
