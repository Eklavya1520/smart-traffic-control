import React, { useState } from 'react';
import { Sliders, Zap, AlertTriangle, ArrowUpDown, ArrowLeftRight, RotateCcw, Siren } from 'lucide-react';
import { triggerManualOverride } from '../../services/api';

export default function SimulationControls({ intersectionId, onSimulateSurge, onSimulateAlert, onResetSystem }) {
  const [activeOverride, setActiveOverride] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleOverride = async (phase, duration) => {
    setLoading(true);
    try {
      await triggerManualOverride(intersectionId, phase, duration);
      setActiveOverride(phase);
      showToast(`⚡ Signal Override Dispatched: Forced ${phase === 'PHASE_A_NS' ? 'North-South' : 'East-West'} Green for ${duration}s!`);
    } catch (e) {
      showToast(`⚠️ Override Triggered locally for ${phase}`);
      setActiveOverride(phase);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyVehicle = () => {
    handleOverride('PHASE_A_NS', 45);
    onSimulateAlert({
      _id: `alert_em_${Date.now()}`,
      intersectionId,
      type: 'EMERGENCY_PREEMPTION',
      severity: 'CRITICAL',
      message: '🚨 Priority Emergency Vehicle (Ambulance) detected. North-South corridor granted instant green preemption.',
      resolved: false,
      createdAt: new Date().toISOString()
    });
    showToast('🚨 Ambulance Corridor Activated! North-South green preemption locked.');
  };

  const handleRushHour = () => {
    onSimulateSurge('SURGE');
    onSimulateAlert({
      _id: `alert_surge_${Date.now()}`,
      intersectionId,
      type: 'QUEUE_SPIKE',
      severity: 'WARNING',
      message: '⚠️ Acute traffic surge injected. Webster algorithm auto-scaling cycle length to 90s.',
      resolved: false,
      createdAt: new Date().toISOString()
    });
    showToast('🚗 Rush-hour surge injected! Vehicle queues increased.');
  };

  const handleReset = () => {
    setActiveOverride(null);
    if (onResetSystem) onResetSystem();
    showToast('🔄 Restored system to Auto-Adaptive Webster optimization.');
  };

  return (
    <div className="card sim-controls-card">
      <div className="card-title-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={18} color="var(--accent-amber)" />
          <h2 className="card-title" style={{ fontSize: '1rem' }}>
            <span>Interactive Signal & Traffic Simulator Deck</span>
          </h2>
        </div>

        {activeOverride && (
          <span className="status-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', borderColor: 'var(--accent-amber)' }}>
            MANUAL OVERRIDE ACTIVE
          </span>
        )}
      </div>

      {notification && (
        <div className="sim-toast-banner">
          <span>{notification}</span>
        </div>
      )}

      <div className="sim-controls-grid">
        {/* Signal Overrides Section */}
        <div className="sim-control-group">
          <h4 className="sim-group-heading">
            <Zap size={14} color="var(--accent-cyan)" />
            <span>Manual Signal Phasing</span>
          </h4>
          <p className="sim-group-sub">Force immediate green light allocations</p>
          <div className="sim-btn-row">
            <button
              onClick={() => handleOverride('PHASE_A_NS', 30)}
              disabled={loading}
              className={`sim-action-btn ${activeOverride === 'PHASE_A_NS' ? 'active-green' : ''}`}
            >
              <ArrowUpDown size={14} />
              <span>Force North-South (30s)</span>
            </button>
            <button
              onClick={() => handleOverride('PHASE_B_EW', 30)}
              disabled={loading}
              className={`sim-action-btn ${activeOverride === 'PHASE_B_EW' ? 'active-green' : ''}`}
            >
              <ArrowLeftRight size={14} />
              <span>Force East-West (30s)</span>
            </button>
          </div>
        </div>

        {/* Real-Time Event Injection */}
        <div className="sim-control-group">
          <h4 className="sim-group-heading">
            <AlertTriangle size={14} color="var(--accent-rose)" />
            <span>Simulate Live Traffic Events</span>
          </h4>
          <p className="sim-group-sub">Inject real-world anomalies into AI model</p>
          <div className="sim-btn-row">
            <button
              onClick={handleEmergencyVehicle}
              className="sim-action-btn emergency"
            >
              <Siren size={14} />
              <span>Ambulance Corridor</span>
            </button>
            <button
              onClick={handleRushHour}
              className="sim-action-btn surge"
            >
              <Zap size={14} />
              <span>Rush Hour Surge (+15 Cars)</span>
            </button>
            <button
              onClick={handleReset}
              className="sim-action-btn reset"
            >
              <RotateCcw size={14} />
              <span>Auto-Adaptive Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
