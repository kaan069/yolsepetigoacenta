import { useEffect, useState } from 'react';

// expires_at'e kalan sure. Cihaz saati sapabilecegi icin kesin karar her zaman WS olayindan gelir.
export function useCountdown(expiresAt: string | null | undefined) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const remainingMs = expiresAt ? Math.max(0, new Date(expiresAt).getTime() - now) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return {
    remainingSeconds,
    label: `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`,
    isExpired: !!expiresAt && remainingMs === 0,
  };
}
