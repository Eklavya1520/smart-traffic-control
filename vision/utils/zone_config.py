"""
zone_config.py
--------------
Defines polygonal regions of interest (ROIs) for approaches (North, South, East, West).
Polygons are specified as normalized (x, y) coordinates relative to frame dimensions (0.0 to 1.0).
"""

from typing import Dict, List, Tuple

# Default standard 4-way intersection zones
# (Coordinates are normalized [0.0 - 1.0] for frame resolution independence)
DEFAULT_4WAY_ZONES: Dict[str, List[Tuple[float, float]]] = {
    "North": [
        (0.35, 0.05),
        (0.65, 0.05),
        (0.60, 0.40),
        (0.40, 0.40)
    ],
    "South": [
        (0.38, 0.60),
        (0.62, 0.60),
        (0.70, 0.95),
        (0.30, 0.95)
    ],
    "East": [
        (0.60, 0.35),
        (0.95, 0.30),
        (0.95, 0.70),
        (0.60, 0.65)
    ],
    "West": [
        (0.05, 0.30),
        (0.40, 0.35),
        (0.40, 0.65),
        (0.05, 0.70)
    ]
}


def get_intersection_zones(intersection_type: str = "4-way") -> Dict[str, List[Tuple[float, float]]]:
    """Return approach bounding zones based on geometry layout."""
    if intersection_type == "4-way":
        return DEFAULT_4WAY_ZONES
    elif intersection_type == "3-way-T":
        return {
            "North": DEFAULT_4WAY_ZONES["North"],
            "East": DEFAULT_4WAY_ZONES["East"],
            "West": DEFAULT_4WAY_ZONES["West"]
        }
    return DEFAULT_4WAY_ZONES
