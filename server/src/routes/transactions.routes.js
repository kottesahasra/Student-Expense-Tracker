const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  createTransactionSchema,
  updateTransactionSchema,
  queryTransactionSchema
} = require('../schemas/transaction.schema');

// All transaction routes require authentication
router.use(authenticate);

router.get('/', validate(queryTransactionSchema, 'query'), transactionsController.getAll);
router.get('/:id', transactionsController.getById);
router.post('/', validate(createTransactionSchema), transactionsController.create);
router.put('/:id', validate(updateTransactionSchema), transactionsController.update);
router.delete('/:id', transactionsController.delete);

module.exports = router;

