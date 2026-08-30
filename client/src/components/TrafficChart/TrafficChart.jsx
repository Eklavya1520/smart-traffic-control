import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrafficChart({ historyData }) {
  const labels = historyData?.map((d, i) => {
    const t = new Date(d.timestamp);
    return isNaN(t.getTime()) ? `-${historyData.length - i}m` : t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }) || [];

  const totalVehicles = historyData?.map((d) => d.totalVehicles) || [];
  const delaySec = historyData?.map((d) => d.signalPlan?.estimatedAvgDelaySec || 32) || [];

  const data = {
    labels,
    datasets: [
      {
        label: 'Vehicle Queue Density (YOLOv8)',
        data: totalVehicles,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: 'Optimized Avg Wait Time (s)',
        data: delaySec,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: false,
        borderDash: [5, 5],
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9ca3af', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      tooltip: {
        backgroundColor: '#1f293d',
        titleColor: '#f3f4f6',
        bodyColor: '#9ca3af',
        borderColor: '#2e3d5b',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(46, 61, 91, 0.3)' },
        ticks: { color: '#6b7280', font: { size: 10 } },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(46, 61, 91, 0.3)' },
        ticks: { color: '#06b6d4' },
        title: { display: true, text: 'Total Vehicles', color: '#06b6d4' },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { color: '#10b981' },
        title: { display: true, text: 'Delay (seconds)', color: '#10b981' },
      },
    },
  };

  return (
    <div style={{ height: '240px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
}
