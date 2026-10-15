import { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Link as MuiLink, InputAdornment, IconButton } from '@mui/material';
import { Business, Person, Email, Phone, Lock, Visibility, VisibilityOff, AccountBalance, LocationOn, Webhook } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { registerCompany } from '../../api';
import type { RegisterPayload } from '../../types';
import { colors, alpha } from '../../tokens';

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload & { passwordConfirm: string }>({
    name: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    password: '',
    passwordConfirm: '',
    tax_number: '',
    tax_office: '',
    company_address: '',
    webhook_url: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.contact_person || !form.contact_email || !form.contact_phone || !form.password || !form.tax_number || !form.tax_office || !form.company_address) {
      setError('Lutfen tum zorunlu alanlari doldurun');
      return;
    }
    if (form.password.length < 8) {
      setError('Sifre en az 8 karakter olmalidir');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('Sifreler eslesmiyor');
      return;
    }
    if (form.tax_number.length < 10 || form.tax_number.length > 11) {
      setError('Vergi numarasi 10 veya 11 haneli olmalidir');
      return;
    }

    setLoading(true);
    try {
      const { passwordConfirm: _, ...payload } = form;
      const webhookPayload = payload.webhook_url ? payload : { ...payload, webhook_url: undefined };
      const response = await registerCompany(webhookPayload);
      setSuccess(response.message);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Kayit basarisiz. Lutfen bilgilerinizi kontrol edin.');
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
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${colors.neutral[900]} 0%, ${colors.neutral[800]} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: `${alpha(colors.primary[500], 0.08)}` }} />
        <Box sx={{ position: 'absolute', bottom: -120, left: -60, width: 400, height: 400, borderRadius: '50%', bgcolor: `${alpha(colors.primary[500], 0.05)}` }} />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <Box
            component="img"
            src="/assets/goyazililogo.jpeg"
            alt="YolSepetiGO"
            sx={{ width: 72, height: 72, borderRadius: 3, mx: 'auto', mb: 3, objectFit: 'cover', boxShadow: `0 8px 32px ${alpha(colors.primary[500], 0.3)}` }}
          />
          <Typography sx={{ fontSize: 32, fontWeight: 800, color: 'white', mb: 1.5 }}>
            YolSepetiGO
          </Typography>
          <Typography sx={{ fontSize: 16, color: colors.neutral[400], lineHeight: 1.6, mb: 4 }}>
            Acenta olarak kayit olun, tum hizmetlerimize erisim saglayin.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', mx: 'auto', maxWidth: 280 }}>
            {[
              'Cekici, vinc ve yol yardimi hizmetleri',
              'Anlik takip ve fiyat hesaplama',
              'Detayli raporlama ve istatistikler',
              'Webhook entegrasyonu',
            ].map((text) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: colors.primary[400], flexShrink: 0 }} />
                <Typography sx={{ fontSize: 14, color: colors.neutral[400] }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Sag - Form */}
      <Box
        sx={{
          flex: { xs: 1, lg: '0 0 560px' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-start', lg: 'center' },
          p: { xs: 2.5, sm: 5 },
          pt: { xs: 4, sm: 5 },
          bgcolor: 'white',
          overflow: 'auto',
          maxHeight: '100vh',
        }}
      >
        {/* Mobil logo */}
        <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 3, justifyContent: 'center' }}>
          <Box
            component="img"
            src="/assets/goyazililogo.jpeg"
            alt="YolSepetiGO"
            sx={{ width: 40, height: 40, borderRadius: 2, objectFit: 'cover' }}
          />
          <Typography sx={{ fontWeight: 700, fontSize: 20, color: colors.neutral[900] }}>YolSepetiGO</Typography>
        </Box>

        <Box sx={{ maxWidth: 460, width: '100%', mx: 'auto' }}>
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: colors.neutral[900], mb: 0.5 }}>
            Sirket Kaydi
          </Typography>
          <Typography sx={{ fontSize: 14, color: colors.neutral[500], mb: 3 }}>
            Acenta hesabi olusturun
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {success}
              <Box sx={{ mt: 1 }}>
                <MuiLink component={Link} to="/panel/login" sx={{ fontWeight: 600 }}>Giris sayfasina git</MuiLink>
              </Box>
            </Alert>
          )}

          {!success && (
            <Box component="form" onSubmit={handleSubmit}>
              {/* Sirket Bilgileri */}
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                Sirket Bilgileri
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <TextField fullWidth label="Sirket Adi *" value={form.name} onChange={handleChange('name')} size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Business sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
                />
                <TextField fullWidth label="Yetkili Kisi *" value={form.contact_person} onChange={handleChange('contact_person')} size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
                />
                <TextField fullWidth label="E-posta *" type="email" value={form.contact_email} onChange={handleChange('contact_email')} size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
                />
                <TextField fullWidth label="Telefon *" value={form.contact_phone} onChange={handleChange('contact_phone')} size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Phone sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
                />
              </Box>

              {/* Guvenlik */}
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                Guvenlik
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <TextField fullWidth label="Sifre *" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange('password')} size="small" helperText="En az 8 karakter"
                  slotProps={{ input: {
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment>,
                  } }}
                />
                <TextField fullWidth label="Sifre Tekrar *" type={showPassword ? 'text' : 'password'} value={form.passwordConfirm} onChange={handleChange('passwordConfirm')} size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><Lock sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
                />
              </Box>

              {/* Vergi Bilgileri */}
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                Vergi Bilgileri
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <TextField fullWidth label="Vergi Numarasi *" value={form.tax_number} onChange={handleChange('tax_number')} size="small" helperText="10-11 haneli"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><AccountBalance sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
                />
                <TextField fullWidth label="Vergi Dairesi *" value={form.tax_office} onChange={handleChange('tax_office')} size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><AccountBalance sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
                />
              </Box>

              {/* Adres ve Webhook */}
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                Diger Bilgiler
              </Typography>
              <TextField fullWidth label="Sirket Adresi *" value={form.company_address} onChange={handleChange('company_address')} size="small" multiline rows={2} sx={{ mb: 2 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><LocationOn sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
              />
              <TextField fullWidth label="Webhook URL (opsiyonel)" value={form.webhook_url} onChange={handleChange('webhook_url')} size="small" sx={{ mb: 3 }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Webhook sx={{ color: colors.neutral[400], fontSize: 18 }} /></InputAdornment> } }}
              />

              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
                sx={{
                  py: 1.5, fontSize: 15, fontWeight: 600,
                  background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                  boxShadow: `0 4px 14px ${alpha(colors.primary[500], 0.35)}`,
                  '&:hover': { background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`, boxShadow: `0 6px 20px ${alpha(colors.primary[500], 0.4)}` },
                }}
              >
                {loading ? 'Kayit yapiliyor...' : 'Kayit Ol'}
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 13, color: colors.neutral[400] }}>
              Zaten hesabiniz var mi?{' '}
              <MuiLink component={Link} to="/panel/login" sx={{ fontWeight: 600 }}>Giris yapin</MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
