import { useEffect, useRef, useState } from 'react';
import type { AgencyDriverLocationEvent } from '../types';
import { WS_BASE_URL } from '../config';
import { refreshAccessToken } from '../api';

const PING_INTERVAL_MS = 25000;
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;
// Gecersiz ya da suresi dolmus acente token'i
const AUTH_FAILED_CODE = 4001;

interface UseAgencyDriversWebSocketOptions {
  enabled: boolean;
  // Havuzdaki bir surucunun yeni konumu (app-ping, aktif is konumu ya da heartbeat)
  onDriverLocation: (event: AgencyDriverLocationEvent) => void;
  // Kopup yeniden baglaninca: aradaki olaylar kacmis olabilir, liste bir kez yeniden cekilmeli
  onReconnected?: () => void;
}

// ws/agency/drivers/: acentenin sürücülerinin anlık konumu
export function useAgencyDriversWebSocket(options: UseAgencyDriversWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);

  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  });

  useEffect(() => {
    if (!options.enabled) return;

    let ws: WebSocket | null = null;
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;
    let delay = RECONNECT_DELAY_MS;
    let connectedOnce = false;
    // Token yenilendikten sonra hala 4001 gelirse dongu olmasin; normal bekleme ile denenir
    let authRefreshed = false;

    const scheduleReconnect = () => {
      reconnectTimer = setTimeout(connect, delay);
      delay = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
    };

    function connect() {
      if (disposed) return;
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const socket = new WebSocket(`${WS_BASE_URL}/ws/agency/drivers/?agency_token=${encodeURIComponent(token)}`);
      ws = socket;

      socket.onopen = () => {
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
        }, PING_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        if (disposed) return;
        let data: { type?: string };
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (data.type === 'connection_established') {
          setIsConnected(true);
          delay = RECONNECT_DELAY_MS;
          authRefreshed = false;
          if (connectedOnce) callbacksRef.current.onReconnected?.();
          connectedOnce = true;
        } else if (data.type === 'driver_location') {
          callbacksRef.current.onDriverLocation(data as AgencyDriverLocationEvent);
        }
      };

      socket.onclose = (event) => {
        clearInterval(pingTimer);
        if (ws === socket) ws = null;
        if (disposed) return;
        setIsConnected(false);
        if (event.code === AUTH_FAILED_CODE && !authRefreshed) {
          authRefreshed = true;
          // Yenileme basarisizsa refreshAccessToken oturumu kapatip girise yonlendirir
          refreshAccessToken().then(connect, () => {});
          return;
        }
        scheduleReconnect();
      };
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      clearInterval(pingTimer);
      ws?.close();
      ws = null;
      setIsConnected(false);
    };
  }, [options.enabled]);

  return { isConnected };
}
