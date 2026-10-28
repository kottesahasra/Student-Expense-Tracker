const transactionsService = require('../services/transactions.service');
const { successResponse } = require('../utils/response');

class TransactionsController {
  async getAll(req, res, next) {
    try {
      const data = await transactionsService.getTransactions(req.supabase, req.user.id, req.query);
      return successResponse(res, data, 'Transactions retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const transaction = await transactionsService.getTransactionById(req.supabase, req.user.id, req.params.id);
      return successResponse(res, transaction, 'Transaction retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const transaction = await transactionsService.createTransaction(req.supabase, req.user.id, req.body);
      return successResponse(res, transaction, 'Transaction created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const transaction = await transactionsService.updateTransaction(req.supabase, req.user.id, req.params.id, req.body);
      return successResponse(res, transaction, 'Transaction updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await transactionsService.deleteTransaction(req.supabase, req.user.id, req.params.id);
      return successResponse(res, result, 'Transaction deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TransactionsController();

