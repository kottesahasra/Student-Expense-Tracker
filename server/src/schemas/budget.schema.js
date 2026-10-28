const { z } = require('zod');

const createBudgetSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  amount_limit: z.coerce.number().positive('Budget amount limit must be positive'),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).optional()
});

const updateBudgetSchema = z.object({
  amount_limit: z.coerce.number().positive('Budget amount limit must be positive')
});

module.exports = {
  createBudgetSchema,
  updateBudgetSchema
};

