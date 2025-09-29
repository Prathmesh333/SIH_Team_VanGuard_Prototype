const express = require('express');
const router = express.Router();
const templeController = require('../controllers/templeController');

// GET /api/temples - Get all temples
router.get('/', templeController.getAllTemples);

// GET /api/temples/nearby - Get temples by location
router.get('/nearby', templeController.getTemplesByLocation);

// GET /api/temples/:id - Get temple by ID
router.get('/:id', templeController.getTempleById);

// GET /api/temples/:id/crowd - Get real-time crowd data for temple
router.get('/:id/crowd', templeController.getTempleCrowdData);

// PUT /api/temples/:id/status - Update temple status
router.put('/:id/status', templeController.updateTempleStatus);

// POST /api/temples/:id/alert - Create crowd alert
router.post('/:id/alert', templeController.createCrowdAlert);

module.exports = router;