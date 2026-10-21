// Backend adresi; VITE_API_URL tanimli degilse canli API kullanilir
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://api.yolsepetigo.com').replace(/\/$/, '');

// WebSocket adresi API adresinden turetilir (https -> wss, http -> ws)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

// Harita, adres arama ve mesafe hesabi
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Test sigortali telefonu; musteriden konum (SMS) denenecekse kendi numaranizi yazin
export const TEST_PHONE = (import.meta.env.VITE_TEST_PHONE || '5330933572').replace(/\D/g, '');

// Backend dosya adreslerini goreli ("/media/...") dondurebilir; API adresiyle tamamlanir
export const toMediaUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
