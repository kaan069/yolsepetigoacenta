import type { AgencyDriverInfo, AppLocation, DriverLocation, PoolDriver } from '../types';

export const driverFullName = (driver: AgencyDriverInfo) => `${driver.first_name} ${driver.last_name}`.trim();

// 0.71 -> "0,7 km"
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
