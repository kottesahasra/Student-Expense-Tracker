const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', categoriesController.getAll);
router.post('/', categoriesController.create);

module.exports = router;

