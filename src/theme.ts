import { createTheme } from '@mui/material/styles';
import { colors, shadows } from './tokens';

// Web (yolsepetigo.com) temasiyla ayni temel; panel yogun veri gosterdigi icin
// buton dolgulari ve baslik boyutlari biraz daha kompakt tutulur.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: '#ffffff',
    },
    success: {
      main: colors.success[500],
      light: colors.success[300],
      dark: colors.success[700],
      contrastText: '#ffffff',
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[300],
      dark: colors.warning[700],
      contrastText: '#ffffff',
    },
    info: {
      main: colors.info[500],
      light: colors.info[300],
      dark: colors.info[700],
      contrastText: '#ffffff',
    },
    error: {
      main: colors.danger[500],
      light: colors.danger[300],
      dark: colors.danger[700],
      contrastText: '#ffffff',
    },
    background: {
      default: colors.neutral[50],
      paper: '#ffffff',
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[600],
      disabled: colors.neutral[400],
    },
    divider: colors.neutral[200],
    grey: colors.neutral,
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 },
    h5: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.4 },
    h6: { fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.5 },
    body2: { lineHeight: 1.5 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '9px 20px',
          boxShadow: 'none',
        },
        contained: {
          '&:hover': { boxShadow: '0 6px 16px rgba(0, 0, 0, 0.14)' },
        },
        sizeSmall: {
          padding: '5px 12px',
          borderRadius: 10,
        },
        sizeLarge: {
          padding: '13px 28px',
          fontSize: '1rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: shadows.card,
          border: `1px solid ${colors.neutral[100]}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: shadows.card,
          border: `1px solid ${colors.neutral[100]}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '1.125rem' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#ffffff',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary[300] },
        },
        notchedOutline: {
          borderColor: colors.neutral[200],
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 12,
          fontWeight: 600,
          color: colors.neutral[500],
          backgroundColor: colors.neutral[50],
          borderBottomColor: colors.neutral[200],
        },
        body: {
          borderBottomColor: colors.neutral[100],
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': { backgroundColor: colors.primary[50] },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.Mui-selected': {
            backgroundColor: colors.primary[50],
            color: colors.primary[700],
            borderColor: colors.primary[200],
            '&:hover': { backgroundColor: colors.primary[100] },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: colors.neutral[800], fontSize: 12, borderRadius: 8 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});
