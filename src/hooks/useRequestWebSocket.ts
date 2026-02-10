import { useEffect, useRef, useState } from 'react';
import type { DriverOfferInfo, WsMessage, WsNewOffer } from '../types';

const WS_BASE = 'wss://api.yolsepetigo.com/ws/requests';
const MAX_RECONNECT_DELAY = 30000;

function mapWsOfferToDriverOfferInfo(wsOffer: WsNewOffer['offer']): DriverOfferInfo {
  return {
    id: wsOffer.id,
    driver_info: {
      id: wsOffer.driver.id,
      name: `${wsOffer.driver.first_name} ${wsOffer.driver.last_name}`,
      phone: wsOffer.driver.phone_number,
      average_rating: null,
      total_ratings: 0,
    },
    vehicle_info: wsOffer.vehicle
      ? { ...wsOffer.vehicle, vehicle_type: '' }
      : null,
    estimated_price: parseFloat(wsOffer.estimated_price),
    driver_earnings: 0,
    platform_commission: 0,
    pricing_breakdown: {},
    offer_details: {},
    status: wsOffer.status as DriverOfferInfo['status'],
    created_at: wsOffer.created_at,
  };
}

interface UseRequestWebSocketOptions {
  trackingToken: string | null;
  enabled: boolean;
  onNewOffer: (offer: DriverOfferInfo) => void;
  onOfferWithdrawn: (offerId: number) => void;
  onStatusChange: () => void;
}

export function useRequestWebSocket(options: UseRequestWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectDelayRef = useRef(1000);
  const mountedRef = useRef(true);

  // Store callbacks in ref to avoid effect re-runs
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    mountedRef.current = true;

    if (!options.enabled || !options.trackingToken) {
      // Clean up any existing connection when disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearTimeout(reconnectTimeoutRef.current);
      setIsConnected(false);
      return;
    }

    const token = options.trackingToken;

    function connect() {
      if (!mountedRef.current) return;

      const ws = new WebSocket(`${WS_BASE}/${token}/`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        reconnectDelayRef.current = 1000;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as WsMessage;
          const cb = callbacksRef.current;
          switch (data.type) {
            case 'connection_established':
              cb.onStatusChange();
              break;
            case 'new_offer':
              cb.onNewOffer(mapWsOfferToDriverOfferInfo(data.offer));
              break;
            case 'offer_withdrawn':
              cb.onOfferWithdrawn(data.offer_id);
              break;
            case 'offer_accepted':
            case 'request_completed':
            case 'request_cancelled':
            case 'payment_completed':
              cb.onStatusChange();
              break;
          }
        } catch {
          // Malformed message - ignore
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        ws.close();
      };
    }

    function scheduleReconnect() {
      if (!mountedRef.current || !callbacksRef.current.enabled) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && callbacksRef.current.enabled) {
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
  }, [options.trackingToken, options.enabled]);

  return { isConnected };
}
