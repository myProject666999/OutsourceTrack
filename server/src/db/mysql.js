const mysql = require('mysql2/promise');
const config = require('../config');
const debug = require('debug')('ot:db');

const pool = mysql.createPool(config.mysql);

pool.on('connection', (connection) => {
  debug('MySQL pool new connection: threadId=%d', connection.threadId);
});

pool.on('release', (connection) => {
  debug('MySQL pool release: threadId=%d', connection.threadId);
});

async function query(sql, params) {
  debug('SQL: %s | Params: %o', sql, params);
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function insert(sql, params) {
  debug('INSERT SQL: %s | Params: %o', sql, params);
  const [result] = await pool.execute(sql, params);
  return result;
}

async function update(sql, params) {
  debug('UPDATE SQL: %s | Params: %o', sql, params);
  const [result] = await pool.execute(sql, params);
  return result;
}

async function deleteRows(sql, params) {
  debug('DELETE SQL: %s | Params: %o', sql, params);
  const [result] = await pool.execute(sql, params);
  return result;
}

async function transaction(fn) {
  const conn = await pool.getConnection();
  debug('Transaction begin');
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    debug('Transaction commit');
    return result;
  } catch (err) {
    await conn.rollback();
    debug('Transaction rollback: %s', err.message);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, queryOne, insert, update, deleteRows, transaction };
