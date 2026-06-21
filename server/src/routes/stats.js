const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, fail } = require('../utils/response');
const debug = require('debug')('ot:stats');

router.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;
    const vendor = await db.queryOne('SELECT * FROM ot_vendor WHERE id = ?', [vendorId]);
    if (!vendor) return fail(res, '外协厂不存在', 404);
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [vendorId];
    if (start_date) { dateFilter += ' AND o.order_date >= ?'; params.push(start_date); }
    if (end_date) { dateFilter += ' AND o.order_date <= ?'; params.push(end_date); }

    const orderStats = await db.queryOne('SELECT COUNT(*) as total_orders, COALESCE(SUM(CASE WHEN o.status >= 3 THEN 1 ELSE 0 END), 0) as completed_orders, COALESCE(SUM(o.total_amount), 0) as total_amount FROM ot_outsource_order o WHERE o.vendor_id = ? AND o.status >= 1' + dateFilter, params);

    const deliveryStats = await db.queryOne('SELECT COUNT(*) as total_items, COALESCE(SUM(CASE WHEN oi.status >= 3 THEN 1 ELSE 0 END), 0) as delivered_items, COALESCE(SUM(CASE WHEN oi.status >= 3 AND o.delivery_date >= IFNULL((SELECT MAX(rr.receipt_date) FROM ot_receipt_record rr WHERE rr.order_item_id = oi.id), "9999-12-31") THEN 1 ELSE 0 END), 0) as on_time_items FROM ot_order_item oi JOIN ot_outsource_order o ON oi.order_id = o.id WHERE o.vendor_id = ? AND o.status >= 1' + dateFilter, params);

    const qualityStats = await db.queryOne('SELECT COALESCE(SUM(oi.received_qty), 0) as total_received, COALESCE(SUM(oi.qualified_qty), 0) as total_qualified, COALESCE(SUM(oi.unqualified_qty), 0) as total_unqualified FROM ot_order_item oi JOIN ot_outsource_order o ON oi.order_id = o.id WHERE o.vendor_id = ? AND o.status >= 1' + dateFilter, params);

    const deliveryRate = Number(deliveryStats.total_items) > 0 ? +(Number(deliveryStats.delivered_items) / Number(deliveryStats.total_items) * 100).toFixed(2) : 0;
    const qualityRate = Number(qualityStats.total_received) > 0 ? +(Number(qualityStats.total_qualified) / Number(qualityStats.total_received) * 100).toFixed(2) : 0;

    const result = {
      vendor,
      period: { start_date: start_date || null, end_date: end_date || null },
      orders: { total: orderStats.total_orders, completed: orderStats.completed_orders, total_amount: +Number(orderStats.total_amount).toFixed(2) },
      delivery: { total_items: deliveryStats.total_items, delivered_items: deliveryStats.delivered_items, delivery_rate: deliveryRate },
      quality: { total_received: +Number(qualityStats.total_received).toFixed(4), total_qualified: +Number(qualityStats.total_qualified).toFixed(4), total_unqualified: +Number(qualityStats.total_unqualified).toFixed(4), quality_rate: qualityRate }
    };
    debug('Vendor stats: vendor_id=%d, delivery_rate=%s%, quality_rate=%s%', vendorId, deliveryRate, qualityRate);
    success(res, result);
  } catch (err) { next(err); }
});

router.get('/overview', async (req, res, next) => {
  try {
    const totalVendors = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_vendor WHERE status = 1');
    const totalOrders = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_outsource_order WHERE status >= 1');
    const activeOrders = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_outsource_order WHERE status >= 1 AND status < 3');
    const overdueOrders = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_outsource_order WHERE status >= 1 AND status < 3 AND delivery_date < CURDATE()');
    const totalIssued = await db.queryOne('SELECT COALESCE(SUM(issued_qty), 0) as total FROM ot_order_item oi JOIN ot_outsource_order o ON oi.order_id = o.id WHERE o.status >= 1');
    const totalReceived = await db.queryOne('SELECT COALESCE(SUM(received_qty), 0) as total FROM ot_order_item oi JOIN ot_outsource_order o ON oi.order_id = o.id WHERE o.status >= 1');
    const inProcess = +(Number(totalIssued.total) - Number(totalReceived.total)).toFixed(4);

    const pendingAlerts = await db.queryOne('SELECT COUNT(*) as cnt FROM ot_alert WHERE status = 0');

    const result = {
      total_vendors: totalVendors.cnt,
      total_orders: totalOrders.cnt,
      active_orders: activeOrders.cnt,
      overdue_orders: overdueOrders.cnt,
      total_issued: +Number(totalIssued.total).toFixed(4),
      total_received: +Number(totalReceived.total).toFixed(4),
      in_process: inProcess,
      pending_alerts: pendingAlerts.cnt
    };
    debug('Overview stats: %o', result);
    success(res, result);
  } catch (err) { next(err); }
});

router.get('/vendors-comparison', async (req, res, next) => {
  try {
    const vendors = await db.query('SELECT id, code, name FROM ot_vendor WHERE status = 1 ORDER BY id');
    const result = [];
    for (const v of vendors) {
      const deliveryStats = await db.queryOne('SELECT COUNT(*) as total_items, COALESCE(SUM(CASE WHEN oi.status >= 3 THEN 1 ELSE 0 END), 0) as delivered_items FROM ot_order_item oi JOIN ot_outsource_order o ON oi.order_id = o.id WHERE o.vendor_id = ? AND o.status >= 1', [v.id]);
      const qualityStats = await db.queryOne('SELECT COALESCE(SUM(oi.received_qty), 0) as total_received, COALESCE(SUM(oi.qualified_qty), 0) as total_qualified FROM ot_order_item oi JOIN ot_outsource_order o ON oi.order_id = o.id WHERE o.vendor_id = ? AND o.status >= 1', [v.id]);
      const deliveryRate = deliveryStats.total_items > 0 ? +(Number(deliveryStats.delivered_items) / Number(deliveryStats.total_items) * 100).toFixed(2) : 0;
      const qualityRate = Number(qualityStats.total_received) > 0 ? +(Number(qualityStats.total_qualified) / Number(qualityStats.total_received) * 100).toFixed(2) : 0;
      result.push({ vendor_id: v.id, vendor_code: v.code, vendor_name: v.name, delivery_rate: deliveryRate, quality_rate: qualityRate, total_items: deliveryStats.total_items, total_received: +Number(qualityStats.total_received).toFixed(4) });
    }
    success(res, result);
  } catch (err) { next(err); }
});

module.exports = router;
