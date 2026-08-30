"""
stream_handler.py
-----------------
Provides unified frame capture abstraction across local webcams, RTSP streams,
recorded video files, and a high-fidelity synthetic frame generator for testing.
"""

import cv2
import time
import numpy as np
from typing import Generator, Tuple, Optional


class StreamHandler:
    """
    Manages video source ingestion with automatic reconnection and FPS throttling.
    """

    def __init__(self, source: str = "synthetic", target_fps: int = 25):
        self.source = source
        self.target_fps = target_fps
        self.cap: Optional[cv2.VideoCapture] = None
        self._is_synthetic = (source == "synthetic" or source == "demo")

    def initialize(self) -> bool:
        if self._is_synthetic:
            return True

        # Try parsing integer (webcam index)
        try:
            src_index = int(self.source)
            self.cap = cv2.VideoCapture(src_index)
        except ValueError:
            self.cap = cv2.VideoCapture(self.source)

        if not self.cap or not self.cap.isOpened():
            print(f"[WARN] Failed to open stream source: {self.source}. Falling back to synthetic simulation mode.")
            self._is_synthetic = True
            return True

        return True

    def frames(self) -> Generator[np.ndarray, None, None]:
        """Yield frames at the designated frame rate."""
        frame_interval = 1.0 / self.target_fps

        if self._is_synthetic:
            # Generate simulated intersection canvas
            while True:
                start = time.time()
                yield self._generate_synthetic_intersection_frame()
                elapsed = time.time() - start
                time.sleep(max(0.0, frame_interval - elapsed))
        else:
            while self.cap and self.cap.isOpened():
                start = time.time()
                ret, frame = self.cap.read()
                if not ret:
                    # Loop video if file source
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = self.cap.read()
                    if not ret:
                        break

                yield frame
                elapsed = time.time() - start
                time.sleep(max(0.0, frame_interval - elapsed))

    def _generate_synthetic_intersection_frame(self) -> np.ndarray:
        """Create a 1280x720 graphic representing a live 4-way crossroad for demo inference."""
        canvas = np.zeros((720, 1280, 3), dtype=np.uint8)
        # Background grass / sidewalks
        canvas[:] = (45, 55, 45)

        # Crossroad asphalt roads
        cv2.rectangle(canvas, (460, 0), (820, 720), (50, 50, 50), -1)  # N-S Road
        cv2.rectangle(canvas, (0, 220), (1280, 500), (50, 50, 50), -1) # E-W Road
        # Road markings
        cv2.line(canvas, (640, 0), (640, 220), (240, 240, 240), 2)
        cv2.line(canvas, (640, 500), (640, 720), (240, 240, 240), 2)
        cv2.line(canvas, (0, 360), (460, 360), (240, 240, 240), 2)
        cv2.line(canvas, (820, 360), (1280, 360), (240, 240, 240), 2)

        # Center intersection yellow cross hatch
        cv2.rectangle(canvas, (460, 220), (820, 500), (55, 55, 55), -1)
        cv2.putText(canvas, "LIVE CAMERA 01 - NORTH-SOUTH / EAST-WEST", (40, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        return canvas

    def release(self):
        if self.cap and self.cap.isOpened():
            self.cap.release()
