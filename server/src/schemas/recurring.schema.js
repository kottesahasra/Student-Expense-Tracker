const { z } = require('zod');

const emptyToNull = val => (val === '' || val === undefined ? null : val);

const createRecurringSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category_id: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  account_id: z.preprocess(emptyToNull, z.string().uuid().optional().nullable()),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'semester', 'yearly']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const updateRecurringSchema = createRecurringSchema.partial().extend({
  is_active: z.boolean().optional()
});

module.exports = {
  createRecurringSchema,
  updateRecurringSchema
};

