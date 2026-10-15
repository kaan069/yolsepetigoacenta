import { useState } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { saveDriverPaymentMethod, getApiError } from '../../../api';
import type { DriverPaymentMethod, MissingStep } from '../../../types';
import { SectionCard } from './parts';
import { CARD_IDS, otherFieldErrors } from './constants';

const FORM_FIELDS = ['account_holder_name', 'iban'];

interface PaymentMethodCardProps {
  driverId: number;
  paymentMethod: DriverPaymentMethod | null;
  onSaved: (paymentMethod: DriverPaymentMethod, steps: MissingStep[]) => void;
}

// IBAN asla tam gosterilmez; form bos acilir, yeni IBAN yazilirsa gonderilir
export default function PaymentMethodCard({ driverId, paymentMethod, onSaved }: PaymentMethodCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [holderName, setHolderName] = useState('');
  const [iban, setIban] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const handleSave = async () => {
    setNotice('');
    const normalizedIban = iban.replace(/\s/g, '').toUpperCase();
    const errors: Record<string, string> = {};
    if (!paymentMethod) {
      if (!holderName.trim()) errors.account_holder_name = 'Hesap sahibi zorunludur';
      if (!normalizedIban) errors.iban = 'IBAN zorunludur';
    } else if (!holderName.trim() && !normalizedIban) {
      errors.iban = 'Değiştirmek istediğiniz bilgiyi yazın';
    }
    if (normalizedIban && !/^TR\d{24}$/.test(normalizedIban)) errors.iban = 'Geçerli bir TR IBAN girin (TR ve 24 hane)';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const response = await saveDriverPaymentMethod(driverId, {
        ...(holderName.trim() && { account_holder_name: holderName.trim() }),
        ...(normalizedIban && { iban: normalizedIban }),
      });
      onSaved(response.payment_method, response.missing_steps);
      setHolderName('');
      setIban('');
      enqueueSnackbar(response.message || 'Ödeme bilgisi kaydedildi', { variant: 'success' });
      if (normalizedIban) enqueueSnackbar('IBAN değişikliği sürücüye SMS ile bildirildi.', { variant: 'info' });
    } catch (err) {
      const apiError = getApiError(err);
      setFieldErrors(apiError.fieldErrors);
      const hasFieldErrors = Object.keys(apiError.fieldErrors).length > 0;
      setNotice(
        apiError.message
        || otherFieldErrors(apiError.fieldErrors, FORM_FIELDS)
        || (hasFieldErrors ? '' : 'Ödeme bilgisi kaydedilemedi. Lütfen tekrar deneyin.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard id={CARD_IDS.payment} title="Ödeme bilgisi">
      {paymentMethod && (
        <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{paymentMethod.account_holder_name}</Typography>
          <Typography sx={{ fontSize: 13, color: '#334155', fontFamily: 'monospace' }}>{paymentMethod.iban_masked}</Typography>
          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>
            Son güncelleme: {new Date(paymentMethod.updated_at).toLocaleString('tr-TR')}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          label={paymentMethod ? 'Yeni hesap sahibi' : 'Hesap sahibi *'} value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          error={!!fieldErrors.account_holder_name} helperText={fieldErrors.account_holder_name}
        />
        <TextField
          label={paymentMethod ? 'Yeni IBAN' : 'IBAN *'} value={iban} placeholder="TR00 0000 0000 0000 0000 0000 00"
          onChange={(e) => setIban(e.target.value.toUpperCase())}
          error={!!fieldErrors.iban} helperText={fieldErrors.iban}
          slotProps={{ htmlInput: { maxLength: 34, style: { fontFamily: 'monospace' } } }}
        />
      </Box>

      {notice && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Box>
    </SectionCard>
  );
}
