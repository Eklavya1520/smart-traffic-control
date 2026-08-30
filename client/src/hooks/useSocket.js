import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4000';

export function useSocket(intersectionId) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTelemetry, setLastTelemetry] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (intersectionId) {
        socket.emit('subscribe:intersection', intersectionId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('traffic:update', (data) => {
      if (!intersectionId || data.intersectionId === intersectionId) {
        setLastTelemetry(data);
      }
    });

    socket.on('alert:new', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev]);
    });

    socket.on('alert:resolved', ({ alertId }) => {
      setLiveAlerts((prev) => prev.filter((a) => a._id !== alertId));
    });

    return () => {
      if (intersectionId) {
        socket.emit('unsubscribe:intersection', intersectionId);
      }
      socket.disconnect();
    };
  }, [intersectionId]);

  return { isConnected, lastTelemetry, liveAlerts, socket: socketRef.current };
}
