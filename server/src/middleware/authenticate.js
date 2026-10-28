const { supabase, getScopedClient } = require('../config/supabase');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access denied. No authorization token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Access denied. Malformed authorization token.', 401);
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return errorResponse(res, 'Invalid or expired session. Please log in again.', 401);
    }

    // Attach user and scoped Supabase client to request
    req.user = user;
    req.token = token;
    req.supabase = getScopedClient(token);

    next();
  } catch (err) {
    return errorResponse(res, 'Authentication verification failed: ' + err.message, 401);
  }
};

module.exports = authenticate;

