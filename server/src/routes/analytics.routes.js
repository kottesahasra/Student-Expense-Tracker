const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/summary', analyticsController.getSummary);
router.get('/trends', analyticsController.getTrends);

module.exports = router;

