/**
 * index.js
 * Main entry point for the Smart Traffic Control Node.js & Socket.IO server.
 */

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { setupSocketIO } = require('./socket/socketHandler');
const { initUptimeMonitor } = require('./services/uptimeMonitor');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
setupSocketIO(io);

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/traffic', require('./routes/trafficRoutes'));
app.use('/api/intersections', require('./routes/intersectionRoutes'));
app.use('/api/alerts', require('./routes/alertRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'smart-traffic-control-api',
    uptimeSec: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Start uptime background checker
initUptimeMonitor(io, parseInt(process.env.UPTIME_CHECK_INTERVAL_MS, 10) || 30000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Smart Traffic Control Server listening on port ${PORT}`);
  console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(` WebSocket   : Active`);
  console.log(`=======================================================`);
});
