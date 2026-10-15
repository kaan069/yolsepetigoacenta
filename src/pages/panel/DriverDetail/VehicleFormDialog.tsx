import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Chip, Typography,
  FormControlLabel, Switch, Alert, useMediaQuery, useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { createDriverVehicle, updateDriverVehicle, getApiError } from '../../../api';
import { DriverVehicleTypeLabels } from '../../../types';
import type { DriverVehicleEntry, DriverVehicleType, MissingStep } from '../../../types';
import {
  TOWABLE_VEHICLE_OPTIONS, ROAD_SERVICE_OPTIONS, MOVING_VEHICLE_OPTIONS, CAPACITY_TYPE_OPTIONS,
  TRANSFER_TYPE_OPTIONS, vehicleClassOptions,
} from './vehicleConfig';
import { otherFieldErrors } from './constants';

interface VehicleFormState {
  brand: string;
  model: string;
  year: string;
  plate_number: string;
  availibility_vehicles_types: string[];
  max_height: string;
  available_services: string[];
  // Nakliye arac tipi; payload'da "vehicle_type" olarak gider
  moving_vehicle_type: string;
  capacity_type: string;
  max_volume: string;
  max_weight: string;
  has_helper: boolean;
  transfer_type: string;
  passenger_capacity: string;
  vehicle_class: string;
}

const FORM_FIELDS = [
  'brand', 'model', 'year', 'plate_number', 'availibility_vehicles_types', 'max_height', 'available_services',
  'moving_vehicle_type', 'capacity_type', 'max_volume', 'max_weight', 'has_helper', 'transfer_type',
  'passenger_capacity', 'vehicle_class',
];

const str = (value: unknown) => (value === null || value === undefined ? '' : String(value));
const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
const normalizePlate = (plate: string) => plate.replace(/\s/g, '').toUpperCase();

const initialForm = (entry?: DriverVehicleEntry): VehicleFormState => {
  const vehicle = entry?.vehicle;
  return {
    brand: str(vehicle?.brand),
    model: str(vehicle?.model),
    year: str(vehicle?.year),
    plate_number: str(vehicle?.plate_number),
    availibility_vehicles_types: list(vehicle?.availibility_vehicles_types),
    max_height: str(vehicle?.max_height),
    available_services: list(vehicle?.available_services),
    moving_vehicle_type: str(vehicle?.vehicle_type),
    capacity_type: str(vehicle?.capacity_type) || 'medium',
    max_volume: str(vehicle?.max_volume),
    max_weight: str(vehicle?.max_weight),
    has_helper: Boolean(vehicle?.has_helper),
    transfer_type: str(vehicle?.transfer_type) || 'organization',
    passenger_capacity: str(vehicle?.passenger_capacity),
    vehicle_class: str(vehicle?.vehicle_class),
  };
};

// Alanlar surucu uygulamasindaki arac formlariyla ayni; cekici ve vinc icin uygulama gibi bos renk gonderilir
const buildPayload = (type: DriverVehicleType, form: VehicleFormState): Record<string, unknown> => {
  const base = {
    brand: form.brand.trim(),
    model: form.model.trim(),
    year: Number(form.year),
    plate_number: form.plate_number.trim(),
  };
  switch (type) {
    case 'towTruck':
      return { ...base, color: '', availibility_vehicles_types: form.availibility_vehicles_types };
    case 'crane':
      return { ...base, color: '', max_height: Number(form.max_height) };
    case 'roadAssistance':
      return { ...base, available_services: form.available_services };
    case 'moving':
      return {
        ...base,
        vehicle_type: form.moving_vehicle_type,
        capacity_type: form.capacity_type,
        max_volume: Number(form.max_volume),
        max_weight: Number(form.max_weight),
        has_helper: form.has_helper,
      };
    case 'transfer':
      return {
        ...base,
        transfer_type: form.transfer_type,
        passenger_capacity: Number(form.passenger_capacity),
        vehicle_class: form.vehicle_class,
      };
  }
};

const validate = (type: DriverVehicleType, form: VehicleFormState) => {
  const errors: Record<string, string> = {};
  const year = Number(form.year);
  if (!form.brand.trim()) errors.brand = 'Marka zorunludur';
  if (!form.model.trim()) errors.model = 'Model zorunludur';
  if (!/^\d{4}$/.test(form.year) || year < 1950 || year > new Date().getFullYear() + 1) errors.year = 'Geçerli bir yıl girin';
  if (!form.plate_number.trim()) errors.plate_number = 'Plaka zorunludur';

  if (type === 'towTruck' && form.availibility_vehicles_types.length === 0) {
    errors.availibility_vehicles_types = 'Çekebildiği en az bir araç tipi seçin';
  }
  if (type === 'crane' && !(Number(form.max_height) > 0)) errors.max_height = "Yükseklik 0'dan büyük olmalıdır";
  if (type === 'moving') {
    if (!form.moving_vehicle_type) errors.moving_vehicle_type = 'Nakliye araç tipi seçin';
    if (!(Number(form.max_volume) > 0)) errors.max_volume = "Hacim 0'dan büyük olmalıdır";
    if (!(Number(form.max_weight) > 0)) errors.max_weight = "Ağırlık 0'dan büyük olmalıdır";
  }
  if (type === 'transfer') {
    const capacity = Number(form.passenger_capacity);
    if (!Number.isInteger(capacity) || capacity < 1) errors.passenger_capacity = 'Yolcu kapasitesi en az 1 olmalıdır';
    if (!form.vehicle_class) errors.vehicle_class = 'Araç sınıfı seçin';
  }
  return errors;
};

