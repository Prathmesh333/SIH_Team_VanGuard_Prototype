const db = require('../db/sqlite');

const seedTodayData = () => {
  const today = new Date().toISOString().split('T')[0];

  // Check if today's data already exists
  const existingData = db.prepare(`
    SELECT COUNT(*) as count FROM crowd_analytics
    WHERE date(timestamp) = ?
  `).get(today);

  if (existingData.count > 0) {
    console.log('Today\'s analytics data already exists');
    return;
  }

  const temples = db.prepare('SELECT * FROM temples').all();
  const insertAnalytics = db.prepare(`
    INSERT INTO crowd_analytics (templeId, crowdCount, density, alertLevel, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  console.log('Seeding today\'s analytics data...');

  temples.forEach(temple => {
    // Generate data for every 2 hours today
    for (let hour = 0; hour < 24; hour += 2) {
      const timestamp = new Date();
      timestamp.setHours(hour, 0, 0, 0);

      // Simulate realistic crowd patterns (higher during day hours)
      let baseMultiplier = 0.3; // Minimum 30% occupancy
      if (hour >= 6 && hour <= 10) baseMultiplier = 0.8; // Morning rush
      else if (hour >= 11 && hour <= 14) baseMultiplier = 0.6; // Afternoon
      else if (hour >= 17 && hour <= 20) baseMultiplier = 0.9; // Evening peak

      // Add 15% overcrowding factor as requested
      const overcrowdingFactor = 1.15;
      const crowdCount = Math.floor(temple.capacity * baseMultiplier * overcrowdingFactor * (0.8 + Math.random() * 0.4));
      const density = Math.min(100, (crowdCount / temple.capacity) * 100);

      let alertLevel = 'low';
      if (density >= 90) alertLevel = 'critical';
      else if (density >= 75) alertLevel = 'high';
      else if (density >= 50) alertLevel = 'medium';

      insertAnalytics.run(
        temple.id,
        crowdCount,
        Math.round(density),
        alertLevel,
        timestamp.toISOString()
      );
    }
  });

  console.log('Today\'s analytics data seeded successfully');
};

// Run if called directly
if (require.main === module) {
  seedTodayData();
}

module.exports = seedTodayData;