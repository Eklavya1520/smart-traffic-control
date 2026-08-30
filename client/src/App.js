import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Dashboard from './components/Dashboard/Dashboard';
import { useSocket } from './hooks/useSocket';
import { fetchIntersections, fetchIntersectionHistory, fetchAlerts, resolveAlert } from './services/api';

export default function App() {
  const [intersections, setIntersections] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeIntersectionId, setActiveIntersectionId] = useState('INT_001');

  const { isConnected, lastTelemetry, liveAlerts } = useSocket(activeIntersectionId);

  useEffect(() => {
    // Initial data hydration
    async function loadData() {
      try {
        const intRes = await fetchIntersections();
        if (intRes?.data) setIntersections(intRes.data);

        const histRes = await fetchIntersectionHistory(activeIntersectionId, 25);
        if (histRes?.data && histRes.data.length > 0) {
          setHistoryData(histRes.data);
        } else {
          // Generate mock trend points for standalone client presentation
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
        console.warn('Backend offline, running in standalone live demo mode:', err.message);
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
      setHistoryData((prev) => [...prev.slice(-29), lastTelemetry]);
    }
  }, [lastTelemetry]);

  const handleResolveAlert = async (id) => {
    try {
      await resolveAlert(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch (e) {
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    }
  };

  return (
    <div className="app-container">
      <Header
        isConnected={isConnected}
        alertCount={alerts.filter((a) => !a.resolved).length}
        onOpenAlerts={() => {}}
      />
      <main className="main-content">
        <Dashboard
          intersections={intersections}
          latestTelemetry={lastTelemetry}
          historyData={historyData}
          alerts={alerts}
          onResolveAlert={handleResolveAlert}
        />
      </main>
    </div>
  );
}
