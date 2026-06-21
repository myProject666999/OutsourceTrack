const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const { success, paginate, fail } = require('../utils/response');
const { cacheBalance, getCachedBalance, cacheVendorBalance, getCachedVendorBalance, deleteCachedVendorBalance } = require('../db/redis');
const debug = require('debug')('ot:balance');

async function computeOrderBalance(orderId) {
  const order = await db.queryOne('SELECT o.*, v.name as vendor_name FROM ot_outsource_order o LEFT JOIN ot_vendor v ON o.vendor_id = v.id WHERE o.id = ?', [orderId]);
  if (!order) return null;
  const items = await db.query('SELECT oi.*, m.code as product_code, m.name as product_name, m.unit as product_unit, rm.code as raw_code, rm.name as raw_name, rm.unit as raw_unit FROM ot_order_item oi LEFT JOIN ot_material m ON oi.material_id = m.id LEFT JOIN ot_material rm ON oi.raw_material_id = rm.id WHERE oi.order_id = ?', [orderId]);
  const balanceItems = items.map(item => {
    const issuedQty = Number(item.issued_qty);
    const qualifiedQty = Number(item.qualified_qty || 0);
    const ratio = Number(item.input_output_ratio);
    const expectedProductQty = item.input_output_ratio ? +(issuedQty * ratio).toFixed(4) : null;
    const inProcessRaw = +issuedQty.toFixed(4);
    const productDiff = expectedProductQty !== null ? +(expectedProductQty - qualifiedQty).toFixed(4) : null;
    const abnormalLoss = 0;
    let lossRate = 0;
    if (expectedProductQty && expectedProductQty > 0 && qualifiedQty >= 0) {
      lossRate = +((expectedProductQty - qualifiedQty) / expectedProductQty * 100).toFixed(2);
    }
    return {
      ...item,
      expected_product_qty: expectedProductQty,
      in_process_raw: inProcessRaw,
      product_diff: productDiff,
      loss_rate: lossRate,
      abnormal_loss: abnormalLoss
    };
  });
  const balance = { order, items: balanceItems, computed_at: new Date().toISOString() };
  return balance;
}

async function computeVendorBalance(vendorId) {
  const vendor = await db.queryOne('SELECT * FROM ot_vendor WHERE id = ?', [vendorId]);
  if (!vendor) return null;
  const orders = await db.query('SELECT o.*, (SELECT COALESCE(SUM(oi.issued_qty), 0) FROM ot_order_item oi WHERE oi.order_id = o.id) as total_issued, (SELECT COALESCE(SUM(oi.received_qty), 0) FROM ot_order_item oi WHERE oi.order_id = o.id) as total_received, (SELECT COALESCE(SUM(oi.qualified_qty), 0) FROM ot_order_item oi WHERE oi.order_id = o.id) as total_qualified FROM ot_outsource_order o WHERE o.vendor_id = ? AND o.status >= 1', [vendorId]);
  const summary = {
    total_orders: orders.length,
    total_issued: 0,
    total_received: 0,
    total_qualified: 0,
    in_process: 0,
    overdue_count: 0
  };
  const today = new Date().toISOString().slice(0, 10);
  for (const order of orders) {
    summary.total_issued += Number(order.total_issued);
    summary.total_received += Number(order.total_received);
    summary.total_qualified += Number(order.total_qualified);
    if (order.delivery_date < today && order.status < 3) {
      summary.overdue_count++;
    }
  }
  summary.in_process = +(summary.total_issued - summary.total_received).toFixed(4);
  summary.total_issued = +Number(summary.total_issued).toFixed(4);
  summary.total_received = +Number(summary.total_received).toFixed(4);
  summary.total_qualified = +Number(summary.total_qualified).toFixed(4);
  const result = { vendor, summary, orders, computed_at: new Date().toISOString() };
  return result;
}

router.get('/order/:orderId', async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const useCache = req.query.cache !== '0';
    if (useCache) {
      const cached = await getCachedBalance(orderId);
      if (cached) {
        debug('Return cached balance for order %d', orderId);
        return success(res, cached);
      }
    }
    const balance = await computeOrderBalance(orderId);
    if (!balance) return fail(res, '订单不存在', 404);
    await cacheBalance(orderId, balance);
    debug('Compute and cache balance for order %d', orderId);
    success(res, balance);
  } catch (err) { next(err); }
});

router.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;
    const useCache = req.query.cache !== '0';
    if (useCache) {
      const cached = await getCachedVendorBalance(vendorId);
      if (cached) {
        debug('Return cached vendor balance for vendor %d', vendorId);
        return success(res, cached);
      }
    }
    const balance = await computeVendorBalance(vendorId);
    if (!balance) return fail(res, '外协厂不存在', 404);
    await cacheVendorBalance(vendorId, balance);
    debug('Compute and cache vendor balance for vendor %d', vendorId);
    success(res, balance);
  } catch (err) { next(err); }
});

router.get('/vendor', async (req, res, next) => {
  try {
    const vendors = await db.query('SELECT id, code, name FROM ot_vendor WHERE status = 1 ORDER BY id');
    const result = [];
    for (const v of vendors) {
      const balance = await computeVendorBalance(v.id);
      if (balance) result.push(balance);
    }
    success(res, result);
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { order_id, vendor_id } = req.body;
    if (order_id) {
      const balance = await computeOrderBalance(order_id);
      if (balance) await cacheBalance(order_id, balance);
      debug('Refresh balance for order %d', order_id);
    }
    if (vendor_id) {
      const balance = await computeVendorBalance(vendor_id);
      if (balance) await cacheVendorBalance(vendor_id, balance);
      await deleteCachedVendorBalance(vendor_id);
      debug('Refresh balance for vendor %d', vendor_id);
    }
    success(res, null, '刷新成功');
  } catch (err) { next(err); }
});

module.exports = router;
