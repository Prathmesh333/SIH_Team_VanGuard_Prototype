const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics/predictions - Get crowd predictions
router.get('/predictions', analyticsController.getCrowdPredictions);

// GET /api/analytics/temple/:templeId/history - Get historical data for temple
router.get('/temple/:templeId/history', analyticsController.getHistoricalData);

// GET /api/analytics/daily-report - Generate daily report
router.get('/daily-report', analyticsController.generateDailyReport);

module.exports = router;