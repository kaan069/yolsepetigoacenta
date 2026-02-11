import { ThemeProvider, CssBaseline } from '@mui/material';
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
import NewRequestPage from './pages/panel/NewRequestPage';
import PricingPage from './pages/panel/PricingPage';
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
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
