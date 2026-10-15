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
import { useDriverGoneRedirect } from './useDriverGoneRedirect';
import { colors } from '../../../tokens';

interface VehicleFormState {
  brand: string;
  model: string;
  year: string;
  plate_number: string;
  availibility_vehicles_types: string[];
  max_height: string;
  max_capacity: string;
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
  'brand', 'model', 'year', 'plate_number', 'availibility_vehicles_types', 'max_height', 'max_capacity', 'available_services',
  'moving_vehicle_type', 'capacity_type', 'max_volume', 'max_weight', 'has_helper', 'transfer_type',
  'passenger_capacity', 'vehicle_class',
];

const str = (value: unknown) => (value === null || value === undefined ? '' : String(value));
const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

// --- Backend kurallari (core/validators.py, apps/vehicles/models.py, apps/vehicles/serializers.py) ---

// Plaka: il kodu (01-81) + 1-3 harf + 2-4 rakam; bosluk, tire ve nokta silinip buyuk harfe cevrilir
const PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|8[01])[A-Z]{1,3}[0-9]{2,4}$/;
const normalizePlate = (plate: string) => plate.replace(/[\s\-.]/g, '').toUpperCase();

// DecimalField(max_digits=6, decimal_places=2): 0'dan buyuk, en fazla 9999.99 ve 2 ondalik
const isValidDecimal = (value: string) => /^\d{1,4}(\.\d{1,2})?$/.test(value) && Number(value) > 0;
const DECIMAL_ERROR = "0'dan büyük, en fazla 9999,99 ve en fazla 2 ondalık olmalıdır";

const MAX_TEXT_LENGTH = 100;

// Ondalik alan girdisi: virgul noktaya cevrilir, rakam ve tek nokta disindaki karakterler atilir
const toDecimalInput = (value: string) => {
  const [whole, ...rest] = value.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.');
  return rest.length > 0 ? `${whole}.${rest.join('')}` : whole;
};

