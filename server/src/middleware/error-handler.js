const { errorResponse } = require('../utils/response');
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error at [${req.method}] ${req.originalUrl}:`, err.stack || err.message);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = err.message || 'An unexpected internal error occurred';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = errorHandler;

