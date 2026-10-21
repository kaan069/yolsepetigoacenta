import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { NotificationsContext } from './context';
import type { DesktopPermission, NotificationsContextValue } from './context';
import type { PanelNotification, PanelNotificationInput } from './events';
import { installAudioUnlock, playNotificationTone } from './sounds';
import { useRequestEventsSource } from './useRequestEventsSource';

const STORAGE_KEY = 'panel_notifications_v1';
const SOUND_KEY = 'panel_notifications_sound';
const MAX_ITEMS = 50;
// Ayni anahtarli olay bu sure icinde tekrar gelirse yok sayilir
const DEDUPE_MS = 10 * 60 * 1000;
const TOAST_DURATION_MS = 8000;

// Tarayici depolamasi kapali olabilir (gizli pencere); hata durumunda bos baslanir
const loadStored = (): PanelNotification[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
};

const readSoundPref = () => {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
};

const currentDesktopPermission = (): DesktopPermission =>
  typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';

// Panel calisanina teklif, onay, odeme gibi olaylarda sag ustte sesli bildirim
export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState<PanelNotification[]>(loadStored);
  const [soundEnabled, setSoundEnabledState] = useState(readSoundPref);
  const [desktopPermission, setDesktopPermission] = useState<DesktopPermission>(currentDesktopPermission);
  const seenRef = useRef(new Map<string, number>());
  const soundRef = useRef(soundEnabled);

  useEffect(() => installAudioUnlock(), []);

  useEffect(() => {
    soundRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Depolama kapaliysa liste sadece bu oturumda tutulur
    }
  }, [notifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  // Sekme basliginda okunmamis sayisi: "(2) YolSepetiGO Acenta Paneli"
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const openRequest = useCallback((requestId: number) => {
    navigate(`/panel/requests/${requestId}`);
  }, [navigate]);

  const notify = useCallback((input: PanelNotificationInput, alsoSeenKeys: string[] = []) => {
    const now = Date.now();
    const seen = seenRef.current;
    for (const [key, at] of seen) if (now - at > DEDUPE_MS) seen.delete(key);
    if (seen.has(input.key)) return;
    seen.set(input.key, now);
    alsoSeenKeys.forEach((key) => seen.set(key, now));

    const item: PanelNotification = {
      ...input,
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, MAX_ITEMS));

    if (soundRef.current) playNotificationTone(input.tone);

    enqueueSnackbar(
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{input.title}</Typography>
        <Typography sx={{ fontSize: 13, opacity: 0.92 }}>{input.message}</Typography>
      </Box>,
      {
        variant: input.severity,
        autoHideDuration: TOAST_DURATION_MS,
        action: (snackbarKey) => (
          <Button
            size="small"
            sx={{ color: 'inherit', fontWeight: 700, minWidth: 0 }}
            onClick={() => {
              closeSnackbar(snackbarKey);
              markRead(item.id);
              openRequest(input.requestId);
            }}
          >
            Aç
          </Button>
        ),
      },
    );

    // Panel sekmesi arka plandaysa isletim sistemi bildirimi de gosterilir
    if (document.visibilityState === 'hidden' && currentDesktopPermission() === 'granted') {
      try {
        const desktop = new Notification(input.title, { body: input.message, icon: '/assets/goyazililogo.webp', tag: input.key });
        desktop.onclick = () => {
          window.focus();
          markRead(item.id);
          openRequest(input.requestId);
          desktop.close();
        };
      } catch {
        // Bazi tarayicilar (or. iOS Safari) Notification olusturmaya izin vermez
      }
    }
  }, [enqueueSnackbar, closeSnackbar, markRead, openRequest]);

  useRequestEventsSource(notify);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
    } catch {
      // Tercih sadece bu oturumda gecerli olur
    }
    if (enabled) playNotificationTone('info');
  }, []);

  const requestDesktopPermission = useCallback(() => {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(setDesktopPermission).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => (item.read ? item : { ...item, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const value = useMemo<NotificationsContextValue>(() => ({
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    desktopPermission,
    requestDesktopPermission,
    markRead,
    markAllRead,
    clearAll,
    openRequest,
  }), [
    notifications, unreadCount, soundEnabled, setSoundEnabled, desktopPermission,
    requestDesktopPermission, markRead, markAllRead, clearAll, openRequest,
  ]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
