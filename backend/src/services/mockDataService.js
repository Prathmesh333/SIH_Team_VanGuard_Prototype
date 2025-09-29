const { Temple, CrowdAnalytics, Queue } = require('../models');

class MockDataService {
  constructor() {
    this.templeData = [
      {
        name: 'Somnath Temple',
        location: { lat: 20.8880, lng: 70.4013, address: 'Somnath, Gujarat' },
        capacity: 5000,
        zones: [
          { name: 'Main Sanctum', capacity: 1000 },
          { name: 'Outer Courtyard', capacity: 2000 },
          { name: 'Prayer Hall', capacity: 1500 },
          { name: 'Entrance Area', capacity: 500 }
        ],
        facilities: ['Parking', 'Restrooms', 'Drinking Water', 'Medical Aid', 'Security'],
        darshanTimings: {
          morning: { start: '06:00', end: '12:00' },
          evening: { start: '16:00', end: '21:00' }
        },
        description: 'One of the twelve Jyotirlinga shrines of Shiva',
        contact: { phone: '+91-9876543210', email: 'info@somnath.gov.in' }
      },
      {
        name: 'Dwarkadhish Temple',
        location: { lat: 22.2442, lng: 68.9685, address: 'Dwarka, Gujarat' },
        capacity: 4000,
        zones: [
          { name: 'Main Temple', capacity: 800 },
          { name: 'Courtyard', capacity: 1500 },
          { name: 'Waiting Area', capacity: 1200 },
          { name: 'Entrance', capacity: 500 }
        ],
        facilities: ['Parking', 'Restrooms', 'Prasad Counter', 'Book Store', 'Medical Aid'],
        darshanTimings: {
          morning: { start: '05:30', end: '12:30' },
          evening: { start: '15:30', end: '21:30' }
        },
        description: 'Sacred Krishna temple in Dwarka',
        contact: { phone: '+91-9876543220', email: 'info@dwarkadhish.gov.in' }
      },
      {
        name: 'Ambaji Temple',
        location: { lat: 24.2122, lng: 72.8681, address: 'Ambaji, Gujarat' },
        capacity: 3000,
        zones: [
          { name: 'Sanctum', capacity: 600 },
          { name: 'Assembly Hall', capacity: 1000 },
          { name: 'Outer Area', capacity: 1000 },
          { name: 'Entrance', capacity: 400 }
        ],
        facilities: ['Parking', 'Restrooms', 'Prasad Counter', 'Accommodation', 'Medical Aid'],
        darshanTimings: {
          morning: { start: '06:00', end: '12:00' },
          evening: { start: '16:00', end: '22:00' }
        },
        description: 'Shakti Peetha dedicated to Goddess Amba',
        contact: { phone: '+91-9876543230', email: 'info@ambaji.gov.in' }
      },
      {
        name: 'Pavagadh Temple',
        location: { lat: 22.4833, lng: 73.5333, address: 'Pavagadh, Gujarat' },
        capacity: 2500,
        zones: [
          { name: 'Main Temple', capacity: 500 },
          { name: 'Waiting Area', capacity: 800 },
          { name: 'Ropeway Station', capacity: 800 },
          { name: 'Base Area', capacity: 400 }
        ],
        facilities: ['Ropeway', 'Parking', 'Restrooms', 'Food Court', 'Medical Aid'],
        darshanTimings: {
          morning: { start: '06:00', end: '12:00' },
          evening: { start: '15:00', end: '20:00' }
        },
        description: 'Kalika Mata Temple on Pavagadh Hill',
        contact: { phone: '+91-9876543240', email: 'info@pavagadh.gov.in' }
      }
    ];
  }

  async initializeTemples() {
    try {
      // Check if temples already exist
      const existingCount = await Temple.countDocuments();
      if (existingCount > 0) {
        console.log('Temples already initialized');
        return;
      }

      const temples = await Temple.insertMany(this.templeData);
      console.log(`Initialized ${temples.length} temples`);
      return temples;
    } catch (error) {
      console.error('Error initializing temples:', error);
      throw error;
    }
  }

