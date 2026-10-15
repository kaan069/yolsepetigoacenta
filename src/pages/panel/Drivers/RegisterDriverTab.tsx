import { useState } from 'react';
import { Box, TextField, Button, Alert } from '@mui/material';
import { registerDriver, getApiError } from '../../../api';
import type { DriverServiceType, RegisterDriverPayload } from '../../../types';
import type { LocationResult } from '../../../components/MapPickerDialog';
import { ServiceTypeChips, CityAutocomplete, BusinessAddressField } from '../../../components/DriverFields';

// Formda alan altinda gosterilen hatalar; digerleri genel uyari olarak gosterilir
const FORM_FIELDS = ['first_name', 'last_name', 'phone_number', 'tc_no', 'user_type', 'service_cities'];

interface RegisterDriverTabProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onRegistered: (driverId: number) => void;
  onLinkInstead: (phone: string) => void;
}

interface Notice {
  severity: 'warning' | 'error';
  text: string;
  // Dolu ise "Numarayla ekle" butonu gosterilir
  linkPhone?: string;
}

export default function RegisterDriverTab({ phone, onPhoneChange, onRegistered, onLinkInstead }: RegisterDriverTabProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [services, setServices] = useState<DriverServiceType[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [business, setBusiness] = useState<LocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.first_name = 'Ad zorunludur';
    if (!lastName.trim()) errors.last_name = 'Soyad zorunludur';
    if (!phone.trim()) errors.phone_number = 'Telefon zorunludur';
    if (services.length === 0) errors.user_type = 'En az bir hizmet tipi seçin';
    if (tcNo && tcNo.length !== 11) errors.tc_no = 'TC kimlik numarası 11 haneli olmalıdır';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: RegisterDriverPayload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: phone.trim(),
      user_type: services,
    };
    if (tcNo) payload.tc_no = tcNo;
    if (cities.length > 0) payload.service_cities = cities;
    if (business) {
      payload.business_address = business.address;
      if (business.il) payload.business_address_il = business.il;
      if (business.ilce) payload.business_address_ilce = business.ilce;
      payload.business_latitude = business.latitude.toFixed(6);
      payload.business_longitude = business.longitude.toFixed(6);
    }

    setLoading(true);
    try {
      const response = await registerDriver(payload);
      onRegistered(response.driver.id);
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError.code === 'PHONE_EXISTS') {
        setNotice({ severity: 'warning', text: apiError.message || 'Bu numara zaten kayıtlı.', linkPhone: phone.trim() });
      } else if (apiError.code === 'TC_EXISTS') {
        setFieldErrors({ tc_no: apiError.message || 'Bu TC kimlik numarası zaten kayıtlı' });
      } else if (apiError.code === 'PHONE_INVALID') {
        setFieldErrors({ phone_number: apiError.message || 'Geçersiz telefon numarası' });
      } else {
        // DRF alan hatalari ilgili alanlara; formda karsiligi olmayanlar genel uyariya
        setFieldErrors(apiError.fieldErrors);
        const otherErrors = Object.entries(apiError.fieldErrors)
          .filter(([key]) => !FORM_FIELDS.includes(key))
          .map(([, message]) => message);
        const hasFieldErrors = Object.keys(apiError.fieldErrors).length > 0;
        const text = apiError.message || otherErrors.join(' ') || (hasFieldErrors ? '' : 'Sürücü kaydedilemedi. Lütfen tekrar deneyin.');
        if (text) setNotice({ severity: 'error', text });
      }
    } finally {
      setLoading(false);
    }
  };

  const linkPhone = notice?.linkPhone;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          label="Ad *" value={firstName} onChange={(e) => setFirstName(e.target.value)}
          error={!!fieldErrors.first_name} helperText={fieldErrors.first_name}
        />
        <TextField
          label="Soyad *" value={lastName} onChange={(e) => setLastName(e.target.value)}
          error={!!fieldErrors.last_name} helperText={fieldErrors.last_name}
        />
        <TextField
          label="Telefon *" placeholder="0532 111 22 33" value={phone} onChange={(e) => onPhoneChange(e.target.value)}
          error={!!fieldErrors.phone_number} helperText={fieldErrors.phone_number}
          slotProps={{ htmlInput: { inputMode: 'tel' } }}
        />
        <TextField
          label="TC Kimlik No" value={tcNo} onChange={(e) => setTcNo(e.target.value.replace(/\D/g, '').slice(0, 11))}
          error={!!fieldErrors.tc_no} helperText={fieldErrors.tc_no}
          slotProps={{ htmlInput: { inputMode: 'numeric' } }}
        />
      </Box>

      <ServiceTypeChips value={services} onChange={setServices} error={fieldErrors.user_type} />
      <CityAutocomplete value={cities} onChange={setCities} error={fieldErrors.service_cities} />
      <BusinessAddressField value={business} onChange={setBusiness} />

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2, borderRadius: 2 }}>
          {notice.text}
          {linkPhone !== undefined && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => onLinkInstead(linkPhone)}
                sx={{ fontWeight: 600 }}
              >
                Numarayla ekle
              </Button>
            </Box>
          )}
        </Alert>
      )}

      <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ borderRadius: 2 }}>
        {loading ? 'Kaydediliyor...' : 'Sürücüyü Kaydet'}
      </Button>
    </Box>
  );
}
