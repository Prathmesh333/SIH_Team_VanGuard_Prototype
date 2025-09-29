const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// POST /api/queue/book - Book darshan slot
router.post('/book', queueController.bookDarshanSlot);

// GET /api/queue/:templeId/status - Get current queue status for temple
router.get('/:templeId/status', queueController.getQueueStatus);

// GET /api/queue/token/:tokenNumber - Get booking details by token
router.get('/token/:tokenNumber', queueController.getBookingByToken);

// PUT /api/queue/token/:tokenNumber - Update queue position/status
router.put('/token/:tokenNumber', queueController.updateQueuePosition);

// DELETE /api/queue/token/:tokenNumber - Cancel booking
router.delete('/token/:tokenNumber', queueController.cancelBooking);

// POST /api/queue/:templeId/call-next - Call next person in queue
router.post('/:templeId/call-next', queueController.callNext);

// PUT /api/queue/entry/:entryId - Update queue entry
router.put('/entry/:entryId', queueController.updateQueueEntry);

// GET /api/queue/:templeId/entries - Get queue entries by temple
router.get('/:templeId/entries', queueController.getQueueByTemple);

// POST /api/queue/:templeId/add - Add person to queue (for manual management)
router.post('/:templeId/add', queueController.addToQueue);

module.exports = router;