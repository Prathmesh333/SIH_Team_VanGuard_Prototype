const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  templeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Temple',
    required: true
  },
  tokenNumber: {
    type: String,
    required: true,
    unique: true
  },
  pilgrimPhone: {
    type: String,
    required: true
  },
  pilgrimName: {
    type: String,
    required: true
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  estimatedTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled', 'no_show'],
    default: 'waiting'
  },
  queuePosition: {
    type: Number,
    required: true
  },
  qrCode: {
    type: String
  },
  specialNeeds: {
    wheelchair: { type: Boolean, default: false },
    elderly: { type: Boolean, default: false },
    pregnant: { type: Boolean, default: false },
    other: { type: String }
  },
  groupSize: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  notificationsSent: {
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

QueueSchema.index({ templeId: 1, status: 1 });
QueueSchema.index({ tokenNumber: 1 });
QueueSchema.index({ pilgrimPhone: 1 });
QueueSchema.index({ scheduledTime: 1 });

module.exports = mongoose.model('Queue', QueueSchema);