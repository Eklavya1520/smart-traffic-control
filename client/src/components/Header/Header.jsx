import React from 'react';
import { Activity, Wifi, Cpu, Bell } from 'lucide-react';

export default function Header({ isConnected, alertCount, onOpenAlerts }) {
  return (
    <header className="header-container">
      <div className="logo-badge">
        <div className="logo-icon-box">
          <Activity size={22} />
        </div>
        <div>
          <h1 className="system-title">Smart Traffic Control System</h1>
          <p className="system-subtitle">YOLOv8 Edge Vision + Webster Signal Optimization Engine</p>
        </div>
      </div>

      <div className="header-status-group">
        <div className="status-pill">
          <span className={`pulse-dot ${isConnected ? '' : 'disconnected'}`}></span>
          <Wifi size={14} style={{ display: 'inline', marginRight: '4px' }} />
          <span>{isConnected ? 'WEBSOCKET: LIVE' : 'CONNECTING...'}</span>
        </div>

        <div className="status-pill" style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
          <Cpu size={14} />
          <span>INFERENCE: 32ms</span>
        </div>

        <button
          onClick={onOpenAlerts}
          className="btn-resolve"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}
        >
          <Bell size={14} />
          <span>Alerts ({alertCount})</span>
        </button>
      </div>
    </header>
  );
}