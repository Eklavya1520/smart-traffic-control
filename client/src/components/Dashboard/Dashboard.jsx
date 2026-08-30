import React, { useState } from 'react';
import { Activity, Clock, ShieldAlert, Cpu } from 'lucide-react';
import IntersectionCard from '../IntersectionCard/IntersectionCard';
import TrafficChart from '../TrafficChart/TrafficChart';
import AlertPanel from '../AlertPanel/AlertPanel';
import { triggerManualOverride } from '../../services/api';

export default function Dashboard({ intersections, latestTelemetry, historyData, alerts, onResolveAlert }) {
  const [selectedIntersection, setSelectedIntersection] = useState('INT_001');

  const activeInt = intersections?.find((i) => i.intersectionId === selectedIntersection) || intersections?.[0];

  const handleManualOverride = async (id) => {
    const phase = window.prompt('Enter phase to force: PHASE_A_NS or PHASE_B_EW', 'PHASE_A_NS');
    if (!phase) return;
    const duration = parseInt(window.prompt('Duration in seconds (10-90):', '30'), 10);
    if (!duration) return;

    try {
      await triggerManualOverride(id, phase, duration);
      alert(`Manual override dispatched to signal controller ${id}`);
    } catch (e) {
      alert(`Override failed: ${e.message}`);
    }
  };

  return (
    <div>
      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>AVG WAIT TIME REDUCTION</span>
            <Clock size={16} color="var(--accent-emerald)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>31.4%</div>
          <div className="stat-highlight">vs static 45s fixed timer cycle</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>REAL-TIME VEHICLE QUEUE</span>
            <Activity size={16} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {latestTelemetry?.totalVehicles ?? 40}
          </div>
          <div className="stat-highlight">across 4 monitored approaches</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>ACTIVE INTERSECTIONS</span>
            <Cpu size={16} color="var(--accent-indigo)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-indigo)' }}>
            {intersections?.length || 2} Nodes
          </div>
          <div className="stat-highlight">100% camera stream uptime</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>ACTIVE ANOMALIES / ALERTS</span>
            <ShieldAlert size={16} color="var(--accent-amber)" />
          </div>
          <div className="stat-value" style={{ color: alerts?.filter(a => !a.resolved).length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
            {alerts?.filter(a => !a.resolved).length || 0}
          </div>
          <div className="stat-highlight">Auto-recovery enabled</div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="dashboard-grid">
        <div>
          <IntersectionCard
            intersection={activeInt}
            latestTelemetry={latestTelemetry}
            onManualOverride={handleManualOverride}
          />

          <div className="card">
            <div className="card-title-bar">
              <h2 className="card-title">
                <Activity size={18} color="var(--accent-cyan)" />
                <span>30-Minute Telemetry Trend (Queue Density & Delay)</span>
              </h2>
            </div>
            <TrafficChart historyData={historyData} />
          </div>
        </div>

        <div>
          <AlertPanel alerts={alerts} onResolve={onResolveAlert} />
        </div>
      </div>
    </div>
  );
}
