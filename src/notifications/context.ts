import { createContext, useContext } from 'react';
import type { PanelNotification } from './events';

export type DesktopPermission = NotificationPermission | 'unsupported';

export interface NotificationsContextValue {
  notifications: PanelNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  desktopPermission: DesktopPermission;
  requestDesktopPermission: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  openRequest: (requestId: number) => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error('useNotifications NotificationsProvider icinde kullanilmali');
  return value;
}
