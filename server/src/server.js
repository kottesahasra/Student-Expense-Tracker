const app = require('./app');
const env = require('./config/env');
const { logger } = require('./utils/logger');

const server = app.listen(env.PORT, () => {
  logger.info(`Student Expense Tracker Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`API Base URL: http://localhost:${env.PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise);
  logger.error('Reason:', reason);
});

