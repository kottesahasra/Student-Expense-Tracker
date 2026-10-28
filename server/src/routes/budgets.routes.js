const express = require('express');
const router = express.Router();
const budgetsController = require('../controllers/budgets.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createBudgetSchema, updateBudgetSchema } = require('../schemas/budget.schema');

router.use(authenticate);

router.get('/', budgetsController.getBudgets);
router.post('/', validate(createBudgetSchema), budgetsController.setBudget);
router.put('/:id', validate(updateBudgetSchema), budgetsController.updateBudget);
router.delete('/:id', budgetsController.deleteBudget);

module.exports = router;

