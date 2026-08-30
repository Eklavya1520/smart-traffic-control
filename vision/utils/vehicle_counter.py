"""
vehicle_counter.py
------------------
Spatial assignment of detected bounding boxes to approach zones,
with Exponential Moving Average (EMA) smoothing to eliminate single-frame jitter.
"""

import cv2
import numpy as np
from typing import Dict, List, Tuple
from config import CLASS_WEIGHTS


def point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
    """Determine if a point (normalized x, y) is inside a polygon using OpenCV."""
    pts = np.array(polygon, dtype=np.float32)
    result = cv2.pointPolygonTest(pts, point, False)
    return result >= 0


class VehicleCounter:
    """
    Tracks vehicle counts per lane/approach zone and applies exponential smoothing.
    """

    def __init__(self, zones: Dict[str, List[Tuple[float, float]]], smoothing_alpha: float = 0.35):
        self.zones = zones
        self.alpha = smoothing_alpha  # Weight for new measurements
        self.smoothed_counts: Dict[str, float] = {k: 0.0 for k in zones.keys()}
        self.smoothed_pcu: Dict[str, float] = {k: 0.0 for k in zones.keys()}

    def process_detections(
        self,
        boxes: List[Tuple[float, float, float, float, int, float]],
        frame_width: int,
        frame_height: int
    ) -> Tuple[Dict[str, int], Dict[str, float], Dict[str, Dict[str, int]]]:
        """
        Assign bounding boxes to approach zones and calculate PCU weighted demand.

        Parameters
        ----------
        boxes: list of (x1, y1, x2, y2, class_id, conf)
        frame_width: video frame width in pixels
        frame_height: video frame height in pixels

        Returns
        -------
        raw_counts: dictionary of approach -> total vehicles
        smoothed_pcu: dictionary of approach -> smoothed Passenger Car Units
        class_breakdown: dictionary of approach -> { "car": count, "truck": count, ... }
        """
        raw_counts = {k: 0 for k in self.zones.keys()}
        raw_pcu = {k: 0.0 for k in self.zones.keys()}
        class_breakdown = {k: {"cars": 0, "motorcycles": 0, "buses": 0, "trucks": 0} for k in self.zones.keys()}

        class_map = {2: "cars", 3: "motorcycles", 5: "buses", 7: "trucks"}

        for (x1, y1, x2, y2, cls_id, conf) in boxes:
            # Bottom-center of the vehicle's bounding box represents its road contact point
            cx = (x1 + x2) / (2.0 * frame_width)
            cy = y2 / float(frame_height)

            for approach, poly in self.zones.items():
                if point_in_polygon((cx, cy), poly):
                    raw_counts[approach] += 1
                    weight = CLASS_WEIGHTS.get(cls_id, 1.0)
                    raw_pcu[approach] += weight

                    cls_name = class_map.get(cls_id, "cars")
                    class_breakdown[approach][cls_name] += 1
                    break

        # Apply Exponential Moving Average (EMA) smoothing
        for approach in self.zones.keys():
            self.smoothed_counts[approach] = (
                self.alpha * raw_counts[approach] + (1 - self.alpha) * self.smoothed_counts[approach]
            )
            self.smoothed_pcu[approach] = (
                self.alpha * raw_pcu[approach] + (1 - self.alpha) * self.smoothed_pcu[approach]
            )

        return raw_counts, {k: round(v, 2) for k, v in self.smoothed_pcu.items()}, class_breakdown
