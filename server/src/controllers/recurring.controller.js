const recurringService = require('../services/recurring.service');
const { successResponse } = require('../utils/response');

class RecurringController {
  async getAll(req, res, next) {
    try {
      const items = await recurringService.getRecurring(req.supabase, req.user.id);
      return successResponse(res, items, 'Recurring transactions retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const item = await recurringService.createRecurring(req.supabase, req.user.id, req.body);
      return successResponse(res, item, 'Recurring transaction created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const item = await recurringService.updateRecurring(req.supabase, req.user.id, req.params.id, req.body);
      return successResponse(res, item, 'Recurring transaction updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await recurringService.deleteRecurring(req.supabase, req.user.id, req.params.id);
      return successResponse(res, result, 'Recurring transaction deleted successfully');
    } catch (err) {
      next(err);
    }
  }

  async process(req, res, next) {
    try {
      const result = await recurringService.processRecurring(req.supabase, req.user.id, req.params.id);
      return successResponse(res, result, 'Recurring item processed into transaction');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RecurringController();

