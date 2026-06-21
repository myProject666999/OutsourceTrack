module.exports = {
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'outsource_track',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 0,
    keyPrefix: 'ot:'
  },
  server: {
    port: 3001,
    apiPrefix: '/api'
  },
  alert: {
    overdueDays: 0,
    abnormalLossThreshold: 0.05
  }
};
