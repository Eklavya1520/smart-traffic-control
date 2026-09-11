import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Info, Siren } from 'lucide-react';

export default function AlertModal({ isOpen, onClose, alerts, onResolveAlert, onClearAll }) {
  const [filter, setFilter] = useState('ALL');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'UNRESOLVED') return !a.resolved;
    if (filter === 'RESOLVED') return a.resolved;
    if (filter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (filter === 'WARNING') return a.severity === 'WARNING';
    return true;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={20} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>System Incidents & Alerts Log</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="modal-toolbar">
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'UNRESOLVED', 'CRITICAL', 'WARNING', 'RESOLVED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`cam-tab-btn ${filter === f ? 'active' : ''}`}
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
              >
                {f}
              </button>
            ))}
          </div>

          {onClearAll && alerts.length > 0 && (
            <button
              onClick={onClearAll}
              className="btn-resolve"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem' }}
            >
              <CheckCircle2 size={13} />
              <span>Resolve All</span>
            </button>
          )}
        </div>

        {/* Alert List */}
        <div className="modal-body-list">
          {filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ margin: '0 auto 0.5rem auto' }} />
              <p>No alerts matching current filter.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert._id || alert.id}
                className={`alert-item ${alert.severity} ${alert.resolved ? 'resolved' : ''}`}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {alert.severity === 'CRITICAL' ? (
                    <Siren size={18} color="var(--accent-rose)" />
                  ) : alert.severity === 'WARNING' ? (
                    <AlertTriangle size={18} color="var(--accent-amber)" />
                  ) : (
                    <Info size={18} color="var(--accent-cyan)" />
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className={`hud-badge ${alert.severity === 'CRITICAL' ? 'rose' : alert.severity === 'WARNING' ? 'amber' : 'cyan'}`}>
                        {alert.type || 'TRAFFIC_INCIDENT'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {alert.intersectionId || 'INT_001'}
                      </span>
                    </div>
                    <p className="alert-msg">{alert.message}</p>
                    <span className="alert-meta">
                      {new Date(alert.createdAt || Date.now()).toLocaleTimeString()} | Status: {alert.resolved ? 'RESOLVED' : 'ACTIVE'}
                    </span>
                  </div>
                </div>

                {!alert.resolved && (
                  <button
                    onClick={() => onResolveAlert(alert._id || alert.id)}
                    className="btn-resolve"
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
