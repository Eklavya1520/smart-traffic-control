const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export async function fetchIntersections() {
  const res = await fetch(`${BASE_URL}/intersections`);
  if (!res.ok) throw new Error('Failed to fetch intersections');
  return res.json();
}

export async function fetchIntersectionHistory(id, limit = 30) {
  const res = await fetch(`${BASE_URL}/traffic/history/${id}?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${BASE_URL}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function resolveAlert(id) {
  const res = await fetch(`${BASE_URL}/alerts/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function triggerManualOverride(id, phase, durationSec) {
  const res = await fetch(`${BASE_URL}/intersections/${id}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, durationSec }),
  });
  if (!res.ok) throw new Error('Failed to trigger override');
  return res.json();
}
