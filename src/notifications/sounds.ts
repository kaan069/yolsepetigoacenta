// Bildirim sesleri Web Audio ile uretilir (ses dosyasi yok).
// Tarayicilar kullanici etkilesimi olmadan ses calmaz; ilk tiklama/tusla AudioContext acilir.

export type NotificationTone = 'offer' | 'success' | 'warning' | 'info';

// [frekans (Hz), baslangic (sn)]
const TONES: Record<NotificationTone, [number, number][]> = {
  offer: [[880, 0], [1318.5, 0.13]],
  success: [[659.3, 0], [880, 0.1], [1318.5, 0.2]],
  warning: [[523.3, 0], [392, 0.16]],
  info: [[784, 0]],
};

let context: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (context) return context;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context = new Ctor();
  return context;
};

// Ilk kullanici etkilesiminde sesi ac; sonraki bildirimler engellenmeden calar
export function installAudioUnlock(): () => void {
  const unlock = () => {
    getContext()?.resume().catch(() => {});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
}

export function playNotificationTone(tone: NotificationTone) {
  const ctx = getContext();
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  for (const [frequency, offset] of TONES[tone]) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.4);
  }
}