const initialForm = (entry?: DriverVehicleEntry): VehicleFormState => {
  const vehicle = entry?.vehicle;
  return {
    brand: str(vehicle?.brand),
    model: str(vehicle?.model),
    year: str(vehicle?.year),
    plate_number: str(vehicle?.plate_number),
    availibility_vehicles_types: list(vehicle?.availibility_vehicles_types),
    max_height: str(vehicle?.max_height),
    max_capacity: str(vehicle?.max_capacity),
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

// Alanlar backend'in arac serializer'lariyla (apps/vehicles/serializers.py) ve surucu uygulamasindaki formlarla ayni
const buildPayload = (type: DriverVehicleType, form: VehicleFormState): Record<string, unknown> => {
  const base = {
    brand: form.brand.trim(),
    model: form.model.trim(),
    year: Number(form.year),
    // Normalize hali gonderilir; backend de ayni bicimde saklar ("34 abc 123" -> "34ABC123")
    plate_number: normalizePlate(form.plate_number),
  };
  switch (type) {
    case 'towTruck':
      return { ...base, availibility_vehicles_types: form.availibility_vehicles_types };
    case 'crane':
      // max_height tam sayi (metre); max_capacity ton, bos birakilirsa backend varsayilanini kullanir
      return {
        ...base,
        max_height: Number(form.max_height),
        ...(form.max_capacity && { max_capacity: Number(form.max_capacity) }),
      };
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

  // Ortak: brand/model max 100 karakter, yil 1900 - bu yil, plaka Turkiye formati
  if (!form.brand.trim()) errors.brand = 'Marka zorunludur';
  else if (form.brand.trim().length > MAX_TEXT_LENGTH) errors.brand = 'En fazla 100 karakter olabilir';
  if (!form.model.trim()) errors.model = 'Model zorunludur';
  else if (form.model.trim().length > MAX_TEXT_LENGTH) errors.model = 'En fazla 100 karakter olabilir';
  const year = Number(form.year);
  const currentYear = new Date().getFullYear();
  if (!/^\d{4}$/.test(form.year) || year < 1900 || year > currentYear) errors.year = `1900 ile ${currentYear} arasında olmalıdır`;
  if (!form.plate_number.trim()) errors.plate_number = 'Plaka zorunludur';
  else if (!PLATE_REGEX.test(normalizePlate(form.plate_number))) {
    errors.plate_number = 'Geçersiz plaka. İl kodu (01-81), 1-3 harf ve 2-4 rakam olmalı (örn. 34 ABC 123)';
  }

  // Cekici: availibility_vehicles_types bos olamaz (validate_vehicle_types)
  if (type === 'towTruck' && form.availibility_vehicles_types.length === 0) {
    errors.availibility_vehicles_types = 'Çekebildiği en az bir araç tipi seçin';
  }
  // Vinc: max_height tam sayi 1-1000 (metre), max_capacity istege bagli ondalik (ton)
  if (type === 'crane') {
    const height = Number(form.max_height);
    if (!Number.isInteger(height) || height < 1 || height > 1000) errors.max_height = '1 ile 1000 arasında tam sayı olmalıdır';
    if (form.max_capacity && !isValidDecimal(form.max_capacity)) errors.max_capacity = DECIMAL_ERROR;
  }
  // Nakliye: hacim ve agirlik zorunlu ondalik (max 9999.99)
  if (type === 'moving') {
    if (!form.moving_vehicle_type) errors.moving_vehicle_type = 'Nakliye araç tipi seçin';
    if (!isValidDecimal(form.max_volume)) errors.max_volume = DECIMAL_ERROR;
    if (!isValidDecimal(form.max_weight)) errors.max_weight = DECIMAL_ERROR;
  }
  // Transfer: tip, sinif ve en az 1 yolcu zorunlu (modelde varsayilan yok)
  if (type === 'transfer') {
    if (!form.transfer_type) errors.transfer_type = 'Transfer tipi seçin';
    const capacity = Number(form.passenger_capacity);
    if (!Number.isInteger(capacity) || capacity < 1) errors.passenger_capacity = 'En az 1 olmalıdır';
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
  // VEHICLE_NOT_FOUND: arac artik yok; liste yenilenir
  onVehicleMissing: () => void;
}

export default function VehicleFormDialog({
  driverId, allowedTypes, entry, onClose, onSaved, onVehicleMissing,
}: VehicleFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const redirectIfDriverGone = useDriverGoneRedirect();
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
      if (redirectIfDriverGone(apiError)) return;
      if (apiError.code === 'PLATE_EXISTS') {
        setFieldErrors({ plate_number: apiError.message || 'Bu plaka başka bir araçta kayıtlı' });
      } else if (apiError.code === 'VEHICLE_NOT_FOUND') {
        enqueueSnackbar(apiError.message || 'Araç bulunamadı', { variant: 'warning' });
        onVehicleMissing();
      } else if (apiError.code === 'USER_TYPE_MISMATCH' || apiError.code === 'VEHICLE_TYPE_INVALID') {
        setNotice(apiError.message || 'Bu araç tipi sürücünün hizmet tiplerinde yok. Önce temel bilgilerden hizmet tipini ekleyin.');
      } else {
        // Nakliyede backend'in "vehicle_type" hatasi formdaki nakliye arac tipi alanina aittir
        const errorsByField = Object.fromEntries(
          Object.entries(apiError.fieldErrors).map(([key, message]) => [
            vehicleType === 'moving' && key === 'vehicle_type' ? 'moving_vehicle_type' : key,
            message,
          ]),
        );
        // Ayni tipte ayni plaka: DRF'in unique kontrolu Ingilizce mesaj doner ("... already exists")
        if (errorsByField.plate_number && /already exists/i.test(errorsByField.plate_number)) {
          errorsByField.plate_number = 'Bu plaka zaten kayıtlı';
        }
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
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.neutral[700], mb: 1 }}>{title}</Typography>
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
            slotProps={{ htmlInput: { maxLength: MAX_TEXT_LENGTH } }}
          />
          <TextField
            label="Model *" value={form.model} onChange={(e) => update({ model: e.target.value })}
            error={!!fieldErrors.model} helperText={fieldErrors.model}
            slotProps={{ htmlInput: { maxLength: MAX_TEXT_LENGTH } }}
          />
          <TextField
            label="Yıl *" value={form.year} onChange={(e) => update({ year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
            error={!!fieldErrors.year} helperText={fieldErrors.year}
            slotProps={{ htmlInput: { inputMode: 'numeric' } }}
          />
          <TextField
            label="Plaka *" value={form.plate_number} onChange={(e) => update({ plate_number: e.target.value.toUpperCase() })}
            error={!!fieldErrors.plate_number} helperText={fieldErrors.plate_number || 'Örn. 34 ABC 123'}
            slotProps={{ htmlInput: { maxLength: 15 } }}
          />
        </Box>

        {plateChangedOnApproved && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Bu araç onaylı. Plakayı değiştirirseniz aracın belgeleri yeniden admin onayına düşer.
          </Alert>
        )}

        {vehicleType === 'towTruck' && chipGroup('availibility_vehicles_types', 'Çekebildiği araç tipleri *', TOWABLE_VEHICLE_OPTIONS)}

        {vehicleType === 'crane' && (
          <Box sx={gridSx}>
            <TextField
              label="Maksimum yükseklik (m) *" value={form.max_height}
              onChange={(e) => update({ max_height: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              error={!!fieldErrors.max_height} helperText={fieldErrors.max_height || 'Tam sayı, 1-1000'}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
            <TextField
              label="Maksimum kapasite (ton)" value={form.max_capacity}
              onChange={(e) => update({ max_capacity: toDecimalInput(e.target.value) })}
              error={!!fieldErrors.max_capacity}
              helperText={fieldErrors.max_capacity || 'Boş bırakılırsa 10 ton kabul edilir'}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          </Box>
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
                select label="Kapasite tipi" value={form.capacity_type}
                onChange={(e) => update({ capacity_type: e.target.value })}
                error={!!fieldErrors.capacity_type} helperText={fieldErrors.capacity_type}
              >
                {CAPACITY_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Maksimum hacim (m³) *" value={form.max_volume}
                onChange={(e) => update({ max_volume: toDecimalInput(e.target.value) })}
                error={!!fieldErrors.max_volume} helperText={fieldErrors.max_volume || 'En fazla 9999,99'}
                slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              />
              <TextField
                label="Maksimum ağırlık (kg) *" value={form.max_weight}
                onChange={(e) => update({ max_weight: toDecimalInput(e.target.value) })}
                error={!!fieldErrors.max_weight} helperText={fieldErrors.max_weight || 'En fazla 9999,99 kg'}
                slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              />
            </Box>
            <FormControlLabel
              control={<Switch checked={form.has_helper} onChange={(e) => update({ has_helper: e.target.checked })} />}
              label={<Typography sx={{ fontSize: 14, color: colors.neutral[700] }}>Yardımcı personel var</Typography>}
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
        <Button onClick={onClose} disabled={saving} sx={{ color: colors.neutral[500] }}>Vazgeç</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
          {saving ? 'Kaydediliyor...' : editing ? 'Kaydet' : 'Aracı Ekle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
