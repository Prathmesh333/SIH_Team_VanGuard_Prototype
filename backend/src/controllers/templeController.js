const db = require('../db/sqlite');

exports.getAllTemples = async (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM temples WHERE status != 'maintenance'");
    const temples = stmt.all();

    // Convert to match expected format
    const formattedTemples = temples.map(temple => ({
      _id: temple.id,
      id: temple.id,
      name: temple.name,
      location: temple.location,
      capacity: temple.capacity,
      currentOccupancy: temple.currentOccupancy,
      status: temple.status,
      coordinates: temple.coordinates,
      createdAt: temple.createdAt,
      updatedAt: temple.updatedAt
    }));

    res.json(formattedTemples);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTempleById = async (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM temples WHERE id = ?");
    const temple = stmt.get(req.params.id);

    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    const formattedTemple = {
      _id: temple.id,
      id: temple.id,
      name: temple.name,
      location: temple.location,
      capacity: temple.capacity,
      currentOccupancy: temple.currentOccupancy,
      status: temple.status,
      coordinates: temple.coordinates,
      createdAt: temple.createdAt,
      updatedAt: temple.updatedAt
    };

    res.json(formattedTemple);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTempleCrowdData = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;

    const templeStmt = db.prepare("SELECT * FROM temples WHERE id = ?");
    const temple = templeStmt.get(id);

    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    // Mock crowd analytics data for now
    const mockCrowdData = {
      templeId: id,
      crowdCount: temple.currentOccupancy,
      alertLevel: temple.currentOccupancy > temple.capacity * 0.8 ? 'high' :
                 temple.currentOccupancy > temple.capacity * 0.6 ? 'medium' : 'low',
      timestamp: new Date(),
      zones: [
        { name: 'Entry Gate', occupancy: Math.floor(temple.currentOccupancy * 0.3) },
        { name: 'Main Hall', occupancy: Math.floor(temple.currentOccupancy * 0.5) },
        { name: 'Exit Area', occupancy: Math.floor(temple.currentOccupancy * 0.2) }
      ]
    };

    res.json({
      temple: {
        id: temple.id,
        name: temple.name,
        capacity: temple.capacity,
        currentOccupancy: temple.currentOccupancy,
        status: temple.status
      },
      currentData: mockCrowdData,
      historicalData: [mockCrowdData], // Mock historical data
      occupancyPercentage: Math.round((temple.currentOccupancy / temple.capacity) * 100),
      alertLevel: mockCrowdData.alertLevel
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTempleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentOccupancy } = req.body;

    const updateStmt = db.prepare(`
      UPDATE temples
      SET status = ?, currentOccupancy = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = updateStmt.run(status, currentOccupancy, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    const templeStmt = db.prepare("SELECT * FROM temples WHERE id = ?");
    const temple = templeStmt.get(id);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${id}`).emit('temple-status-update', {
        templeId: id,
        status,
        currentOccupancy,
        timestamp: new Date()
      });
    }

    res.json({
      _id: temple.id,
      id: temple.id,
      name: temple.name,
      location: temple.location,
      capacity: temple.capacity,
      currentOccupancy: temple.currentOccupancy,
      status: temple.status,
      coordinates: temple.coordinates,
      createdAt: temple.createdAt,
      updatedAt: temple.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCrowdAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { alertLevel, message, zones } = req.body;

    const templeStmt = db.prepare("SELECT * FROM temples WHERE id = ?");
    const temple = templeStmt.get(id);

    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    // Emit real-time alert
    const io = req.app.get('io');
    const alertData = {
      templeId: id,
      templeName: temple.name,
      alertLevel,
      message,
      zones,
      timestamp: new Date()
    };

    if (io) {
      io.to(`temple-${id}`).emit('crowd-alert', alertData);
      io.emit('global-alert', alertData); // For admin dashboard
    }

    res.json({ success: true, alert: alertData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTemplesByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius in km

    // For SQLite, we'll do a simple filter (without geospatial queries for simplicity)
    const stmt = db.prepare("SELECT * FROM temples WHERE status != 'maintenance'");
    const temples = stmt.all();

    const formattedTemples = temples.map(temple => ({
      _id: temple.id,
      id: temple.id,
      name: temple.name,
      location: temple.location,
      capacity: temple.capacity,
      currentOccupancy: temple.currentOccupancy,
      status: temple.status,
      coordinates: temple.coordinates,
      createdAt: temple.createdAt,
      updatedAt: temple.updatedAt
    }));

    res.json(formattedTemples);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};