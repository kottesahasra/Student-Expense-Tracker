const { z } = require('zod');

const emptyToNull = val => (val === '' || val === undefined ? null : val);
const emptyToUndefined = val => (val === '' ? undefined : val);

const createTransactionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  type: z.enum(['income', 'expense'], { required_error: "Type must be 'income' or 'expense'" }),
  category_id: z.preprocess(emptyToNull, z.string().uuid('Invalid category ID').nullable().optional()),
  account_id: z.preprocess(emptyToNull, z.string().uuid('Invalid account ID').nullable().optional()),
  date: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional()),
  description: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  tags: z.array(z.string()).optional()
});

const updateTransactionSchema = createTransactionSchema.partial();

const queryTransactionSchema = z.object({
  startDate: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  endDate: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  type: z.preprocess(emptyToUndefined, z.enum(['income', 'expense']).optional()),
  categoryId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  search: z.preprocess(emptyToUndefined, z.string().optional()),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  queryTransactionSchema
};

