import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Email, Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import AuthShell, { GlassStat } from './AuthShell';
import { colors, alpha } from '../../tokens';

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
    <AuthShell
      breakpoint="md"
      formWidth={480}
      formMaxWidth={360}
      tagline="Acenta paneliniz ile tum hizmet taleplerinizi tek bir yerden yonetin."
      highlights={
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <GlassStat value="7/24" label="Destek" />
          <GlassStat value="5" label="Hizmet Tipi" />
          <GlassStat value="Anlik" label="Takip" />
        </Box>
      }
    >
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: colors.neutral[900], mb: 0.5 }}>
        Hosgeldiniz
      </Typography>
      <Typography sx={{ fontSize: 14, color: colors.neutral[500], mb: 4 }}>
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
                  <Email sx={{ color: colors.neutral[400], fontSize: 20 }} />
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
                  <Lock sx={{ color: colors.neutral[400], fontSize: 20 }} />
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
            background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
            boxShadow: `0 4px 14px ${alpha(colors.primary[500], 0.35)}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
              boxShadow: `0 6px 20px ${alpha(colors.primary[500], 0.4)}`,
            },
          }}
        >
          {loading ? 'Giris yapiliyor...' : 'Giris Yap'}
        </Button>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>
          Henuz hesabiniz yok mu?{' '}
          <MuiLink component={Link} to="/panel/register" sx={{ fontWeight: 600 }}>
            Kayit olun
          </MuiLink>
        </Typography>
        <Typography sx={{ fontSize: 13, color: colors.neutral[400], mt: 1.5 }}>
          <MuiLink component={Link} to="/" sx={{ color: colors.neutral[400], '&:hover': { color: colors.primary[500] } }}>
            Ana sayfaya don
          </MuiLink>
        </Typography>
      </Box>
    </AuthShell>
  );
}
