import React, { useState } from 'react';
import { MapPin, Compass, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function InteractiveMap({ intersections, selectedId, onSelectIntersection, latestTelemetry }) {
  const [mapLayer, setMapLayer] = useState('traffic'); // 'traffic', 'satellite', 'dark'

  const mockIntersections = [
    {
      intersectionId: 'INT_001',
      name: 'Downtown Central 4-Way',
      address: 'Main Ring Road & Central Ave Crossing',
      coords: { x: 380, y: 220 },
      lat: 28.6139,
      lng: 77.2090,
      status: 'ACTIVE',
      congestion: 'MEDIUM',
      queue: latestTelemetry?.totalVehicles || 38,
      pcu: 42.5
    },
    {
      intersectionId: 'INT_002',
      name: 'Tech Park Cyber Gateway',
      address: 'IT Corridor Sector 62 Expressway',
      coords: { x: 580, y: 140 },
      lat: 28.5355,
      lng: 77.3910,
      status: 'ACTIVE',
      congestion: 'LOW',
      queue: 18,
      pcu: 21.0
    },
    {
      intersectionId: 'INT_003',
      name: 'Airport Express Corridor',
      address: 'Terminal 3 Outer Ring Flyover',
      coords: { x: 220, y: 320 },
      lat: 28.5562,
      lng: 77.1000,
      status: 'ACTIVE',
      congestion: 'HIGH',
      queue: 52,
      pcu: 64.2
    }
  ];

  const currentList = intersections && intersections.length > 0 ? intersections.map((item, idx) => {
    const mock = mockIntersections.find(m => m.intersectionId === item.intersectionId) || mockIntersections[idx % mockIntersections.length];
    return {
      ...mock,
      ...item,
      coords: mock.coords,
      queue: item.intersectionId === selectedId ? (latestTelemetry?.totalVehicles || mock.queue) : mock.queue
    };
  }) : mockIntersections;

  return (
    <div className="card interactive-map-card">
      <div className="card-title-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={18} color="var(--accent-cyan)" />
          <h2 className="card-title" style={{ fontSize: '1rem' }}>
            <span>Live City Traffic Grid & Intersection GIS Map</span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Layer:</span>
          <button
            onClick={() => setMapLayer('traffic')}
            className={`cam-tab-btn ${mapLayer === 'traffic' ? 'active' : ''}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
          >
            Live Flow
          </button>
          <button
            onClick={() => setMapLayer('dark')}
            className={`cam-tab-btn ${mapLayer === 'dark' ? 'active' : ''}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
          >
            Dark Vector
          </button>
        </div>
      </div>

      {/* SVG Interactive Map Canvas */}
      <div className="map-viewport-wrapper">
        <svg className="map-svg" viewBox="0 0 800 420">
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Map Base Surface */}
          <rect x="0" y="0" width="800" height="420" fill="#090d16" />

          {/* City Grid Lines / Blocks */}
          <g stroke="#1a2234" strokeWidth="1" opacity="0.6">
            {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800].map(x => (
              <line key={`gx-${x}`} x1={x} y1="0" x2={x} y2="420" />
            ))}
            {[0, 70, 140, 210, 280, 350, 420].map(y => (
              <line key={`gy-${y}`} x1="0" y1={y} x2="800" y2={y} />
            ))}
          </g>

          {/* Major Highway Arteries */}
          {/* Main Ring Highway */}
          <path
            d="M 50,380 C 180,350 250,220 380,220 C 500,220 540,140 750,110"
            fill="none"
            stroke="#24324c"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 50,380 C 180,350 250,220 380,220 C 500,220 540,140 750,110"
            fill="none"
            stroke={mapLayer === 'traffic' ? '#06b6d4' : '#475569'}
            strokeWidth="4"
            strokeDasharray="8,6"
            opacity="0.85"
          />

          {/* Secondary Arterial Avenue */}
          <path
            d="M 380,30 L 380,400"
            fill="none"
            stroke="#24324c"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 380,30 L 380,400"
            fill="none"
            stroke={mapLayer === 'traffic' ? '#10b981' : '#475569'}
            strokeWidth="3"
            strokeDasharray="6,6"
            opacity="0.85"
          />

          {/* Express Corridor Link */}
          <path
            d="M 120,80 L 580,140 L 700,360"
            fill="none"
            stroke="#24324c"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 120,80 L 580,140 L 700,360"
            fill="none"
            stroke={mapLayer === 'traffic' ? '#f59e0b' : '#475569'}
            strokeWidth="3"
            strokeDasharray="6,6"
            opacity="0.85"
          />

          {/* Clickable Intersection Marker Nodes */}
          {currentList.map((item) => {
            const isSelected = item.intersectionId === selectedId;
            const x = item.coords.x;
            const y = item.coords.y;

            return (
              <g
                key={item.intersectionId}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectIntersection(item.intersectionId)}
                style={{ cursor: 'pointer' }}
                className="map-node-group"
              >
                {/* Radar Pulse Effect for Selected Node */}
                {isSelected && (
                  <circle cx="0" cy="0" r="26" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.6">
                    <animate attributeName="r" values="14;34;14" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Node Outer Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r={isSelected ? "18" : "14"}
                  fill={isSelected ? "#06b6d4" : "#1e293b"}
                  stroke={isSelected ? "#ffffff" : "#06b6d4"}
                  strokeWidth={isSelected ? "3" : "2"}
                  filter="url(#glowCyan)"
                />

                {/* Inner Icon */}
                <circle cx="0" cy="0" r="5" fill="#ffffff" />

                {/* Info Callout Box above pin */}
                <g transform="translate(-75, -60)">
                  <rect
                    x="0"
                    y="0"
                    width="150"
                    height="45"
                    rx="6"
                    fill="#111827"
                    stroke={isSelected ? "#06b6d4" : "#334155"}
                    strokeWidth={isSelected ? "2" : "1"}
                    opacity="0.95"
                  />
                  <text x="8" y="18" fill="#f8fafc" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">
                    {item.name}
                  </text>
                  <text x="8" y="34" fill="#94a3b8" fontSize="9.5" fontFamily="monospace">
                    Queue: {item.queue} veh | {item.status}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Map Overlay Selector Banner */}
        <div className="map-bottom-strip">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <strong>SELECT INTERSECTION:</strong> Click any pin on the map or quick-select below:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currentList.map((item) => (
              <button
                key={item.intersectionId}
                onClick={() => onSelectIntersection(item.intersectionId)}
                className={`btn-resolve ${item.intersectionId === selectedId ? 'active-pill' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  background: item.intersectionId === selectedId ? 'var(--accent-cyan)' : 'transparent',
                  color: item.intersectionId === selectedId ? '#0b0f19' : 'var(--text-primary)',
                  fontWeight: item.intersectionId === selectedId ? '700' : '500',
                  borderColor: item.intersectionId === selectedId ? 'var(--accent-cyan)' : 'var(--border-color)',
                }}
              >
                <MapPin size={13} />
                <span>{item.name} ({item.intersectionId})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
