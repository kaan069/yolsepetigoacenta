import { ThemeProvider, CssBaseline, Box, IconButton } from '@mui/material';
import { WhatsApp, Email } from '@mui/icons-material';
import { Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import PanelLayout from './layouts/PanelLayout';
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/panel/DashboardPage';
import RequestsPage from './pages/panel/RequestsPage';
import RequestDetailPage from './pages/panel/RequestDetailPage';
import NewRequestPage from './pages/panel/NewRequest';
import PricingPage from './pages/panel/PricingPage';
import HakedislerPage from './pages/panel/HakedislerPage';
import SettingsPage from './pages/panel/SettingsPage';
import LocationSharePage from './pages/public/LocationSharePage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
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
            <Route path="pricing" element={<PricingPage />} />
            <Route path="hakedisler" element={<HakedislerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>

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
    </ThemeProvider>
  );
}

export default App;
