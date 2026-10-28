const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const transactionsRoutes = require('./transactions.routes');
const budgetsRoutes = require('./budgets.routes');
const goalsRoutes = require('./goals.routes');
const recurringRoutes = require('./recurring.routes');
const analyticsRoutes = require('./analytics.routes');
const categoriesRoutes = require('./categories.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'student-expense-tracker-api'
  });
});

// API resources
router.use('/auth', authRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/budgets', budgetsRoutes);
router.use('/goals', goalsRoutes);
router.use('/recurring', recurringRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/categories', categoriesRoutes);

module.exports = router;

