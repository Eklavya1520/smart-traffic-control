/**
 * uptimeMonitor.js
 * Periodically monitors intersection telemetry age and triggers alerts for stale streams.
 */

const Intersection = require('../models/Intersection');
const Alert = require('../models/Alert');

function initUptimeMonitor(io, intervalMs = 30000) {
  setInterval(async () => {
    try {
      if (Intersection.db.readyState !== 1) return;

      const thresholdSeconds = parseInt(process.env.STALE_DATA_THRESHOLD_SECONDS, 10) || 120;
      const cutoff = new Date(Date.now() - thresholdSeconds * 1000);

      const staleIntersections = await Intersection.find({
        lastTelemetryReceivedAt: { $lt: cutoff },
        status: { $ne: 'OFFLINE' }
      });

      for (const item of staleIntersections) {
        // Check if an unresolved alert already exists
        const existingAlert = await Alert.findOne({
          intersectionId: item.intersectionId,
          type: 'STALE_DATA',
          resolved: false
        });

        if (!existingAlert) {
          const newAlert = await Alert.create({
            intersectionId: item.intersectionId,
            type: 'STALE_DATA',
            severity: 'CRITICAL',
            message: `No video telemetry received from ${item.name} for >${thresholdSeconds}s. Signal reverted to failsafe fixed cycle.`,
            details: { lastSeen: item.lastTelemetryReceivedAt }
          });

          await Intersection.findByIdAndUpdate(item._id, { status: 'DEGRADED' });

          if (io) {
            io.emit('alert:new', newAlert);
            io.emit('intersection:status_change', {
              intersectionId: item.intersectionId,
              status: 'DEGRADED'
            });
          }
          console.warn(`[ALERT] Created STALE_DATA alert for intersection: ${item.intersectionId}`);
        }
      }
    } catch (err) {
      console.error('[UptimeMonitor] Error checking stream health:', err.message);
    }
  }, intervalMs);
}

module.exports = { initUptimeMonitor };
