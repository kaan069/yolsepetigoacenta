import { useEffect, useRef, useState } from 'react';
import type { WsLocationReceived } from '../types';

const MAX_RECONNECT_DELAY = 15000;

interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
}

interface UseLocationShareWebSocketOptions {
  wsUrl: string | null;
  onLocationReceived: (location: LocationResult) => void;
}

export function useLocationShareWebSocket(options: UseLocationShareWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectDelayRef = useRef(1000);
  const mountedRef = useRef(true);
  const receivedRef = useRef(false);
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    mountedRef.current = true;
    receivedRef.current = false;

    if (!options.wsUrl) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearTimeout(reconnectTimeoutRef.current);
      setIsConnected(false);
      setIsWaiting(false);
      return;
    }

    const url = options.wsUrl;
    setIsWaiting(true);

    function connect() {
      if (!mountedRef.current || receivedRef.current) return;

      const ws = new WebSocket(url);
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
            receivedRef.current = true;
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
        // Konum alindiysa reconnect etme
        if (receivedRef.current) return;
        // Sadece hala bekliyorsak reconnect et
        if (callbacksRef.current.wsUrl) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        ws.close();
      };
    }

    function scheduleReconnect() {
      if (!mountedRef.current || receivedRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !receivedRef.current && callbacksRef.current.wsUrl) {
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
  }, [options.wsUrl]);

  return { isConnected, isWaiting };
}
