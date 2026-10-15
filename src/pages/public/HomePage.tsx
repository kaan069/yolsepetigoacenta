import { Box, Typography, Container, Chip, Button, Card, CardContent } from '@mui/material';
import { LocalShipping, AccessTime, GpsFixed, Security, Business, SupportAgent, Calculate, TrackChanges } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { colors, alpha } from '../../tokens';

export default function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.neutral[900]} 0%, ${colors.neutral[800]} 50%, ${colors.neutral[900]} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          py: { xs: 8, md: 12 },
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(colors.primary[500], 0.15)} 0%, transparent 70%)` }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(colors.primary[500], 0.1)} 0%, transparent 70%)` }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto' }}>
            <Chip
              icon={<LocalShipping sx={{ fontSize: 16, color: `${colors.primary[500]} !important` }} />}
              label="7/24 Yol Yardim Hizmeti"
              sx={{
                mb: 3,
                bgcolor: `${alpha(colors.primary[500], 0.1)}`,
                color: colors.primary[500],
                fontWeight: 600,
                fontSize: 12,
                border: `1px solid ${alpha(colors.primary[500], 0.2)}`,
                '& .MuiChip-icon': { color: colors.primary[500] },
              }}
            />
            <Typography
              sx={{
                fontSize: { xs: 32, md: 48 },
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.2,
                mb: 2,
                letterSpacing: -1,
              }}
            >
              Turkiye'nin Lider{' '}
              <Box component="span" sx={{ background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[400]})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Yol Yardim Platformu
              </Box>
            </Typography>
            <Typography sx={{ fontSize: { xs: 15, md: 17 }, color: colors.neutral[400], maxWidth: 520, mx: 'auto', lineHeight: 1.7, mb: 5 }}>
              YolSepetiGO ile dakikalar icinde cekici, vinc veya yol yardim hizmeti talep edin. Anlik takip ile aracinizin nerede oldugunu bilin.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/panel/register"
                variant="contained"
                size="large"
                sx={{
                  background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                  fontWeight: 600,
                  fontSize: 15,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 4,
                  py: 1.5,
                  boxShadow: `0 4px 20px ${alpha(colors.primary[500], 0.4)}`,
                  '&:hover': { boxShadow: `0 6px 28px ${alpha(colors.primary[500], 0.5)}` },
                }}
              >
                Acenta Kaydi
              </Button>
              <Button
                component={Link}
                to="/panel/login"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: `${alpha(colors.neutral[400], 0.3)}`,
                  color: colors.neutral[300],
                  fontWeight: 600,
                  fontSize: 15,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 4,
                  py: 1.5,
                  '&:hover': { borderColor: colors.primary[500], color: colors.primary[500], bgcolor: `${alpha(colors.primary[500], 0.05)}` },
                }}
              >
                Giris Yap
              </Button>
            </Box>

            {/* Feature Pills */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 6, flexWrap: 'wrap' }}>
              {[
                { icon: <AccessTime sx={{ fontSize: 18 }} />, text: 'Hizli Cevap' },
                { icon: <GpsFixed sx={{ fontSize: 18 }} />, text: 'Anlik Takip' },
                { icon: <Security sx={{ fontSize: 18 }} />, text: 'Guvenli Hizmet' },
              ].map((item) => (
                <Box key={item.text} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: colors.primary[500] }}>{item.icon}</Box>
                  <Typography sx={{ fontSize: 13, color: colors.neutral[300], fontWeight: 500 }}>{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 700, color: colors.neutral[900], mb: 1.5 }}>
            Neden YolSepetiGO?
          </Typography>
          <Typography sx={{ fontSize: 15, color: colors.neutral[500], maxWidth: 500, mx: 'auto' }}>
            Acentalar icin tasarlanmis, entegrasyonu kolay, guvenilir yol yardim altyapisi
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
          {[
            { icon: <LocalShipping sx={{ fontSize: 24 }} />, title: 'Cekici & Vinc', desc: 'Her turlu arac icin cekici ve vinc hizmeti' },
            { icon: <SupportAgent sx={{ fontSize: 24 }} />, title: '7/24 Destek', desc: 'Kesintisiz musteri hizmetleri' },
            { icon: <TrackChanges sx={{ fontSize: 24 }} />, title: 'Anlik Takip', desc: 'Arac ve sofor konumunu canli takip edin' },
            { icon: <Calculate sx={{ fontSize: 24 }} />, title: 'Fiyat Hesaplama', desc: 'Aninda fiyat tahmini alin' },
          ].map((feature) => (
            <Card key={feature.title} sx={{ borderRadius: 3, boxShadow: 'none', border: `1px solid ${colors.neutral[200]}`, transition: 'all 0.2s', '&:hover': { borderColor: colors.primary[500], boxShadow: `0 4px 20px ${alpha(colors.primary[500], 0.1)}` } }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: colors.info[50], display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, color: colors.primary[500] }}>
                  {feature.icon}
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: colors.neutral[900], mb: 0.5 }}>{feature.title}</Typography>
                <Typography sx={{ fontSize: 13, color: colors.neutral[500], lineHeight: 1.5 }}>{feature.desc}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: colors.neutral[50], py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md">
          <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.06)', border: `1px solid ${colors.neutral[200]}`, overflow: 'hidden' }}>
            <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: colors.info[50], display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <Business sx={{ fontSize: 28, color: colors.primary[500] }} />
              </Box>
              <Typography sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 700, color: colors.neutral[900], mb: 1.5 }}>
                Acenta Olarak Kayit Olun
              </Typography>
              <Typography sx={{ fontSize: 15, color: colors.neutral[500], maxWidth: 440, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
                Hemen kayit olun, API key'inizi alin ve taleplerinizi yonetmeye baslayin. Entegrasyon dakikalar icerisinde tamamlanir.
              </Typography>
              <Button
                component={Link}
                to="/panel/register"
                variant="contained"
                size="large"
                sx={{
                  background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                  fontWeight: 600,
                  fontSize: 15,
                  textTransform: 'none',
                  borderRadius: 2.5,
                  px: 5,
                  py: 1.5,
                  boxShadow: `0 4px 20px ${alpha(colors.primary[500], 0.35)}`,
                  '&:hover': { boxShadow: `0 6px 28px ${alpha(colors.primary[500], 0.45)}` },
                }}
              >
                Ucretsiz Kayit Ol
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
