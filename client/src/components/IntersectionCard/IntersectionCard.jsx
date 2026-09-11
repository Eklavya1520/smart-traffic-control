import React from 'react';
import { MapPin, TrendingUp, Sliders, ShieldCheck } from 'lucide-react';
import SignalTimer from '../SignalTimer/SignalTimer';

export default function IntersectionCard({ intersection, latestTelemetry, onManualOverride }) {
  const signalPlan = latestTelemetry?.signalPlan || intersection?.activeSignalPlan;
  const approachCounts = latestTelemetry?.approachCounts || { North: 12, South: 14, East: 6, West: 8 };
  const totalVehicles = latestTelemetry?.totalVehicles ?? 40;

  const maxCapacityPerApproach = 25;

  return (
    <div className="card">
      <div className="card-title-bar">
        <div>
          <h2 className="card-title">
            <MapPin size={18} color="var(--accent-cyan)" />
            <span>{intersection?.name || 'Downtown Central Crossing'}</span>
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ID: {intersection?.intersectionId || 'INT_001'} | Geo: {intersection?.geometryType || '4-way'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="status-pill" style={{ fontSize: '0.7rem' }}>
            <ShieldCheck size={12} />
            <span>{intersection?.status || 'ACTIVE'}</span>
          </span>
          <button
            onClick={() => onManualOverride(intersection?.intersectionId)}
            className="btn-resolve"
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Sliders size={12} />
            <span>Override</span>
          </button>
        </div>
      </div>

      <SignalTimer signalPlan={signalPlan} />

      <div style={{ marginTop: '1.25rem' }}>
        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>
          LIVE APPROACH QUEUE DEPTHS (TOTAL: {totalVehicles} VEHICLES)
        </h4>

        {Object.entries(approachCounts).map(([approach, count]) => {
          const percentage = Math.min(100, Math.round((count / maxCapacityPerApproach) * 100));
          let levelClass = 'normal';
          if (percentage > 70) levelClass = 'heavy';
          else if (percentage > 40) levelClass = 'warning';

          return (
            <div key={approach} className="approach-meter">
              <div className="approach-label-row">
                <span>{approach} Approach</span>
                <span><strong>{count}</strong> vehicles ({percentage}%)</span>
              </div>
              <div className="meter-track">
                <div className={`meter-fill ${levelClass}`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
          <TrendingUp size={16} />
          <span>Webster Efficiency Optimization Gain:</span>
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
          +{signalPlan?.efficiencyGainPercent || 31.4}%
        </span>
      </div>
    </div>
  );
}
