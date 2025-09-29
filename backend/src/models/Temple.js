const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  currentOccupancy: {
    type: Number,
    default: 0
  }
});

const TempleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
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
    address: {
      type: String,
      required: true
    }
  },
  capacity: {
    type: Number,
    required: true
  },
  zones: [ZoneSchema],
  currentOccupancy: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'emergency', 'maintenance'],
    default: 'open'
  },
  facilities: [{
    type: String
  }],
  darshanTimings: {
    morning: {
      start: String,
      end: String
    },
    evening: {
      start: String,
      end: String
    }
  },
  description: {
    type: String
  },
  images: [{
    type: String
  }],
  contact: {
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

TempleSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Temple', TempleSchema);