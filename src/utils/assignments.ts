import type { AgencyAssignment, RequestStatusValue } from '../types';

// Dogrudan atamali talep bu durumlardayken surucu atanabilir ya da pazaryerine acilabilir
export const ASSIGNABLE_STATUSES: RequestStatusValue[] = ['pending_location', 'pending', 'awaiting_approval'];

// Panelin kendi isleminden dogan iptaller; kullaniciya ayrica mesaj gosterilmez
export const isOwnCancelReason = (reason: string | null | undefined) =>
  reason === 'reassigned' || reason === 'agency_cancelled';

const CANCEL_MESSAGES: Record<string, string> = {
  offer_withdrawn: 'Sürücü teklifini geri çekti',
  request_cancelled: 'Talep iptal edildi',
  admin_reverted: 'Yönetici talebi geri aldı',
  driver_removed: 'Sürücü listenizden çıkarıldı',
  opened_to_marketplace: 'Talep pazaryerine açıldı',
  timeout: 'Sürücü süresi içinde yanıt vermedi',
  driver_declined: 'Sürücü reddetti',
};

// Kapanan atamanin (olaydan ya da sunucu durumundan) kullaniciya gosterilecek sonucu
export const assignmentOutcomeMessage = (status: AgencyAssignment['status'], reason: string | null | undefined) => {
  if (status === 'declined') return 'Sürücü reddetti';
  if (status === 'expired') return 'Sürücü süresi içinde yanıt vermedi';
  return (reason && CANCEL_MESSAGES[reason]) || 'Atama iptal edildi';
};

export const offeredMessage = (estimatedPrice: string | null | undefined) => {
  const price = estimatedPrice ? parseFloat(estimatedPrice) : NaN;
  return Number.isFinite(price)
    ? `Sürücü kabul etti, teklif verdi: ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(price)} TL`
    : 'Sürücü kabul etti, teklif verdi';
};
