import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Dashboard from './components/Dashboard/Dashboard';
import AlertModal from './components/AlertModal/AlertModal';
import { useSocket } from './hooks/useSocket';
import { fetchIntersections, fetchIntersectionHistory, fetchAlerts, resolveAlert } from './services/api';

export default function App() {
  const [intersections, setIntersections] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeIntersectionId, setActiveIntersectionId] = useState('INT_001');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [simulatedSurgeMultiplier, setSimulatedSurgeMultiplier] = useState(1);

  const { isConnected, lastTelemetry, liveAlerts } = useSocket(activeIntersectionId);

  useEffect(() => {
    // Initial data hydration
    async function loadData() {
      try {
        const intRes = await fetchIntersections();
        if (intRes?.data && intRes.data.length > 0) {
          setIntersections(intRes.data);
        } else {
          setIntersections([
            {
              intersectionId: 'INT_001',
              name: 'Downtown Central 4-Way Junction',
              location: { lat: 28.6139, lng: 77.2090, address: 'Main Ring Road & Central Ave' },
              geometryType: '4-way',
              status: 'ACTIVE'
            },
            {
              intersectionId: 'INT_002',
              name: 'Tech Park Cyber Gateway',
              location: { lat: 28.5355, lng: 77.3910, address: 'Sector 62 Expressway' },
              geometryType: '4-way',
              status: 'ACTIVE'
            },
            {
              intersectionId: 'INT_003',
              name: 'Airport Express Corridor',
              location: { lat: 28.5562, lng: 77.1000, address: 'Terminal 3 Outer Ring Flyover' },
              geometryType: '4-way',
              status: 'ACTIVE'
            }
          ]);
        }

        const histRes = await fetchIntersectionHistory(activeIntersectionId, 25);
        if (histRes?.data && histRes.data.length > 0) {
          setHistoryData(histRes.data);
        } else {
          const mockTrend = Array.from({ length: 15 }, (_, i) => ({
            timestamp: new Date(Date.now() - (15 - i) * 60000).toISOString(),
            totalVehicles: Math.floor(18 + Math.sin(i) * 12),
            signalPlan: { estimatedAvgDelaySec: Math.floor(25 + Math.cos(i) * 8) },
          }));
          setHistoryData(mockTrend);
        }

        const alertRes = await fetchAlerts();
        if (alertRes?.data) setAlerts(alertRes.data);
      } catch (err) {
        console.warn('Backend offline or loading error, initializing robust state:', err.message);
      }
    }
    loadData();
  }, [activeIntersectionId]);

  // Merge live WebSocket alerts
  useEffect(() => {
    if (liveAlerts.length > 0) {
      setAlerts((prev) => [...liveAlerts, ...prev]);
    }
  }, [liveAlerts]);

  // Update history stream when new telemetry arrives
  useEffect(() => {
    if (lastTelemetry) {
      const adjustedTelemetry = {
        ...lastTelemetry,
        totalVehicles: Math.round((lastTelemetry.totalVehicles || 35) * simulatedSurgeMultiplier)
      };
      setHistoryData((prev) => [...prev.slice(-29), adjustedTelemetry]);
    }
  }, [lastTelemetry, simulatedSurgeMultiplier]);

  const handleResolveAlert = async (id) => {
    try {
      await resolveAlert(id);
      setAlerts((prev) => prev.map((a) => (a._id === id || a.id === id ? { ...a, resolved: true } : a)));
    } catch (e) {
      setAlerts((prev) => prev.map((a) => (a._id === id || a.id === id ? { ...a, resolved: true } : a)));
    }
  };

  const handleClearAllAlerts = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, resolved: true })));
  };

  const handleSimulateSurge = (type) => {
    setSimulatedSurgeMultiplier((prev) => (type === 'SURGE' ? 1.6 : 1));
  };

  const handleSimulateAlert = (newAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleResetSystem = () => {
    setSimulatedSurgeMultiplier(1);
  };

  const activeTelemetry = lastTelemetry ? {
    ...lastTelemetry,
    totalVehicles: Math.round((lastTelemetry.totalVehicles || 35) * simulatedSurgeMultiplier),
    approachCounts: {
      North: Math.round((lastTelemetry.approachCounts?.North || 12) * simulatedSurgeMultiplier),
      South: Math.round((lastTelemetry.approachCounts?.South || 14) * simulatedSurgeMultiplier),
      East: Math.round((lastTelemetry.approachCounts?.East || 6) * simulatedSurgeMultiplier),
      West: Math.round((lastTelemetry.approachCounts?.West || 8) * simulatedSurgeMultiplier),
    }
  } : null;

  return (
    <div className="app-container">
      <Header
        isConnected={isConnected}
        alertCount={alerts.filter((a) => !a.resolved).length}
        onOpenAlerts={() => setIsAlertModalOpen(true)}
      />
      <main className="main-content">
        <Dashboard
          intersections={intersections}
          activeIntersectionId={activeIntersectionId}
          onSelectIntersection={(id) => setActiveIntersectionId(id)}
          latestTelemetry={activeTelemetry}
          historyData={historyData}
          alerts={alerts}
          onResolveAlert={handleResolveAlert}
          onSimulateSurge={handleSimulateSurge}
          onSimulateAlert={handleSimulateAlert}
          onResetSystem={handleResetSystem}
        />
      </main>

      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alerts={alerts}
        onResolveAlert={handleResolveAlert}
        onClearAll={handleClearAllAlerts}
      />
    </div>
  );
}
