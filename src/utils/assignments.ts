import type { AgencyAssignment, RequestStatusValue } from '../types';

// Dogrudan atamali talep bu durumlardayken surucu atanabilir ya da pazaryerine acilabilir
export const ASSIGNABLE_STATUSES: RequestStatusValue[] = ['pending_location', 'pending', 'awaiting_approval'];

// assign-driver hata kodlari
export const ASSIGN_ERROR_MESSAGES: Record<string, string> = {
  DRIVER_BUSY: 'Sürücü şu an başka bir işte ya da başka bir atamada',
  DRIVER_NOT_ELIGIBLE: 'Sürücünün belgeleri veya profili eksik',
  DRIVER_NOT_IN_POOL: 'Sürücü listenizde değil',
  INVALID_STATUS: 'Talep artık atanabilir durumda değil',
  NOT_DIRECT: 'Bu talep pazaryerinde',
  LOCATION_REQUIRED: 'Müşterinin konumu bekleniyor',
};

// Panelin kendi isleminden dogan iptaller; kullaniciya ayrica mesaj gosterilmez
// (other_selected: acente toplu davetteki tekliflerden birini secti, digerleri kapandi)
const OWN_CANCEL_REASONS = ['reassigned', 'agency_cancelled', 'switched_to_broadcast', 'other_selected'];
export const isOwnCancelReason = (reason: string | null | undefined) =>
  !!reason && OWN_CANCEL_REASONS.includes(reason);

export const isBroadcast = (assignment: AgencyAssignment | null | undefined) => assignment?.mode === 'broadcast';

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

// Toplu davette surucu adiyla ("Ali Kaya teklif verdi: 1.250 TL"), tekil atamada "Sürücü kabul etti..."
export const offeredMessage = (estimatedPrice: string | null | undefined, driverName?: string) => {
  const price = estimatedPrice ? parseFloat(estimatedPrice) : NaN;
  const subject = driverName ? `${driverName} teklif verdi` : 'Sürücü kabul etti, teklif verdi';
  return Number.isFinite(price)
    ? `${subject}: ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(price)} TL`
    : subject;
};
