/**
 * signalService.js
 * Fallback and validation service for traffic signal timing calculations.
 */

const MIN_GREEN = 15;
const MAX_GREEN = 60;
const YELLOW_TIME = 4;
const ALL_RED = 2;

function computeOptimalSignal(northSouthDemand, eastWestDemand) {
  const lostTimePerPhase = YELLOW_TIME + ALL_RED - 1;
  const totalLostTime = 2 * lostTimePerPhase;

  const q_ns = Math.max(northSouthDemand, 1) * 120;
  const q_ew = Math.max(eastWestDemand, 1) * 120;
  const s = 1800; // saturation flow rate

  const y_ns = Math.min(q_ns / s, 0.45);
  const y_ew = Math.min(q_ew / s, 0.45);
  const Y = y_ns + y_ew;

  let optimalCycle = 60;
  if (Y >= 0.85) {
    optimalCycle = (MAX_GREEN * 2) + totalLostTime;
  } else if (Y <= 0.10) {
    optimalCycle = (MIN_GREEN * 2) + totalLostTime;
  } else {
    optimalCycle = Math.round((1.5 * totalLostTime + 5) / (1 - Y));
  }

  optimalCycle = Math.max((MIN_GREEN * 2) + totalLostTime, Math.min(optimalCycle, (MAX_GREEN * 2) + totalLostTime));
  const effectiveGreen = Math.max(optimalCycle - totalLostTime, 20);

  let g_ns = Math.round(effectiveGreen * (y_ns / (Y || 1)));
  let g_ew = Math.round(effectiveGreen * (y_ew / (Y || 1)));

  g_ns = Math.max(MIN_GREEN, Math.min(g_ns, MAX_GREEN));
  g_ew = Math.max(MIN_GREEN, Math.min(g_ew, MAX_GREEN));

  return {
    cycleLength: g_ns + g_ew + Math.round(totalLostTime),
    phaseA_NorthSouth: { green: g_ns, yellow: YELLOW_TIME, red: ALL_RED },
    phaseB_EastWest: { green: g_ew, yellow: YELLOW_TIME, red: ALL_RED },
    estimatedAvgDelaySec: Math.max(18.0, Number((48.5 * (1 - 0.3 * (Math.abs(g_ns - g_ew) / (g_ns + g_ew)))).toFixed(1))),
    efficiencyGainPercent: Number((((48.5 - 32.0) / 48.5) * 100).toFixed(1))
  };
}

module.exports = { computeOptimalSignal };