// Duzenlemede yalnizca degisen alanlar gonderilir (PATCH)
const changedFields = (next: Record<string, unknown>, prev: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(prev[key])));

interface VehicleFormDialogProps {
  driverId: number;
  allowedTypes: DriverVehicleType[];
  // Dolu ise duzenleme, bos ise yeni arac
  entry?: DriverVehicleEntry;
  onClose: () => void;
  onSaved: (entry: DriverVehicleEntry, steps: MissingStep[], created: boolean) => void;
}

export default function VehicleFormDialog({ driverId, allowedTypes, entry, onClose, onSaved }: VehicleFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const editing = !!entry;

  const [vehicleType, setVehicleType] = useState<DriverVehicleType | ''>(
    entry?.vehicle_type ?? (allowedTypes.length === 1 ? allowedTypes[0] : ''),
  );
  const [initial] = useState(() => initialForm(entry));
  const [form, setForm] = useState<VehicleFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const update = (patch: Partial<VehicleFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleIn = (key: 'availibility_vehicles_types' | 'available_services', value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));
  };

  // VIP'e gecince gecersiz kalan arac sinifini temizle
  const handleTransferTypeChange = (transferType: string) => {
    setForm((prev) => ({
      ...prev,
      transfer_type: transferType,
      vehicle_class: vehicleClassOptions(transferType).some((option) => option.value === prev.vehicle_class) ? prev.vehicle_class : '',
    }));
  };

  // Onayli aracin plakasi degisirse belgeleri yeniden onaya duser
  const plateChangedOnApproved = editing
    && entry.vehicle.verification_status === 'approved'
    && normalizePlate(form.plate_number) !== normalizePlate(initial.plate_number);

  const handleSubmit = async () => {
    setNotice('');
    if (!vehicleType) {
      setFieldErrors({ vehicle_type_select: 'Araç tipi seçin' });
      return;
    }
    const errors = validate(vehicleType, form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    let body = buildPayload(vehicleType, form);
    if (editing) {
      body = changedFields(body, buildPayload(vehicleType, initial));
      if (Object.keys(body).length === 0) {
        enqueueSnackbar('Kaydedilecek bir değişiklik yok', { variant: 'info' });
        onClose();
        return;
      }
    }

    setSaving(true);
    try {
      const response = editing
        ? await updateDriverVehicle(driverId, vehicleType, entry.vehicle.id, body)
        : await createDriverVehicle(driverId, vehicleType, body);
      onSaved(
        { vehicle_type: response.vehicle_type, vehicle: response.vehicle, documents: response.documents },
        response.missing_steps,
        !editing,
      );
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError.code === 'PLATE_EXISTS') {
        setFieldErrors({ plate_number: apiError.message || 'Bu plaka başka bir araçta kayıtlı' });
      } else if (apiError.code === 'USER_TYPE_MISMATCH') {
        setNotice(apiError.message || 'Bu araç tipi sürücünün hizmet tiplerinde yok. Önce temel bilgilerden hizmet tipini ekleyin.');
      } else {
        // Nakliyede backend'in "vehicle_type" hatasi formdaki nakliye arac tipi alanina aittir
        const errorsByField = Object.fromEntries(
          Object.entries(apiError.fieldErrors).map(([key, message]) => [
            vehicleType === 'moving' && key === 'vehicle_type' ? 'moving_vehicle_type' : key,
            message,
          ]),
        );
        setFieldErrors(errorsByField);
        const hasFieldErrors = Object.keys(errorsByField).length > 0;
        setNotice(
          apiError.message
          || otherFieldErrors(errorsByField, FORM_FIELDS)
          || (hasFieldErrors ? '' : 'Araç kaydedilemedi. Lütfen tekrar deneyin.'),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const chipGroup = (
    key: 'availibility_vehicles_types' | 'available_services',
    title: string,
    options: { value: string; label: string }[],
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#334155', mb: 1 }}>{title}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            onClick={() => toggleIn(key, option.value)}
            color={form[key].includes(option.value) ? 'primary' : 'default'}
            variant={form[key].includes(option.value) ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
      {fieldErrors[key] && <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>{fieldErrors[key]}</Typography>}
    </Box>
  );

  const gridSx = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        {editing ? `Aracı Düzenle · ${DriverVehicleTypeLabels[entry.vehicle_type]}` : 'Araç Ekle'}
      </DialogTitle>
      <DialogContent>
        {!editing && (
          <TextField
            select fullWidth label="Araç tipi *" value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as DriverVehicleType)}
            error={!!fieldErrors.vehicle_type_select}
            helperText={fieldErrors.vehicle_type_select || 'Sürücünün hizmet tiplerine göre listelenir'}
            sx={{ mt: 1, mb: 2 }}
          >
            {allowedTypes.map((type) => (
              <MenuItem key={type} value={type}>{DriverVehicleTypeLabels[type]}</MenuItem>
            ))}
          </TextField>
        )}

        <Box sx={{ ...gridSx, mt: editing ? 1 : 0 }}>
          <TextField
            label="Marka *" value={form.brand} onChange={(e) => update({ brand: e.target.value })}
            error={!!fieldErrors.brand} helperText={fieldErrors.brand}
          />
          <TextField
            label="Model *" value={form.model} onChange={(e) => update({ model: e.target.value })}
            error={!!fieldErrors.model} helperText={fieldErrors.model}
          />
          <TextField
            label="Yıl *" value={form.year} onChange={(e) => update({ year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            error={!!fieldErrors.year} helperText={fieldErrors.year}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
          <TextField
            label="Plaka *" value={form.plate_number} onChange={(e) => update({ plate_number: e.target.value.toUpperCase() })}
            error={!!fieldErrors.plate_number} helperText={fieldErrors.plate_number || 'Örn. 34 ABC 123'}
          />
        </Box>

        {plateChangedOnApproved && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Bu araç onaylı. Plakayı değiştirirseniz aracın belgeleri yeniden admin onayına düşer.
          </Alert>
        )}

        {vehicleType === 'towTruck' && chipGroup('availibility_vehicles_types', 'Çekebildiği araç tipleri *', TOWABLE_VEHICLE_OPTIONS)}

        {vehicleType === 'crane' && (
          <TextField
            fullWidth label="Maksimum yükseklik (m) *" value={form.max_height}
            onChange={(e) => update({ max_height: e.target.value.replace(',', '.') })}
            error={!!fieldErrors.max_height} helperText={fieldErrors.max_height}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            sx={{ mb: 2 }}
          />
        )}

        {vehicleType === 'roadAssistance' && chipGroup('available_services', 'Verdiği hizmetler', ROAD_SERVICE_OPTIONS)}

        {vehicleType === 'moving' && (
          <>
            <Box sx={gridSx}>
              <TextField
                select label="Nakliye araç tipi *" value={form.moving_vehicle_type}
                onChange={(e) => update({ moving_vehicle_type: e.target.value })}
                error={!!fieldErrors.moving_vehicle_type} helperText={fieldErrors.moving_vehicle_type}
              >
                {MOVING_VEHICLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select label="Kapasite" value={form.capacity_type}
                onChange={(e) => update({ capacity_type: e.target.value })}
                error={!!fieldErrors.capacity_type} helperText={fieldErrors.capacity_type}
              >
                {CAPACITY_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Maksimum hacim (m³) *" value={form.max_volume}
                onChange={(e) => update({ max_volume: e.target.value.replace(',', '.') })}
                error={!!fieldErrors.max_volume} helperText={fieldErrors.max_volume}
                slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              />
              <TextField
                label="Maksimum ağırlık (kg) *" value={form.max_weight}
                onChange={(e) => update({ max_weight: e.target.value.replace(',', '.') })}
                error={!!fieldErrors.max_weight} helperText={fieldErrors.max_weight}
                slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              />
            </Box>
            <FormControlLabel
              control={<Switch checked={form.has_helper} onChange={(e) => update({ has_helper: e.target.checked })} />}
              label={<Typography sx={{ fontSize: 14, color: '#334155' }}>Yardımcı personel var</Typography>}
              sx={{ mb: 2 }}
            />
          </>
        )}

        {vehicleType === 'transfer' && (
          <Box sx={gridSx}>
            <TextField
              select label="Transfer tipi *" value={form.transfer_type}
              onChange={(e) => handleTransferTypeChange(e.target.value)}
              error={!!fieldErrors.transfer_type} helperText={fieldErrors.transfer_type}
            >
              {TRANSFER_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Yolcu kapasitesi *" value={form.passenger_capacity}
              onChange={(e) => update({ passenger_capacity: e.target.value.replace(/\D/g, '') })}
              error={!!fieldErrors.passenger_capacity} helperText={fieldErrors.passenger_capacity}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <TextField
              select label="Araç sınıfı *" value={form.vehicle_class}
              onChange={(e) => update({ vehicle_class: e.target.value })}
              error={!!fieldErrors.vehicle_class} helperText={fieldErrors.vehicle_class}
            >
              {vehicleClassOptions(form.transfer_type).map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {notice && <Alert severity="error" sx={{ borderRadius: 2 }}>{notice}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: '#64748b' }}>Vazgeç</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
          {saving ? 'Kaydediliyor...' : editing ? 'Kaydet' : 'Aracı Ekle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
