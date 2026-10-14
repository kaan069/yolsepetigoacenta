import { lazy, Suspense } from 'react';
import { ThemeProvider, CssBaseline, Box, IconButton } from '@mui/material';
import { WhatsApp, Email } from '@mui/icons-material';
import { Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import PanelLayout from './layouts/PanelLayout';
import PageLoader from './components/PageLoader';

// Sayfalar ayri chunk'lara bolunur; harita kutuphanesi yalnizca gereken sayfada yuklenir
const HomePage = lazy(() => import('./pages/public/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/panel/DashboardPage'));
const RequestsPage = lazy(() => import('./pages/panel/RequestsPage'));
const RequestDetailPage = lazy(() => import('./pages/panel/RequestDetailPage'));
const NewRequestPage = lazy(() => import('./pages/panel/NewRequest'));
const AssignDriverPage = lazy(() => import('./pages/panel/AssignDriver'));
const DriversPage = lazy(() => import('./pages/panel/Drivers'));
const PricingPage = lazy(() => import('./pages/panel/PricingPage'));
const HakedislerPage = lazy(() => import('./pages/panel/HakedislerPage'));
const SettingsPage = lazy(() => import('./pages/panel/SettingsPage'));
const LocationSharePage = lazy(() => import('./pages/public/LocationSharePage'));

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={4000}
      >
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* Konum paylasimi (musteri tarafi, layout yok) */}
          <Route path="/konum-paylas/:token" element={<LocationSharePage />} />

          {/* Auth */}
          <Route path="/panel/login" element={<LoginPage />} />
          <Route path="/panel/register" element={<RegisterPage />} />

          {/* Panel (auth korumali) */}
          <Route path="/panel" element={<PanelLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="requests/new" element={<NewRequestPage />} />
            <Route path="requests/:id" element={<RequestDetailPage />} />
            <Route path="requests/:id/assign" element={<AssignDriverPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="hakedisler" element={<HakedislerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        </Suspense>

        {/* Sabit iletisim butonlari */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1.5, zIndex: 1300 }}>
          <IconButton
            component="a"
            href="https://wa.me/905550103434"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              width: 48, height: 48, bgcolor: '#25D366', color: 'white',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
              '&:hover': { bgcolor: '#1da851' },
            }}
          >
            <WhatsApp />
          </IconButton>
          <IconButton
            component="a"
            href="mailto:info@yolsepetigo.com"
            sx={{
              width: 48, height: 48, bgcolor: '#0ea5e9', color: 'white',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
              '&:hover': { bgcolor: '#0284c7' },
            }}
          >
            <Email />
          </IconButton>
        </Box>
      </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
