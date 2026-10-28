const analyticsService = require('../services/analytics.service');
const { successResponse } = require('../utils/response');

class AnalyticsController {
  async getSummary(req, res, next) {
    try {
      const { month, year } = req.query;
      const data = await analyticsService.getDashboardSummary(req.supabase, req.user.id, month, year);
      return successResponse(res, data, 'Analytics summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getTrends(req, res, next) {
    try {
      const months = req.query.months ? parseInt(req.query.months, 10) : 6;
      const data = await analyticsService.getMonthlyTrend(req.supabase, req.user.id, months);
      return successResponse(res, data, 'Monthly spending trends retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();

