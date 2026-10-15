import { useState } from 'react';
import { Box, Button, Alert, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { uploadDriverLicense, getApiError } from '../../../api';
import { toMediaUrl } from '../../../config';
import type { DriverLicense, MissingStep } from '../../../types';
import FileField from '../../../components/FileField';
import { SectionCard, VerificationChip } from './parts';
import { CARD_IDS, otherFieldErrors } from './constants';
import { useDriverGoneRedirect } from './useDriverGoneRedirect';

const FORM_FIELDS = ['license_photo', 'tax_plate_photo', 'k_document_photo'];

interface LicenseCardProps {
  driverId: number;
  license: DriverLicense | null;
  onSaved: (license: DriverLicense, steps: MissingStep[]) => void;
}

export default function LicenseCard({ driverId, license, onSaved }: LicenseCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const redirectIfDriverGone = useDriverGoneRedirect();
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null);
  const [taxPlatePhoto, setTaxPlatePhoto] = useState<File | null>(null);
  const [kDocumentPhoto, setKDocumentPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const handleUpload = async () => {
    setNotice('');
    // Ehliyet ve vergi levhasi birlikte gonderilmeli
    if (!licensePhoto || !taxPlatePhoto) {
      setFieldErrors({
        ...(!licensePhoto && { license_photo: 'Ehliyet fotoğrafı zorunludur' }),
        ...(!taxPlatePhoto && { tax_plate_photo: 'Vergi levhası zorunludur' }),
      });
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      const response = await uploadDriverLicense(driverId, {
        license_photo: licensePhoto,
        tax_plate_photo: taxPlatePhoto,
        k_document_photo: kDocumentPhoto ?? undefined,
      });
      onSaved(response.license, response.missing_steps);
      setLicensePhoto(null);
      setTaxPlatePhoto(null);
      setKDocumentPhoto(null);
      enqueueSnackbar(response.message || 'Belgeler yüklendi, admin onayına gönderildi', { variant: 'success' });
    } catch (err) {
      const apiError = getApiError(err);
      if (redirectIfDriverGone(apiError)) return;
      setFieldErrors(apiError.fieldErrors);
      const hasFieldErrors = Object.keys(apiError.fieldErrors).length > 0;
      setNotice(
        apiError.message
        || otherFieldErrors(apiError.fieldErrors, FORM_FIELDS)
        || (hasFieldErrors ? '' : 'Belgeler yüklenemedi. Lütfen tekrar deneyin.'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      id={CARD_IDS.license}
      title="Ehliyet ve vergi levhası"
      action={license && <VerificationChip status={license.verification_status} />}
    >
      {license?.verification_status === 'rejected' && license.rejection_reason && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>Red sebebi: {license.rejection_reason}</Alert>
      )}
      {license?.verification_status === 'approved' && (
        <Alert severity="info" sx={{ mb: 1.5, borderRadius: 2 }}>
          Belgeler onaylı. Yeniden yüklerseniz onay sıfırlanır ve belgeler tekrar admin onayına düşer.
        </Alert>
      )}

      <FileField
        label="Ehliyet fotoğrafı" required file={licensePhoto} onChange={setLicensePhoto}
        currentUrl={license?.license_photo ? toMediaUrl(license.license_photo) : null}
        error={fieldErrors.license_photo}
      />
      <FileField
        label="Vergi levhası" required file={taxPlatePhoto} onChange={setTaxPlatePhoto}
        currentUrl={license?.tax_plate_photo ? toMediaUrl(license.tax_plate_photo) : null}
        error={fieldErrors.tax_plate_photo}
      />
      <FileField
        label="K belgesi" file={kDocumentPhoto} onChange={setKDocumentPhoto}
        currentUrl={license?.k_document_photo ? toMediaUrl(license.k_document_photo) : null}
        error={fieldErrors.k_document_photo}
      />

      <Typography sx={{ fontSize: 12, color: '#94a3b8', mt: 1 }}>
        Ehliyet ve vergi levhası birlikte yüklenmelidir. JPG, PNG, WEBP ya da PDF; en fazla 5 MB.
      </Typography>

      {notice && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{notice}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
        <Button variant="contained" onClick={handleUpload} disabled={saving} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {saving ? 'Yükleniyor...' : 'Yükle'}
        </Button>
      </Box>
    </SectionCard>
  );
}
