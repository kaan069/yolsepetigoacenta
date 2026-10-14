import { useState } from 'react';
import { Box, TextField, Button, Alert } from '@mui/material';
import { linkDriver, getApiError } from '../../../api';

interface LinkDriverTabProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onLinked: () => void;
  onRegisterInstead: (phone: string) => void;
}

interface Notice {
  severity: 'info' | 'error';
  text: string;
  // Dolu ise "Yeni sürücü olarak kaydet" butonu gosterilir
  registerPhone?: string;
}

export default function LinkDriverTab({ phone, onPhoneChange, onLinked, onRegisterInstead }: LinkDriverTabProps) {
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setNotice(null);

    if (!phone.trim()) {
      setPhoneError('Telefon numarası zorunludur');
      return;
    }

    setLoading(true);
    try {
      await linkDriver(phone.trim());
      onLinked();
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError.code === 'DRIVER_NOT_FOUND') {
        // Yanittaki normalize edilmis numara kayit formuna tasinir
        const normalized = typeof apiError.data.phone_number === 'string' ? apiError.data.phone_number : phone.trim();
        setNotice({ severity: 'info', text: 'Bu numarayla kayıtlı sürücü yok.', registerPhone: normalized });
      } else if (apiError.code === 'ALREADY_IN_POOL') {
        setNotice({ severity: 'info', text: 'Sürücü zaten listenizde.' });
      } else if (apiError.code === 'PHONE_INVALID' || apiError.code === 'PHONE_REQUIRED') {
        setPhoneError(apiError.message || 'Geçersiz telefon numarası');
      } else {
        setNotice({ severity: 'error', text: apiError.message || 'Sürücü eklenemedi. Lütfen tekrar deneyin.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const registerPhone = notice?.registerPhone;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <TextField
        fullWidth
        autoFocus
        label="Telefon *"
        placeholder="0532 111 22 33"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        error={!!phoneError}
        helperText={phoneError || 'Sürücünün uygulamaya kayıtlı olduğu numara'}
        slotProps={{ htmlInput: { inputMode: 'tel' } }}
        sx={{ mb: 2 }}
      />

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2, borderRadius: 2 }}>
          {notice.text}
          {registerPhone !== undefined && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => onRegisterInstead(registerPhone)}
                sx={{ fontWeight: 600 }}
              >
                Yeni sürücü olarak kaydet
              </Button>
            </Box>
          )}
        </Alert>
      )}

      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ borderRadius: 2 }}>
        {loading ? 'Ekleniyor...' : 'Listeme Ekle'}
      </Button>
    </Box>
  );
}
