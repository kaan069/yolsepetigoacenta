import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { colors } from '../../tokens';

interface AuthShellProps {
  tagline: string;
  // Sol marka panelindeki ek icerik (istatistikler, ozellik listesi)
  highlights: React.ReactNode;
  // Marka paneli bu kirilimdan itibaren gosterilir
  breakpoint: 'md' | 'lg';
  formWidth: number;
  formMaxWidth: number;
  children: React.ReactNode;
}

// Giris ve kayit sayfalarinin ortak iskeleti: solda turkuaz marka paneli, sagda form
export default function AuthShell({ tagline, highlights, breakpoint, formWidth, formMaxWidth, children }: AuthShellProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {/* Sol - marka */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', [breakpoint]: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(160deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 55%, ${colors.primary[900]} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 340, height: 340, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.07)' }} />
        <Box sx={{ position: 'absolute', bottom: -140, left: -80, width: 440, height: 440, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.05)' }} />
        <Box sx={{ position: 'absolute', top: '45%', left: '8%', width: 180, height: 180, borderRadius: '50%', bgcolor: `${colors.secondary[400]}26`, filter: 'blur(40px)' }} />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420 }}>
          <Box
            component="img"
            src="/assets/goyazililogo.webp"
            alt="YolSepetiGO"
            sx={{
              width: 88, height: 88, borderRadius: '50%', mx: 'auto', mb: 3, objectFit: 'cover', display: 'block',
              border: '4px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
            }}
          />
          <Typography sx={{ fontSize: 34, fontWeight: 800, color: colors.white, mb: 1.5, lineHeight: 1.2, letterSpacing: -0.5 }}>
            YolSepetiGO
          </Typography>
          <Typography sx={{ fontSize: 16, color: colors.primary[100], lineHeight: 1.6, mb: 4 }}>
            {tagline}
          </Typography>
          {highlights}
        </Box>
      </Box>

      {/* Sag - form */}
      <Box
        sx={{
          flex: { xs: 1, [breakpoint]: `0 0 ${formWidth}px` },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 6 },
          bgcolor: colors.white,
        }}
      >
        <Box sx={{ display: { xs: 'flex', [breakpoint]: 'none' }, justifyContent: 'center', mb: 4 }}>
          <Box component={Link} to="/" sx={{ textDecoration: 'none' }}>
            <BrandLogo size={44} subtitle="Acenta Paneli" />
          </Box>
        </Box>

        <Box sx={{ maxWidth: formMaxWidth, width: '100%', mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

// Marka panelinde kullanilan cam efektli kucuk kutu
export function GlassStat({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{
      flex: 1, py: 1.5, px: 1, borderRadius: 3, textAlign: 'center',
      bgcolor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.18)',
      backdropFilter: 'blur(8px)',
    }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: colors.white }}>{value}</Typography>
      <Typography sx={{ fontSize: 12, color: colors.primary[100] }}>{label}</Typography>
    </Box>
  );
}
