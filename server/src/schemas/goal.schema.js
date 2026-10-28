const { z } = require('zod');

const emptyToNull = val => (val === '' || val === undefined ? null : val);

const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  target_amount: z.coerce.number().positive('Target amount must be positive'),
  current_amount: z.coerce.number().min(0).default(0),
  target_date: z.preprocess(emptyToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional().nullable()),
  category: z.string().max(60).optional()
});

const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional()
});

const contributeGoalSchema = z.object({
  amount: z.coerce.number().positive('Contribution amount must be greater than zero')
});

module.exports = {
  createGoalSchema,
  updateGoalSchema,
  contributeGoalSchema
};

