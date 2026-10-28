const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurring.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createRecurringSchema, updateRecurringSchema } = require('../schemas/recurring.schema');

router.use(authenticate);

router.get('/', recurringController.getAll);
router.post('/', validate(createRecurringSchema), recurringController.create);
router.put('/:id', validate(updateRecurringSchema), recurringController.update);
router.delete('/:id', recurringController.delete);
router.post('/:id/process', recurringController.process);

module.exports = router;

