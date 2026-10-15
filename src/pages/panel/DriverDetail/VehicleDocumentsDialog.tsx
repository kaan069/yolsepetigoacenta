import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Alert, useMediaQuery, useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { uploadDriverVehicleDocuments, getApiError } from '../../../api';
import { toMediaUrl } from '../../../config';
import { DriverVehicleTypeLabels } from '../../../types';
import type { DriverVehicleEntry, MissingStep } from '../../../types';
import FileField from '../../../components/FileField';
import { documentFields } from './vehicleConfig';
import { VerificationChip } from './parts';
import { otherFieldErrors } from './constants';
import { useDriverGoneRedirect } from './useDriverGoneRedirect';

interface VehicleDocumentsDialogProps {
  driverId: number;
  entry: DriverVehicleEntry;
  onClose: () => void;
  onSaved: (entry: DriverVehicleEntry, steps: MissingStep[]) => void;
  // VEHICLE_NOT_FOUND: arac artik yok; liste yenilenir
  onVehicleMissing: () => void;
}

export default function VehicleDocumentsDialog({
  driverId, entry, onClose, onSaved, onVehicleMissing,
}: VehicleDocumentsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const redirectIfDriverGone = useDriverGoneRedirect();
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const { vehicle, vehicle_type: vehicleType } = entry;
  const isTransfer = vehicleType === 'transfer';
  const fields = documentFields(vehicleType, vehicle.transfer_type);
  const documents = entry.documents ?? {};
  const documentsStatus = typeof documents.verification_status === 'string' ? documents.verification_status : null;

  const currentUrl = (key: string) => {
    const value = documents[key];
    return typeof value === 'string' && value ? toMediaUrl(value) : null;
  };

  const handleUpload = async () => {
    setNotice('');
    const selected: Record<string, File> = {};
    Object.entries(files).forEach(([key, file]) => {
      if (file) selected[key] = file;
    });

    // Transfer belgeleri parca parca yuklenebilir; digerlerinde arac fotografi her yuklemede zorunlu
    if (isTransfer && Object.keys(selected).length === 0) {
      setNotice('Yüklemek için en az bir belge seçin');
      return;
    }
    if (!isTransfer && !selected.vehicle_photo) {
      setFieldErrors({ vehicle_photo: 'Araç fotoğrafı her yüklemede zorunludur' });
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      const response = await uploadDriverVehicleDocuments(driverId, vehicleType, vehicle.id, selected);
      onSaved(
        { vehicle_type: response.vehicle_type, vehicle: response.vehicle, documents: response.documents },
        response.missing_steps,
      );
      enqueueSnackbar(response.message || 'Belgeler yüklendi, admin onayına gönderildi', { variant: 'success' });
      onClose();
    } catch (err) {
      const apiError = getApiError(err);
      if (redirectIfDriverGone(apiError)) return;
      if (apiError.code === 'VEHICLE_NOT_FOUND') {
        enqueueSnackbar(apiError.message || 'Araç bulunamadı', { variant: 'warning' });
        onVehicleMissing();
      } else if (apiError.code === 'FILES_REQUIRED') {
        setNotice(apiError.message || 'Yüklemek için en az bir belge seçin');
      } else {
        setFieldErrors(apiError.fieldErrors);
        const hasFieldErrors = Object.keys(apiError.fieldErrors).length > 0;
        setNotice(
          apiError.message
          || otherFieldErrors(apiError.fieldErrors, fields.map((field) => field.key))
          || (hasFieldErrors ? '' : 'Belgeler yüklenemedi. Lütfen tekrar deneyin.'),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Araç Belgeleri</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {DriverVehicleTypeLabels[vehicleType]} · {vehicle.brand} {vehicle.model} · {vehicle.plate_number}
          </Typography>
          {documentsStatus && <VerificationChip status={documentsStatus} />}
        </Box>
        <Typography sx={{ fontSize: 12, color: '#64748b', mb: 1 }}>
          {isTransfer
            ? 'Belgeler parça parça yüklenebilir; en az bir dosya seçin.'
            : 'Araç fotoğrafı her yüklemede zorunludur, sigorta belgesi isteğe bağlıdır.'}
          {' '}JPG, PNG, WEBP ya da PDF; en fazla 5 MB. Yüklenen belgeler admin onayına düşer.
        </Typography>

        {/* Tek bir belge eklemek bile onaylı aracı yeniden onaya dusurur (transfer dahil) */}
        {vehicle.verification_status === 'approved' && (
          <Alert severity="warning" sx={{ mb: 1, borderRadius: 2 }}>
            Belgeleri değiştirirseniz araç yeniden onaya düşer. Admin onaylayana kadar sürücü bu araçla iş alamaz.
          </Alert>
        )}

        {fields.map((field) => (
          <FileField
            key={field.key}
            label={field.label}
            required={field.required}
            file={files[field.key] ?? null}
            onChange={(file) => setFiles((prev) => ({ ...prev, [field.key]: file }))}
            currentUrl={currentUrl(field.key)}
            error={fieldErrors[field.key]}
          />
        ))}

        {notice && <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{notice}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: '#64748b' }}>Vazgeç</Button>
        <Button variant="contained" onClick={handleUpload} disabled={saving} sx={{ borderRadius: 2 }}>
          {saving ? 'Yükleniyor...' : 'Yükle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
