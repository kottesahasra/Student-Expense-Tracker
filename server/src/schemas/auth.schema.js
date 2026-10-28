const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  currency: z.string().length(3, 'Currency must be 3-letter code (e.g. USD, EUR)').optional()
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  currency: z.string().length(3).optional(),
  monthlyBudgetTarget: z.number().min(0).optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema
};

