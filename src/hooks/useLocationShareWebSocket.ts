import { useEffect, useReducer, useRef, useState } from 'react';
import type {
  LocationShareImage,
  LocationShareState,
  LocationShareStatusResponse,
  WsLocationShareEvent,
} from '../types';
import { getLocationShareStatus } from '../api';

const RECONNECT_DELAY = 5000;

interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
}

type NotifySeverity = 'info' | 'success' | 'warning' | 'error';

interface UseLocationShareWebSocketOptions {
  token: string | null;
  wsUrl: string | null;
  enabled: boolean;
  onLocationReceived: (location: LocationResult) => void;
  onNotify: (severity: NotifySeverity, message: string) => void;
}

const initialState: LocationShareState = {
  location: null,
  images: [],
  imageCount: 0,
  maxImages: 0,
  isSubmitted: false,
  isExpired: false,
};

const byOrderThenId = (a: LocationShareImage, b: LocationShareImage) =>
  a.order - b.order || a.id - b.id;

type Action =
  | { kind: 'RESET' }
  | { kind: 'SNAPSHOT'; snap: LocationShareStatusResponse }
  | { kind: 'SET_LOCATION'; location: { lat: number; lng: number; address: string } }
  | { kind: 'IMAGE_UPSERT'; image: LocationShareImage }
  | { kind: 'IMAGE_REMOVE'; id: number }
  | { kind: 'SUBMITTED' }
  | { kind: 'EXPIRED' };

function reducer(state: LocationShareState, action: Action): LocationShareState {
  switch (action.kind) {
    case 'RESET':
      return initialState;

    case 'SNAPSHOT': {
      // Snapshot otoriterdir: gorsel listesini tumuyle degistirir, sirali tutar.
      const { snap } = action;
      const images = (snap.images ?? []).slice().sort(byOrderThenId);
      const isSubmitted = state.isSubmitted || snap.is_used;
      return {
        ...state,
        // location null gelirse mevcut (canli) konumu ezme
        location: snap.location ?? state.location,
        images,
        imageCount: snap.image_count ?? images.length,
        maxImages: snap.max_images ?? state.maxImages,
        isSubmitted,
        isExpired: (snap.is_expired ?? false) && !isSubmitted,
      };
    }

    case 'SET_LOCATION':
      return { ...state, location: action.location };

    case 'IMAGE_UPSERT': {
      // id zaten varsa: sayim degismez (snapshot+WS yarisinda cift sayim olmaz)
      if (state.images.some((i) => i.id === action.image.id)) {
        const images = state.images
          .map((i) => (i.id === action.image.id ? { ...i, ...action.image } : i))
          .sort(byOrderThenId);
        return { ...state, images };
      }
      const images = [...state.images, action.image].sort(byOrderThenId);
      return { ...state, images, imageCount: images.length };
    }

    case 'IMAGE_REMOVE': {
      if (!state.images.some((i) => i.id === action.id)) return state;
      const images = state.images.filter((i) => i.id !== action.id);
      return { ...state, images, imageCount: Math.max(0, images.length) };
    }

    case 'SUBMITTED':
      // submitted, expired'i ezer
      return { ...state, isSubmitted: true, isExpired: false };

    case 'EXPIRED':
      if (state.isSubmitted) return state;
      return { ...state, isExpired: true };

    default:
      return state;
  }
}

