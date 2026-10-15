import { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import { getDriverProfile, getApiError } from '../../../api';
import type { DriverProfile, DriverVehicleEntry, MissingStep } from '../../../types';
import { driverFullName } from '../../../utils/drivers';
import PageLoader from '../../../components/PageLoader';
import MissingStepsCard from './MissingStepsCard';
import BasicInfoCard from './BasicInfoCard';
import LicenseCard from './LicenseCard';
import CompanyInfoCard from './CompanyInfoCard';
import PaymentMethodCard from './PaymentMethodCard';
import VehiclesCard from './VehiclesCard';
import { useDriverGoneRedirect } from './useDriverGoneRedirect';

const isSameVehicle = (a: DriverVehicleEntry, b: DriverVehicleEntry) =>
  a.vehicle_type === b.vehicle_type && a.vehicle.id === b.vehicle.id;

// Panelden kaydedilen (managed) surucunun belge ve bilgileri.
// Her kayittan sonra yanittaki missing_steps ile kontrol listesi guncellenir; profil yeniden cekilmez.
export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const driverId = Number(id);
  const invalidId = !Number.isInteger(driverId) || driverId <= 0;

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; notManaged?: boolean } | null>(null);
  const redirectIfDriverGone = useDriverGoneRedirect();

  useEffect(() => {
    if (invalidId) return;
    getDriverProfile(driverId)
      .then(setProfile)
      .catch((err) => {
        const apiError = getApiError(err);
        if (redirectIfDriverGone(apiError)) return;
        if (apiError.code === 'DRIVER_NOT_MANAGED') {
          setError({
            message: 'Bu sürücü belgelerini kendisi yönetiyor. Telefonla eklenen sürücünün ehliyet, araç ve IBAN bilgilerini yalnızca sürücü uygulamadan girebilir.',
            notManaged: true,
          });
        } else {
          setError({ message: apiError.message || 'Sürücü bilgileri yüklenemedi' });
        }
      })
      .finally(() => setLoading(false));
  }, [invalidId, driverId, redirectIfDriverGone]);

  // Arac bulunamadi gibi durumlarda guncel profili yeniden cek
  const reloadProfile = () => {
    getDriverProfile(driverId)
      .then(setProfile)
      .catch((err) => {
        redirectIfDriverGone(getApiError(err));
      });
  };

  const updateProfile = (patch: Partial<DriverProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleVehicleSaved = (entry: DriverVehicleEntry, steps: MissingStep[]) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const exists = prev.vehicles.some((item) => isSameVehicle(item, entry));
      const vehicles = exists
        ? prev.vehicles.map((item) => (isSameVehicle(item, entry) ? entry : item))
        : [...prev.vehicles, entry];
      return { ...prev, vehicles, missing_steps: steps };
    });
  };

  const backButton = (
    <Button component={Link} to="/panel/drivers" startIcon={<ArrowBack />} size="small" sx={{ color: '#64748b', fontWeight: 500, mb: 1 }}>
      Sürücülerim
    </Button>
  );

  if (invalidId || error) {
    return (
      <Box sx={{ maxWidth: 820, mx: 'auto' }}>
        {backButton}
        <Alert severity={error?.notManaged ? 'info' : 'error'} sx={{ borderRadius: 2 }}>
          {error?.message || 'Sürücü bulunamadı'}
        </Alert>
      </Box>
    );
  }

  if (loading || !profile) {
    return <PageLoader />;
  }

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      {backButton}

      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{driverFullName(profile.driver)}</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b' }}>
          {profile.driver.phone_number} · Panelden kaydedildi
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Yüklenen ya da değiştirilen her belge admin onayına düşer. Onay bekleyen sürücü haritada görünmez.
      </Alert>

      <MissingStepsCard steps={profile.missing_steps} />

      <BasicInfoCard driverId={driverId} driver={profile.driver} onSaved={setProfile} />

      <LicenseCard
        driverId={driverId}
        license={profile.license}
        onSaved={(license, steps) => updateProfile({ license, missing_steps: steps })}
      />

      <CompanyInfoCard
        driverId={driverId}
        companyInfo={profile.company_info}
        onSaved={(companyInfo, steps) => updateProfile({ company_info: companyInfo, missing_steps: steps })}
      />

      <PaymentMethodCard
        driverId={driverId}
        paymentMethod={profile.payment_method}
        onSaved={(paymentMethod, steps) => updateProfile({ payment_method: paymentMethod, missing_steps: steps })}
      />

      <VehiclesCard
        driverId={driverId}
        services={profile.driver.user_type}
        vehicles={profile.vehicles}
        onSaved={handleVehicleSaved}
        onReload={reloadProfile}
      />
    </Box>
  );
}
