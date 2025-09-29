const db = require('../db/sqlite');

const generateTokenNumber = (templeId) => {
  const timestamp = Date.now().toString().slice(-6);
  const templeShort = templeId.toString().slice(-4);
  return `T${templeShort}${timestamp}`;
};

exports.bookDarshanSlot = async (req, res) => {
  try {
    const { templeId, pilgrimPhone, pilgrimName, scheduledTime, specialNeeds, groupSize } = req.body;

    // Validate temple
    const templeStmt = db.prepare('SELECT * FROM temples WHERE id = ?');
    const temple = templeStmt.get(templeId);

    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    if (temple.status !== 'normal') {
      return res.status(400).json({ error: 'Temple is currently not accepting bookings' });
    }

    // Check for existing active booking
    const existingStmt = db.prepare(`
      SELECT * FROM queue_entries
      WHERE templeId = ? AND visitorPhone = ? AND status IN ('waiting', 'called')
    `);
    const existingBooking = existingStmt.get(templeId, pilgrimPhone);

    if (existingBooking) {
      return res.status(400).json({
        error: 'You already have an active booking for this temple',
        existingToken: existingBooking.tokenNumber
      });
    }

    // Get current queue count
    const queueCountStmt = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE templeId = ? AND status IN ('waiting', 'called')
    `);
    const queueCount = queueCountStmt.get(templeId).count;

    const tokenNumber = generateTokenNumber(templeId);

    // Calculate estimated time (assuming 5 minutes per person/group)
    const estimatedWaitMinutes = queueCount * 5;

    const insertStmt = db.prepare(`
      INSERT INTO queue_entries
      (templeId, tokenNumber, visitorName, visitorPhone, estimatedWaitTime, priority)
      VALUES (?, ?, ?, ?, ?, 'normal')
    `);

    const result = insertStmt.run(
      templeId,
      tokenNumber,
      pilgrimName,
      pilgrimPhone,
      estimatedWaitMinutes
    );

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${templeId}`).emit('queue-update', {
        type: 'new_booking',
        templeId,
        queueLength: queueCount + 1,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      booking: {
        tokenNumber,
        queuePosition: queueCount + 1,
        estimatedWaitTime: estimatedWaitMinutes,
        temple: temple.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQueueStatus = async (req, res) => {
  try {
    const { templeId } = req.params;

    const templeStmt = db.prepare('SELECT * FROM temples WHERE id = ?');
    const temple = templeStmt.get(templeId);

    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    const activeQueueStmt = db.prepare(`
      SELECT * FROM queue_entries
      WHERE templeId = ? AND status IN ('waiting', 'called')
      ORDER BY tokenNumber ASC
    `);
    const activeQueue = activeQueueStmt.all(templeId);

    const currentServingStmt = db.prepare(`
      SELECT * FROM queue_entries
      WHERE templeId = ? AND status = 'called'
      LIMIT 1
    `);
    const currentServing = currentServingStmt.get(templeId);

    const waitingCountStmt = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE templeId = ? AND status = 'waiting'
    `);
    const waitingCount = waitingCountStmt.get(templeId).count;

    const avgWaitTime = waitingCount * 5; // 5 minutes per person

    res.json({
      temple: {
        id: temple.id,
        name: temple.name,
        status: temple.status
      },
      queue: {
        totalWaiting: waitingCount,
        currentlyServing: currentServing?.tokenNumber || null,
        estimatedWaitTime: avgWaitTime,
        nextFew: activeQueue.slice(0, 5).map((q, index) => ({
          tokenNumber: q.tokenNumber,
          position: index + 1,
          groupSize: 1
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingByToken = async (req, res) => {
  try {
    const { tokenNumber } = req.params;

    const bookingStmt = db.prepare(`
      SELECT qe.*, t.name as templeName, t.status as templeStatus
      FROM queue_entries qe
      JOIN temples t ON qe.templeId = t.id
      WHERE qe.tokenNumber = ?
    `);
    const booking = bookingStmt.get(tokenNumber);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get current position (number of people ahead)
    const peopleAheadStmt = db.prepare(`
      SELECT COUNT(*) as count FROM queue_entries
      WHERE templeId = ? AND status IN ('waiting', 'called') AND id < ?
    `);
    const peopleAhead = peopleAheadStmt.get(booking.templeId, booking.id).count;

    res.json({
      tokenNumber: booking.tokenNumber,
      temple: booking.templeName,
      templeStatus: booking.templeStatus,
      status: booking.status,
      currentPosition: peopleAhead + 1,
      estimatedWaitTime: peopleAhead * 5,
      bookingTime: booking.createdAt,
      groupSize: 1,
      specialNeeds: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateQueuePosition = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const { status } = req.body;

    const findStmt = db.prepare('SELECT * FROM queue_entries WHERE tokenNumber = ?');
    const booking = findStmt.get(tokenNumber);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updateStmt = db.prepare(`
      UPDATE queue_entries
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE tokenNumber = ?
    `);

    updateStmt.run(status, tokenNumber);

    // Get updated booking
    const updatedBooking = findStmt.get(tokenNumber);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${booking.templeId}`).emit('queue-update', {
        type: 'status_change',
        tokenNumber,
        status,
        timestamp: new Date()
      });
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { tokenNumber } = req.params;

    const findStmt = db.prepare('SELECT * FROM queue_entries WHERE tokenNumber = ?');
    const booking = findStmt.get(tokenNumber);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!['waiting', 'called'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    const updateStmt = db.prepare(`
      UPDATE queue_entries
      SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP
      WHERE tokenNumber = ?
    `);

    updateStmt.run(tokenNumber);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${booking.templeId}`).emit('queue-update', {
        type: 'cancellation',
        tokenNumber,
        timestamp: new Date()
      });
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Additional methods to match the original API structure
exports.getQueueByTemple = async (req, res) => {
  try {
    const { templeId } = req.params;
    const { status = 'waiting' } = req.query;

    const stmt = db.prepare(`
      SELECT qe.*, t.name as templeName
      FROM queue_entries qe
      JOIN temples t ON qe.templeId = t.id
      WHERE qe.templeId = ? AND qe.status = ?
      ORDER BY qe.tokenNumber ASC
    `);

    const queueEntries = stmt.all(templeId, status);

    const formattedEntries = queueEntries.map(entry => ({
      _id: entry.id,
      templeId: entry.templeId,
      tokenNumber: entry.tokenNumber,
      visitorName: entry.visitorName,
      visitorPhone: entry.visitorPhone,
      estimatedWaitTime: entry.estimatedWaitTime,
      status: entry.status,
      priority: entry.priority,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      temple: { name: entry.templeName }
    }));

    res.json(formattedEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addToQueue = async (req, res) => {
  try {
    const { templeId } = req.params;
    const { visitorName, visitorPhone, priority = 'normal' } = req.body;

    // Get next token number
    const maxTokenStmt = db.prepare(`
      SELECT MAX(tokenNumber) as maxToken
      FROM queue_entries
      WHERE templeId = ? AND DATE(createdAt) = DATE('now')
    `);
    const result = maxTokenStmt.get(templeId);
    const nextToken = (result.maxToken || 0) + 1;

    // Calculate estimated wait time
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM queue_entries
      WHERE templeId = ? AND status = 'waiting'
    `);
    const queueCount = countStmt.get(templeId);
    const estimatedWaitTime = queueCount.count * 10; // 10 minutes per person

    const insertStmt = db.prepare(`
      INSERT INTO queue_entries
      (templeId, tokenNumber, visitorName, visitorPhone, estimatedWaitTime, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertResult = insertStmt.run(
      templeId,
      nextToken,
      visitorName,
      visitorPhone,
      estimatedWaitTime,
      priority
    );

    const getEntryStmt = db.prepare('SELECT * FROM queue_entries WHERE id = ?');
    const newEntry = getEntryStmt.get(insertResult.lastInsertRowid);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${templeId}`).emit('queue-update', {
        action: 'add',
        entry: newEntry,
        queueLength: queueCount.count + 1
      });
    }

    res.status(201).json({
      _id: newEntry.id,
      templeId: newEntry.templeId,
      tokenNumber: newEntry.tokenNumber,
      visitorName: newEntry.visitorName,
      visitorPhone: newEntry.visitorPhone,
      estimatedWaitTime: newEntry.estimatedWaitTime,
      status: newEntry.status,
      priority: newEntry.priority,
      createdAt: newEntry.createdAt,
      updatedAt: newEntry.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Call next person in queue
exports.callNext = async (req, res) => {
  try {
    const { templeId } = req.params;

    // Get next waiting person
    const nextPersonStmt = db.prepare(`
      SELECT * FROM queue_entries
      WHERE templeId = ? AND status = 'waiting'
      ORDER BY id ASC
      LIMIT 1
    `);
    const nextPerson = nextPersonStmt.get(templeId);

    if (!nextPerson) {
      return res.status(404).json({ error: 'No one waiting in queue' });
    }

    // Update status to called
    const updateStmt = db.prepare(`
      UPDATE queue_entries
      SET status = 'called', updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(nextPerson.id);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${templeId}`).emit('queue-call', {
        tokenNumber: nextPerson.tokenNumber,
        name: nextPerson.visitorName,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      calledToken: nextPerson.tokenNumber,
      name: nextPerson.visitorName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update queue entry
exports.updateQueueEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const { status } = req.body;

    const findStmt = db.prepare('SELECT * FROM queue_entries WHERE id = ?');
    const entry = findStmt.get(entryId);

    if (!entry) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    const updateStmt = db.prepare(`
      UPDATE queue_entries
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(status, entryId);

    // Get updated entry
    const updatedEntry = findStmt.get(entryId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${entry.templeId}`).emit('queue-update', {
        type: 'status_change',
        entryId,
        status,
        timestamp: new Date()
      });
    }

    res.json({ success: true, entry: updatedEntry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get queue entries by temple
exports.getQueueByTemple = async (req, res) => {
  try {
    const { templeId } = req.params;
    const { status = 'waiting', limit = 50 } = req.query;

    let query = `
      SELECT qe.*, t.name as templeName
      FROM queue_entries qe
      JOIN temples t ON qe.templeId = t.id
      WHERE qe.templeId = ?
    `;
    let params = [templeId];

    if (status !== 'all') {
      query += ' AND qe.status = ?';
      params.push(status);
    }

    query += ' ORDER BY qe.id ASC LIMIT ?';
    params.push(parseInt(limit));

    const stmt = db.prepare(query);
    const entries = stmt.all(...params);

    const formattedEntries = entries.map((entry, index) => ({
      _id: entry.id,
      templeId: entry.templeId,
      tokenNumber: entry.tokenNumber,
      visitorName: entry.visitorName,
      visitorPhone: entry.visitorPhone,
      groupSize: entry.groupSize || 1,
      status: entry.status,
      priority: entry.priority,
      estimatedWaitTime: (index + 1) * 5, // 5 minutes per person ahead
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      templeName: entry.templeName
    }));

    res.json(formattedEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add person to queue manually
exports.addToQueue = async (req, res) => {
  try {
    const { templeId } = req.params;
    const { visitorName, visitorPhone, groupSize = 1, priority = 'normal' } = req.body;

    if (!visitorName || !visitorPhone) {
      return res.status(400).json({ error: 'Visitor name and phone are required' });
    }

    // Generate token
    const tokenNumber = `T${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Get current queue count
    const queueCountStmt = db.prepare('SELECT COUNT(*) as count FROM queue_entries WHERE templeId = ? AND status IN ("waiting", "called")');
    const queueCount = queueCountStmt.get(templeId);
    const estimatedWaitTime = queueCount.count * 5; // 5 minutes per person

    // Insert new queue entry
    const insertStmt = db.prepare(`
      INSERT INTO queue_entries (templeId, tokenNumber, visitorName, visitorPhone, groupSize, status, priority, estimatedWaitTime)
      VALUES (?, ?, ?, ?, ?, 'waiting', ?, ?)
    `);

    const result = insertStmt.run(templeId, tokenNumber, visitorName, visitorPhone, groupSize, priority, estimatedWaitTime);

    // Get the created entry
    const getStmt = db.prepare('SELECT * FROM queue_entries WHERE id = ?');
    const newEntry = getStmt.get(result.lastInsertRowid);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${templeId}`).emit('queue-update', {
        type: 'new_entry',
        entry: newEntry,
        queueLength: queueCount.count + 1
      });
    }

    res.status(201).json({
      success: true,
      entry: {
        _id: newEntry.id,
        tokenNumber: newEntry.tokenNumber,
        visitorName: newEntry.visitorName,
        status: newEntry.status,
        estimatedWaitTime: newEntry.estimatedWaitTime,
        queuePosition: queueCount.count + 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};