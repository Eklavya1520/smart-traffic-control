const mongoose = require('mongoose');

const IntersectionSchema = new mongoose.Schema({
  intersectionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String,
  },
  geometryType: {
    type: String,
    enum: ['4-way', '3-way-T', 'Roundabout'],
    default: '4-way',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'MANUAL_OVERRIDE', 'DEGRADED', 'OFFLINE'],
    default: 'ACTIVE',
  },
  currentPhase: {
    type: String,
    enum: ['PHASE_A_NS', 'PHASE_B_EW', 'YELLOW', 'ALL_RED'],
    default: 'PHASE_A_NS',
  },
  activeSignalPlan: {
    cycleLength: { type: Number, default: 60 },
    phaseA_NorthSouth: {
      green: { type: Number, default: 25 },
      yellow: { type: Number, default: 4 },
      red: { type: Number, default: 2 },
    },
    phaseB_EastWest: {
      green: { type: Number, default: 25 },
      yellow: { type: Number, default: 4 },
      red: { type: Number, default: 2 },
    },
    estimatedAvgDelaySec: { type: Number, default: 32.5 },
    efficiencyGainPercent: { type: Number, default: 28.4 },
  },
  lastTelemetryReceivedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Intersection', IntersectionSchema);
