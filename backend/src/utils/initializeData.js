const mockDataService = require('../services/mockDataService');

async function initializeApplication() {
  try {
    console.log('Initializing Smart Pilgrimage Crowd Management System...');

    // Initialize temples
    console.log('Setting up temples...');
    await mockDataService.initializeTemples();

    // Generate historical data for the past week
    console.log('Generating historical crowd data...');
    await mockDataService.generateHistoricalData(7);

    // Generate sample queue data
    console.log('Creating sample queue bookings...');
    await mockDataService.generateSampleQueueData();

    // Start real-time data generation
    console.log('Starting real-time data generation...');
    await mockDataService.startRealTimeDataGeneration(5); // Every 5 minutes

    console.log('Application initialization completed successfully!');
    console.log('System is ready to serve pilgrims and temple administrators');

  } catch (error) {
    console.error('Error during initialization:', error);
    throw error;
  }
}

module.exports = { initializeApplication };