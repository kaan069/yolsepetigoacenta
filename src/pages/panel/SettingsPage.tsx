import { useState, useEffect } from 'react';
import {
Typography, Card, CardContent, Box, TextField, Button, Alert,
  CircularProgress, IconButton, Tooltip, Chip,
} from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { getProfile, updateWebhook } from '../../api';
import type { CompanyProfile } from '../../types';
import { colors } from '../../tokens';

export default function SettingsPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState('');
  const [webhookError, setWebhookError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setWebhookUrl(data.api.webhook_url || '');
      } catch {
        setError('Profil bilgileri yuklenirken hata olustu');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleWebhookUpdate = async () => {
    setWebhookError('');
    setWebhookSuccess('');
    if (!webhookUrl) {
      setWebhookError('Webhook URL zorunludur');
      return;
    }
    setWebhookLoading(true);
    try {
      const response = await updateWebhook(webhookUrl);
      setWebhookSuccess(response.message);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setWebhookError(axiosErr.response?.data?.error || 'Webhook guncellenirken hata olustu');
      } else {
        setWebhookError('Bir hata olustu');
      }
    } finally {
      setWebhookLoading(false);
    }
  };

  const copyApiKey = () => {
    if (profile?.api.api_key) {
      navigator.clipboard.writeText(profile.api.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box>
        <Alert severity="error">{error || 'Profil yuklenemedi'}</Alert>
      </Box>
    );
  }

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 180, flexShrink: 0, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value ?? '-'}</Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: colors.neutral[900] }}>Ayarlar</Typography>
        <Typography sx={{ fontSize: 14, color: colors.neutral[500] }}>Sirket bilgileriniz ve API ayarlari</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Sirket Bilgileri</Typography>
            <InfoRow label="Sirket Adi" value={profile.company.name} />
            <InfoRow label="Yetkili Kisi" value={profile.company.contact_person} />
            <InfoRow label="E-posta" value={profile.company.contact_email} />
            <InfoRow label="Telefon" value={profile.company.contact_phone} />
            <InfoRow label="Vergi No" value={profile.company.tax_number} />
            <InfoRow label="Vergi Dairesi" value={profile.company.tax_office} />
            <InfoRow label="Adres" value={profile.company.company_address} />
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Hesap Durumu</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip
                  label={profile.status.is_approved ? 'Onaylanmis' : 'Onay Bekleniyor'}
                  color={profile.status.is_approved ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={profile.status.is_active ? 'Aktif' : 'Pasif'}
                  color={profile.status.is_active ? 'success' : 'error'}
                  size="small"
                />
              </Box>
              <InfoRow label="Kayit Tarihi" value={profile.status.created_at ? new Date(profile.status.created_at).toLocaleDateString('tr-TR') : null} />
              <InfoRow label="Onay Tarihi" value={profile.status.approved_at ? new Date(profile.status.approved_at).toLocaleDateString('tr-TR') : null} />
              <InfoRow label="Komisyon Orani" value={`%${profile.status.commission_rate}`} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>API Bilgileri</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 180, flexShrink: 0, fontWeight: 500 }}>
                  API Key
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
                  {profile.api.api_key}
                </Typography>
                <Tooltip title={copied ? 'Kopyalandi!' : 'Kopyala'}>
                  <IconButton size="small" onClick={copyApiKey}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <InfoRow label="Rate Limit" value={`${profile.api.rate_limit_per_minute} istek/dk`} />
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Webhook Ayarlari</Typography>
          {webhookSuccess && <Alert severity="success" sx={{ mb: 2 }}>{webhookSuccess}</Alert>}
          {webhookError && <Alert severity="error" sx={{ mb: 2 }}>{webhookError}</Alert>}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <Button variant="contained" onClick={handleWebhookUpdate} disabled={webhookLoading} sx={{ whiteSpace: 'nowrap', mt: 0.5 }}>
              {webhookLoading ? 'Guncelleniyor...' : 'Guncelle'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
