const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/temples', require('./routes/temples'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/crowd', require('./routes/crowd'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-temple', (templeId) => {
    socket.join(`temple-${templeId}`);
    console.log(`Client ${socket.id} joined temple ${templeId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate real-time occupancy updates with 15% overcrowding factor
const simulateOccupancyUpdates = () => {
  const db = require('./db/sqlite');

  setInterval(() => {
    try {
      const stmt = db.prepare("SELECT * FROM temples WHERE status != 'maintenance'");
      const temples = stmt.all();

      temples.forEach(temple => {
        // Get current queue count for this temple
        const queueStmt = db.prepare(`
          SELECT COUNT(*) as count FROM queue_entries
          WHERE templeId = ? AND status IN ('waiting', 'called')
        `);
        const queueCount = queueStmt.get(temple.id).count;

        // Base occupancy calculation with realistic HIGH crowd patterns for busy pilgrimage sites
        const hour = new Date().getHours();
        let baseMultiplier = 0.65; // Minimum 65% occupancy (always busy)

        // Peak hours simulation - much higher for realistic pilgrimage sites
        if (hour >= 4 && hour <= 10) baseMultiplier = 1.1; // Early morning prayers (very crowded)
        else if (hour >= 10 && hour <= 14) baseMultiplier = 0.95; // Late morning (high)
        else if (hour >= 14 && hour <= 17) baseMultiplier = 0.85; // Afternoon (busy)
        else if (hour >= 17 && hour <= 22) baseMultiplier = 1.25; // Evening peak (extremely crowded)
        else if (hour >= 22 || hour <= 4) baseMultiplier = 0.7; // Night prayers (moderately busy)

        // Add random variation (±15% to keep it realistic but high)
        const randomVariation = 0.85 + (Math.random() * 0.3);

        // Increase overcrowding factor for realistic pilgrimage crowds
        const overcrowdingFactor = 1.3; // 30% overcrowding is common

        // Include queue impact (people waiting add to perceived occupancy)
        const queueImpact = Math.min(queueCount * 2, temple.capacity * 0.1); // Max 10% impact from queue

        let newOccupancy = Math.floor(
          (temple.capacity * baseMultiplier * randomVariation * overcrowdingFactor) + queueImpact
        );

        // Allow higher overcrowding for realistic pilgrimage scenarios (up to 150%)
        newOccupancy = Math.max(temple.capacity * 0.6, Math.min(temple.capacity * 1.5, newOccupancy));

        // Larger gradual changes for busy periods
        const maxChange = Math.floor(temple.capacity * 0.08); // Max 8% change per update for dynamic crowds
        const currentOccupancy = temple.currentOccupancy || 0;
        if (Math.abs(newOccupancy - currentOccupancy) > maxChange) {
          newOccupancy = currentOccupancy + (newOccupancy > currentOccupancy ? maxChange : -maxChange);
        }

        if (newOccupancy !== currentOccupancy) {
          // Update database
          const updateStmt = db.prepare('UPDATE temples SET currentOccupancy = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?');
          updateStmt.run(newOccupancy, temple.id);

          // Record analytics data with adjusted thresholds for high-capacity scenarios
          const density = Math.round((newOccupancy / temple.capacity) * 100);
          let alertLevel = 'low';
          if (density >= 130) alertLevel = 'critical'; // Over 130% is critical for pilgrimage sites
          else if (density >= 110) alertLevel = 'high';   // 110%+ is high risk
          else if (density >= 85) alertLevel = 'medium';  // 85%+ is medium risk
          // Below 85% is now considered 'low' for busy pilgrimage sites

          const insertAnalytics = db.prepare(`
            INSERT INTO crowd_analytics (templeId, crowdCount, density, alertLevel, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `);
          insertAnalytics.run(temple.id, newOccupancy, density, alertLevel, new Date().toISOString());

          // Emit real-time update
          const updateData = {
            templeId: temple.id,
            templeName: temple.name,
            currentOccupancy: newOccupancy,
            capacity: temple.capacity,
            occupancyPercentage: density,
            alertLevel,
            queueCount,
            overcrowdingFactor: overcrowdingFactor,
            timestamp: new Date()
          };

          io.to(`temple-${temple.id}`).emit('occupancy-update', updateData);
          io.emit('global-occupancy-update', updateData);

          console.log(`Updated ${temple.name}: ${newOccupancy}/${temple.capacity} (${density}%) - Queue: ${queueCount} - Alert: ${alertLevel}`);
        }
      });
    } catch (error) {
      console.error('Error updating occupancy:', error);
    }
  }, 10000); // Update every 10 seconds for more realistic simulation
};

// Start occupancy simulation after database is initialized
setTimeout(simulateOccupancyUpdates, 2000);

// Make io accessible to routes
app.set('io', io);

// Initialize SQLite database
const db = require('./db/sqlite');
console.log('SQLite database initialized');

// Initialize Emergency Generator
const EmergencyGenerator = require('./services/emergencyGenerator');
const emergencyGenerator = new EmergencyGenerator(io);

// Start emergency generator after a delay to ensure database is ready
setTimeout(() => {
  emergencyGenerator.start();
}, 5000); // Start after 5 seconds

// Add emergency generator control routes
app.get('/api/emergency/generator/status', (req, res) => {
  res.json(emergencyGenerator.getStatus());
});

app.post('/api/emergency/generator/start', (req, res) => {
  emergencyGenerator.start();
  res.json({ message: 'Emergency generator started', status: emergencyGenerator.getStatus() });
});

app.post('/api/emergency/generator/stop', (req, res) => {
  emergencyGenerator.stop();
  res.json({ message: 'Emergency generator stopped', status: emergencyGenerator.getStatus() });
});

app.post('/api/emergency/generator/trigger', (req, res) => {
  emergencyGenerator.generateImmediateEmergency();
  res.json({ message: 'Emergency generated immediately' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});