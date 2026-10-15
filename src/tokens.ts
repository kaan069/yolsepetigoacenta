// YolSepetiGO "turkuaz" tasarim sistemi token'lari.
// Kaynak: web src/theme/theme.ts ve surucu uygulamasi src/theme/design.ts.
// Renkler bu dosyadan kullanilir; sayfalarda hex yazilmaz.

import type { RequestStatusValue } from './types';

export const colors = {
  primary: {
    50: '#effbf9',
    100: '#cdf3ee',
    200: '#9ee6dd',
    300: '#66d0c4',
    400: '#4db6ac', // Marka/logo tonu (turkuaz)
    500: '#159b8d', // Ana renk (buton/aksan)
    600: '#0f7d72',
    700: '#0f635b',
    800: '#114f49',
    900: '#0f413c',
  },
  secondary: {
    50: '#fef7ee',
    100: '#fdedd3',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Turuncu
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50: '#f0faf8', // Sayfa zemini (hafif turkuaz)
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  white: '#ffffff',
} as const;

export type ColorScale = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

/** Hex rengi saydamlikla rgba'ya cevirir: alpha('#159b8d', 0.2) */
export function alpha(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Tinted kutu kalibi: X[50] zemin, X[200] kenarlik, X[700] metin, X[500] ikon. */
export function tint(scale: ColorScale) {
  const c = colors[scale];
  return { bg: c[50], border: c[200], text: c[700], icon: c[500], solid: c[500] };
}

export const shadows = {
  card: '0 2px 12px rgba(0, 0, 0, 0.08)',
  raised: '0 8px 24px rgba(0, 0, 0, 0.12)',
  primary: `0 4px 14px ${alpha(colors.primary[500], 0.3)}`,
} as const;

/** Marka gradyanlari (web TopBar ile ayni) */
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
  brandText: `linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[500]} 100%)`,
  glass: `linear-gradient(135deg, ${colors.primary[500]}15, ${colors.secondary[500]}10)`,
} as const;

// Hizmet kartlari icin markayla uyumlu serin palet (web ve mobil ile birebir ayni)
export type CardPalette = { 200: string; 500: string; 600: string };

export const cardPalettes = {
  towTruck: { 200: '#9ee6dd', 500: '#159b8d', 600: '#0f7d72' },
  crane: { 200: '#a6dcef', 500: '#1f8fc4', 600: '#1772a0' },
  moving: { 200: '#a8e6cf', 500: '#13a37b', 600: '#0e8160' },
  roadAssistance: { 200: '#bcd0e8', 500: '#4a6fa5', 600: '#3a5985' },
  transferOrg: { 200: '#9fe8e1', 500: '#0fa39a', 600: '#0c807a' },
  transferVip: { 200: '#c2c9d6', 500: '#475d72', 600: '#374a5c' },
} satisfies Record<string, CardPalette>;

export interface StatusStyle {
  bg: string;
  text: string;
}

// Talep durumu renkleri: X[100] zemin, X[700] metin (surucu uygulamasindaki esleme)
export const statusColors: Record<RequestStatusValue, StatusStyle> = {
  pending_location: { bg: colors.neutral[100], text: colors.neutral[700] },
  pending: { bg: colors.warning[100], text: colors.warning[700] },
  awaiting_approval: { bg: colors.info[100], text: colors.info[700] },
  awaiting_payment: { bg: colors.secondary[100], text: colors.secondary[700] },
  in_progress: { bg: colors.primary[100], text: colors.primary[700] },
  completed: { bg: colors.success[100], text: colors.success[700] },
  cancelled: { bg: colors.danger[100], text: colors.danger[700] },
};

export const unknownStatusStyle: StatusStyle = { bg: colors.neutral[100], text: colors.neutral[600] };

export function getStatusStyle(status?: string | null): StatusStyle {
  return (status && statusColors[status as RequestStatusValue]) || unknownStatusStyle;
}
