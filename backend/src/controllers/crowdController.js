const db = require('../db/sqlite');

// Generate realistic crowd monitoring data using actual temple occupancy
const generateCrowdData = () => {
  const temples = db.prepare('SELECT * FROM temples').all();
  const crowdData = [];

  temples.forEach(temple => {
    // Use actual current occupancy from temple data
    const occupancy = temple.currentOccupancy || 0;
    const density = Math.round((occupancy / temple.capacity) * 100);

    // Calculate risk factors adjusted for high-capacity pilgrimage sites
    let riskLevel = 'low';
    if (density >= 130) riskLevel = 'critical';  // 130%+ overcrowding is critical
    else if (density >= 110) riskLevel = 'high'; // 110%+ is high risk
    else if (density >= 85) riskLevel = 'medium'; // 85%+ is medium risk for busy temples
    // Below 85% is considered normal/low for pilgrimage sites

    // Flow rate (people per minute) - Higher for busy pilgrimage sites
    const baseFlowRate = density > 100 ? 180 : 120; // Higher base flow for overcrowded conditions
    const flowRate = Math.floor(Math.random() * 100) + baseFlowRate;

    // Movement speed (meters per second) - More realistic for crowded conditions
    let movementSpeed = 1.8 - (density / 100) * 1.5; // Slower with higher density
    movementSpeed = Math.max(0.2, movementSpeed); // Minimum realistic walking speed
    movementSpeed = Math.round(movementSpeed * 10) / 10;

    // Noise level (decibels) - Higher base for active pilgrimage sites
    const baseNoise = 65; // Higher baseline for active temples
    const noiseLevel = Math.floor(Math.random() * 25) + baseNoise + (density / 4);

    // Heat index (Celsius) - Higher with density due to body heat
    const baseHeat = 28; // Typical temple environment temperature
    const heatIndex = Math.floor(Math.random() * 12) + baseHeat + (density / 8);

    // Exit blockage (higher probability for overcrowded conditions)
    const exitBlockage = Math.random() < (density / 150); // More likely when very crowded

    crowdData.push({
      templeId: temple.id,
      templeName: temple.name,
      currentOccupancy: occupancy,
      capacity: temple.capacity,
      density: density,
      riskLevel: riskLevel,
      flowRate: flowRate,
      exitBlockage: exitBlockage,
      noiseLevel: Math.round(noiseLevel),
      movementSpeed: movementSpeed,
      heatIndex: Math.round(heatIndex),
      timestamp: new Date().toISOString()
    });
  });

  return crowdData;
};

// Generate crowd alerts based on data
const generateCrowdAlerts = (crowdData) => {
  const alerts = [];

  crowdData.forEach(crowd => {
    const alertId = `${crowd.templeId}-${Date.now()}`;

    // Stampede risk alert
    if (crowd.density >= 90) {
      alerts.push({
        id: `stampede-${alertId}`,
        type: 'stampede_risk',
        severity: crowd.density >= 95 ? 'critical' : 'high',
        templeId: crowd.templeId,
        templeName: crowd.templeName,
        description: `Extremely high crowd density detected: ${crowd.density}%. Stampede risk imminent.`,
        recommendations: [
          'Stop new entries immediately',
          'Open all emergency exits',
          'Deploy crowd control personnel',
          'Make announcements to calm crowd',
          'Prepare medical emergency response'
        ],
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Exit blockage alert
    if (crowd.exitBlockage) {
      alerts.push({
        id: `exit-${alertId}`,
        type: 'exit_blocked',
        severity: 'critical',
        templeId: crowd.templeId,
        templeName: crowd.templeName,
        description: 'Emergency exit routes are blocked or congested.',
        recommendations: [
          'Clear exit pathways immediately',
          'Deploy security to manage exits',
          'Redirect crowd flow to alternate exits',
          'Make public announcements'
        ],
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Slow movement alert
    if (crowd.movementSpeed < 0.5) {
      alerts.push({
        id: `movement-${alertId}`,
        type: 'slow_movement',
        severity: 'high',
        templeId: crowd.templeId,
        templeName: crowd.templeName,
        description: `Crowd movement dangerously slow: ${crowd.movementSpeed} m/s. Risk of crushing.`,
        recommendations: [
          'Guide crowd movement',
          'Create additional pathways',
          'Reduce new entries',
          'Monitor for panic signs'
        ],
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // High noise level alert
    if (crowd.noiseLevel > 80) {
      alerts.push({
        id: `noise-${alertId}`,
        type: 'high_noise',
        severity: 'medium',
        templeId: crowd.templeId,
        templeName: crowd.templeName,
        description: `High noise levels detected: ${crowd.noiseLevel} dB. May indicate panic or distress.`,
        recommendations: [
          'Investigate noise source',
          'Make calming announcements',
          'Deploy personnel to assess situation',
          'Monitor for signs of distress'
        ],
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    // Heat stress alert
    if (crowd.heatIndex > 35) {
      alerts.push({
        id: `heat-${alertId}`,
        type: 'heat_stress',
        severity: 'medium',
        templeId: crowd.templeId,
        templeName: crowd.templeName,
        description: `High heat index detected: ${crowd.heatIndex}°C. Risk of heat-related incidents.`,
        recommendations: [
          'Provide water stations',
          'Increase ventilation',
          'Monitor for heat exhaustion signs',
          'Consider reducing capacity temporarily'
        ],
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }
  });

  return alerts;
};

exports.getCrowdData = async (req, res) => {
  try {
    const crowdData = generateCrowdData();

    res.json({
      success: true,
      data: crowdData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCrowdAlerts = async (req, res) => {
  try {
    const crowdData = generateCrowdData();
    const alerts = generateCrowdAlerts(crowdData);

    res.json({
      success: true,
      alerts: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCrowdStats = async (req, res) => {
  try {
    const crowdData = generateCrowdData();
    const alerts = generateCrowdAlerts(crowdData);

    const stats = {
      totalCrowd: crowdData.reduce((acc, d) => acc + d.currentOccupancy, 0),
      totalCapacity: crowdData.reduce((acc, d) => acc + d.capacity, 0),
      averageDensity: Math.round(crowdData.reduce((acc, d) => acc + d.density, 0) / crowdData.length),
      highRiskAreas: crowdData.filter(d => d.riskLevel === 'critical' || d.riskLevel === 'high').length,
      activeAlerts: alerts.length,
      alertsByType: {
        stampede_risk: alerts.filter(a => a.type === 'stampede_risk').length,
        exit_blocked: alerts.filter(a => a.type === 'exit_blocked').length,
        slow_movement: alerts.filter(a => a.type === 'slow_movement').length,
        high_noise: alerts.filter(a => a.type === 'high_noise').length,
        heat_stress: alerts.filter(a => a.type === 'heat_stress').length
      },
      riskDistribution: {
        critical: crowdData.filter(d => d.riskLevel === 'critical').length,
        high: crowdData.filter(d => d.riskLevel === 'high').length,
        medium: crowdData.filter(d => d.riskLevel === 'medium').length,
        low: crowdData.filter(d => d.riskLevel === 'low').length
      }
    };

    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTempleCrowdData = async (req, res) => {
  try {
    const { templeId } = req.params;
    const crowdData = generateCrowdData();
    const templeData = crowdData.find(d => d.templeId == templeId);

    if (!templeData) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    const alerts = generateCrowdAlerts([templeData]);

    res.json({
      success: true,
      data: templeData,
      alerts: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};