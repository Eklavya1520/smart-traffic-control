const Intersection = require('../models/Intersection');

// In-memory fallback dataset when MongoDB is connecting/local
const MOCK_INTERSECTIONS = [
  {
    intersectionId: 'INT_001',
    name: 'Downtown Central 4-Way',
    location: { lat: 28.6139, lng: 77.2090, address: 'Connaught Circus & Janpath' },
    geometryType: '4-way',
    status: 'ACTIVE',
    currentPhase: 'PHASE_A_NS',
    activeSignalPlan: {
      cycleLength: 65,
      phaseA_NorthSouth: { green: 32, yellow: 4, red: 2 },
      phaseB_EastWest: { green: 23, yellow: 4, red: 2 },
      estimatedAvgDelaySec: 29.5,
      efficiencyGainPercent: 32.1
    },
    lastTelemetryReceivedAt: new Date()
  },
  {
    intersectionId: 'INT_002',
    name: 'Tech Park Expressway Cross',
    location: { lat: 28.5355, lng: 77.3910, address: 'Sector 62 IT Hub Crossing' },
    geometryType: '4-way',
    status: 'ACTIVE',
    currentPhase: 'PHASE_B_EW',
    activeSignalPlan: {
      cycleLength: 55,
      phaseA_NorthSouth: { green: 20, yellow: 4, red: 2 },
      phaseB_EastWest: { green: 25, yellow: 4, red: 2 },
      estimatedAvgDelaySec: 31.0,
      efficiencyGainPercent: 29.8
    },
    lastTelemetryReceivedAt: new Date()
  }
];

exports.getAll = async (req, res, next) => {
  try {
    let items = [];
    if (Intersection.db.readyState === 1) {
      items = await Intersection.find();
    }
    if (!items || items.length === 0) {
      items = MOCK_INTERSECTIONS;
    }
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let item = null;
    if (Intersection.db.readyState === 1) {
      item = await Intersection.findOne({ intersectionId: id });
    }
    if (!item) {
      item = MOCK_INTERSECTIONS.find(i => i.intersectionId === id) || MOCK_INTERSECTIONS[0];
    }
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.overrideSignal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { phase, durationSec } = req.body;

    const io = req.app.get('io');
    if (io) {
      io.to(`intersection:${id}`).emit('signal:manual_override', {
        intersectionId: id,
        phase,
        durationSec,
        issuedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: `Manual override executed for ${id} -> Phase: ${phase} for ${durationSec}s`
    });
  } catch (error) {
    next(error);
  }
};