export function useLocationShareWebSocket(options: UseLocationShareWebSocketOptions) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);
  const terminalRef = useRef(false); // submission_completed | expiry -> reconnect etme
  const locationFilledRef = useRef(false); // formu yalnizca bir kez doldur
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const { token, wsUrl, enabled } = options;

  useEffect(() => {
    mountedRef.current = true;
    terminalRef.current = false;
    locationFilledRef.current = false;
    dispatch({ kind: 'RESET' });

    if (!enabled || !wsUrl || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearTimeout(reconnectTimeoutRef.current);
      setIsConnected(false);
      return;
    }

    function maybeFillLocation(
      raw:
        | {
            lat?: number; lng?: number;
            latitude?: number | string; longitude?: number | string;
            address?: string;
          }
        | null,
    ) {
      if (!raw || locationFilledRef.current) return;
      // Hem {lat,lng} (number) hem {latitude,longitude} (string) formatina toleransli ol
      const lat = typeof raw.lat === 'number' ? raw.lat : parseFloat(String(raw.latitude ?? ''));
      const lng = typeof raw.lng === 'number' ? raw.lng : parseFloat(String(raw.longitude ?? ''));
      // Gecersiz koordinati forma yazma (aksi halde toFixed crash eder)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      locationFilledRef.current = true;
      callbacksRef.current.onLocationReceived({
        latitude: lat,
        longitude: lng,
        address: raw.address ?? '',
      });
    }

    async function fetchSnapshot() {
      if (!token) return;
      try {
        const snap = await getLocationShareStatus(token);
        if (!mountedRef.current) return;
        dispatch({ kind: 'SNAPSHOT', snap });
        if (snap.is_used) {
          terminalRef.current = true;
        } else if (snap.is_expired) {
          terminalRef.current = true;
          dispatch({ kind: 'EXPIRED' });
        }
        maybeFillLocation(snap.location);
      } catch {
        // Snapshot alinamadi; canli event'ler hala gelebilir
      }
    }

    function handleLiveEvent(msg: WsLocationShareEvent) {
      switch (msg.type) {
        case 'location_received': {
          const location = {
            lat: parseFloat(msg.latitude),
            lng: parseFloat(msg.longitude),
            address: msg.address,
          };
          dispatch({ kind: 'SET_LOCATION', location });
          maybeFillLocation(location);
          break;
        }
        case 'image_uploaded':
          dispatch({
            kind: 'IMAGE_UPSERT',
            image: {
              id: msg.image_id,
              url: msg.url,
              order: msg.order,
              uploaded_at: new Date().toISOString(),
            },
          });
          callbacksRef.current.onNotify('info', 'Müşteri yeni görsel yükledi');
          break;
        case 'image_deleted':
          dispatch({ kind: 'IMAGE_REMOVE', id: msg.image_id });
          break;
        case 'image_moderated':
          dispatch({ kind: 'IMAGE_REMOVE', id: msg.image_id });
          callbacksRef.current.onNotify(
            'warning',
            `Yönetici bir görseli kaldırdı${msg.reason ? ': ' + msg.reason : ''}`,
          );
          break;
        case 'submission_completed':
          terminalRef.current = true;
          dispatch({ kind: 'SUBMITTED' });
          callbacksRef.current.onNotify(
            'success',
            'Müşteri formu gönderdi — talep işleme alındı',
          );
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
          break;
      }
    }

    function connect() {
      if (!mountedRef.current || terminalRef.current) return;

      const ws = new WebSocket(wsUrl as string);
      wsRef.current = ws;

      ws.onopen = () => {
        if (wsRef.current !== ws || !mountedRef.current) return;
        setIsConnected(true);
        // (Re)connect'te kacan event'leri yakalamak icin snapshot tazele
        fetchSnapshot();
      };

      ws.onmessage = (event) => {
        if (wsRef.current !== ws || !mountedRef.current) return;
        try {
          const data = JSON.parse(event.data) as WsLocationShareEvent;
          handleLiveEvent(data);
        } catch {
          // Bozuk mesaj
        }
      };

      ws.onclose = () => {
        // Eski bir effect calismasindan kalan soketi yok say
        if (wsRef.current !== ws) return;
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;
        if (terminalRef.current) return;
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (wsRef.current !== ws) return;
        ws.close();
      };
    }

    function scheduleReconnect() {
      if (!mountedRef.current || terminalRef.current) return;
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && !terminalRef.current) connect();
      }, RECONNECT_DELAY);
    }

    // Once snapshot (soket acilmadan galeriyi/konumu aninda doldur), sonra soket
    fetchSnapshot();
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
  }, [token, wsUrl, enabled]);

  const isWaiting =
    enabled && !state.location && !state.isSubmitted && !state.isExpired;

  return { state, isConnected, isWaiting };
}
