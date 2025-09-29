const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

// POST /api/emergency/report - Report emergency incident
router.post('/report', emergencyController.reportEmergency);

// GET /api/emergency/active - Get active emergencies
router.get('/active', emergencyController.getActiveEmergencies);

// GET /api/emergency - Get all emergencies
router.get('/', emergencyController.getAllEmergencies);

// PUT /api/emergency/:id/update - Update emergency status
router.put('/:id/update', emergencyController.updateEmergencyStatus);

// GET /api/emergency/contacts - Get emergency contact numbers
router.get('/contacts', emergencyController.getEmergencyContacts);

// GET /api/emergency/contacts/:templeId - Get emergency contacts for specific temple
router.get('/contacts/:templeId', emergencyController.getEmergencyContacts);

// GET /api/emergency/temple/:templeId/history - Get emergency history for temple
router.get('/temple/:templeId/history', emergencyController.getEmergencyHistory);

// GET /api/emergency/stats - Get emergency statistics
router.get('/stats', emergencyController.getEmergencyStats);

module.exports = router;