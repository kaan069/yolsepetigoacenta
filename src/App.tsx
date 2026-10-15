import { lazy, Suspense } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import PanelLayout from './layouts/PanelLayout';
import PageLoader from './components/PageLoader';
import ContactFab from './components/ContactFab';

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
const DriverDetailPage = lazy(() => import('./pages/panel/DriverDetail'));
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
            <Route path="drivers/:id" element={<DriverDetailPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="hakedisler" element={<HakedislerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        </Suspense>

        <ContactFab />
      </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
