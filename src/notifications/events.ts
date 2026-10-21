import type { RequestStatusValue } from '../types';
import type { NotificationTone } from './sounds';

export type NotificationSeverity = 'success' | 'info' | 'warning';

// Gosterilecek bildirim (zil listesi, sag ust kart, masaustu bildirimi)
export interface PanelNotificationInput {
  // Ayni olayin iki kez gelmesini (WS + yoklama, cift baglanti) eler
  key: string;
  requestId: number;
  title: string;
  message: string;
  severity: NotificationSeverity;
  tone: NotificationTone;
}

export interface PanelNotification extends PanelNotificationInput {
  id: string;
  createdAt: number;
  read: boolean;
}

const formatTl = (value: unknown) => {
  const price = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(price) ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(price)} TL` : '';
};

const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(' · ');

const driverName = (assignment: unknown) => {
  const driver = (assignment as { driver?: { first_name?: string; last_name?: string } } | null)?.driver;
  return driver ? `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() : '';
};

// Durum gecisleri: hem WS olayi hem yoklama ayni anahtari uretir, bildirim bir kez cikar
export const statusKey = (requestId: number, status: string) => `status:${requestId}:${status}`;

type WsEvent = { type?: string; [field: string]: unknown };

// ws/requests/{token}/ olayi -> bildirim; bildirilmeyecek olaylarda null
export function notificationFromWsEvent(requestId: number, event: WsEvent): PanelNotificationInput | null {
  const talep = `Talep #${requestId}`;
  switch (event.type) {
    case 'new_offer': {
      const offer = event.offer as { id?: number; estimated_price?: number; driver_info?: { name?: string } } | undefined;
      return {
        key: `offer:${offer?.id ?? Date.now()}`,
        requestId,
        title: 'Yeni teklif geldi',
        message: join(talep, offer?.driver_info?.name, formatTl(offer?.estimated_price)),
        severity: 'info',
        tone: 'offer',
      };
    }
    case 'offer_withdrawn':
      return {
        key: `withdrawn:${event.offer_id}`,
        requestId,
        title: 'Teklif geri çekildi',
        message: talep,
        severity: 'warning',
        tone: 'warning',
      };
    case 'offer_accepted':
    case 'request_approved':
      return {
        key: statusKey(requestId, 'awaiting_payment'),
        requestId,
        title: 'Teklif onaylandı',
        message: join(talep, event.driver_name as string | undefined, formatTl(event.estimated_price)),
        severity: 'success',
        tone: 'success',
      };
    case 'request_rejected':
      return {
        key: `rejected:${requestId}:${Date.now()}`,
        requestId,
        title: 'Teklif reddedildi',
        message: join(talep, event.reason as string | undefined),
        severity: 'warning',
        tone: 'warning',
      };
    case 'payment_completed':
    case 'request_accepted':
      return {
        key: statusKey(requestId, 'in_progress'),
        requestId,
        title: 'Ödeme alındı, iş başladı',
        message: talep,
        severity: 'success',
        tone: 'success',
      };
    case 'status_update':
      if (event.status === 'in_progress') return notificationFromWsEvent(requestId, { type: 'payment_completed' });
      // Odeme basarisiz olup talep geri alindi
      if (event.status === 'awaiting_approval' && event.old_status === 'awaiting_payment') {
        return {
          key: `payment_failed:${requestId}:${Date.now()}`,
          requestId,
          title: 'Ödeme tamamlanamadı',
          message: `${talep} · teklif tekrar onay bekliyor`,
          severity: 'warning',
          tone: 'warning',
        };
      }
      return null;
    case 'request_completed':
      return {
        key: statusKey(requestId, 'completed'),
        requestId,
        title: 'İş tamamlandı',
        message: talep,
        severity: 'success',
        tone: 'success',
      };
    case 'request_cancelled':
      return {
        key: statusKey(requestId, 'cancelled'),
        requestId,
        title: 'Talep iptal edildi',
        message: join(talep, event.reason as string | undefined),
        severity: 'warning',
        tone: 'warning',
      };
    case 'agency_assignment': {
      const assignment = event.assignment as { id?: number } | null;
      const name = driverName(assignment);
      // assignment_offered: ayni anda new_offer da gelir, o bildirilir
      if (event.event === 'assignment_declined') {
        return {
          key: `assignment:${assignment?.id}:declined`,
          requestId,
          title: 'Sürücü atamayı reddetti',
          message: join(talep, name),
          severity: 'warning',
          tone: 'warning',
        };
      }
      if (event.event === 'assignment_expired') {
        return {
          key: `assignment:${assignment?.id}:expired`,
          requestId,
          title: 'Sürücü süresi içinde yanıt vermedi',
          message: join(talep, name),
          severity: 'warning',
          tone: 'warning',
        };
      }
      // Panelin kendi islemleri ve ayrica bildirilen olaylar (teklif geri cekme, talep iptali) haric
      if (event.event === 'assignment_cancelled' && (event.reason === 'admin_reverted' || event.reason === 'driver_removed')) {
        return {
          key: `assignment:${assignment?.id}:cancelled`,
          requestId,
          title: event.reason === 'admin_reverted' ? 'Yönetici atamayı geri aldı' : 'Sürücü listenizden çıkarıldı',
          message: join(talep, name),
          severity: 'warning',
          tone: 'warning',
        };
      }
      return null;
    }
    default:
      return null;
  }
}

// Yoklamada gorulen durum degisikligi (WS olayi kacmissa ya da talep yeni dinlenmeye baslandiysa)
export function notificationFromStatusChange(requestId: number, status: RequestStatusValue): PanelNotificationInput | null {
  const talep = `Talep #${requestId}`;
  const byStatus: Partial<Record<RequestStatusValue, Omit<PanelNotificationInput, 'key' | 'requestId' | 'message'>>> = {
    awaiting_approval: { title: 'Teklif bekleyen talep', severity: 'info', tone: 'offer' },
    awaiting_payment: { title: 'Teklif onaylandı', severity: 'success', tone: 'success' },
    in_progress: { title: 'Ödeme alındı, iş başladı', severity: 'success', tone: 'success' },
    completed: { title: 'İş tamamlandı', severity: 'success', tone: 'success' },
    cancelled: { title: 'Talep iptal edildi', severity: 'warning', tone: 'warning' },
  };
  const base = byStatus[status];
  return base ? { ...base, key: statusKey(requestId, status), requestId, message: talep } : null;
}
