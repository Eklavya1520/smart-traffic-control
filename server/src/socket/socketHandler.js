/**
 * socketHandler.js
 * Real-time bidirectional WebSocket handling with room isolation per intersection.
 */

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join specific intersection telemetry stream room
    socket.on('subscribe:intersection', (intersectionId) => {
      socket.join(`intersection:${intersectionId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined room: intersection:${intersectionId}`);
    });

    socket.on('unsubscribe:intersection', (intersectionId) => {
      socket.leave(`intersection:${intersectionId}`);
      console.log(`[Socket.IO] Client ${socket.id} left room: intersection:${intersectionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupSocketIO };
