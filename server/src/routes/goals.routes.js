const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goals.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { createGoalSchema, updateGoalSchema, contributeGoalSchema } = require('../schemas/goal.schema');

router.use(authenticate);

router.get('/', goalsController.getAll);
router.post('/', validate(createGoalSchema), goalsController.create);
router.put('/:id', validate(updateGoalSchema), goalsController.update);
router.post('/:id/contribute', validate(contributeGoalSchema), goalsController.contribute);
router.delete('/:id', goalsController.delete);

module.exports = router;

