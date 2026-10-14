import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Email, Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('E-posta ve sifre zorunludur');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/panel');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.');
      } else {
        setError('Bir hata olustu. Lutfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sol - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        {/* Dekoratif daireler */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(14, 165, 233, 0.08)' }} />
        <Box sx={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(14, 165, 233, 0.05)' }} />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <Box
            component="img"
            src="/assets/goyazililogo.jpeg"
            alt="YolSepetiGO"
            sx={{ width: 72, height: 72, borderRadius: 3, mx: 'auto', mb: 3, objectFit: 'cover', boxShadow: '0 8px 32px rgba(14, 165, 233, 0.3)' }}
          />
          <Typography sx={{ fontSize: 32, fontWeight: 800, color: 'white', mb: 1.5, lineHeight: 1.2 }}>
            YolSepetiGO
          </Typography>
          <Typography sx={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, mb: 4 }}>
            Acenta paneliniz ile tum hizmet taleplerinizi tek bir yerden yonetin.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            {[
              { num: '7/24', label: 'Destek' },
              { num: '5', label: 'Hizmet Tipi' },
              { num: 'Anlik', label: 'Takip' },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>{item.num}</Typography>
                <Typography sx={{ fontSize: 12, color: '#64748b' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Sag - Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
          bgcolor: 'white',
        }}
      >
        {/* Mobil logo */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4, justifyContent: 'center' }}>
          <Box
            component="img"
            src="/assets/goyazililogo.jpeg"
            alt="YolSepetiGO"
            sx={{ width: 40, height: 40, borderRadius: 2, objectFit: 'cover' }}
          />
          <Typography sx={{ fontWeight: 700, fontSize: 20, color: '#0f172a' }}>YolSepetiGO</Typography>
        </Box>

        <Box sx={{ maxWidth: 360, width: '100%', mx: 'auto' }}>
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            Hosgeldiniz
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#64748b', mb: 4 }}>
            Acenta panelinize giris yapin
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Sifre"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: 15,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 6px 20px rgba(14, 165, 233, 0.4)',
                },
              }}
            >
              {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>
              Henuz hesabiniz yok mu?{' '}
              <MuiLink component={Link} to="/panel/register" sx={{ fontWeight: 600 }}>
                Kayit olun
              </MuiLink>
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#94a3b8', mt: 1.5 }}>
              <MuiLink component={Link} to="/" sx={{ color: '#94a3b8', '&:hover': { color: '#0ea5e9' } }}>
                Ana sayfaya don
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
