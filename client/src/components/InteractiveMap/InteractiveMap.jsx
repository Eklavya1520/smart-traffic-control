import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Compass } from 'lucide-react';

const MAP_INTERSECTIONS = [
  {
    intersectionId: 'INT_001',
    name: 'Downtown Central 4-Way Junction',
    city: 'Central Business District',
    lat: 28.6328,
    lng: 77.2197,
    status: 'ACTIVE',
    congestion: 'MEDIUM',
    queue: 38,
    pcu: 42.5
  },
  {
    intersectionId: 'INT_002',
    name: 'Tech Park Cyber Gateway',
    city: 'Cyber City Expressway',
    lat: 28.4950,
    lng: 77.0895,
    status: 'ACTIVE',
    congestion: 'LOW',
    queue: 18,
    pcu: 21.0
  },
  {
    intersectionId: 'INT_003',
    name: 'Airport Express Corridor',
    city: 'T3 Aerocity Interchange',
    lat: 28.5562,
    lng: 77.1000,
    status: 'ACTIVE',
    congestion: 'HIGH',
    queue: 52,
    pcu: 64.2
  }
];

export default function InteractiveMap({ intersections, selectedId, onSelectIntersection, latestTelemetry }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite', 'hybrid', 'dark'

  const currentList = intersections && intersections.length > 0 ? intersections.map((item) => {
    const defaultData = MAP_INTERSECTIONS.find(m => m.intersectionId === item.intersectionId) || MAP_INTERSECTIONS[0];
    return {
      ...defaultData,
      ...item,
      lat: item.location?.lat || defaultData.lat,
      lng: item.location?.lng || defaultData.lng,
      queue: item.intersectionId === selectedId ? (latestTelemetry?.totalVehicles || defaultData.queue) : defaultData.queue
    };
  }) : MAP_INTERSECTIONS;

  const activeInt = currentList.find(i => i.intersectionId === selectedId) || currentList[0];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.57, 77.16],
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      const markersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    let attribution = '&copy; Google Hybrid';

    if (mapLayer === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Satellite';
    } else if (mapLayer === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CartoDB';
    }

    const layer = L.tileLayer(url, {
      subdomains: mapLayer === 'dark' ? 'abcd' : ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 19,
      attribution
    }).addTo(map);

    tileLayerRef.current = layer;
  }, [mapLayer]);

  // Render Markers & Corridors
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Add Highway Corridor Lines connecting the nodes
    const coordsList = currentList.map(item => [item.lat, item.lng]);
    if (coordsList.length > 1) {
      L.polyline(coordsList, {
        color: '#06b6d4',
        weight: 3,
        opacity: 0.6,
        dashArray: '6, 6'
      }).addTo(markersGroup);
    }

    currentList.forEach((item) => {
      const isSelected = item.intersectionId === selectedId;

      const markerIcon = L.divIcon({
        className: 'city-gis-marker',
        html: `
          <div class="gis-node-pin ${isSelected ? 'selected' : ''}">
            <div class="gis-pin-pulse"></div>
            <div class="gis-pin-badge">
              <span class="dot ${item.queue > 40 ? 'red' : item.queue > 20 ? 'amber' : 'green'}"></span>
              <strong>${item.intersectionId}</strong>
            </div>
            <div class="gis-callout">
              <div class="gis-callout-title">${item.name}</div>
              <div class="gis-callout-sub">${item.queue} vehicles | ${item.congestion || 'ACTIVE'}</div>
            </div>
          </div>
        `,
        iconSize: [120, 60],
        iconAnchor: [60, 30]
      });

      const marker = L.marker([item.lat, item.lng], { icon: markerIcon }).addTo(markersGroup);
      marker.on('click', () => {
        if (onSelectIntersection) onSelectIntersection(item.intersectionId);
        map.flyTo([item.lat, item.lng], 14, { duration: 1 });
      });
    });
  }, [currentList, selectedId, onSelectIntersection]);

  return (
    <div className="card interactive-map-card">
      <div className="card-title-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={18} color="var(--accent-cyan)" />
          <h2 className="card-title" style={{ fontSize: '1rem' }}>
            <span>Live City Traffic Grid & Intersection GIS Satellite Network</span>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Layer:</span>
          <button
            onClick={() => setMapLayer('satellite')}
            className={`cam-tab-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => setMapLayer('hybrid')}
            className={`cam-tab-btn ${mapLayer === 'hybrid' ? 'active' : ''}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
          >
            🗺️ Hybrid
          </button>
          <button
            onClick={() => setMapLayer('dark')}
            className={`cam-tab-btn ${mapLayer === 'dark' ? 'active' : ''}`}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
          >
            🌑 Dark GIS
          </button>
        </div>
      </div>

      {/* Real Leaflet Map Viewport */}
      <div className="map-viewport-wrapper">
        <div ref={mapContainerRef} style={{ width: '100%', height: '340px' }} />

        {/* Map Bottom Quick Selection Strip */}
        <div className="map-bottom-strip">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <strong>SELECT INTERSECTION:</strong> Click any satellite node on map or choose below:
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currentList.map((item) => (
              <button
                key={item.intersectionId}
                onClick={() => {
                  if (onSelectIntersection) onSelectIntersection(item.intersectionId);
                  mapInstanceRef.current?.flyTo([item.lat, item.lng], 14, { duration: 1 });
                }}
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
