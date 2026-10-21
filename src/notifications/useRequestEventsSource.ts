import { useEffect, useRef } from 'react';
import { listInsuranceRequests, getInsuranceRequest, extractTrackingToken } from '../api';
import type { RequestStatusValue } from '../types';
import { WS_BASE_URL } from '../config';
import { notificationFromStatusChange, notificationFromWsEvent, statusKey } from './events';
import type { PanelNotificationInput } from './events';

// Teklif, onay ve odeme olaylari bu durumlardaki taleplerde gelir
const ACTIVE_STATUSES: RequestStatusValue[] = ['pending', 'awaiting_approval', 'awaiting_payment', 'in_progress'];
const POLL_INTERVAL_MS = 30000;
// Liste ucu en fazla 100 talep doner; acentenin aktif talepleri bunun icinde kalir
const POLL_PAGE_SIZE = 100;

export type NotifyFn = (input: PanelNotificationInput, alsoSeenKeys?: string[]) => void;

/**
 * Panel genelinde talep olaylari. Backend'de acente icin tek bir olay kanali olmadigindan
 * aktif her talebin kendi kanali (ws/requests/{token}/) dinlenir. Liste 30 sn'de bir yoklanir:
 * yeni aktif talepler dinlenmeye baslanir, bitenlerin kanali kapanir; kacan durum
 * degisiklikleri de buradan bildirilir.
 * Not: Kanal kapaninca bekleyen talebin otomatik iptali acente taleplerinde kapali (backend 2406ec9).
 */
export function useRequestEventsSource(notify: NotifyFn) {
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  });

  useEffect(() => {
    let disposed = false;
    const sockets = new Map<number, WebSocket>();
    const tokens = new Map<number, string>();
    const statuses = new Map<number, RequestStatusValue>();
    let firstSync = true;

    const listen = (requestId: number, token: string) => {
      const socket = new WebSocket(`${WS_BASE_URL}/ws/requests/${token}/`);
      sockets.set(requestId, socket);
      socket.onmessage = (event) => {
        if (disposed) return;
        let data: { type?: string; [field: string]: unknown };
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        const notification = notificationFromWsEvent(requestId, data);
        if (!notification) return;
        // Ilk teklif talebi "onay bekliyor"a gecirir; yoklama ayrica bildirmesin
        notifyRef.current(notification, data.type === 'new_offer' ? [statusKey(requestId, 'awaiting_approval')] : undefined);
      };
      // Kopan kanal bir sonraki yoklamada yeniden acilir
      socket.onclose = () => {
        if (sockets.get(requestId) === socket) sockets.delete(requestId);
      };
    };

    const sync = async () => {
      let results;
      try {
        results = (await listInsuranceRequests({ page_size: POLL_PAGE_SIZE })).results;
      } catch {
        return;
      }
      if (disposed) return;

      const active = new Set<number>();
      for (const item of results) {
        const previous = statuses.get(item.request_id);
        statuses.set(item.request_id, item.status);
        // Ilk yuklemede mevcut durumlar bildirilmez; sonradan degisenler bildirilir
        if (!firstSync && previous && previous !== item.status) {
          const notification = notificationFromStatusChange(item.request_id, item.status);
          if (notification) notifyRef.current(notification);
        }
        if (ACTIVE_STATUSES.includes(item.status)) active.add(item.request_id);
      }
      firstSync = false;

      for (const [requestId, socket] of sockets) {
        if (!active.has(requestId)) {
          sockets.delete(requestId);
          socket.close();
        }
      }

      for (const requestId of active) {
        if (sockets.has(requestId)) continue;
        let token = tokens.get(requestId);
        if (!token) {
          try {
            const detail = await getInsuranceRequest(requestId);
            if (!detail.tracking_url) continue;
            token = extractTrackingToken(detail.tracking_url);
            tokens.set(requestId, token);
          } catch {
            continue;
          }
          if (disposed) return;
        }
        if (!sockets.has(requestId)) listen(requestId, token);
      }
    };

    sync();
    const interval = setInterval(sync, POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      clearInterval(interval);
      for (const socket of sockets.values()) socket.close();
      sockets.clear();
    };
  }, []);
}
