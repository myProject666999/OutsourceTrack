const Redis = require('ioredis');
const config = require('../config');
const debug = require('debug')('ot:redis');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
  keyPrefix: config.redis.keyPrefix,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    debug('Redis retry connection, attempt=%d, delay=%dms', times, delay);
    return delay;
  }
});

redis.on('connect', () => debug('Redis connected'));
redis.on('error', (err) => debug('Redis error: %s', err.message));
redis.on('ready', () => debug('Redis ready'));

const CACHE_TTL = 3600;
const BALANCE_KEY_PREFIX = 'balance:';

async function cacheBalance(orderId, balanceData) {
  const key = BALANCE_KEY_PREFIX + orderId;
  debug('Cache balance: key=%s', key);
  await redis.set(key, JSON.stringify(balanceData), 'EX', CACHE_TTL);
}

async function getCachedBalance(orderId) {
  const key = BALANCE_KEY_PREFIX + orderId;
  const data = await redis.get(key);
  if (data) {
    debug('Cache hit: key=%s', key);
    return JSON.parse(data);
  }
  debug('Cache miss: key=%s', key);
  return null;
}

async function deleteCachedBalance(orderId) {
  const key = BALANCE_KEY_PREFIX + orderId;
  debug('Cache delete: key=%s', key);
  await redis.del(key);
}

async function cacheVendorBalance(vendorId, balanceData) {
  const key = 'vendor_balance:' + vendorId;
  debug('Cache vendor balance: key=%s', key);
  await redis.set(key, JSON.stringify(balanceData), 'EX', CACHE_TTL);
}

async function getCachedVendorBalance(vendorId) {
  const key = 'vendor_balance:' + vendorId;
  const data = await redis.get(key);
  if (data) {
    debug('Cache hit: key=%s', key);
    return JSON.parse(data);
  }
  debug('Cache miss: key=%s', key);
  return null;
}

async function deleteCachedVendorBalance(vendorId) {
  const key = 'vendor_balance:' + vendorId;
  await redis.del(key);
}

module.exports = {
  redis,
  cacheBalance,
  getCachedBalance,
  deleteCachedBalance,
  cacheVendorBalance,
  getCachedVendorBalance,
  deleteCachedVendorBalance
};
