import { useState } from 'react';
import { Box, TextField, Button, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';
import { updateDriverInfo, getApiError } from '../../../api';
import type { DriverProfile, DriverServiceType, UpdateDriverInfoPayload } from '../../../types';
import type { LocationResult } from '../../../components/MapPickerDialog';
import { ServiceTypeChips, CityAutocomplete, BusinessAddressField } from '../../../components/DriverFields';
import { toCityDisplayName, isSameCity } from '../../../data/turkeyCities';
import { SectionCard } from './parts';
import { CARD_IDS, otherFieldErrors } from './constants';

const FORM_FIELDS = ['first_name', 'last_name', 'tc_no', 'user_type', 'service_cities'];

type DriverInfo = DriverProfile['driver'];

const toLocation = (driver: DriverInfo): LocationResult | null =>
  driver.business_latitude != null && driver.business_longitude != null
    ? {
        address: driver.business_address ?? '',
        latitude: Number(driver.business_latitude),
        longitude: Number(driver.business_longitude),
        il: driver.business_address_il ?? undefined,
        ilce: driver.business_address_ilce ?? undefined,
      }
    : null;

const sameItems = <T,>(a: T[], b: T[], equals: (x: T, y: T) => boolean = (x, y) => x === y) =>
  a.length === b.length && a.every((x) => b.some((y) => equals(x, y)));

interface BasicInfoCardProps {
  driverId: number;
  driver: DriverInfo;
  onSaved: (profile: DriverProfile) => void;
}

export default function BasicInfoCard({ driverId, driver, onSaved }: BasicInfoCardProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [firstName, setFirstName] = useState(driver.first_name);
  const [lastName, setLastName] = useState(driver.last_name);
  // Profil TC'yi dondurmez; yalnizca degistirilmek istenirse yazilir
  const [tcNo, setTcNo] = useState('');
  const [services, setServices] = useState<DriverServiceType[]>(driver.user_type);
  const [cities, setCities] = useState<string[]>(() => (driver.service_cities ?? []).map(toCityDisplayName));
  const [business, setBusiness] = useState<LocationResult | null>(() => toLocation(driver));
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  // PATCH: yalnizca kayitli profilden farkli olan alanlar gonderilir
  const buildChanges = (): UpdateDriverInfoPayload => {
    const changes: UpdateDriverInfoPayload = {};
    if (firstName.trim() !== driver.first_name) changes.first_name = firstName.trim();
    if (lastName.trim() !== driver.last_name) changes.last_name = lastName.trim();
    if (tcNo) changes.tc_no = tcNo;
    if (!sameItems(services, driver.user_type)) changes.user_type = services;
    if (!sameItems(cities, driver.service_cities ?? [], isSameCity)) changes.service_cities = cities;

    const saved = toLocation(driver);
    const addressChanged = business && (
      !saved || business.latitude !== saved.latitude || business.longitude !== saved.longitude || business.address !== saved.address
    );
    if (business && addressChanged) {
      changes.business_address = business.address;
      if (business.il) changes.business_address_il = business.il;
      if (business.ilce) changes.business_address_ilce = business.ilce;
      changes.business_latitude = business.latitude.toFixed(6);
      changes.business_longitude = business.longitude.toFixed(6);
    }
    return changes;
  };

  const handleSave = async () => {
    setNotice('');
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.first_name = 'Ad zorunludur';
    if (!lastName.trim()) errors.last_name = 'Soyad zorunludur';
    if (services.length === 0) errors.user_type = 'En az bir hizmet tipi seçin';
    if (tcNo && tcNo.length !== 11) errors.tc_no = 'TC kimlik numarası 11 haneli olmalıdır';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const changes = buildChanges();
    if (Object.keys(changes).length === 0) {
      enqueueSnackbar('Kaydedilecek bir değişiklik yok', { variant: 'info' });
      return;
    }

    setSaving(true);
    try {
      const { message, ...profile } = await updateDriverInfo(driverId, changes);
      onSaved(profile);
      setTcNo('');
      enqueueSnackbar(message || 'Bilgiler kaydedildi', { variant: 'success' });
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError.code === 'TC_EXISTS') {
        setFieldErrors({ tc_no: apiError.message || 'Bu TC kimlik numarası başka bir kullanıcıda kayıtlı' });
      } else {
        setFieldErrors(apiError.fieldErrors);
        const hasFieldErrors = Object.keys(apiError.fieldErrors).length > 0;
        setNotice(
          apiError.message
          || otherFieldErrors(apiError.fieldErrors, FORM_FIELDS)
          || (hasFieldErrors ? '' : 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.'),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard id={CARD_IDS.basic} title="Temel bilgiler">
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
          label="Telefon" value={driver.phone_number} disabled
          helperText="Giriş kullanıcı adıdır, değiştirilemez"
        />
        <TextField
          label="TC Kimlik No" value={tcNo} placeholder="Değiştirmek için yazın"
          onChange={(e) => setTcNo(e.target.value.replace(/\D/g, '').slice(0, 11))}
          error={!!fieldErrors.tc_no} helperText={fieldErrors.tc_no}
          slotProps={{ htmlInput: { inputMode: 'numeric' }, inputLabel: { shrink: true } }}
        />
      </Box>

      <ServiceTypeChips value={services} onChange={setServices} error={fieldErrors.user_type} />
      <CityAutocomplete value={cities} onChange={setCities} error={fieldErrors.service_cities} />
      <BusinessAddressField value={business} onChange={setBusiness} allowClear={false} />

      {notice && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{notice}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Box>
    </SectionCard>
  );
}
