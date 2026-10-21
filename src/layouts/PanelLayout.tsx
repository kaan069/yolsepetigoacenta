import { Suspense, useState } from 'react';
import {
  Box, Typography, IconButton, Avatar, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, Button, Menu, MenuItem, useMediaQuery, useTheme,
} from '@mui/material';
import {
  SpaceDashboardOutlined, ListAltOutlined, GroupsOutlined, MapOutlined, CalculateOutlined,
  AccountBalanceWalletOutlined, SettingsOutlined, Logout, Add, Close, WhatsApp, MailOutline,
  Menu as MenuIcon, KeyboardArrowDown, ChevronRight,
} from '@mui/icons-material';
import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import PageLoader from '../components/PageLoader';
import BrandLogo from '../components/BrandLogo';
import { colors, gradients, shadows } from '../tokens';

const DRAWER_WIDTH = 264;
const TOPBAR_HEIGHT = 64;
const NEW_REQUEST_PATH = '/panel/requests/new';

const navSections = [
  {
    title: 'Operasyon',
    items: [
      { label: 'Kontrol Paneli', path: '/panel', icon: <SpaceDashboardOutlined /> },
      { label: 'Talepler', path: '/panel/requests', icon: <ListAltOutlined /> },
      { label: 'Sürücülerim', path: '/panel/drivers', icon: <GroupsOutlined /> },
      { label: 'Sürücü Haritası', path: '/panel/drivers/map', icon: <MapOutlined /> },
    ],
  },
  {
    title: 'Hesap',
    items: [
      { label: 'Fiyat Hesapla', path: '/panel/pricing', icon: <CalculateOutlined /> },
      { label: 'Hakedisler', path: '/panel/hakedisler', icon: <AccountBalanceWalletOutlined /> },
      { label: 'Ayarlar', path: '/panel/settings', icon: <SettingsOutlined /> },
    ],
  },
];

const navItems = navSections.flatMap((section) => section.items);

