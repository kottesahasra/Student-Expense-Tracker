const goalsService = require('../services/goals.service');
const { successResponse } = require('../utils/response');

class GoalsController {
  async getAll(req, res, next) {
    try {
      const goals = await goalsService.getGoals(req.supabase, req.user.id);
      return successResponse(res, goals, 'Savings goals retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const goal = await goalsService.createGoal(req.supabase, req.user.id, req.body);
      return successResponse(res, goal, 'Savings goal created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const goal = await goalsService.updateGoal(req.supabase, req.user.id, req.params.id, req.body);
      return successResponse(res, goal, 'Savings goal updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async contribute(req, res, next) {
    try {
      const goal = await goalsService.contributeToGoal(req.supabase, req.user.id, req.params.id, req.body.amount);
      return successResponse(res, goal, 'Contribution added successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await goalsService.deleteGoal(req.supabase, req.user.id, req.params.id);
      return successResponse(res, result, 'Savings goal deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GoalsController();

