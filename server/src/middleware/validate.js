const { errorResponse } = require('../utils/response');

/**
 * Middleware factory to validate request body, query, or params with a Zod schema.
 */
const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return errorResponse(res, 'Validation failed', 422, formattedErrors);
      }
      return errorResponse(res, 'Validation error: ' + error.message, 400);
    }
  };
};

module.exports = validate;

