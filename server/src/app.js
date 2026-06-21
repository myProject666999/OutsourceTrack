const debug = require('debug')('ot:app');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

const vendorRouter = require('./routes/vendor');
const materialRouter = require('./routes/material');
const warehouseRouter = require('./routes/warehouse');
const ratioRouter = require('./routes/ratio');
const orderRouter = require('./routes/order');
const issueRouter = require('./routes/issue');
const receiptRouter = require('./routes/receipt');
const balanceRouter = require('./routes/balance');
const alertRouter = require('./routes/alert');
const statsRouter = require('./routes/stats');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(config.server.apiPrefix + '/vendors', vendorRouter);
app.use(config.server.apiPrefix + '/materials', materialRouter);
app.use(config.server.apiPrefix + '/warehouses', warehouseRouter);
app.use(config.server.apiPrefix + '/ratios', ratioRouter);
app.use(config.server.apiPrefix + '/orders', orderRouter);
app.use(config.server.apiPrefix + '/issues', issueRouter);
app.use(config.server.apiPrefix + '/receipts', receiptRouter);
app.use(config.server.apiPrefix + '/balances', balanceRouter);
app.use(config.server.apiPrefix + '/alerts', alertRouter);
app.use(config.server.apiPrefix + '/stats', statsRouter);

app.use((err, req, res, _next) => {
  debug('Unhandled error: %s', err.message);
  console.error(err.stack);
  res.status(500).json({ code: -1, message: err.message, data: null });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  debug('Server started on port %d', PORT);
  console.log('OutsourceTrack server running at http://localhost:%d', PORT);
  console.log('API prefix: %s', config.server.apiPrefix);
  console.log('Debug enabled, use DEBUG=ot:* to see logs');
});

module.exports = app;
