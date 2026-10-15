import { Suspense } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Login } from '@mui/icons-material';
import { Outlet, Link } from 'react-router-dom';
import PageLoader from '../components/PageLoader';
import { colors, alpha } from '../tokens';

export default function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: colors.neutral[50] }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: `1px solid ${colors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.9)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
            {/* Logo */}
            <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
              <Box
                component="img"
                src="/assets/goyazililogo.jpeg"
                alt="YolSepetiGO"
                sx={{ width: 42, height: 42, borderRadius: 2.5, objectFit: 'cover', boxShadow: `0 4px 14px ${alpha(colors.primary[500], 0.3)}` }}
              />
              <Box>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: colors.neutral[900], lineHeight: 1.2, letterSpacing: -0.5 }}>
                  YolSepetiGO
                </Typography>
                <Typography sx={{ fontSize: 11, color: colors.neutral[400], fontWeight: 500, letterSpacing: 0.5 }}>
                  Yol Yardim Platformu
                </Typography>
              </Box>
            </Box>

            {/* Nav */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                component={Link}
                to="/panel/login"
                startIcon={<Login sx={{ fontSize: 18 }} />}
                sx={{
                  color: colors.neutral[500],
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2,
                  '&:hover': { bgcolor: colors.neutral[100], color: colors.neutral[900] },
                }}
              >
                Acenta Girisi
              </Button>
              <Button
                component={Link}
                to="/panel/register"
                variant="contained"
                sx={{
                  background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 2.5,
                  boxShadow: `0 2px 8px ${alpha(colors.primary[500], 0.3)}`,
                  '&:hover': { boxShadow: `0 4px 14px ${alpha(colors.primary[500], 0.4)}` },
                }}
              >
                Kayit Ol
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: colors.neutral[900], py: 5, mt: 6 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-start' }, gap: 4 }}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 1.5 }}>
                <Box
                  component="img"
                  src="/assets/goyazililogo.jpeg"
                  alt="YolSepetiGO"
                  sx={{ width: 36, height: 36, borderRadius: 2, objectFit: 'cover' }}
                />
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'white' }}>
                  YolSepetiGO
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: colors.neutral[400], maxWidth: 320 }}>
                Turkiye'nin lider yol yardim platformu. 7/24 cekici, vinc ve yol yardim hizmeti.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 6 }}>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>Hizmetler</Typography>
                <Typography sx={{ fontSize: 13, color: colors.neutral[400], mb: 0.8 }}>Cekici Hizmeti</Typography>
                <Typography sx={{ fontSize: 13, color: colors.neutral[400], mb: 0.8 }}>Vinc Hizmeti</Typography>
                <Typography sx={{ fontSize: 13, color: colors.neutral[400], mb: 0.8 }}>Yol Yardim</Typography>
                <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>Sehirlerarasi Tasima</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>Acenta</Typography>
                <Typography component={Link} to="/panel/login" sx={{ fontSize: 13, color: colors.neutral[400], mb: 0.8, display: 'block', textDecoration: 'none', '&:hover': { color: colors.primary[500] } }}>Giris Yap</Typography>
                <Typography component={Link} to="/panel/register" sx={{ fontSize: 13, color: colors.neutral[400], mb: 0.8, display: 'block', textDecoration: 'none', '&:hover': { color: colors.primary[500] } }}>Kayit Ol</Typography>
                <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>API Dokumantasyon</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ borderTop: `1px solid ${colors.neutral[800]}`, mt: 4, pt: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, color: colors.neutral[600] }}>
              2025 YolSepetiGO. Tum haklari saklidir.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
