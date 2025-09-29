const db = require('../db/sqlite');

class EmergencyGenerator {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.interval = null;

    // Emergency scenarios with realistic descriptions
    this.emergencyScenarios = [
      {
        type: 'medical',
        severity: 'high',
        descriptions: [
          'Pilgrim experiencing chest pain near main entrance',
          'Elderly visitor collapsed in the main courtyard',
          'Child with breathing difficulties in queue area',
          'Person showing signs of heat stroke near temple steps',
          'Medical emergency - visitor fell and injured leg'
        ]
      },
      {
        type: 'security',
        severity: 'medium',
        descriptions: [
          'Suspicious package found near security checkpoint',
          'Unattended bag reported in visitor waiting area',
          'Argument between visitors escalating near main gate',
          'Lost child reported by family in temple premises',
          'Security breach - unauthorized access attempted'
        ]
      },
      {
        type: 'crowd',
        severity: 'high',
        descriptions: [
          'Overcrowding detected in main darshan area',
          'Queue management system malfunction causing backup',
          'Crowd surge reported near temple entrance',
          'Bottleneck forming at narrow passage points',
          'Emergency evacuation path blocked by crowd'
        ]
      },
      {
        type: 'fire',
        severity: 'critical',
        descriptions: [
          'Small fire detected in electrical room',
          'Smoke reported from kitchen area',
          'Electrical short circuit causing sparks',
          'Overheated equipment in control room',
          'Fire alarm triggered in storage facility'
        ]
      },
      {
        type: 'structural',
        severity: 'medium',
        descriptions: [
          'Cracks noticed in temple wall structure',
          'Loose railing reported on elevated platform',
          'Water leakage affecting electrical systems',
          'Damaged flooring creating trip hazard',
          'Structural concern raised about ancient pillar'
        ]
      },
      {
        type: 'other',
        severity: 'low',
        descriptions: [
          'Power outage in visitor facilities',
          'Water supply disruption in restroom area',
          'Audio system malfunction during prayer time',
          'Lighting failure in main corridor',
          'Temperature control system not working'
        ]
      }
    ];

    this.reporterNames = [
      'Security Guard Raj',
      'Visitor Priya Sharma',
      'Temple Staff Kumar',
      'Volunteer Amit Patel',
      'Pilgrim Sita Devi',
      'Guide Ramesh Bhai',
      'Maintenance Staff',
      'Anonymous Reporter',
      'Temple Administrator',
      'First Aid Volunteer'
    ];

    this.reporterPhones = [
      '+91-9876543210',
      '+91-9123456789',
      '+91-8765432109',
      '+91-7654321098',
      '+91-6543210987',
      '', // Anonymous
      '+91-9988776655',
      '+91-8877665544',
      '+91-7766554433',
      '+91-6655443322'
    ];
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Emergency Generator started - Random alerts will be generated');

    // Generate an emergency every 2-5 minutes
    this.scheduleNextEmergency();
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    console.log('Emergency Generator stopped');
  }

  scheduleNextEmergency() {
    if (!this.isRunning) return;

    // Random interval between 2-5 minutes (120000-300000 ms)
    const nextInterval = Math.random() * (300000 - 120000) + 120000;

    this.interval = setTimeout(() => {
      this.generateRandomEmergency();
      this.scheduleNextEmergency();
    }, nextInterval);

    console.log(`Next emergency scheduled in ${Math.round(nextInterval / 1000)} seconds`);
  }

  generateRandomEmergency() {
    try {
      // Get available temples
      const templesStmt = db.prepare('SELECT * FROM temples');
      const temples = templesStmt.all();

      if (temples.length === 0) {
        console.log('No temples found for emergency generation');
        return;
      }

      // Select random temple
      const randomTemple = temples[Math.floor(Math.random() * temples.length)];

      // Select random emergency scenario
      const randomScenario = this.emergencyScenarios[Math.floor(Math.random() * this.emergencyScenarios.length)];
      const randomDescription = randomScenario.descriptions[Math.floor(Math.random() * randomScenario.descriptions.length)];

      // Random reporter
      const reporterIndex = Math.floor(Math.random() * this.reporterNames.length);
      const reporterName = this.reporterNames[reporterIndex];
      const reporterPhone = this.reporterPhones[reporterIndex];

      // Create emergency record
      const insertStmt = db.prepare(`
        INSERT INTO emergencies (templeId, type, severity, description, reportedBy, reporterPhone)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = insertStmt.run(
        randomTemple.id,
        randomScenario.type,
        randomScenario.severity,
        randomDescription,
        reporterName,
        reporterPhone
      );

      // Get the created emergency with temple name
      const getEmergencyStmt = db.prepare(`
        SELECT e.*, t.name as templeName
        FROM emergencies e
        JOIN temples t ON e.templeId = t.id
        WHERE e.id = ?
      `);
      const newEmergency = getEmergencyStmt.get(result.lastInsertRowid);

      // Emit real-time alert
      if (this.io) {
        const alertData = {
          _id: newEmergency.id,
          emergencyId: newEmergency.id,
          templeId: newEmergency.templeId,
          templeName: newEmergency.templeName,
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
          temple: { name: newEmergency.templeName },
          timestamp: new Date()
        };

        // Emit to specific temple room and globally
        this.io.to(`temple-${randomTemple.id}`).emit('emergency-alert', alertData);
        this.io.emit('emergency-alert', alertData);
        this.io.emit('global-emergency', alertData);
      }

      console.log(`🚨 Generated ${randomScenario.severity} ${randomScenario.type} emergency at ${randomTemple.name}: ${randomDescription}`);

    } catch (error) {
      console.error('Error generating random emergency:', error);
    }
  }

  // Method to generate emergency on demand (for testing)
  generateImmediateEmergency() {
    this.generateRandomEmergency();
  }

  // Method to get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextEmergencyIn: this.interval ? 'Scheduled' : 'Not scheduled'
    };
  }
}

module.exports = EmergencyGenerator;