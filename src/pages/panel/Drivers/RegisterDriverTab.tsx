import { useState } from 'react';
import { Box, TextField, Button, Alert, Chip, Typography, Autocomplete, IconButton } from '@mui/material';
import { Place, Close } from '@mui/icons-material';
import { registerDriver, getApiError } from '../../../api';
import { DriverServiceLabels } from '../../../types';
import type { DriverServiceType, RegisterDriverPayload } from '../../../types';
import { TURKEY_CITIES, filterCities } from '../../../data/turkeyCities';
import MapPickerDialog, { type LocationResult } from '../../../components/MapPickerDialog';

const serviceOptions = Object.keys(DriverServiceLabels) as DriverServiceType[];

// Formda alan altinda gosterilen hatalar; digerleri genel uyari olarak gosterilir
const FORM_FIELDS = ['first_name', 'last_name', 'phone_number', 'tc_no', 'user_type', 'service_cities'];

interface RegisterDriverTabProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onRegistered: () => void;
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
  const [mapOpen, setMapOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const toggleService = (service: DriverServiceType) => {
    setServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]));
  };

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
      await registerDriver(payload);
      onRegistered();
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

      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 1 }}>Hizmet tipleri *</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: fieldErrors.user_type ? 0.5 : 2 }}>
        {serviceOptions.map((service) => (
          <Chip
            key={service}
            label={DriverServiceLabels[service]}
            onClick={() => toggleService(service)}
            color={services.includes(service) ? 'primary' : 'default'}
            variant={services.includes(service) ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
      {fieldErrors.user_type && (
        <Typography sx={{ fontSize: 12, color: 'error.main', mb: 2 }}>{fieldErrors.user_type}</Typography>
      )}

      <Autocomplete
        multiple
        options={TURKEY_CITIES}
        value={cities}
        onChange={(_, value) => setCities(value)}
        filterOptions={(options, state) => filterCities(options, state.inputValue)}
        filterSelectedOptions
        noOptionsText="İl bulunamadı"
        renderInput={(params) => (
          <TextField
            {...params}
            label="Hizmet şehirleri"
            placeholder={cities.length === 0 ? 'İl seçin' : ''}
            error={!!fieldErrors.service_cities}
            helperText={fieldErrors.service_cities}
          />
        )}
        sx={{ mb: 2 }}
      />

      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 1 }}>İş adresi</Typography>
      {business ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, mb: 1 }}>
          <Place sx={{ color: '#0ea5e9', mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{business.address}</Typography>
            <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
              {business.latitude.toFixed(6)}, {business.longitude.toFixed(6)}
            </Typography>
          </Box>
          <Button size="small" onClick={() => setMapOpen(true)}>Değiştir</Button>
          <IconButton size="small" onClick={() => setBusiness(null)} title="Kaldır">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button variant="outlined" startIcon={<Place />} onClick={() => setMapOpen(true)} sx={{ mb: 1, borderRadius: 2 }}>
          Haritadan seç
        </Button>
      )}
      <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 2 }}>
        Sürücü uygulamadan konum göndermediği sürece haritada bu adreste görünür. Seçmeniz önerilir.
      </Typography>

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

      <MapPickerDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelect={setBusiness}
        initialLocation={business}
        title="İş Adresi Seç"
      />
    </Box>
  );
}
