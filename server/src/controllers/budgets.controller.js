const budgetsService = require('../services/budgets.service');
const { successResponse } = require('../utils/response');

class BudgetsController {
  async getBudgets(req, res, next) {
    try {
      const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
      const data = await budgetsService.getBudgets(req.supabase, req.user.id, month, year);
      return successResponse(res, data, 'Budgets retrieved');
    } catch (err) {
      next(err);
    }
  }

  async setBudget(req, res, next) {
    try {
      const budget = await budgetsService.setBudget(req.supabase, req.user.id, req.body);
      return successResponse(res, budget, 'Budget configured successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateBudget(req, res, next) {
    try {
      const budget = await budgetsService.updateBudget(req.supabase, req.user.id, req.params.id, req.body.amount_limit);
      return successResponse(res, budget, 'Budget updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteBudget(req, res, next) {
    try {
      const result = await budgetsService.deleteBudget(req.supabase, req.user.id, req.params.id);
      return successResponse(res, result, 'Budget removed successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BudgetsController();

