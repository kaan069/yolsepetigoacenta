import { Box, IconButton } from '@mui/material';
import { WhatsApp, MailOutline } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { colors, shadows } from '../tokens';

const PANEL_PUBLIC_PATHS = ['/panel/login', '/panel/register'];

// Sabit iletisim butonlari; panel icinde menudeki destek karti kullanildigi icin gizlenir
export default function ContactFab() {
  const { pathname } = useLocation();
  const insidePanel = pathname.startsWith('/panel') && !PANEL_PUBLIC_PATHS.includes(pathname);
  if (insidePanel) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1.5, zIndex: 1300 }}>
      <IconButton
        component="a"
        href="https://wa.me/905550103434"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
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
        aria-label="E-posta"
        sx={{
          width: 48, height: 48, bgcolor: colors.primary[500], color: 'white',
          boxShadow: shadows.primary,
          '&:hover': { bgcolor: colors.primary[600] },
        }}
      >
        <MailOutline />
      </IconButton>
    </Box>
  );
}
