/**
 * seed_db.js
 * Populates MongoDB with default intersection geometries and historical baseline data.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const Intersection = require('../server/src/models/Intersection');
const Alert = require('../server/src/models/Alert');

const SEED_INTERSECTIONS = [
  {
    intersectionId: 'INT_001',
    name: 'Downtown Central 4-Way Junction',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Main Ring Road & Central Avenue Crossing'
    },
    geometryType: '4-way',
    status: 'ACTIVE',
    currentPhase: 'PHASE_A_NS',
    activeSignalPlan: {
      cycleLength: 65,
      phaseA_NorthSouth: { green: 32, yellow: 4, red: 2 },
      phaseB_EastWest: { green: 23, yellow: 4, red: 2 },
      estimatedAvgDelaySec: 28.4,
      efficiencyGainPercent: 31.4
    }
  },
  {
    intersectionId: 'INT_002',
    name: 'Tech Park Cyber Gateway',
    location: {
      lat: 28.5355,
      lng: 77.3910,
      address: 'IT Corridor Sector 62 Expressway'
    },
    geometryType: '4-way',
    status: 'ACTIVE',
    currentPhase: 'PHASE_B_EW',
    activeSignalPlan: {
      cycleLength: 55,
      phaseA_NorthSouth: { green: 20, yellow: 4, red: 2 },
      phaseB_EastWest: { green: 25, yellow: 4, red: 2 },
      estimatedAvgDelaySec: 30.2,
      efficiencyGainPercent: 29.1
    }
  }
];

const SEED_ALERTS = [
  {
    intersectionId: 'INT_001',
    type: 'QUEUE_SPIKE',
    severity: 'WARNING',
    message: 'High vehicle accumulation detected on South Approach (22 PCU). Green phase auto-extended.',
    resolved: false
  },
  {
    intersectionId: 'INT_002',
    type: 'HARDWARE_FAULT',
    severity: 'INFO',
    message: 'YOLOv8 inference running on CPU fallback (average latency 42ms).',
    resolved: true,
    resolvedAt: new Date()
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_traffic_db';
  console.log(`[Seed] Connecting to MongoDB: ${uri}`);
  try {
    await mongoose.connect(uri);
    console.log('[Seed] Clearing existing collections...');
    await Intersection.deleteMany({});
    await Alert.deleteMany({});

    console.log('[Seed] Inserting initial intersections...');
    await Intersection.insertMany(SEED_INTERSECTIONS);

    console.log('[Seed] Inserting initial alerts...');
    await Alert.insertMany(SEED_ALERTS);

    console.log('[Seed] ✅ Database seeding completed successfully.');
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
