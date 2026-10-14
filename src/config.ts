// Backend adresi; VITE_API_URL tanimli degilse canli API kullanilir
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://api.yolsepetigo.com').replace(/\/$/, '');

// WebSocket adresi API adresinden turetilir (https -> wss, http -> ws)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');
