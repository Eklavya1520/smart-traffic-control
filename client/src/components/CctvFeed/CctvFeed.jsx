import React, { useState, useEffect } from 'react';
import { Eye, Zap, Sparkles, Layers } from 'lucide-react';

export default function CctvFeed({ intersection, latestTelemetry }) {
  const [activeCam, setActiveCam] = useState('OVERVIEW'); // 'OVERVIEW', 'NORTH', 'SOUTH', 'EAST', 'WEST'
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [simStep, setSimStep] = useState(0);

  // Approach counts from latest telemetry or defaults
  const approachCounts = latestTelemetry?.approachCounts || { North: 12, South: 14, East: 6, West: 8 };
  const fps = latestTelemetry?.fps || 24.8;
  const totalVehicles = latestTelemetry?.totalVehicles || 40;

  // Track simulation animation frame
  useEffect(() => {
    let animId;
    const updateSim = () => {
      setSimStep((prev) => (prev + 1) % 3600);
      animId = requestAnimationFrame(updateSim);
    };
    animId = requestAnimationFrame(updateSim);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Determine current active light phase from simStep
  const phaseNsIsGreen = Math.floor(simStep / 120) % 2 === 0;

  return (
    <div className="card cctv-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Top Bar / HUD Info */}
      <div className="card-title-bar" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="cctv-rec-indicator">
            <span className="cctv-rec-dot"></span>
            <span>LIVE CCTV</span>
          </div>
          <h2 className="card-title" style={{ fontSize: '1rem' }}>
            <span>YOLOv8 Real-Time Intersection Vision Feed</span>
          </h2>
        </div>

        {/* Camera Selector Tabs */}
        <div className="cam-selector-group">
          {['OVERVIEW', 'NORTH', 'SOUTH', 'EAST', 'WEST'].map((cam) => (
            <button
              key={cam}
              onClick={() => setActiveCam(cam)}
              className={`cam-tab-btn ${activeCam === cam ? 'active' : ''}`}
            >
              {cam === 'OVERVIEW' ? '4-Way Quad' : `${cam} Cam`}
            </button>
          ))}
        </div>
      </div>

      {/* Main CCTV Stream Viewport */}
      <div className={`cctv-viewport ${nightMode ? 'night-mode' : ''}`}>
        {/* HUD Overlay Details */}
        <div className="cctv-hud-top">
          <div className="hud-badge">
            <span className="hud-label">CAM:</span>
            <span className="hud-val">{intersection?.intersectionId || 'INT_001'}-{activeCam}</span>
          </div>
          <div className="hud-badge">
            <span className="hud-label">FPS:</span>
            <span className="hud-val">{(fps + (Math.sin(simStep * 0.1) * 0.4)).toFixed(1)}</span>
          </div>
          <div className="hud-badge">
            <span className="hud-label">MODEL:</span>
            <span className="hud-val">YOLOv8x-traffic-v2.pt</span>
          </div>
          <div className="hud-badge">
            <span className="hud-label">LATENCY:</span>
            <span className="hud-val">28ms (CUDA TensorRT)</span>
          </div>
          <div className="hud-badge" style={{ marginLeft: 'auto' }}>
            <span className="hud-val">{new Date().toLocaleTimeString()} UTC+5:30</span>
          </div>
        </div>

        {/* 4-Way Road Graphic & Animated Vehicles with YOLO Bounding Boxes */}
        <div className="road-junction-stage">
          {/* SVG Road Layout */}
          <svg className="road-svg-layer" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
            {/* Background Grass / Terrain */}
            <rect x="0" y="0" width="800" height="450" fill={nightMode ? '#070b12' : '#141d2b'} />

            {/* Corner Curbs / Buildings */}
            <rect x="0" y="0" width="310" height="135" rx="8" fill={nightMode ? '#0f172a' : '#1e293b'} stroke="#334155" strokeWidth="2" />
            <rect x="490" y="0" width="310" height="135" rx="8" fill={nightMode ? '#0f172a' : '#1e293b'} stroke="#334155" strokeWidth="2" />
            <rect x="0" y="315" width="310" height="135" rx="8" fill={nightMode ? '#0f172a' : '#1e293b'} stroke="#334155" strokeWidth="2" />
            <rect x="490" y="315" width="310" height="135" rx="8" fill={nightMode ? '#0f172a' : '#1e293b'} stroke="#334155" strokeWidth="2" />

            {/* Asphalt Roads */}
            <rect x="0" y="135" width="800" height="180" fill="#232733" />
            <rect x="310" y="0" width="180" height="450" fill="#232733" />

            {/* Intersection Center Box */}
            <rect x="310" y="135" width="180" height="180" fill="#282d3c" />

            {/* Yellow Center Dividing Lines */}
            <line x1="400" y1="0" x2="400" y2="135" stroke="#f59e0b" strokeWidth="3" strokeDasharray="12,8" />
            <line x1="400" y1="315" x2="400" y2="450" stroke="#f59e0b" strokeWidth="3" strokeDasharray="12,8" />
            <line x1="0" y1="225" x2="310" y2="225" stroke="#f59e0b" strokeWidth="3" strokeDasharray="12,8" />
            <line x1="490" y1="225" x2="800" y2="225" stroke="#f59e0b" strokeWidth="3" strokeDasharray="12,8" />

            {/* White Lane Dividers */}
            <line x1="355" y1="0" x2="355" y2="135" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />
            <line x1="445" y1="0" x2="445" y2="135" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />
            <line x1="355" y1="315" x2="355" y2="450" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />
            <line x1="445" y1="315" x2="445" y2="450" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />
            <line x1="0" y1="180" x2="310" y2="180" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />
            <line x1="0" y1="270" x2="310" y2="270" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />
            <line x1="490" y1="180" x2="800" y2="180" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />
            <line x1="490" y1="270" x2="800" y2="270" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="8,8" opacity="0.5" />

            {/* Stop Lines & Pedestrian Crosswalks (Zebra Crossing) */}
            <g opacity="0.7">
              {[320, 340, 360, 380, 400, 420, 440, 460].map((x) => (
                <rect key={`nx-${x}`} x={x} y="125" width="12" height="10" fill="#ffffff" />
              ))}
              <line x1="310" y1="135" x2="490" y2="135" stroke={phaseNsIsGreen ? '#10b981' : '#ef4444'} strokeWidth="4" />
            </g>

            <g opacity="0.7">
              {[320, 340, 360, 380, 400, 420, 440, 460].map((x) => (
                <rect key={`sx-${x}`} x={x} y="315" width="12" height="10" fill="#ffffff" />
              ))}
              <line x1="310" y1="315" x2="490" y2="315" stroke={phaseNsIsGreen ? '#10b981' : '#ef4444'} strokeWidth="4" />
            </g>

            <g opacity="0.7">
              {[145, 165, 185, 205, 225, 245, 265, 285].map((y) => (
                <rect key={`wx-${y}`} x="300" y={y} width="10" height="12" fill="#ffffff" />
              ))}
              <line x1="310" y1="135" x2="310" y2="315" stroke={!phaseNsIsGreen ? '#10b981' : '#ef4444'} strokeWidth="4" />
            </g>

            <g opacity="0.7">
              {[145, 165, 185, 205, 225, 245, 265, 285].map((y) => (
                <rect key={`ex-${y}`} x="490" y={y} width="10" height="12" fill="#ffffff" />
              ))}
              <line x1="490" y1="135" x2="490" y2="315" stroke={!phaseNsIsGreen ? '#10b981' : '#ef4444'} strokeWidth="4" />
            </g>

            {/* AI Zone Detection Overlay Boxes (when enabled) */}
            {showZones && (
              <>
                <rect x="315" y="10" width="80" height="115" fill="rgba(6, 182, 212, 0.12)" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="320" y="25" fill="#06b6d4" fontSize="10" fontFamily="monospace" fontWeight="bold">ZONE-N1 ({approachCounts.North})</text>

                <rect x="405" y="325" width="80" height="115" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.6)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="410" y="340" fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="bold">ZONE-S1 ({approachCounts.South})</text>

                <rect x="10" y="140" width="290" height="80" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="20" y="155" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">ZONE-W1 ({approachCounts.West})</text>

                <rect x="500" y="230" width="290" height="80" fill="rgba(244, 63, 94, 0.12)" stroke="rgba(244, 63, 94, 0.6)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="510" y="245" fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">ZONE-E1 ({approachCounts.East})</text>
              </>
            )}

            {/* Traffic Signal Lights Graphic */}
            <g transform="translate(290, 110)">
              <rect x="0" y="0" width="16" height="24" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <circle cx="8" cy="7" r="4" fill={!phaseNsIsGreen ? '#ef4444' : '#334155'} />
              <circle cx="8" cy="17" r="4" fill={phaseNsIsGreen ? '#10b981' : '#334155'} />
            </g>
            <g transform="translate(495, 315)">
              <rect x="0" y="0" width="16" height="24" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <circle cx="8" cy="7" r="4" fill={!phaseNsIsGreen ? '#ef4444' : '#334155'} />
              <circle cx="8" cy="17" r="4" fill={phaseNsIsGreen ? '#10b981' : '#334155'} />
            </g>
            <g transform="translate(290, 205)">
              <rect x="0" y="0" width="16" height="24" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <circle cx="8" cy="7" r="4" fill={phaseNsIsGreen ? '#ef4444' : '#334155'} />
              <circle cx="8" cy="17" r="4" fill={!phaseNsIsGreen ? '#10b981' : '#334155'} />
            </g>
            <g transform="translate(495, 205)">
              <rect x="0" y="0" width="16" height="24" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
              <circle cx="8" cy="7" r="4" fill={phaseNsIsGreen ? '#ef4444' : '#334155'} />
              <circle cx="8" cy="17" r="4" fill={!phaseNsIsGreen ? '#10b981' : '#334155'} />
            </g>
          </svg>

          {/* Animated Dynamic Vehicles & YOLO Bounding Box Elements */}
          <div className="vehicles-overlay-layer">
            {/* North Approaching Vehicles */}
            <div
              className={`yolo-vehicle-box`}
              style={{
                top: phaseNsIsGreen ? `${((simStep * 2.8) % 450)}px` : '75px',
                left: '335px',
                width: '26px',
                height: '42px',
                backgroundColor: '#3b82f6',
              }}
            >
              {showBoxes && <div className="yolo-box-border cyan"></div>}
              {showLabels && <div className="yolo-label cyan">car 97%</div>}
            </div>

            <div
              className={`yolo-vehicle-box`}
              style={{
                top: phaseNsIsGreen ? `${((simStep * 2.8 + 60) % 450)}px` : '20px',
                left: '365px',
                width: '30px',
                height: '56px',
                backgroundColor: '#eab308',
              }}
            >
              {showBoxes && <div className="yolo-box-border amber"></div>}
              {showLabels && <div className="yolo-label amber">bus 94%</div>}
            </div>

            {/* South Approaching Vehicles */}
            <div
              className={`yolo-vehicle-box`}
              style={{
                top: phaseNsIsGreen ? `${450 - ((simStep * 2.8) % 450)}px` : '340px',
                left: '420px',
                width: '28px',
                height: '46px',
                backgroundColor: '#10b981',
              }}
            >
              {showBoxes && <div className="yolo-box-border emerald"></div>}
              {showLabels && <div className="yolo-label emerald">suv 98%</div>}
            </div>

            <div
              className={`yolo-vehicle-box`}
              style={{
                top: phaseNsIsGreen ? `${450 - ((simStep * 2.8 + 70) % 450)}px` : '395px',
                left: '450px',
                width: '32px',
                height: '60px',
                backgroundColor: '#8b5cf6',
              }}
            >
              {showBoxes && <div className="yolo-box-border purple"></div>}
              {showLabels && <div className="yolo-label purple">truck 91%</div>}
            </div>

            {/* West Approaching Vehicles */}
            <div
              className={`yolo-vehicle-box`}
              style={{
                top: '150px',
                left: !phaseNsIsGreen ? `${((simStep * 2.8) % 800)}px` : '240px',
                width: '44px',
                height: '26px',
                backgroundColor: '#06b6d4',
              }}
            >
              {showBoxes && <div className="yolo-box-border cyan"></div>}
              {showLabels && <div className="yolo-label cyan">car 95%</div>}
            </div>

            <div
              className={`yolo-vehicle-box`}
              style={{
                top: '190px',
                left: !phaseNsIsGreen ? `${((simStep * 2.8 + 80) % 800)}px` : '170px',
                width: '40px',
                height: '24px',
                backgroundColor: '#ec4899',
              }}
            >
              {showBoxes && <div className="yolo-box-border pink"></div>}
              {showLabels && <div className="yolo-label pink">moto 89%</div>}
            </div>

            {/* East Approaching Vehicles */}
            <div
              className={`yolo-vehicle-box`}
              style={{
                top: '240px',
                left: !phaseNsIsGreen ? `${800 - ((simStep * 2.8) % 800)}px` : '520px',
                width: '46px',
                height: '28px',
                backgroundColor: '#f97316',
              }}
            >
              {showBoxes && <div className="yolo-box-border orange"></div>}
              {showLabels && <div className="yolo-label orange">car 96%</div>}
            </div>

            <div
              className={`yolo-vehicle-box`}
              style={{
                top: '275px',
                left: !phaseNsIsGreen ? `${800 - ((simStep * 2.8 + 100) % 800)}px` : '590px',
                width: '58px',
                height: '32px',
                backgroundColor: '#64748b',
              }}
            >
              {showBoxes && <div className="yolo-box-border gray"></div>}
              {showLabels && <div className="yolo-label gray">bus 93%</div>}
            </div>
          </div>
        </div>

        {/* Bottom CCTV Status / AI Detections Summary */}
        <div className="cctv-hud-bottom">
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              AI DETECTIONS:
            </span>
            <span className="hud-badge green">Cars: {Math.round(totalVehicles * 0.65)}</span>
            <span className="hud-badge amber">Buses: {Math.max(1, Math.round(totalVehicles * 0.1))}</span>
            <span className="hud-badge cyan">Trucks: {Math.max(1, Math.round(totalVehicles * 0.1))}</span>
            <span className="hud-badge purple">Bikes: {Math.round(totalVehicles * 0.15)}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={`hud-toggle-btn ${showBoxes ? 'active' : ''}`}
              title="Toggle Bounding Boxes"
            >
              <Eye size={12} />
              <span>Boxes</span>
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`hud-toggle-btn ${showLabels ? 'active' : ''}`}
              title="Toggle Labels"
            >
              <Sparkles size={12} />
              <span>Labels</span>
            </button>
            <button
              onClick={() => setShowZones(!showZones)}
              className={`hud-toggle-btn ${showZones ? 'active' : ''}`}
              title="Toggle Zone Overlays"
            >
              <Layers size={12} />
              <span>Zones</span>
            </button>
            <button
              onClick={() => setNightMode(!nightMode)}
              className={`hud-toggle-btn ${nightMode ? 'active' : ''}`}
              title="Toggle Night Vision / Infrared"
            >
              <Zap size={12} />
              <span>{nightMode ? 'IR Night' : 'Day Cam'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
