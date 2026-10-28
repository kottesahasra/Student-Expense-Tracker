const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return successResponse(res, result, 'User registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, 'Login successful');
    } catch (err) {
      return errorResponse(res, err.message || 'Invalid email or password', 401);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getProfile(req.supabase, req.user.id);
      return successResponse(res, profile, 'Profile retrieved');
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updated = await authService.updateProfile(req.supabase, req.user.id, req.body);
      return successResponse(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();

