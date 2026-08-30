"""
simulate_traffic.py
-------------------
Realistic multi-phase traffic simulator. Generates synthetic traffic flow,
runs the Webster signal optimizer, and streams live telemetry to the Node.js API.
Ideal for showcasing the project without requiring live CCTV video feeds.
"""

import time
import math
import random
import requests
import argparse
from datetime import datetime

API_URL = "http://localhost:4000/api/traffic/reading"


def simulate_intersection_flow(intersection_id: str = "INT_001", interval_sec: int = 5, api_url: str = API_URL):
    print("==========================================================")
    print(f" Smart Traffic Control - Synthetic Telemetry Simulator")
    print(f" Intersection: {intersection_id}")
    print(f" Target API  : {api_url}")
    print(f" Interval    : {interval_sec}s")
    print("==========================================================")

    step = 0
    while True:
        step += 1
        t = time.time()

        # Simulate dynamic sinusoidal traffic flow with rush-hour surges
        base_n = 10 + 6 * math.sin(step * 0.1) + random.uniform(-2, 2)
        base_s = 12 + 7 * math.sin(step * 0.12 + 0.5) + random.uniform(-2, 3)
        base_e = 8 + 5 * math.cos(step * 0.08) + random.uniform(-1, 2)
        base_w = 9 + 6 * math.cos(step * 0.09 + 0.3) + random.uniform(-2, 2)

        # Occasional random congestion surge on one approach
        if step % 8 == 0:
            surge_approach = random.choice(["North", "South", "East", "West"])
            if surge_approach == "North": base_n += 12
            elif surge_approach == "South": base_s += 14
            elif surge_approach == "East": base_e += 10
            else: base_w += 11
            print(f"\n[EVENT] Simulated congestion surge on {surge_approach} approach!")

        counts = {
            "North": max(1, int(round(base_n))),
            "South": max(1, int(round(base_s))),
            "East": max(1, int(round(base_e))),
            "West": max(1, int(round(base_w)))
        }

        total_vehicles = sum(counts.values())

        # Proportional vehicle type breakdown
        breakdown = {}
        pcu = {}
        for app, count in counts.items():
            cars = int(count * 0.7)
            motos = int(count * 0.15)
            buses = int(count * 0.08)
            trucks = count - (cars + motos + buses)
            breakdown[app] = {"cars": cars, "motorcycles": motos, "buses": buses, "trucks": trucks}
            pcu[app] = round(cars * 1.0 + motos * 0.5 + buses * 2.5 + trucks * 2.0, 1)

        # Calculate Webster signal splits
        ns_max = max(pcu["North"], pcu["South"])
        ew_max = max(pcu["East"], pcu["West"])

        total_pcu = max(ns_max + ew_max, 1.0)
        cycle_length = min(90, max(45, int(45 + total_vehicles * 0.8)))
        available_green = cycle_length - 10  # 10s yellow + all-red

        g_ns = max(15, min(60, int(round(available_green * (ns_max / total_pcu)))))
        g_ew = max(15, min(60, int(round(available_green * (ew_max / total_pcu)))))

        efficiency_gain = round(28.0 + (abs(g_ns - g_ew) / max(g_ns + g_ew, 1)) * 12.0, 1)
        estimated_delay = round(max(18.0, 48.5 * (1.0 - (efficiency_gain / 100.0))), 1)

        payload = {
            "intersectionId": intersection_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "approachCounts": counts,
            "smoothedPcu": pcu,
            "classBreakdown": breakdown,
            "totalVehicles": total_vehicles,
            "signalPlan": {
                "cycleLength": cycle_length,
                "phaseA_NorthSouth": {"green": g_ns, "yellow": 4, "red": 2, "demandPcu": ns_max},
                "phaseB_EastWest": {"green": g_ew, "yellow": 4, "red": 2, "demandPcu": ew_max},
                "estimatedAvgDelaySec": estimated_delay,
                "efficiencyGainPercent": efficiency_gain
            },
            "cameraHealth": "ONLINE",
            "fps": 24.8
        }

        try:
            res = requests.post(api_url, json=payload, timeout=3.0)
            status = f"HTTP {res.status_code}" if res.status_code in [200, 201] else f"HTTP {res.status_code} Error"
        except Exception:
            status = "API Offline (Broadcasting locally)"

        print(f"[{datetime.now().strftime('%H:%M:%S')}] Step {step:03d} | Total: {total_vehicles:02d} veh | "
              f"N:{counts['North']:02d} S:{counts['South']:02d} E:{counts['East']:02d} W:{counts['West']:02d} | "
              f"N-S: {g_ns}s / E-W: {g_ew}s | Status: {status}")

        time.sleep(interval_sec)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synthetic Traffic Stream Simulator")
    parser.add_argument("--intersection", type=str, default="INT_001", help="Intersection ID")
    parser.add_argument("--interval", type=int, default=5, help="Seconds between telemetry dispatches")
    parser.add_argument("--api-url", type=str, default=API_URL, help="Backend ingestion endpoint")
    args = parser.parse_args()

    try:
        simulate_intersection_flow(
            intersection_id=args.intersection,
            interval_sec=args.interval,
            api_url=args.api_url
        )
    except KeyboardInterrupt:
        print("\n[INFO] Traffic simulator stopped.")