  generateCrowdData(temple, timestamp = new Date()) {
    const hour = timestamp.getHours();
    const isWeekend = [0, 6].includes(timestamp.getDay());
    const isFestival = Math.random() < 0.1; // 10% chance of festival

    // Base crowd calculation
    let baseCrowd;
    if (hour >= 6 && hour <= 10) {
      baseCrowd = temple.capacity * 0.7; // Morning peak
    } else if (hour >= 17 && hour <= 20) {
      baseCrowd = temple.capacity * 0.8; // Evening peak
    } else if (hour >= 11 && hour <= 16) {
      baseCrowd = temple.capacity * 0.3; // Afternoon low
    } else {
      baseCrowd = temple.capacity * 0.1; // Night/early morning
    }

    // Apply modifiers
    if (isWeekend) baseCrowd *= 1.5;
    if (isFestival) baseCrowd *= 2;

    // Add randomness
    const crowdCount = Math.max(0, Math.min(temple.capacity,
      Math.round(baseCrowd + (Math.random() - 0.5) * temple.capacity * 0.2)
    ));

    const density = Math.round((crowdCount / temple.capacity) * 100);

    let alertLevel = 'low';
    if (density > 90) alertLevel = 'critical';
    else if (density > 75) alertLevel = 'high';
    else if (density > 50) alertLevel = 'medium';

    const weatherConditions = ['sunny', 'cloudy', 'rainy', 'foggy'];
    const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    return {
      templeId: temple._id,
      timestamp,
      crowdCount,
      density,
      weatherCondition: weather,
      temperature: Math.round(20 + Math.random() * 20), // 20-40°C
      isFestival,
      isHoliday: isWeekend,
      alertLevel,
      predictions: {
        nextHour: Math.max(0, Math.min(temple.capacity, crowdCount + (Math.random() - 0.5) * 200)),
        next3Hours: Math.max(0, Math.min(temple.capacity, crowdCount + (Math.random() - 0.5) * 500)),
        nextDay: Math.max(0, Math.min(temple.capacity, baseCrowd))
      },
      zoneData: temple.zones.map(zone => ({
        zoneName: zone.name,
        crowdCount: Math.round((crowdCount / temple.capacity) * zone.capacity),
        density: Math.round(((crowdCount / temple.capacity) * zone.capacity / zone.capacity) * 100)
      }))
    };
  }

  async generateHistoricalData(days = 7) {
    try {
      const temples = await Temple.find();
      const data = [];

      for (let d = days; d >= 0; d--) {
        for (let h = 0; h < 24; h += 1) { // Every hour
          const timestamp = new Date();
          timestamp.setDate(timestamp.getDate() - d);
          timestamp.setHours(h, 0, 0, 0);

          for (const temple of temples) {
            const crowdData = this.generateCrowdData(temple, timestamp);
            data.push(crowdData);
          }
        }
      }

      await CrowdAnalytics.insertMany(data);
      console.log(`Generated ${data.length} historical crowd data points`);
    } catch (error) {
      console.error('Error generating historical data:', error);
      throw error;
    }
  }

  async generateRealTimeCrowdData() {
    try {
      const temples = await Temple.find();
      const data = [];

      for (const temple of temples) {
        const crowdData = this.generateCrowdData(temple);
        data.push(crowdData);

        // Update temple's current occupancy
        await Temple.findByIdAndUpdate(temple._id, {
          currentOccupancy: crowdData.crowdCount
        });
      }

      await CrowdAnalytics.insertMany(data);
      return data;
    } catch (error) {
      console.error('Error generating real-time data:', error);
      throw error;
    }
  }

  async generateSampleQueueData() {
    try {
      const temples = await Temple.find();

      for (const temple of temples) {
        // Generate 5-10 sample queue entries per temple
        const queueCount = Math.floor(Math.random() * 6) + 5;

        for (let i = 0; i < queueCount; i++) {
          const tokenNumber = `T${temple._id.toString().slice(-4)}${Date.now().toString().slice(-6)}${i}`;
          const pilgrimPhone = `+91-98765432${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
          const pilgrimName = `Pilgrim ${i + 1}`;

          const queueEntry = new Queue({
            templeId: temple._id,
            tokenNumber,
            pilgrimPhone,
            pilgrimName,
            scheduledTime: new Date(Date.now() + i * 5 * 60 * 1000), // 5 minutes apart
            queuePosition: i + 1,
            status: i === 0 ? 'active' : 'waiting',
            groupSize: Math.floor(Math.random() * 4) + 1
          });

          await queueEntry.save();
        }
      }

      console.log('Generated sample queue data');
    } catch (error) {
      console.error('Error generating queue data:', error);
      throw error;
    }
  }

  async startRealTimeDataGeneration(intervalMinutes = 5) {
    console.log(`Starting real-time data generation every ${intervalMinutes} minutes`);

    const generateData = async () => {
      try {
        await this.generateRealTimeCrowdData();
        console.log('Generated real-time crowd data');
      } catch (error) {
        console.error('Error in real-time data generation:', error);
      }
    };

    // Generate initial data
    await generateData();

    // Set up interval for continuous generation
    setInterval(generateData, intervalMinutes * 60 * 1000);
  }
}

module.exports = new MockDataService();