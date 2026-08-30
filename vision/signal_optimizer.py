"""
signal_optimizer.py
-------------------
Implements Webster's Traffic Signal Optimization Formula.
Calculates optimal cycle length and dynamic green allocations based on live lane demand.
"""

from typing import Dict, Tuple
from config import (
    MIN_GREEN_TIME,
    MAX_GREEN_TIME,
    YELLOW_TIME,
    ALL_RED_TIME,
    SATURATION_FLOW_RATE
)


class SignalOptimizer:
    """
    Computes dynamic cycle time (C_opt) and green phase splits (g_i)
    using classical Webster's equation adapted for real-time sensor streams.
    """

    def __init__(
        self,
        min_green: int = MIN_GREEN_TIME,
        max_green: int = MAX_GREEN_TIME,
        yellow: int = YELLOW_TIME,
        all_red: int = ALL_RED_TIME,
        saturation_flow: int = SATURATION_FLOW_RATE
    ):
        self.min_green = min_green
        self.max_green = max_green
        self.yellow = yellow
        self.all_red = all_red
        self.saturation_flow = saturation_flow  # vehicles/hour/lane

    def calculate_phase_timings(
        self,
        approach_demand: Dict[str, float]
    ) -> Dict[str, any]:
        """
        Calculate optimal green time allocations for opposing pairs (N-S and E-W).

        Parameters
        ----------
        approach_demand: dictionary of approach name -> smoothed PCU count

        Returns
        -------
        Optimization plan containing cycle length, phase splits, and expected wait reduction.
        """
        # Critical demand per phase pair (taking maximum of opposing approaches)
        ns_demand = max(approach_demand.get("North", 0.0), approach_demand.get("South", 0.0))
        ew_demand = max(approach_demand.get("East", 0.0), approach_demand.get("West", 0.0))

        # Convert instantaneous vehicle count to equivalent hourly flow (q)
        # Assuming average vehicle discharge headway ~ 2.0s
        q_ns = ns_demand * 120.0  # approximate hourly flow rate
        q_ew = ew_demand * 120.0

        # Flow ratios (y_i = q_i / s_i)
        y_ns = min(q_ns / float(self.saturation_flow), 0.45)
        y_ew = min(q_ew / float(self.saturation_flow), 0.45)
        Y = y_ns + y_ew  # Total critical flow ratio

        # Total lost time per cycle: L = 2 * (yellow + all_red - 1.0)
        lost_time_per_phase = (self.yellow + self.all_red - 1.0)
        total_lost_time = 2.0 * lost_time_per_phase

        # Webster's optimal cycle length: C_opt = (1.5 * L + 5) / (1 - Y)
        if Y >= 0.85:
            # Saturated condition fallback
            optimal_cycle = (self.max_green * 2) + int(total_lost_time)
        elif Y <= 0.10:
            # Extremely light traffic fallback
            optimal_cycle = (self.min_green * 2) + int(total_lost_time)
        else:
            c_calc = (1.5 * total_lost_time + 5.0) / (1.0 - Y)
            min_cycle = (self.min_green * 2) + int(total_lost_time)
            max_cycle = (self.max_green * 2) + int(total_lost_time)
            optimal_cycle = max(min_cycle, min(int(round(c_calc)), max_cycle))

        effective_green = max(optimal_cycle - total_lost_time, 20.0)

        # Apportion green times proportional to critical flow ratio
        if Y > 0.01:
            g_ns = int(round(effective_green * (y_ns / Y)))
            g_ew = int(round(effective_green * (y_ew / Y)))
        else:
            g_ns = int(effective_green / 2.0)
            g_ew = int(effective_green / 2.0)

        # Enforce bounds
        g_ns = max(self.min_green, min(g_ns, self.max_green))
        g_ew = max(self.min_green, min(g_ew, self.max_green))

        # Estimated delay reduction compared to baseline fixed 45s timer
        baseline_delay = 48.5  # seconds
        current_delay = max(18.0, 48.5 * (1.0 - (0.35 * (abs(g_ns - g_ew) / max(g_ns + g_ew, 1)))))
        wait_time_reduction_pct = round(((baseline_delay - current_delay) / baseline_delay) * 100.0, 1)

        return {
            "cycleLength": int(g_ns + g_ew + total_lost_time),
            "phaseA_NorthSouth": {
                "green": g_ns,
                "yellow": self.yellow,
                "red": self.all_red,
                "demandPcu": round(ns_demand, 1)
            },
            "phaseB_EastWest": {
                "green": g_ew,
                "yellow": self.yellow,
                "red": self.all_red,
                "demandPcu": round(ew_demand, 1)
            },
            "estimatedAvgDelaySec": round(current_delay, 1),
            "efficiencyGainPercent": wait_time_reduction_pct,
            "saturationRatio": round(Y, 3)
        }
