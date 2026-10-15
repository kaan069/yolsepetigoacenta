import { useState } from 'react';
import { Box, TextField, Button, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import { saveDriverCompanyInfo, getApiError } from '../../../api';
import type { DriverCompanyInfo, MissingStep } from '../../../types';
import { SectionCard } from './parts';
import { CARD_IDS, otherFieldErrors } from './constants';

const FORM_FIELDS = ['company_name', 'tax_number'];

interface CompanyInfoCardProps {
  driverId: number;
  companyInfo: DriverCompanyInfo | null;
  onSaved: (companyInfo: DriverCompanyInfo, steps: MissingStep[]) => void;
}

export default function CompanyInfoCard({ driverId, companyInfo, onSaved }: CompanyInfoCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [companyName, setCompanyName] = useState(companyInfo?.company_name ?? '');
  const [taxNumber, setTaxNumber] = useState(companyInfo?.tax_number ?? '');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const handleSave = async () => {
    setNotice('');
    const errors: Record<string, string> = {};
    if (!companyName.trim()) errors.company_name = 'Şirket adı zorunludur';
    if (taxNumber.length !== 10 && taxNumber.length !== 11) errors.tax_number = 'Vergi numarası 10 ya da 11 haneli olmalıdır';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const response = await saveDriverCompanyInfo(driverId, { company_name: companyName.trim(), tax_number: taxNumber });
      onSaved(response.company_info, response.missing_steps);
      enqueueSnackbar(response.message || 'Şirket bilgisi kaydedildi', { variant: 'success' });
    } catch (err) {
      const apiError = getApiError(err);
      setFieldErrors(apiError.fieldErrors);
      const hasFieldErrors = Object.keys(apiError.fieldErrors).length > 0;
      setNotice(
        apiError.message
        || otherFieldErrors(apiError.fieldErrors, FORM_FIELDS)
        || (hasFieldErrors ? '' : 'Şirket bilgisi kaydedilemedi. Lütfen tekrar deneyin.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard id={CARD_IDS.company} title="Şirket bilgisi">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          label="Şirket adı *" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
          error={!!fieldErrors.company_name} helperText={fieldErrors.company_name}
        />
        <TextField
          label="Vergi numarası *" value={taxNumber}
          onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
          error={!!fieldErrors.tax_number} helperText={fieldErrors.tax_number || '10 ya da 11 hane'}
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
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
