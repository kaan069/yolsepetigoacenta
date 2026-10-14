export const MAP_ID = 'assign-driver-map';

// 0 = sinirsiz (backend yaricap uygulamaz)
export const RADIUS_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 0, label: 'Sınırsız' },
];

export const DEFAULT_RADIUS_KM = 50;

// Surucu mesgul durumu ve konumu degistigi icin liste acikken periyodik yenilenir
export const REFRESH_INTERVAL_MS = 30000;
// Musteri konumu beklenirken daha sik yoklanir
export const LOCATION_WAIT_REFRESH_MS = 10000;
// Geri sayim bittikten sonra olay gelmezse durumu sunucudan tazelemeden once beklenen sure
export const EXPIRY_GRACE_MS = 5000;
