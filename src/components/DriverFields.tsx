import { useState } from 'react';
import { Box, Chip, Typography, Autocomplete, TextField, Button, IconButton } from '@mui/material';
import { Place, Close } from '@mui/icons-material';
import { DriverServiceLabels } from '../types';
import type { DriverServiceType } from '../types';
import { TURKEY_CITIES, filterCities } from '../data/turkeyCities';
import MapPickerDialog, { type LocationResult } from './MapPickerDialog';

// Surucu kaydi ve surucu bilgileri sayfasinda ortak kullanilan alanlar

const serviceOptions = Object.keys(DriverServiceLabels) as DriverServiceType[];

export function ServiceTypeChips({ value, onChange, error }: {
  value: DriverServiceType[];
  onChange: (value: DriverServiceType[]) => void;
  error?: string;
}) {
  const toggle = (service: DriverServiceType) => {
    onChange(value.includes(service) ? value.filter((s) => s !== service) : [...value, service]);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 1 }}>Hizmet tipleri *</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {serviceOptions.map((service) => (
          <Chip
            key={service}
            label={DriverServiceLabels[service]}
            onClick={() => toggle(service)}
            color={value.includes(service) ? 'primary' : 'default'}
            variant={value.includes(service) ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
      {error && <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{error}</Typography>}
    </Box>
  );
}

export function CityAutocomplete({ value, onChange, error }: {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}) {
  return (
    <Autocomplete
      multiple
      options={TURKEY_CITIES}
      value={value}
      onChange={(_, next) => onChange(next)}
      filterOptions={(options, state) => filterCities(options, state.inputValue)}
      filterSelectedOptions
      noOptionsText="İl bulunamadı"
      renderInput={(params) => (
        <TextField
          {...params}
          label="Hizmet şehirleri"
          placeholder={value.length === 0 ? 'İl seçin' : ''}
          error={!!error}
          helperText={error}
        />
      )}
      sx={{ mb: 2 }}
    />
  );
}

export function BusinessAddressField({ value, onChange, allowClear = true }: {
  value: LocationResult | null;
  onChange: (value: LocationResult | null) => void;
  allowClear?: boolean;
}) {
  const [mapOpen, setMapOpen] = useState(false);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 1 }}>İş adresi</Typography>
      {value ? (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, mb: 1 }}>
          <Place sx={{ color: '#0ea5e9', mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{value.address}</Typography>
            <Typography sx={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </Typography>
          </Box>
          <Button size="small" onClick={() => setMapOpen(true)}>Değiştir</Button>
          {allowClear && (
            <IconButton size="small" onClick={() => onChange(null)} title="Kaldır">
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      ) : (
        <Button variant="outlined" startIcon={<Place />} onClick={() => setMapOpen(true)} sx={{ mb: 1, borderRadius: 2 }}>
          Haritadan seç
        </Button>
      )}
      <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
        Sürücü uygulamadan konum göndermediği sürece haritada bu adreste görünür. Seçmeniz önerilir.
      </Typography>

      <MapPickerDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelect={onChange}
        initialLocation={value}
        title="İş Adresi Seç"
      />
    </Box>
  );
}
