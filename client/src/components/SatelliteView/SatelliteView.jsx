import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Maximize2,
  Minimize2,
  Crosshair,
  Eye,
  Radio,
  Zap,
  Navigation,
  Car,
  Flame
} from 'lucide-react';

// Tile provider URLs
const TILE_LAYERS = {
  hybrid: {
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Hybrid'
  },
  satellite: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Satellite Imagery'
  },
  esri: {
    name: 'Esri World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '&copy; Esri & Maxar'
  },
  dark: {
    name: 'Dark Tactical GIS',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; CartoDB Dark Matter'
  },
  osm: {
    name: 'Standard Roads',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }
};

// Known intersection GPS coordinates with road vectors
const INTERSECTION_DATA = {
  INT_001: {
    name: 'Downtown Central 4-Way Crossing',
    city: 'New Delhi',
    lat: 28.6328,
    lng: 77.2197,
    zoom: 18
  },
  INT_002: {
    name: 'Tech Park Cyber Gateway',
    city: 'Cyber City Expressway',
    lat: 28.4950,
    lng: 77.0895,
    zoom: 18
  },
  INT_003: {
    name: 'Airport Express Corridor',
    city: 'T3 Aerocity Interchange',
    lat: 28.5562,
    lng: 77.1000,
    zoom: 18
  }
};

