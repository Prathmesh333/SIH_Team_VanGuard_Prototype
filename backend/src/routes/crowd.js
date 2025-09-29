const express = require('express');
const router = express.Router();
const crowdController = require('../controllers/crowdController');

// GET /api/crowd/data - Get real-time crowd monitoring data for all temples
router.get('/data', crowdController.getCrowdData);

// GET /api/crowd/alerts - Get active crowd safety alerts
router.get('/alerts', crowdController.getCrowdAlerts);

// GET /api/crowd/stats - Get crowd monitoring statistics
router.get('/stats', crowdController.getCrowdStats);

// GET /api/crowd/temple/:templeId - Get crowd data for specific temple
router.get('/temple/:templeId', crowdController.getTempleCrowdData);

module.exports = router;