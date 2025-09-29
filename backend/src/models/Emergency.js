const mongoose = require('mongoose');

const EmergencySchema = new mongoose.Schema({
  templeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Temple',
    required: true
  },
  type: {
    type: String,
    enum: ['medical', 'security', 'crowd', 'fire', 'structural', 'other'],
    required: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    description: {
      type: String
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'false_alarm'],
    default: 'reported'
  },
  reportedBy: {
    name: String,
    phone: String,
    userType: {
      type: String,
      enum: ['pilgrim', 'staff', 'security', 'admin', 'anonymous']
    }
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  assignedTo: {
    name: String,
    department: String,
    phone: String
  },
  responseTime: {
    acknowledged: Date,
    resolved: Date
  },
  notes: [{
    timestamp: { type: Date, default: Date.now },
    author: String,
    content: String
  }],
  affectedZones: [{
    type: String
  }],
  evacuationRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

EmergencySchema.index({ templeId: 1, status: 1 });
EmergencySchema.index({ severity: 1, status: 1 });
EmergencySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Emergency', EmergencySchema);