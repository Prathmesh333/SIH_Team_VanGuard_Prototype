const db = require('../db/sqlite');

exports.getActiveEmergencies = async (req, res) => {
  try {
    const { templeId } = req.query;

    let query = "SELECT e.*, t.name as templeName FROM emergencies e JOIN temples t ON e.templeId = t.id WHERE e.status != 'resolved'";
    const params = [];

    if (templeId) {
      query += ' AND e.templeId = ?';
      params.push(templeId);
    }

    query += ' ORDER BY e.createdAt DESC';

    const stmt = db.prepare(query);
    const emergencies = stmt.all(...params);

    const formattedEmergencies = emergencies.map(emergency => ({
      _id: emergency.id,
      templeId: emergency.templeId,
      type: emergency.type,
      severity: emergency.severity,
      description: emergency.description,
      status: emergency.status,
      reportedBy: {
        name: emergency.reportedBy,
        phone: emergency.reporterPhone
      },
      createdAt: emergency.createdAt,
      updatedAt: emergency.updatedAt,
      temple: { name: emergency.templeName }
    }));

    res.json({
      emergencies: formattedEmergencies,
      count: formattedEmergencies.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllEmergencies = async (req, res) => {
  try {
    const { status, severity, templeId } = req.query;

    let query = 'SELECT e.*, t.name as templeName FROM emergencies e JOIN temples t ON e.templeId = t.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (severity) {
      query += ' AND e.severity = ?';
      params.push(severity);
    }

    if (templeId) {
      query += ' AND e.templeId = ?';
      params.push(templeId);
    }

    query += ' ORDER BY e.createdAt DESC';

    const stmt = db.prepare(query);
    const emergencies = stmt.all(...params);

    const formattedEmergencies = emergencies.map(emergency => ({
      _id: emergency.id,
      templeId: emergency.templeId,
      type: emergency.type,
      severity: emergency.severity,
      description: emergency.description,
      status: emergency.status,
      reportedBy: {
        name: emergency.reportedBy,
        phone: emergency.reporterPhone
      },
      createdAt: emergency.createdAt,
      updatedAt: emergency.updatedAt,
      temple: { name: emergency.templeName }
    }));

    res.json(formattedEmergencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reportEmergency = async (req, res) => {
  try {
    const { templeId, type, severity, description, location, reportedBy } = req.body;

    // Validate temple
    const templeStmt = db.prepare('SELECT * FROM temples WHERE id = ?');
    const temple = templeStmt.get(templeId);

    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO emergencies (templeId, type, severity, description, reportedBy, reporterPhone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      templeId,
      type,
      severity,
      description,
      reportedBy?.name || 'Anonymous',
      reportedBy?.phone || ''
    );

    const getEmergencyStmt = db.prepare(`
      SELECT e.*, t.name as templeName
      FROM emergencies e
      JOIN temples t ON e.templeId = t.id
      WHERE e.id = ?
    `);
    const newEmergency = getEmergencyStmt.get(result.lastInsertRowid);

    // Emit real-time alert
    const io = req.app.get('io');
    if (io) {
      const alertData = {
        emergencyId: newEmergency.id,
        templeId: newEmergency.templeId,
        templeName: newEmergency.templeName,
        type: newEmergency.type,
        severity: newEmergency.severity,
        description: newEmergency.description,
        timestamp: new Date()
      };

      io.to(`temple-${templeId}`).emit('emergency-alert', alertData);
      io.emit('global-emergency', alertData);
    }

    res.status(201).json({
      _id: newEmergency.id,
      templeId: newEmergency.templeId,
      type: newEmergency.type,
      severity: newEmergency.severity,
      description: newEmergency.description,
      status: newEmergency.status,
      reportedBy: {
        name: newEmergency.reportedBy,
        phone: newEmergency.reporterPhone
      },
      createdAt: newEmergency.createdAt,
      updatedAt: newEmergency.updatedAt,
      temple: { name: newEmergency.templeName }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateStmt = db.prepare(`
      UPDATE emergencies
      SET status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = updateStmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    const getEmergencyStmt = db.prepare(`
      SELECT e.*, t.name as templeName
      FROM emergencies e
      JOIN temples t ON e.templeId = t.id
      WHERE e.id = ?
    `);
    const updatedEmergency = getEmergencyStmt.get(id);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`temple-${updatedEmergency.templeId}`).emit('emergency-status-update', {
        emergencyId: id,
        status,
        timestamp: new Date()
      });
    }

    res.json({
      _id: updatedEmergency.id,
      templeId: updatedEmergency.templeId,
      type: updatedEmergency.type,
      severity: updatedEmergency.severity,
      description: updatedEmergency.description,
      status: updatedEmergency.status,
      reportedBy: {
        name: updatedEmergency.reportedBy,
        phone: updatedEmergency.reporterPhone
      },
      createdAt: updatedEmergency.createdAt,
      updatedAt: updatedEmergency.updatedAt,
      temple: { name: updatedEmergency.templeName }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmergencyContacts = async (req, res) => {
  try {
    // Mock emergency contacts data
    const contacts = {
      emergencyContacts: {
        medical: [
          { name: 'Government Hospital Veraval', phone: '+91-2876-220101', available24x7: true },
          { name: 'District Medical Officer', phone: '+91-2876-220102', available24x7: false },
          { name: 'Ambulance Service (108)', phone: '108', available24x7: true },
          { name: 'Private Medical Emergency', phone: '+91-9824567890', available24x7: true }
        ],
        security: [
          { name: 'Temple Security Control Room', phone: '+91-2876-220110', available24x7: true },
          { name: 'Police Station Veraval', phone: '+91-2876-220100', available24x7: true },
          { name: 'Gujarat Police Helpline', phone: '100', available24x7: true },
          { name: 'Tourist Police', phone: '+91-2876-220115', available24x7: true }
        ],
        fire: [
          { name: 'Fire Department Veraval', phone: '+91-2876-220105', available24x7: true },
          { name: 'Fire Emergency', phone: '101', available24x7: true },
          { name: 'Disaster Management', phone: '+91-2876-220107', available24x7: true }
        ],
        administrative: [
          { name: 'Temple Trust Office', phone: '+91-2876-220120', available24x7: false },
          { name: 'District Collector Gir Somnath', phone: '+91-2876-220130', available24x7: false },
          { name: 'Tourism Department Gujarat', phone: '+91-79-23252521', available24x7: false },
          { name: 'Temple Manager', phone: '+91-9876543210', available24x7: false }
        ]
      }
    };

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmergencyStats = async (req, res) => {
  try {
    const { templeId } = req.query;
    const { hours = 24 } = req.query;

    let query = 'SELECT * FROM emergencies WHERE 1=1';
    const params = [];

    if (templeId) {
      query += ' AND templeId = ?';
      params.push(templeId);
    }

    // For simplicity, we'll get all emergencies and filter by time in JavaScript
    const stmt = db.prepare(query);
    const allEmergencies = stmt.all(...params);

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentEmergencies = allEmergencies.filter(e => new Date(e.createdAt) >= since);

    const stats = {
      total: recentEmergencies.length,
      byStatus: {
        reported: recentEmergencies.filter(e => e.status === 'reported').length,
        acknowledged: recentEmergencies.filter(e => e.status === 'acknowledged').length,
        in_progress: recentEmergencies.filter(e => e.status === 'in_progress').length,
        resolved: recentEmergencies.filter(e => e.status === 'resolved').length
      },
      bySeverity: {
        low: recentEmergencies.filter(e => e.severity === 'low').length,
        medium: recentEmergencies.filter(e => e.severity === 'medium').length,
        high: recentEmergencies.filter(e => e.severity === 'high').length,
        critical: recentEmergencies.filter(e => e.severity === 'critical').length
      },
      byType: {
        medical: recentEmergencies.filter(e => e.type === 'medical').length,
        security: recentEmergencies.filter(e => e.type === 'security').length,
        crowd: recentEmergencies.filter(e => e.type === 'crowd').length,
        fire: recentEmergencies.filter(e => e.type === 'fire').length,
        structural: recentEmergencies.filter(e => e.type === 'structural').length,
        other: recentEmergencies.filter(e => e.type === 'other').length
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmergencyHistory = async (req, res) => {
  try {
    const { templeId } = req.params;
    const { days = 30, status, type } = req.query;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let query = `
      SELECT e.*, t.name as templeName
      FROM emergencies e
      JOIN temples t ON e.templeId = t.id
      WHERE e.templeId = ? AND e.createdAt >= ?
    `;
    let params = [templeId, since.toISOString()];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND e.type = ?';
      params.push(type);
    }

    query += ' ORDER BY e.createdAt DESC';

    const stmt = db.prepare(query);
    const emergencies = stmt.all(...params);

    const formattedEmergencies = emergencies.map(emergency => ({
      _id: emergency.id,
      templeId: emergency.templeId,
      type: emergency.type,
      severity: emergency.severity,
      description: emergency.description,
      status: emergency.status,
      createdAt: emergency.createdAt,
      updatedAt: emergency.updatedAt,
      reportedBy: {
        name: emergency.reportedBy,
        phone: emergency.reporterPhone
      },
      templeName: emergency.templeName
    }));

    res.json({ emergencies: formattedEmergencies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};