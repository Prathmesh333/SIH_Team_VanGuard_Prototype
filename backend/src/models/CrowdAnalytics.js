const mongoose = require('mongoose');

const CrowdAnalyticsSchema = new mongoose.Schema({
  templeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Temple',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  crowdCount: {
    type: Number,
    required: true,
    min: 0
  },
  density: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  weatherCondition: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy']
  },
  temperature: {
    type: Number
  },
  specialEvent: {
    type: String
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  isFestival: {
    type: Boolean,
    default: false
  },
  predictions: {
    nextHour: {
      type: Number,
      min: 0
    },
    next3Hours: {
      type: Number,
      min: 0
    },
    nextDay: {
      type: Number,
      min: 0
    }
  },
  zoneData: [{
    zoneName: String,
    crowdCount: Number,
    density: Number
  }],
  alertLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  }
}, {
  timestamps: true
});

CrowdAnalyticsSchema.index({ templeId: 1, timestamp: -1 });
CrowdAnalyticsSchema.index({ timestamp: -1 });
CrowdAnalyticsSchema.index({ alertLevel: 1 });

module.exports = mongoose.model('CrowdAnalytics', CrowdAnalyticsSchema);