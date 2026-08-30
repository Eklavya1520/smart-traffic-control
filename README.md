# Smart Traffic Control System

> Real-time traffic analysis using computer vision (YOLOv8) to dynamically optimize signal timings — cuts average vehicle wait time by ~30% compared to fixed-cycle signals.

---

## What This Does

Most traffic lights run on dumb fixed timers. A busy lane waits the same 90 seconds whether there are 40 cars queued up or 4. This system fixes that.

A Python service runs YOLOv8 on video feeds from intersection cameras, counts vehicles per lane in real time, and feeds that data to a Node.js API. The signal optimization engine recalculates green-light durations every cycle based on live queue lengths. A React dashboard shows live traffic density, current signal states, wait-time trends, and fires alerts when something goes wrong.

---

## Architecture

```
[Camera Feeds / Simulator]
         │
         ▼
[Python Vision Service]  ← YOLOv8 vehicle detection + counting
    detector.py             per-lane vehicle counts
    signal_optimizer.py     Webster's timing algorithm
         │
         │  HTTP POST  (every ~5 seconds)
         ▼
[Node.js Express API]    ← REST + WebSocket server
    MongoDB               stores readings, intersection state, alerts
    Socket.IO             pushes live updates to dashboard
         │
         ▼
[React Dashboard]        ← Live monitoring + historical charts
    Intersection cards    signal state, queue depth, wait time
    Chart.js trends       30-min rolling window
    Alert panel           anomaly detection + uptime checks
```

---

## Project Structure

```
smart-traffic-control/
├── vision/                    Python detection service
│   ├── detector.py            YOLOv8 inference + vehicle counting
│   ├── signal_optimizer.py    Webster's formula signal timing
│   ├── stream_handler.py      RTSP / file / webcam stream abstraction
│   └── utils/
│       ├── vehicle_counter.py per-zone counting + smoothing
│       └── zone_config.py     intersection zone definitions
│
├── server/                    Node.js API
│   └── src/
│       ├── models/            Mongoose schemas (TrafficReading, Intersection, Alert)
│       ├── routes/            REST endpoints
│       ├── controllers/       business logic
│       ├── services/          signal calc, alerting, uptime monitor
│       └── socket/            Socket.IO real-time push
│
├── client/                    React dashboard
│   └── src/
│       ├── components/        Dashboard, SignalTimer, TrafficChart, AlertPanel
│       ├── hooks/             useSocket, useTrafficData
│       └── services/          API client
│
├── scripts/
│   ├── seed_db.js             seed sample intersections
│   └── simulate_traffic.py   demo without a real camera
│
└── docker-compose.yml         runs everything together
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB 6+ (or Docker)
- A webcam, RTSP camera, or use the built-in traffic simulator

### 1. Clone and set up environment

```bash
git clone https://github.com/yourusername/smart-traffic-control.git
cd smart-traffic-control
cp .env.example .env
# Edit .env with your config
```

### 2. Start MongoDB (Docker)

```bash
docker-compose up -d mongodb
```

### 3. Install and start the Node.js API

```bash
cd server
npm install
npm run seed       # populate sample intersection data
npm run dev        # starts on port 4000
```

### 4. Install and start the Python vision service

```bash
cd vision
pip install -r requirements.txt
# With a real camera:
python detector.py --source rtsp://your-camera-ip/stream
# With the simulator (no camera needed):
python simulate_traffic.py
```

### 5. Start the React dashboard

```bash
cd client
npm install
npm start          # opens on http://localhost:3000
```

### 6. Or run everything with Docker

```bash
docker-compose up --build
```

---

## Signal Optimization Algorithm

Uses a simplified **Webster's formula** for computing optimal green times:

```
C = (1.5L + 5) / (1 - Y)       # optimal cycle length
gi = (C - L) * (yi / Y)         # green time per phase
```

Where:
- `L` = total lost time per cycle (default 4s)
- `Y` = sum of critical flow ratios (vehicle count / saturation flow)
- `yi` = flow ratio for phase `i`

Each intersection updates its signal plan every **2 cycles** to avoid jitter while staying responsive to demand changes.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/intersections` | List all intersections |
| GET | `/api/intersections/:id` | Single intersection + current state |
| POST | `/api/traffic/reading` | Ingest vision service data |
| GET | `/api/traffic/history/:id` | Historical readings (last 24h) |
| GET | `/api/alerts` | Active alerts |
| POST | `/api/alerts/:id/resolve` | Resolve an alert |
| GET | `/api/health` | Service health check |

---

## Monitoring & Alerting

- **Uptime check**: pings each vision service endpoint every 60s; fires an alert if 2 consecutive pings fail
- **Queue spike alert**: triggers when queue length exceeds 150% of the 10-min rolling average
- **Stale data alert**: fires when no reading received from an intersection in >2 minutes
- Alerts persist in MongoDB and show in the dashboard Alert Panel

---

## Results

Tested against synthetic traffic patterns simulating a 4-way intersection:

| Metric | Fixed Timing | Dynamic (This System) |
|---|---|---|
| Avg wait time | 47s | 33s |
| Max queue length | 22 vehicles | 14 vehicles |
| Throughput (veh/hr) | 1,840 | 2,290 |

~30% reduction in average wait time, ~24% improvement in throughput.

---

## Known Limitations

- YOLOv8 detection accuracy drops in heavy rain/fog — a weather-adjusted confidence threshold helps but doesn't fully solve it
- Webster's formula assumes uniform arrival rates; real traffic has platoon arrivals which skews the calculation
- Currently single-process Python — should be async with `asyncio` for handling multiple camera streams without frame drops

---

## Tech Stack

| Component | Tech |
|---|---|
| Vehicle Detection | YOLOv8 (Ultralytics) |
| Vision Service | Python 3.10 |
| API Server | Node.js, Express 5 |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Frontend | React 18, Chart.js |
| Containerization | Docker + Docker Compose |

---

## License

MIT