export default function PanelLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { pathname } = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/panel/login" replace />;
  }

  // "Yeni Talep" kendi butonuyla vurgulanir; o sayfada "Talepler" aktif gorunmez.
  // Ic ice yollarda en uzun eslesen secilir ("/panel/drivers/map" -> "Sürücülerim" degil "Sürücü Haritası")
  const matches = (path: string) => {
    if (pathname === path) return true;
    if (path === '/panel' || pathname === NEW_REQUEST_PATH) return false;
    return pathname.startsWith(`${path}/`);
  };
  const activePath = navItems
    .filter((item) => matches(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const isActive = (path: string) => path === activePath;

  const onNewRequestPage = pathname === NEW_REQUEST_PATH;
  const currentLabel = onNewRequestPage ? 'Yeni Talep' : navItems.find((item) => isActive(item.path))?.label;
  const displayName = user?.contact_person || user?.name || 'Acenta';
  const closeMobile = () => isMobile && setMobileOpen(false);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: colors.white }}>
      {/* Marka */}
      <Box sx={{ px: 2.5, height: TOPBAR_HEIGHT + 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component={Link} to="/panel" onClick={closeMobile} sx={{ textDecoration: 'none', minWidth: 0 }}>
          <BrandLogo size={40} subtitle="Acenta Paneli" />
        </Box>
        {isMobile && (
          <IconButton size="small" onClick={() => setMobileOpen(false)} sx={{ color: colors.neutral[500] }}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Ana aksiyon */}
      <Box sx={{ px: 2, pt: 1, pb: 2 }}>
        <Button
          component={Link}
          to={NEW_REQUEST_PATH}
          onClick={closeMobile}
          fullWidth
          variant="contained"
          startIcon={<Add />}
          sx={{
            py: 1.25,
            background: gradients.primary,
            boxShadow: shadows.primary,
            '&:hover': { boxShadow: `0 6px 18px ${colors.primary[500]}59` },
            ...(onNewRequestPage && { outline: `3px solid ${colors.primary[100]}` }),
          }}
        >
          Yeni Talep
        </Button>
      </Box>

      {/* Menu */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5 }}>
        {navSections.map((section) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            <Typography sx={{
              px: 1.5, mb: 0.5, fontSize: 11, fontWeight: 700, color: colors.neutral[400],
              textTransform: 'uppercase', letterSpacing: 0.8,
            }}>
              {section.title}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <ListItemButton
                    key={item.path}
                    component={Link}
                    to={item.path}
                    onClick={closeMobile}
                    sx={{
                      position: 'relative',
                      borderRadius: 2.5,
                      mb: 0.25,
                      px: 1.5,
                      py: 1,
                      color: active ? colors.primary[700] : colors.neutral[600],
                      bgcolor: active ? colors.primary[50] : 'transparent',
                      '&:hover': {
                        bgcolor: active ? colors.primary[50] : colors.neutral[100],
                        color: active ? colors.primary[700] : colors.neutral[900],
                      },
                      '&::before': active ? {
                        content: '""', position: 'absolute', left: -12, top: 8, bottom: 8,
                        width: 4, borderRadius: '0 4px 4px 0', bgcolor: colors.primary[500],
                      } : undefined,
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: active ? colors.primary[500] : colors.neutral[400], '& svg': { fontSize: 21 } }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 500 } } }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Destek */}
      <Box sx={{ p: 2 }}>
        <Box sx={{
          p: 2, borderRadius: 3,
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.secondary[50]} 100%)`,
          border: `1px solid ${colors.primary[100]}`,
        }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: colors.neutral[800] }}>
            Yardım mı lazım?
          </Typography>
          <Typography sx={{ fontSize: 12, color: colors.neutral[500], mt: 0.25, mb: 1.5 }}>
            Destek ekibimize 7/24 ulaşabilirsiniz.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component="a"
              href="https://wa.me/905550103434"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="contained"
              startIcon={<WhatsApp sx={{ fontSize: 16 }} />}
              sx={{ flex: 1, bgcolor: '#25D366', fontSize: 12, '&:hover': { bgcolor: '#1da851' } }}
            >
              WhatsApp
            </Button>
            <Button
              component="a"
              href="mailto:info@yolsepetigo.com"
              size="small"
              variant="outlined"
              startIcon={<MailOutline sx={{ fontSize: 16 }} />}
              sx={{ flex: 1, fontSize: 12, bgcolor: colors.white }}
            >
              E-posta
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Yan menu - masaustu */}
      {!isMobile && (
        <Box sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
          <Box sx={{
            width: DRAWER_WIDTH, position: 'fixed', height: '100vh',
            borderRight: `1px solid ${colors.neutral[200]}`,
          }}>
            {drawerContent}
          </Box>
        </Box>
      )}

      {/* Yan menu - mobil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH + 16, border: 'none', borderRadius: 0 } }}
      >
        {drawerContent}
      </Drawer>

      {/* Icerik */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Ust bar (web TopBar ile ayni cam efekti) */}
        <Box
          component="header"
          sx={{
            position: 'sticky', top: 0, zIndex: theme.zIndex.appBar,
            height: TOPBAR_HEIGHT, px: { xs: 1.5, sm: 3, md: 4 },
            display: 'flex', alignItems: 'center', gap: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.72)',
            backgroundImage: gradients.glass,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${colors.neutral[200]}99`,
          }}
        >
          {isMobile ? (
            <>
              <IconButton onClick={() => setMobileOpen(true)} sx={{ color: colors.neutral[700] }}>
                <MenuIcon />
              </IconButton>
              <Box component={Link} to="/panel" sx={{ textDecoration: 'none', minWidth: 0 }}>
                <BrandLogo size={32} />
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, color: colors.neutral[400], fontWeight: 500 }}>Acenta Paneli</Typography>
              {currentLabel && (
                <>
                  <ChevronRight sx={{ fontSize: 16, color: colors.neutral[300] }} />
                  <Typography noWrap sx={{ fontSize: 14, color: colors.neutral[800], fontWeight: 600 }}>{currentLabel}</Typography>
                </>
              )}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {!onNewRequestPage && (
            isMobile ? (
              <IconButton
                component={Link}
                to={NEW_REQUEST_PATH}
                aria-label="Yeni Talep"
                sx={{ bgcolor: colors.primary[500], color: colors.white, '&:hover': { bgcolor: colors.primary[600] } }}
              >
                <Add />
              </IconButton>
            ) : (
              <Button component={Link} to={NEW_REQUEST_PATH} variant="contained" size="small" startIcon={<Add />} sx={{ px: 2 }}>
                Yeni Talep
              </Button>
            )
          )}

          {/* Kullanici menusu */}
          <Box
            component="button"
            type="button"
            onClick={(e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, p: 0.5, pr: { xs: 0.5, sm: 1 },
              border: `1px solid ${colors.neutral[200]}`, borderRadius: 999, bgcolor: colors.white,
              cursor: 'pointer', font: 'inherit',
              '&:hover': { borderColor: colors.primary[200], bgcolor: colors.primary[50] },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 700, background: gradients.primary }}>
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography noWrap sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 160, fontSize: 13, fontWeight: 600, color: colors.neutral[800] }}>
              {user?.name}
            </Typography>
            <KeyboardArrowDown sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 18, color: colors.neutral[400] }} />
          </Box>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { mt: 1, minWidth: 240, borderRadius: 3 } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: colors.neutral[900] }}>{user?.name}</Typography>
              <Typography noWrap sx={{ fontSize: 12, color: colors.neutral[500] }}>{user?.contact_email}</Typography>
            </Box>
            <Divider />
            <MenuItem component={Link} to="/panel/settings" onClick={() => setMenuAnchor(null)} sx={{ fontSize: 14, gap: 1.5, py: 1.25 }}>
              <SettingsOutlined fontSize="small" sx={{ color: colors.neutral[500] }} />
              Ayarlar
            </MenuItem>
            <MenuItem
              onClick={() => { setMenuAnchor(null); logout(); }}
              sx={{ fontSize: 14, gap: 1.5, py: 1.25, color: colors.danger[600] }}
            >
              <Logout fontSize="small" />
              Çıkış Yap
            </MenuItem>
          </Menu>
        </Box>

        {/* Sayfa */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, minWidth: 0, overflow: 'auto' }}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
