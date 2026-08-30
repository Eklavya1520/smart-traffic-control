const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  intersectionId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['STALE_DATA', 'QUEUE_SPIKE', 'HARDWARE_FAULT', 'SERVICE_DOWN', 'MANUAL_TRIGGER'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'WARNING',
  },
  message: {
    type: String,
    required: true,
  },
  details: mongoose.Schema.Types.Mixed,
  resolved: {
    type: Boolean,
    default: false,
    index: true,
  },
  resolvedAt: Date,
  resolvedBy: String,
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
