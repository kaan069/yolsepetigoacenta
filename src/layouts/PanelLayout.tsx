import { useState } from 'react';
import {
  Box, Typography, IconButton, Avatar, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, useMediaQuery, useTheme, AppBar, Toolbar,
} from '@mui/material';
import {
  Dashboard, ListAlt, AddCircleOutline, Calculate, AccountBalanceWallet, Settings, Logout,
  Menu as MenuIcon, ChevronLeft,
} from '@mui/icons-material';
import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Kontrol Paneli', path: '/panel', icon: <Dashboard /> },
  { label: 'Talepler', path: '/panel/requests', icon: <ListAlt /> },
  { label: 'Yeni Talep', path: '/panel/requests/new', icon: <AddCircleOutline /> },
  { label: 'Fiyat Hesapla', path: '/panel/pricing', icon: <Calculate /> },
  { label: 'Hakedisler', path: '/panel/hakedisler', icon: <AccountBalanceWallet /> },
  { label: 'Ayarlar', path: '/panel/settings', icon: <Settings /> },
];

export default function PanelLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            component="img"
            src="/assets/goyazililogo.jpeg"
            alt="YolSepetiGO"
            sx={{ width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2, objectFit: 'cover' }}
          />
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>Yukleniyor...</Typography>
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/panel/login" replace />;
  }

  const isActive = (path: string) => {
    if (path === '/panel') return location.pathname === '/panel';
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0f172a' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component="img"
          src="/assets/goyazililogo.jpeg"
          alt="YolSepetiGO"
          sx={{ width: 38, height: 38, borderRadius: 2, objectFit: 'cover', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.4)' }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: 'white', lineHeight: 1.2 }}>
            YolSepetiGO
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
            Acenta Paneli
          </Typography>
        </Box>
        {isMobile && (
          <IconButton size="small" onClick={() => setMobileOpen(false)} sx={{ color: '#64748b' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Box sx={{ px: 2, mb: 1 }}>
        <Divider sx={{ borderColor: '#1e293b' }} />
      </Box>

      {/* Nav */}
      <List sx={{ px: 1.5, py: 1, flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                px: 2,
                py: 1.1,
                color: active ? 'white' : '#94a3b8',
                bgcolor: active ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                '&:hover': {
                  bgcolor: active ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: active ? 'white' : '#e2e8f0',
                },
                transition: 'all 0.15s ease',
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: active ? '#38bdf8' : '#64748b' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 600 : 400 }}
              />
              {active && (
                <Box sx={{ width: 3, height: 18, borderRadius: 2, bgcolor: '#38bdf8' }} />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 2, mb: 1 }}>
        <Divider sx={{ borderColor: '#1e293b' }} />
      </Box>

      {/* User */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 36, height: 36, fontSize: 14, fontWeight: 600,
          background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
        }}>
          {user?.name?.charAt(0) || 'A'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.contact_email}
          </Typography>
        </Box>
        <IconButton size="small" onClick={logout} title="Cikis Yap" sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
          <Logout fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
          <Box sx={{
            width: DRAWER_WIDTH, position: 'fixed', height: '100vh',
            borderRight: '1px solid #1e293b',
          }}>
            {drawerContent}
          </Box>
        </Box>
      )}

      {/* Sidebar - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}
      >
        {drawerContent}
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile top bar */}
        {isMobile && (
          <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
            <Toolbar sx={{ minHeight: 56 }}>
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1, color: '#334155' }}>
                <MenuIcon />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  component="img"
                  src="/assets/goyazililogo.jpeg"
                  alt="YolSepetiGO"
                  sx={{ width: 28, height: 28, borderRadius: 1, objectFit: 'cover' }}
                />
                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                  YolSepetiGO
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>
        )}

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
