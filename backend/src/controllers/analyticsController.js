const db = require('../db/sqlite');

exports.getCrowdPredictions = async (req, res) => {
  try {
    const { templeId, days = 7 } = req.query;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let analyticsQuery = `
      SELECT ca.*, t.name, t.capacity
      FROM crowd_analytics ca
      JOIN temples t ON ca.templeId = t.id
      WHERE ca.timestamp >= ?
    `;
    let params = [since.toISOString()];

    if (templeId) {
      analyticsQuery += ' AND ca.templeId = ?';
      params.push(templeId);
    }

    analyticsQuery += ' ORDER BY ca.timestamp DESC';

    const analytics = db.prepare(analyticsQuery).all(...params);

    // Group by temple for better analysis
    const templeAnalytics = {};

    analytics.forEach(data => {
      const templeIdKey = data.templeId.toString();
      if (!templeAnalytics[templeIdKey]) {
        templeAnalytics[templeIdKey] = {
          temple: {
            id: data.templeId,
            name: data.name,
            capacity: data.capacity
          },
          data: [],
          trends: {
            avgCrowdCount: 0,
            peakTime: null,
            quietTime: null,
            busyDays: [],
            alertFrequency: { low: 0, medium: 0, high: 0, critical: 0 }
          }
        };
      }
      templeAnalytics[templeIdKey].data.push(data);
    });

    // Calculate trends and predictions
    Object.keys(templeAnalytics).forEach(templeId => {
      const temple = templeAnalytics[templeId];
      const data = temple.data;

      if (data.length === 0) return;

      // Calculate average crowd count
      temple.trends.avgCrowdCount = Math.round(
        data.reduce((sum, d) => sum + d.crowdCount, 0) / data.length
      );

      // Find peak and quiet times
      const hourlyData = {};
      data.forEach(d => {
        const hour = new Date(d.timestamp).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { total: 0, count: 0 };
        }
        hourlyData[hour].total += d.crowdCount;
        hourlyData[hour].count += 1;
      });

      let peakHour = 0, quietHour = 0;
      let maxAvg = 0, minAvg = Infinity;

      Object.keys(hourlyData).forEach(hour => {
        const avg = hourlyData[hour].total / hourlyData[hour].count;
        if (avg > maxAvg) {
          maxAvg = avg;
          peakHour = hour;
        }
        if (avg < minAvg) {
          minAvg = avg;
          quietHour = hour;
        }
      });

      temple.trends.peakTime = `${peakHour}:00`;
      temple.trends.quietTime = `${quietHour}:00`;

      // Count alert levels
      data.forEach(d => {
        temple.trends.alertFrequency[d.alertLevel]++;
      });

      // Generate basic predictions based on trends
      temple.predictions = {
        nextHour: Math.round(temple.trends.avgCrowdCount * 1.1),
        next3Hours: Math.round(temple.trends.avgCrowdCount * 0.9),
        nextDay: Math.round(temple.trends.avgCrowdCount)
      };
    });

    res.json({
      timeRange: { days, since },
      temples: Object.values(templeAnalytics)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistoricalData = async (req, res) => {
  try {
    const { templeId } = req.params;
    const { startDate, endDate, granularity = 'hour' } = req.query;

    const temple = db.prepare('SELECT * FROM temples WHERE id = ?').get(templeId);
    if (!temple) {
      return res.status(404).json({ error: 'Temple not found' });
    }

    const start = new Date(startDate || Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = new Date(endDate || Date.now());

    const data = db.prepare(`
      SELECT * FROM crowd_analytics
      WHERE templeId = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `).all(templeId, start.toISOString(), end.toISOString());

    // Group data by granularity
    const groupedData = {};

    data.forEach(entry => {
      let key;
      const date = new Date(entry.timestamp);

      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
          key = `week-${weekNum}`;
          break;
        default:
          key = entry.timestamp;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          timestamp: entry.timestamp,
          crowdCount: [],
          density: [],
          alertLevel: entry.alertLevel
        };
      }

      groupedData[key].crowdCount.push(entry.crowdCount);
      groupedData[key].density.push(entry.density);
    });

    // Calculate averages for grouped data
    const processedData = Object.keys(groupedData).map(key => {
      const group = groupedData[key];
      return {
        timestamp: group.timestamp,
        avgCrowdCount: Math.round(group.crowdCount.reduce((a, b) => a + b, 0) / group.crowdCount.length),
        avgDensity: Math.round(group.density.reduce((a, b) => a + b, 0) / group.density.length),
        dataPoints: group.crowdCount.length,
        alertLevel: group.alertLevel
      };
    });

    res.json({
      temple: {
        id: temple.id,
        name: temple.name,
        capacity: temple.capacity
      },
      timeRange: { start, end, granularity },
      data: processedData,
      summary: {
        totalDataPoints: data.length,
        avgCrowdCount: data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.crowdCount, 0) / data.length) : 0,
        peakCrowdCount: data.length > 0 ? Math.max(...data.map(d => d.crowdCount)) : 0,
        avgDensity: data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.density, 0) / data.length) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateDailyReport = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const temples = db.prepare("SELECT * FROM temples WHERE status != 'maintenance'").all();
    const report = [];

    for (const temple of temples) {
      const data = db.prepare(`
        SELECT * FROM crowd_analytics
        WHERE templeId = ? AND timestamp >= ? AND timestamp < ?
        ORDER BY timestamp ASC
      `).all(temple.id, startOfDay.toISOString(), endOfDay.toISOString());

      if (data.length === 0) continue;

      const peakCrowd = Math.max(...data.map(d => d.crowdCount));
      const avgCrowd = Math.round(data.reduce((sum, d) => sum + d.crowdCount, 0) / data.length);
      const alerts = data.filter(d => ['high', 'critical'].includes(d.alertLevel));

      report.push({
        temple: {
          id: temple.id,
          name: temple.name,
          capacity: temple.capacity
        },
        metrics: {
          peakCrowd,
          avgCrowd,
          occupancyRate: Math.round((peakCrowd / temple.capacity) * 100),
          dataPoints: data.length,
          alertCount: alerts.length,
          highAlertTimes: alerts.map(a => a.timestamp)
        }
      });
    }

    res.json({
      date,
      temples: report,
      summary: {
        totalTemples: report.length,
        avgOccupancyRate: report.length > 0 ? Math.round(
          report.reduce((sum, t) => sum + t.metrics.occupancyRate, 0) / report.length
        ) : 0,
        totalAlerts: report.reduce((sum, t) => sum + t.metrics.alertCount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};