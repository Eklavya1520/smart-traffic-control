import React, { useState, useEffect } from 'react';
import { Timer, ArrowUpDown, ArrowLeftRight } from 'lucide-react';

export default function SignalTimer({ signalPlan }) {
  const [activePhase, setActivePhase] = useState('NS'); // 'NS' or 'EW'
  const [lightColor, setLightColor] = useState('green');
  const [secondsRemaining, setSecondsRemaining] = useState(25);

  const nsGreen = signalPlan?.phaseA_NorthSouth?.green || 25;
  const ewGreen = signalPlan?.phaseB_EastWest?.green || 25;
  const yellowTime = signalPlan?.phaseA_NorthSouth?.yellow || 4;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev > 1) return prev - 1;

        // Transition light color & phase
        if (lightColor === 'green') {
          setLightColor('yellow');
          return yellowTime;
        } else {
          setLightColor('green');
          setActivePhase((p) => (p === 'NS' ? 'EW' : 'NS'));
          return activePhase === 'NS' ? ewGreen : nsGreen;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lightColor, activePhase, nsGreen, ewGreen, yellowTime]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#111827', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div className="traffic-light-rig">
          <div className={`light-lens red ${lightColor === 'red' ? 'active' : ''}`}></div>
          <div className={`light-lens yellow ${lightColor === 'yellow' ? 'active' : ''}`}></div>
          <div className={`light-lens green ${lightColor === 'green' ? 'active' : ''}`}></div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <Timer size={14} />
            <span>CURRENT PHASE:</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activePhase === 'NS' ? (
              <>
                <ArrowUpDown size={18} color="var(--accent-cyan)" />
                <span>North - South Flow</span>
              </>
            ) : (
              <>
                <ArrowLeftRight size={18} color="var(--accent-emerald)" />
                <span>East - West Flow</span>
              </>
            )}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Adaptive Green: <strong>{activePhase === 'NS' ? nsGreen : ewGreen}s</strong> | Cycle Length: <strong>{signalPlan?.cycleLength || 60}s</strong>
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>TIME REMAINING</span>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: lightColor === 'green' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
          {secondsRemaining}s
        </div>
      </div>
    </div>
  );
}
