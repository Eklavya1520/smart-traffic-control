const mongoose = require('mongoose');

const TrafficReadingSchema = new mongoose.Schema({
  intersectionId: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  approachCounts: {
    North: { type: Number, default: 0 },
    South: { type: Number, default: 0 },
    East: { type: Number, default: 0 },
    West: { type: Number, default: 0 },
  },
  smoothedPcu: {
    North: { type: Number, default: 0 },
    South: { type: Number, default: 0 },
    East: { type: Number, default: 0 },
    West: { type: Number, default: 0 },
  },
  classBreakdown: {
    North: { cars: Number, motorcycles: Number, buses: Number, trucks: Number },
    South: { cars: Number, motorcycles: Number, buses: Number, trucks: Number },
    East: { cars: Number, motorcycles: Number, buses: Number, trucks: Number },
    West: { cars: Number, motorcycles: Number, buses: Number, trucks: Number },
  },
  totalVehicles: {
    type: Number,
    required: true,
  },
  signalPlan: {
    cycleLength: Number,
    phaseA_NorthSouth: mongoose.Schema.Types.Mixed,
    phaseB_EastWest: mongoose.Schema.Types.Mixed,
    estimatedAvgDelaySec: Number,
    efficiencyGainPercent: Number,
  },
  fps: Number,
  cameraHealth: {
    type: String,
    default: 'ONLINE',
  },
}, { timestamps: true });

// Auto-expire raw data points after 7 days to maintain lightweight database size
TrafficReadingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model('TrafficReading', TrafficReadingSchema);