export default function SatelliteView({ intersection, latestTelemetry, onSelectIntersection }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const overlaysLayerRef = useRef(null);
  const vehicleLayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('hybrid');
  const [showTrafficFlow, setShowTrafficFlow] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showDetectionZones, setShowDetectionZones] = useState(true);
  const [showSignalHud, setShowSignalHud] = useState(true);
  const [infraredFilter, setInfraredFilter] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [currentCoords, setCurrentCoords] = useState({ lat: 28.6328, lng: 77.2197, zoom: 18 });

  // Get current intersection info
  const intId = intersection?.intersectionId || 'INT_001';
  const intConfig = INTERSECTION_DATA[intId] || {
    name: intersection?.name || 'Metropolitan Intersection',
    city: 'Urban Grid',
    lat: intersection?.location?.lat || 28.6328,
    lng: intersection?.location?.lng || 77.2197,
    zoom: 18
  };

  const approachCounts = latestTelemetry?.approachCounts || { North: 12, South: 14, East: 6, West: 8 };
  const totalVehicles = latestTelemetry?.totalVehicles || 40;
  const signalPlan = latestTelemetry?.signalPlan;

  // Signal phase calculations
  const phaseNsIsGreen = Math.floor(simStep / 140) % 2 === 0;
  const phaseTimeRemaining = 25 - (Math.floor(simStep / 5.6) % 25);

  // Animation frame loop for real-time vehicle movement
  useEffect(() => {
    let animId;
    const stepLoop = () => {
      setSimStep((prev) => (prev + 1) % 10000);
      animId = requestAnimationFrame(stepLoop);
    };
    animId = requestAnimationFrame(stepLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [intConfig.lat, intConfig.lng],
        zoom: intConfig.zoom || 18,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 20,
        minZoom: 14
      });

      // Layer groups
      const overlaysGroup = L.layerGroup().addTo(map);
      const vehicleGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      overlaysLayerRef.current = overlaysGroup;
      vehicleLayerRef.current = vehicleGroup;

      map.on('move', () => {
        const center = map.getCenter();
        setCurrentCoords({
          lat: parseFloat(center.lat.toFixed(5)),
          lng: parseFloat(center.lng.toFixed(5)),
          zoom: Math.round(map.getZoom())
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update base tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS[activeLayer] || TILE_LAYERS.hybrid;
    const layer = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains || 'abc',
      maxZoom: cfg.maxZoom || 20,
      attribution: cfg.attribution
    });

    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [activeLayer]);

  // Smoothly FlyTo when intersection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([intConfig.lat, intConfig.lng], intConfig.zoom || 18, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [intId, intConfig.lat, intConfig.lng, intConfig.zoom]);

  // Render Google Maps Style Traffic Flow Polylines & Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlayLayer = overlaysLayerRef.current;
    if (!map || !overlayLayer) return;

    overlayLayer.clearLayers();

    const centerLat = intConfig.lat;
    const centerLng = intConfig.lng;

    // Center Intersection Signal Beacon & Pulse
    const centerIcon = L.divIcon({
      className: 'custom-center-pin',
      html: `
        <div class="sat-center-beacon">
          <div class="beacon-pulse ${phaseNsIsGreen ? 'ns-green' : 'ew-green'}"></div>
          <div class="beacon-core ${phaseNsIsGreen ? 'green' : 'amber'}">
            <span class="beacon-text">${intId}</span>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    L.marker([centerLat, centerLng], { icon: centerIcon }).addTo(overlayLayer);

    if (showTrafficFlow) {
      // Create realistic Google Maps style colored traffic polylines along approaches
      const roadVectors = [
        {
          name: 'North Approach',
          count: approachCounts.North,
          coords: [
            [centerLat + 0.0028, centerLng],
            [centerLat + 0.0014, centerLng],
            [centerLat + 0.0003, centerLng]
          ],
          speed: phaseNsIsGreen ? '42 km/h' : '8 km/h'
        },
        {
          name: 'South Approach',
          count: approachCounts.South,
          coords: [
            [centerLat - 0.0028, centerLng],
            [centerLat - 0.0014, centerLng],
            [centerLat - 0.0003, centerLng]
          ],
          speed: phaseNsIsGreen ? '38 km/h' : '6 km/h'
        },
        {
          name: 'East Approach',
          count: approachCounts.East,
          coords: [
            [centerLat, centerLng + 0.0035],
            [centerLat, centerLng + 0.0018],
            [centerLat, centerLng + 0.0004]
          ],
          speed: !phaseNsIsGreen ? '45 km/h' : '11 km/h'
        },
        {
          name: 'West Approach',
          count: approachCounts.West,
          coords: [
            [centerLat, centerLng - 0.0035],
            [centerLat, centerLng - 0.0018],
            [centerLat, centerLng - 0.0004]
          ],
          speed: !phaseNsIsGreen ? '48 km/h' : '14 km/h'
        }
      ];

      roadVectors.forEach((road) => {
        // Determine Google Maps traffic color based on vehicle count
        let color = '#22c55e'; // Green - free flow
        let opacity = 0.88;
        let flowStatus = 'FREE FLOW';

        if (road.count > 20) {
          color = '#ef4444'; // Red - heavy delay
          flowStatus = 'HEAVY QUEUE';
        } else if (road.count > 10) {
          color = '#f59e0b'; // Amber - moderate congestion
          flowStatus = 'MODERATE';
        }

        // Draw shadow/outline for Google Maps polyline depth
        L.polyline(road.coords, {
          color: '#000000',
          weight: 10,
          opacity: 0.65,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(overlayLayer);

        // Draw primary colored traffic flow line
        const line = L.polyline(road.coords, {
          color: color,
          weight: 6,
          opacity: opacity,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(overlayLayer);

        // Add Google Maps styled tooltip
        line.bindTooltip(
          `<strong>${road.name}</strong><br/>Density: ${road.count} vehicles (${flowStatus})<br/>Avg Speed: ${road.speed}`,
          { permanent: false, direction: 'top', className: 'gmaps-tooltip' }
        );
      });
    }

    // AI Zone Boundary Detection Polygons
    if (showDetectionZones) {
      const zoneNorth = [
        [centerLat + 0.0005, centerLng - 0.0006],
        [centerLat + 0.0022, centerLng - 0.0006],
        [centerLat + 0.0022, centerLng + 0.0006],
        [centerLat + 0.0005, centerLng + 0.0006]
      ];
      const zoneSouth = [
        [centerLat - 0.0005, centerLng - 0.0006],
        [centerLat - 0.0022, centerLng - 0.0006],
        [centerLat - 0.0022, centerLng + 0.0006],
        [centerLat - 0.0005, centerLng + 0.0006]
      ];

      L.polygon(zoneNorth, {
        color: '#06b6d4',
        weight: 1.5,
        fillColor: '#06b6d4',
        fillOpacity: 0.12,
        dashArray: '4,4'
      }).bindTooltip(`Zone North-1: ${approachCounts.North} veh`, { permanent: false }).addTo(overlayLayer);

      L.polygon(zoneSouth, {
        color: '#10b981',
        weight: 1.5,
        fillColor: '#10b981',
        fillOpacity: 0.12,
        dashArray: '4,4'
      }).bindTooltip(`Zone South-1: ${approachCounts.South} veh`, { permanent: false }).addTo(overlayLayer);
    }
  }, [
    intId,
    intConfig.lat,
    intConfig.lng,
    showTrafficFlow,
    showDetectionZones,
    approachCounts.North,
    approachCounts.South,
    approachCounts.East,
    approachCounts.West,
    phaseNsIsGreen
  ]);

  // Render Real-Time Animated Vehicles on Satellite View
  useEffect(() => {
    const vehicleLayer = vehicleLayerRef.current;
    if (!vehicleLayer || !showVehicles) {
      if (vehicleLayer) vehicleLayer.clearLayers();
      return;
    }

    vehicleLayer.clearLayers();

    const centerLat = intConfig.lat;
    const centerLng = intConfig.lng;

    const progressNS = (simStep * 0.008) % 1;
    const progressEW = (simStep * 0.008) % 1;

    // Vehicle fleet specification
    const vehicles = [
      // North to South Approach
      {
        id: 'v1',
        type: 'Car',
        color: '#38bdf8',
        speed: phaseNsIsGreen ? 46 : 0,
        lat: phaseNsIsGreen
          ? centerLat + 0.0025 - progressNS * 0.005
          : centerLat + 0.0008,
        lng: centerLng - 0.00018,
        heading: 180
      },
      {
        id: 'v2',
        type: 'Bus',
        color: '#fbbf24',
        speed: phaseNsIsGreen ? 34 : 0,
        lat: phaseNsIsGreen
          ? centerLat + 0.0028 - ((progressNS + 0.4) % 1) * 0.005
          : centerLat + 0.0016,
        lng: centerLng - 0.00018,
        heading: 180
      },
      // South to North Approach
      {
        id: 'v3',
        type: 'SUV',
        color: '#34d399',
        speed: phaseNsIsGreen ? 42 : 0,
        lat: phaseNsIsGreen
          ? centerLat - 0.0025 + progressNS * 0.005
          : centerLat - 0.0008,
        lng: centerLng + 0.00018,
        heading: 0
      },
      {
        id: 'v4',
        type: 'Truck',
        color: '#a78bfa',
        speed: phaseNsIsGreen ? 28 : 0,
        lat: phaseNsIsGreen
          ? centerLat - 0.0028 + ((progressNS + 0.4) % 1) * 0.005
          : centerLat - 0.0016,
        lng: centerLng + 0.00018,
        heading: 0
      },
      // West to East Approach
      {
        id: 'v5',
        type: 'Car',
        color: '#22d3ee',
        speed: !phaseNsIsGreen ? 50 : 0,
        lat: centerLat - 0.00015,
        lng: !phaseNsIsGreen
          ? centerLng - 0.003 + progressEW * 0.006
          : centerLng - 0.0008,
        heading: 90
      },
      {
        id: 'v6',
        type: 'EV Ambulance',
        color: '#f43f5e',
        speed: !phaseNsIsGreen ? 68 : 12,
        lat: centerLat - 0.00015,
        lng: !phaseNsIsGreen
          ? centerLng - 0.0035 + ((progressEW + 0.35) % 1) * 0.006
          : centerLng - 0.0014,
        heading: 90,
        isEmergency: true
      },
      // East to West Approach
      {
        id: 'v7',
        type: 'Van',
        color: '#f97316',
        speed: !phaseNsIsGreen ? 40 : 0,
        lat: centerLat + 0.00015,
        lng: !phaseNsIsGreen
          ? centerLng + 0.003 - progressEW * 0.006
          : centerLng + 0.0008,
        heading: 270
      }
    ];

    vehicles.forEach((v) => {
      const vIcon = L.divIcon({
        className: 'sat-vehicle-marker',
        html: `
          <div class="sat-vehicle-node ${v.isEmergency ? 'emergency-pulse' : ''}" style="--veh-color: ${v.color}; transform: rotate(${v.heading}deg);">
            <div class="veh-dot"></div>
            <div class="veh-label-pill" style="transform: rotate(-${v.heading}deg);">
              <span>${v.type} ${v.speed > 0 ? `${v.speed}km/h` : 'WAIT'}</span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      L.marker([v.lat, v.lng], { icon: vIcon }).addTo(vehicleLayer);
    });
  }, [simStep, intConfig.lat, intConfig.lng, showVehicles, phaseNsIsGreen]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo([intConfig.lat, intConfig.lng], intConfig.zoom || 18, { duration: 0.8 });
  };

  return (
    <div className={`card sat-view-card ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Top Header & Satellite Metadata Bar */}
      <div className="card-title-bar" style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div className="sat-live-indicator">
            <Radio size={13} className="spin-slow" />
            <span>SATELLITE ORBITAL FEED</span>
          </div>

          <h2 className="card-title" style={{ fontSize: '1rem' }}>
            <span>{intConfig.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.4rem' }}>
              ({intConfig.city} &bull; {currentCoords.lat}&deg;N, {currentCoords.lng}&deg;E)
            </span>
          </h2>
        </div>

        {/* Layer Selector & Intersection Quick Jump */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="cam-selector-group">
            {Object.entries(TILE_LAYERS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                className={`cam-tab-btn ${activeLayer === key ? 'active' : ''}`}
                title={`Switch to ${item.name}`}
              >
                {key === 'hybrid' && '🛰️ Google Hybrid'}
                {key === 'satellite' && '🛰️ High-Res Satellite'}
                {key === 'esri' && '🌍 Esri World'}
                {key === 'dark' && '🌑 Dark GIS'}
                {key === 'osm' && '🗺️ Streets'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hud-toggle-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Satellite Viewport */}
      <div className={`sat-map-viewport ${infraredFilter ? 'infrared-mode' : ''}`}>
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="sat-leaflet-map" style={{ width: '100%', height: isFullscreen ? 'calc(100vh - 140px)' : '460px' }} />

        {/* Top-Left Recon HUD */}
        <div className="sat-hud-panel top-left">
          <div className="hud-badge cyan">
            <Radio size={11} />
            <span className="hud-label">SENSOR:</span>
            <span className="hud-val">Maxar WorldView-3 / Google Earth</span>
          </div>
          <div className="hud-badge">
            <span className="hud-label">RESOLUTION:</span>
            <span className="hud-val">0.31m GSD / Nadir</span>
          </div>
          <div className="hud-badge">
            <span className="hud-label">COORDS:</span>
            <span className="hud-val">{currentCoords.lat.toFixed(4)}&deg;N, {currentCoords.lng.toFixed(4)}&deg;E</span>
          </div>
          <div className="hud-badge">
            <span className="hud-label">ZOOM:</span>
            <span className="hud-val">{currentCoords.zoom}x Level</span>
          </div>
        </div>

        {/* Top-Right Signal Phase & Queue HUD (Overlaid on Satellite View) */}
        {showSignalHud && (
          <div className="sat-hud-panel top-right">
            <div className="signal-overlay-card">
              <div className="signal-hud-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className={`signal-light-dot ${phaseNsIsGreen ? 'green' : 'amber'}`}></span>
                  <strong style={{ fontSize: '0.8rem' }}>
                    {phaseNsIsGreen ? 'NORTH-SOUTH GREEN' : 'EAST-WEST GREEN'}
                  </strong>
                </div>
                <span className="phase-timer-badge">{phaseTimeRemaining}s</span>
              </div>

              <div className="signal-hud-stats">
                <div className="stat-row">
                  <span>Queue Total:</span>
                  <strong>{totalVehicles} vehicles</strong>
                </div>
                <div className="stat-row">
                  <span>Webster Cycle:</span>
                  <strong>{signalPlan?.cycleLength || 60}s</strong>
                </div>
                <div className="stat-row">
                  <span>Congestion Index:</span>
                  <span style={{ color: totalVehicles > 45 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {totalVehicles > 45 ? 'HIGH (Level E)' : 'OPTIMAL (Level B)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Left Side Floating Map Controls (Zoom, Reset, Recenter) */}
        <div className="sat-floating-controls">
          <button onClick={handleZoomIn} className="map-control-btn" title="Zoom In">+</button>
          <button onClick={handleZoomOut} className="map-control-btn" title="Zoom Out">&minus;</button>
          <button onClick={handleRecenter} className="map-control-btn" title="Recenter on Intersection">
            <Crosshair size={14} />
          </button>
        </div>

        {/* Google Maps Style Traffic Legend (Bottom-Left) */}
        <div className="sat-traffic-legend">
          <span className="legend-title">Live Traffic Flow:</span>
          <div className="legend-items">
            <div className="legend-item"><span className="legend-bar green"></span> Fast (&gt;40 km/h)</div>
            <div className="legend-item"><span className="legend-bar amber"></span> Moderate</div>
            <div className="legend-item"><span className="legend-bar red"></span> Slow / Queue</div>
          </div>
        </div>
      </div>

      {/* Bottom GIS Control Toolbar */}
      <div className="sat-bottom-toolbar">
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            SURVEILLANCE OVERLAYS:
          </span>

          <button
            onClick={() => setShowTrafficFlow(!showTrafficFlow)}
            className={`hud-toggle-btn ${showTrafficFlow ? 'active' : ''}`}
          >
            <Navigation size={12} />
            <span>Google Traffic Layer</span>
          </button>

          <button
            onClick={() => setShowVehicles(!showVehicles)}
            className={`hud-toggle-btn ${showVehicles ? 'active' : ''}`}
          >
            <Car size={12} />
            <span>Live Vehicle Fleet</span>
          </button>

          <button
            onClick={() => setShowDetectionZones(!showDetectionZones)}
            className={`hud-toggle-btn ${showDetectionZones ? 'active' : ''}`}
          >
            <Eye size={12} />
            <span>AI Zone Polygons</span>
          </button>

          <button
            onClick={() => setShowSignalHud(!showSignalHud)}
            className={`hud-toggle-btn ${showSignalHud ? 'active' : ''}`}
          >
            <Zap size={12} />
            <span>Signal Phase HUD</span>
          </button>

          <button
            onClick={() => setInfraredFilter(!infraredFilter)}
            className={`hud-toggle-btn ${infraredFilter ? 'active' : ''}`}
            title="Night FLIR Infrared Spectrum"
          >
            <Flame size={12} />
            <span>{infraredFilter ? 'FLIR Thermal [ON]' : 'Thermal IR'}</span>
          </button>
        </div>

        {/* Quick Location Switcher Buttons */}
        <div style={{ display: 'flex', gap: '0.35rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {Object.entries(INTERSECTION_DATA).map(([id, item]) => (
            <button
              key={id}
              onClick={() => onSelectIntersection && onSelectIntersection(id)}
              className={`cam-tab-btn ${intId === id ? 'active' : ''}`}
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
            >
              📍 {item.name.split(' ')[0]} ({id})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
