# Developer Notes

Running notes from building this. Keeping it messy and honest.

---

## Why dynamic signal timing?

The motivation was a real observation — intersection near college has fixed 90-second cycles even at 2am when there are literally 3 cars. The city isn't going to fix it anytime soon. So the idea was: what if you could just swap out the "timer" with something that actually looks at the queue?

The hard part isn't the detection — YOLOv8 makes that almost trivial. The hard part is the control logic: when do you switch phases? How much do you trust a single detection frame? How do you prevent the signal from oscillating wildly cycle to cycle?

---

## YOLOv8 model choice

Tried yolov8n (nano), yolov8s (small), yolov8m (medium).

- nano: 35ms inference on CPU, missed ~15% of vehicles at distance
- small: 58ms on CPU, 12ms on GPU, noticeably better at distance and occlusion
- medium: overkill for this use case, marginal improvement over small

Went with yolov8s as default. If you're running on a Raspberry Pi or similar, switch to nano. If you have a GPU, medium is fine.

The vehicle classes we care about in COCO: car (2), motorcycle (3), bus (5), truck (7). Filtering to these four and ignoring everything else (pedestrians, bicycles) since they don't affect signal timing the same way.

---

## The smoothing problem

Raw per-frame vehicle counts are extremely noisy. A bus partially behind a pole, a car at the edge of the detection zone, reflections — the count can jump from 8 to 3 to 11 across consecutive frames.

Solution: exponential moving average with alpha=0.3. New count = 0.3 * raw + 0.7 * previous_smooth. This gives a stable signal while still responding to genuine changes within ~10 seconds.

Also added a minimum "lock" period: once a signal goes green, it stays green for at least 15 seconds regardless of what the optimizer wants. Prevents rapid switching that would confuse drivers.

---

## Webster's formula — simplified implementation

The full Webster's formula accounts for saturation headways, approach volumes per movement (left/right/through), pedestrian phases, etc. Way too complex for this project.

Used the simplified version: treat each approach as a single phase, use raw vehicle count as a proxy for flow ratio. It's not academically rigorous but it works well enough to produce sensible timing — high-volume lanes get more green, low-volume lanes get less.

TODO: Add separate left-turn phase detection. Currently a left-turn queue and a through queue compete for the same green time which isn't ideal.

---

## MongoDB schema decisions

Two main collections:

**intersections**: static config (location, lane count, saturation flow) plus mutable state (current phase, signal plan). Updated atomically with `findByIdAndUpdate`.

**traffic_readings**: append-only time-series. Each reading = one snapshot from the vision service. Indexed on `(intersection_id, timestamp)` for efficient range queries. TTL index deletes readings older than 7 days automatically.

Considered TimescaleDB for the time-series stuff but MongoDB TTL + compound index is good enough for the scale of this project and avoids adding another dependency.

---

## Socket.IO vs polling

Initial version used 5-second polling from the React client. Switched to Socket.IO because:
- Lower perceived latency (push instead of pull)
- Lower server load (no unnecessary requests when nothing changed)
- Looks more impressive in a demo

Room-based architecture: each intersection is a Socket.IO room. Clients subscribe to rooms for the intersections they care about. The Node.js server emits `traffic:update` events whenever new data comes in from the Python vision service.

---

## Alert system

Three alert types:
1. `STALE_DATA` — no reading for >2 minutes. Usually means the camera or Python service crashed.
2. `QUEUE_SPIKE` — queue length > 150% of 10-min average. Could be an accident, could be an event nearby.
3. `SERVICE_DOWN` — uptime pinger can't reach the vision service endpoint.

Alerts have a `resolved` flag. Once resolved, they stay in MongoDB for audit purposes but disappear from the active alert panel. Don't auto-resolve — requires manual acknowledgement from the dashboard.

---

## React dashboard architecture

Went with a single context (TrafficContext) that holds all intersection state and alert state. Components subscribe to this context. Socket.IO events dispatch to the context reducer, which merges the new data.

The main pain point was reconciling the REST-loaded initial state with subsequent Socket.IO updates. Solved by always keying by `intersectionId` in a Map rather than an array, so updates are O(1) merges.

Chart.js for the time-series charts. Considered Recharts but Chart.js gives finer control over animation and the rolling-window logic was easier to implement with its update API.

---

## Production deployment notes

docker-compose sets up:
- MongoDB with auth
- Node.js API (pm2 process manager inside container)
- React built as static files served by Nginx
- Python vision service (one container per camera, scalable)

For actual production you'd want:
- MongoDB replica set for HA
- Redis for Socket.IO adapter (multiple API server instances)
- Proper secret management (Vault or AWS Secrets Manager)
- GPU-enabled container for the vision service

---

## Things I'd do differently

1. **Async Python** — current vision service is synchronous. Processing 4 camera streams means 4x the frame processing time stacked serially. Should use asyncio + concurrent.futures.ProcessPoolExecutor.

2. **Edge deployment** — the vision service could run on an NVIDIA Jetson at the intersection itself instead of streaming video to a central server. Reduces bandwidth dramatically and adds resilience.

3. **Proper flow measurement** — instead of counting vehicles in a zone, track them across two lines (virtual loop detector). Gives speed + flow rate, not just count. Much better input to Webster's formula.

4. **Pedestrian phase** — completely ignored pedestrian crossing phases. Real signal timing needs to account for these.
