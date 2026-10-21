import type { AgencyDriverInfo, AppLocation, DriverLocation, PoolDriver } from '../types';
import { colors } from '../tokens';

export const driverFullName = (driver: AgencyDriverInfo) => `${driver.first_name} ${driver.last_name}`.trim();

// 0.71 -> "0,7 km"
// Iki nokta arasi kus ucusu mesafe (km); backend'in distance_km hesabiyla ayni (haversine, 2 ondalik)
export const haversineKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const toRad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * toRad;
  const dLng = (b.longitude - a.longitude) * toRad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a.latitude * toRad) * Math.cos(b.latitude * toRad) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 100) / 100;
};

export const formatDistance = (km: number) =>
  `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(km)} km`;

const formatAgo = (iso: string, now: number) => {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  return `${Math.floor(minutes / 60)} sa önce`;
};

// now: verinin yuklendigi an; render sirasinda Date.now() cagirmamak icin disaridan verilir
export const describeLocation = (location: DriverLocation | null, now: number) => {
  if (!location) return 'Konum bilinmiyor';
  if (location.source === 'business') return 'İş adresi';
  const ago = location.updated_at ? ` · ${formatAgo(location.updated_at, now)}` : '';
  if (location.source === 'live') return `Canlı${ago}`;
  // last_known ve backend'in ileride ekleyebilecegi tanimsiz degerler
  return `Son konum${ago}`;
};

// Konum iş adresine düştüyse ya da yoksa uygulamanın son gönderdiği konumun zamanı: "Son görülme: dün 18:40"
export const describeLastSeen = (
  location: DriverLocation | null,
  appLocation: AppLocation | null | undefined,
  now: number,
) => {
  if (!appLocation || (location && location.source !== 'business')) return null;
  const seen = new Date(appLocation.updated_at);
  const time = seen.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfToday.getTime() - new Date(seen).setHours(0, 0, 0, 0)) / 86400000);
  if (dayDiff <= 0) return `Son görülme: bugün ${time}`;
  if (dayDiff === 1) return `Son görülme: dün ${time}`;
  return `Son görülme: ${seen.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${time}`;
};

export type PoolDriverStatus = 'pending_approval' | 'busy' | 'offline' | 'available';

// Rozet kurali: sirayla ilk uyan
export const getPoolDriverStatus = (poolDriver: PoolDriver): PoolDriverStatus => {
  if (poolDriver.eligible_services.length === 0) return 'pending_approval';
  if (poolDriver.is_busy) return 'busy';
  if (!poolDriver.driver.is_online) return 'offline';
  return 'available';
};

export const POOL_STATUS_CHIPS: Record<PoolDriverStatus, { label: string; bg: string; color: string }> = {
  pending_approval: { label: 'Eksik / onay bekliyor', bg: colors.neutral[100], color: colors.neutral[500] },
  busy: { label: 'Meşgul', bg: colors.secondary[100], color: colors.secondary[700] },
  offline: { label: 'Çevrimdışı', bg: colors.neutral[100], color: colors.neutral[500] },
  available: { label: 'Müsait', bg: colors.success[100], color: colors.success[600] },
};

// Surucu Haritasinda "İş aç": belgeleri tamam ve aktif isi olmayan surucu (cevrimdisi da atanabilir)
export const openJobBlockReason = (poolDriver: PoolDriver): string | null => {
  const status = getPoolDriverStatus(poolDriver);
  if (status === 'pending_approval') return 'Belgeleri eksik ya da onay bekliyor';
  if (status === 'busy') return 'Sürücünün aktif bir işi var';
  return null;
};
