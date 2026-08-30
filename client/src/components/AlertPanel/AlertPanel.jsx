import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function AlertPanel({ alerts, onResolve }) {
  const activeAlerts = alerts?.filter((a) => !a.resolved) || [];

  return (
    <div className="card">
      <div className="card-title-bar">
        <h2 className="card-title">
          <AlertTriangle size={18} color="var(--accent-amber)" />
          <span>Active System Alerts ({activeAlerts.length})</span>
        </h2>
      </div>

      <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {activeAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={32} color="var(--accent-emerald)" style={{ marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.9rem' }}>All systems and camera streams operational.</p>
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div key={alert._id} className={`alert-item ${alert.severity}`}>
              <div>
                <p className="alert-msg">{alert.message}</p>
                <div className="alert-meta">
                  <span>Intersection: {alert.intersectionId}</span>
                  <span style={{ margin: '0 0.4rem' }}>•</span>
                  <span>
                    <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <button onClick={() => onResolve(alert._id)} className="btn-resolve">
                Acknowledge
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
