import type { AgencyDriverInfo, DriverLocation, PoolDriver } from '../types';

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
  return location.updated_at ? `Canlı · ${formatAgo(location.updated_at, now)}` : 'Canlı';
};

export type PoolDriverStatus = 'pending_approval' | 'busy' | 'offline' | 'available';

// Rozet kurali: sirayla ilk uyan
export const getPoolDriverStatus = (poolDriver: PoolDriver): PoolDriverStatus => {
  if (poolDriver.eligible_services.length === 0) return 'pending_approval';
  if (poolDriver.is_busy) return 'busy';
  if (!poolDriver.driver.is_online) return 'offline';
  return 'available';
};
