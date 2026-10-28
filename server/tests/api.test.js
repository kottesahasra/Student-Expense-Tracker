/**
 * Comprehensive API Module & Schema Verification Tests
 */
const assert = require('assert');

console.log('Running API module verification tests...');

try {
  // 1. Auth Schema Validation
  const { registerSchema } = require('../src/schemas/auth.schema');
  const validData = registerSchema.safeParse({
    email: 'student@campus.edu',
    password: 'password123',
    fullName: 'Jane Student'
  });
  assert.strictEqual(validData.success, true, 'Valid auth data should pass');

  const invalidData = registerSchema.safeParse({
    email: 'not-an-email',
    password: '123'
  });
  assert.strictEqual(invalidData.success, false, 'Invalid auth data should fail');

  // 2. Budget Schema Validation
  const { createBudgetSchema } = require('../src/schemas/budget.schema');
  const validBudget = createBudgetSchema.safeParse({
    category_id: '550e8400-e29b-41d4-a716-446655440000',
    amount_limit: '250.50'
  });
  assert.strictEqual(validBudget.success, true, 'Budget with coerced amount and omitted month/year should pass');
  assert.strictEqual(validBudget.data.amount_limit, 250.50, 'Budget amount should be coerced to number');

  // 3. Transaction Schema Empty String Preprocessing
  const { createTransactionSchema, queryTransactionSchema } = require('../src/schemas/transaction.schema');
  const txWithEmptyStrings = createTransactionSchema.safeParse({
    title: 'Textbook Rental',
    amount: '45.00',
    type: 'expense',
    category_id: '',
    account_id: '',
    date: '2026-03-01'
  });
  assert.strictEqual(txWithEmptyStrings.success, true, 'Transaction with empty strings for UUID fields should pass');
  assert.strictEqual(txWithEmptyStrings.data.category_id, null, 'Empty string category_id should preprocess to null');
  assert.strictEqual(txWithEmptyStrings.data.account_id, null, 'Empty string account_id should preprocess to null');
  assert.strictEqual(txWithEmptyStrings.data.amount, 45, 'Transaction amount string should coerce to number');

  const queryWithEmptyParams = queryTransactionSchema.safeParse({
    type: '',
    categoryId: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  assert.strictEqual(queryWithEmptyParams.success, true, 'Empty query params should preprocess to undefined and pass');

  // 4. Recurring Frequency & Timezone-safe Due Date Helper
  const recurringService = require('../src/services/recurring.service');
  assert.strictEqual(
    recurringService.calculateNextDueDate('2026-01-01', 'daily'),
    '2026-01-02',
    'Daily calculation should increment 1 day'
  );
  assert.strictEqual(
    recurringService.calculateNextDueDate('2026-01-01', 'weekly'),
    '2026-01-08',
    'Weekly calculation should increment 7 days'
  );
  assert.strictEqual(
    recurringService.calculateNextDueDate('2026-01-01', 'biweekly'),
    '2026-01-15',
    'Biweekly calculation should increment 14 days'
  );
  assert.strictEqual(
    recurringService.calculateNextDueDate('2026-01-01', 'monthly'),
    '2026-02-01',
    'Monthly calculation should increment 1 month'
  );
  assert.strictEqual(
    recurringService.calculateNextDueDate('2026-01-01', 'semester'),
    '2026-07-01',
    'Semester calculation should increment 6 months'
  );
  assert.strictEqual(
    recurringService.calculateNextDueDate('2026-01-01', 'yearly'),
    '2027-01-01',
    'Yearly calculation should increment 1 year'
  );

  console.log('All backend smoke and schema tests passed successfully!');
} catch (err) {
  console.error('Test failed:', err);
  process.exit(1);
}
