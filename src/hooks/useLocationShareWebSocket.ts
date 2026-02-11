import { useEffect, useRef, useState } from 'react';
import type { WsLocationReceived } from '../types';

const WS_BASE = 'wss://api.yolsepetigo.com/ws/location-share';
const MAX_RECONNECT_DELAY = 15000;

interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
}

interface UseLocationShareWebSocketOptions {
  sessionId: string | null;
  onLocationReceived: (location: LocationResult) => void;
}

export function useLocationShareWebSocket(options: UseLocationShareWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectDelayRef = useRef(1000);
  const mountedRef = useRef(true);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    mountedRef.current = true;

    if (!options.sessionId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearTimeout(reconnectTimeoutRef.current);
      setIsConnected(false);
      setIsWaiting(false);
      return;
    }

    const sessionId = options.sessionId;
    setIsWaiting(true);

    function connect() {
      if (!mountedRef.current) return;

      const ws = new WebSocket(`${WS_BASE}/${sessionId}/`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        reconnectDelayRef.current = 1000;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'location_received') {
            const loc = data as WsLocationReceived;
            callbacksRef.current.onLocationReceived({
              latitude: parseFloat(loc.latitude),
              longitude: parseFloat(loc.longitude),
              address: loc.address,
            });
            setIsWaiting(false);
            // Konum alindi, WS'i kapat
            ws.close();
            wsRef.current = null;
          }
        } catch {
          // Malformed message
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;
        // Sadece hala bekliyorsak reconnect et
        if (callbacksRef.current.sessionId) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        ws.close();
      };
    }

    function scheduleReconnect() {
      if (!mountedRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && callbacksRef.current.sessionId) {
          connect();
        }
      }, reconnectDelayRef.current);
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * 2,
        MAX_RECONNECT_DELAY,
      );
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.sessionId]);

  return { isConnected, isWaiting };
}
