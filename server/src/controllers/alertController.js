const Alert = require('../models/Alert');

const MOCK_ALERTS = [
  {
    _id: 'alert_01',
    intersectionId: 'INT_001',
    type: 'QUEUE_SPIKE',
    severity: 'WARNING',
    message: 'High vehicle accumulation detected on South Approach (22 PCU). Green phase auto-extended.',
    resolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 8)
  },
  {
    _id: 'alert_02',
    intersectionId: 'INT_002',
    type: 'HARDWARE_FAULT',
    severity: 'INFO',
    message: 'YOLOv8 inference running on CPU fallback (average latency 42ms).',
    resolved: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 45)
  }
];

exports.getAlerts = async (req, res, next) => {
  try {
    let alerts = [];
    if (Alert.db.readyState === 1) {
      alerts = await Alert.find().sort({ createdAt: -1 }).limit(30);
    }
    if (!alerts || alerts.length === 0) {
      alerts = MOCK_ALERTS;
    }
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    next(error);
  }
};

exports.resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    let alert = null;
    if (Alert.db.readyState === 1) {
      alert = await Alert.findByIdAndUpdate(
        id,
        { resolved: true, resolvedAt: new Date(), resolvedBy: 'operator' },
        { new: true }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('alert:resolved', { alertId: id });
    }

    res.json({ success: true, message: 'Alert marked as resolved', data: alert });
  } catch (error) {
    next(error);
  }
};
