import { useState, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, TextField, Button, Alert,
  MenuItem, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import { MyLocation, LocationOn, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { createInsuranceRequest } from '../../api';
import { ServiceType, ServiceTypeLabels } from '../../types';
import type { ServiceTypeValue, InsuranceRequestCreatePayload } from '../../types';
import MapPickerDialog, { type LocationResult } from '../../components/MapPickerDialog';

const serviceTypeOptions = Object.entries(ServiceTypeLabels).map(([value, label]) => ({ value, label }));

export default function NewRequestPage() {
  const [form, setForm] = useState<InsuranceRequestCreatePayload>({
    service_type: ServiceType.TowTruck as ServiceTypeValue,
    insured_name: '',
    insured_phone: '',
    insured_plate: '',
    policy_number: '',
    pickup_address: '',
    pickup_latitude: 0,
    pickup_longitude: 0,
    dropoff_address: '',
    dropoff_latitude: 0,
    dropoff_longitude: 0,
    estimated_km: 0,
    service_details: '',
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [dropoffDialogOpen, setDropoffDialogOpen] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);

  const routesLib = useMapsLibrary('routes');

  const calculateDistance = useCallback((
    pickup: { lat: number; lng: number },
    dropoff: { lat: number; lng: number },
  ) => {
    if (!routesLib) return;
    setDistanceLoading(true);
    const service = new routesLib.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [pickup],
        destinations: [dropoff],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (
        response: google.maps.DistanceMatrixResponse | null,
        status: google.maps.DistanceMatrixStatus,
      ) => {
        setDistanceLoading(false);
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const element = response.rows[0]?.elements[0];
          if (element?.status === google.maps.DistanceMatrixElementStatus.OK) {
            const km = Math.round(element.distance.value / 1000);
            setForm((prev) => ({ ...prev, estimated_km: km }));
          }
        }
      }
    );
  }, [routesLib]);

  const handlePickupLocationSelect = (loc: LocationResult) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        pickup_address: loc.address,
        pickup_latitude: loc.latitude,
        pickup_longitude: loc.longitude,
      };
      if (updated.dropoff_latitude && updated.dropoff_longitude) {
        calculateDistance(
          { lat: loc.latitude, lng: loc.longitude },
          { lat: updated.dropoff_latitude, lng: updated.dropoff_longitude },
        );
      }
      return updated;
    });
  };

  const handleDropoffLocationSelect = (loc: LocationResult) => {
    setForm((prev) => {
      const updated = {
        ...prev,
        dropoff_address: loc.address,
        dropoff_latitude: loc.latitude,
        dropoff_longitude: loc.longitude,
      };
      if (updated.pickup_latitude && updated.pickup_longitude) {
        calculateDistance(
          { lat: updated.pickup_latitude, lng: updated.pickup_longitude },
          { lat: loc.latitude, lng: loc.longitude },
        );
      }
      return updated;
    });
  };

  const clearDropoffLocation = () => {
    setForm((prev) => ({
      ...prev,
      dropoff_address: '',
      dropoff_latitude: 0,
      dropoff_longitude: 0,
      estimated_km: 0,
    }));
  };

  const handleChange = (field: keyof InsuranceRequestCreatePayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = ['pickup_latitude', 'pickup_longitude', 'dropoff_latitude', 'dropoff_longitude', 'estimated_km'].includes(field)
      ? Number(e.target.value) || 0
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.insured_name || !form.insured_phone || !form.policy_number || !form.pickup_address || !form.pickup_latitude || !form.pickup_longitude) {
      setError('Lutfen zorunlu alanlari doldurun');
      return;
    }

    setLoading(true);
    try {
      const payload: InsuranceRequestCreatePayload = {
        service_type: form.service_type,
        insured_name: form.insured_name,
        insured_phone: form.insured_phone,
        policy_number: form.policy_number,
        pickup_address: form.pickup_address,
        pickup_latitude: form.pickup_latitude,
        pickup_longitude: form.pickup_longitude,
      };
      if (form.insured_plate) payload.insured_plate = form.insured_plate;
      if (form.dropoff_address) payload.dropoff_address = form.dropoff_address;
      if (form.dropoff_latitude) payload.dropoff_latitude = form.dropoff_latitude;
      if (form.dropoff_longitude) payload.dropoff_longitude = form.dropoff_longitude;
      if (form.estimated_km) payload.estimated_km = form.estimated_km;
      if (form.service_details) payload.service_details = form.service_details;

      const response = await createInsuranceRequest(payload);
      navigate(`/panel/requests/${response.request_id}`, {
        state: { trackingToken: response.tracking_token },
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Talep olusturulurken hata olustu');
      } else {
        setError('Bir hata olustu. Lutfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Yeni Talep Olustur</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b' }}>Sigortali icin yeni hizmet talebi olusturun</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>Hizmet Bilgileri</Typography>

            <TextField
              select fullWidth label="Hizmet Tipi *" value={form.service_type}
              onChange={handleChange('service_type')} sx={{ mb: 2 }}
            >
              {serviceTypeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, mt: 1 }}>Sigortali Bilgileri</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField fullWidth label="Sigortali Adi *" value={form.insured_name} onChange={handleChange('insured_name')} />
              <TextField fullWidth label="Sigortali Telefon *" value={form.insured_phone} onChange={handleChange('insured_phone')} />
              <TextField fullWidth label="Plaka" value={form.insured_plate} onChange={handleChange('insured_plate')} />
              <TextField fullWidth label="Police Numarasi *" value={form.policy_number} onChange={handleChange('policy_number')} />
            </Box>

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, mt: 1 }}>Alis Konumu</Typography>

            <Box
              onClick={() => setPickupDialogOpen(true)}
              sx={{
                mb: 2, p: 2, border: '1px solid',
                borderColor: form.pickup_address ? '#0ea5e9' : '#e2e8f0',
                borderRadius: 2, cursor: 'pointer',
                bgcolor: form.pickup_address ? '#f0f9ff' : 'transparent',
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: '#0ea5e9', bgcolor: '#f0f9ff' },
              }}
            >
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
                bgcolor: form.pickup_address ? '#0ea5e9' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MyLocation sx={{ color: form.pickup_address ? 'white' : '#94a3b8', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                {form.pickup_address ? (
                  <>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                      Alis Adresi
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
                      {form.pickup_address}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5, fontFamily: 'monospace' }}>
                      {form.pickup_latitude.toFixed(4)}, {form.pickup_longitude.toFixed(4)}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>
                      Alis konumunu secmek icin tiklayin
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#cbd5e1', mt: 0.25 }}>
                      Haritadan konum secin veya adres arayin
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
            <MapPickerDialog
              open={pickupDialogOpen}
              onClose={() => setPickupDialogOpen(false)}
              onSelect={handlePickupLocationSelect}
              initialLocation={
                form.pickup_latitude !== 0
                  ? { address: form.pickup_address, latitude: form.pickup_latitude, longitude: form.pickup_longitude }
                  : null
              }
              title="Alis Konumu Sec"
            />

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, mt: 1 }}>Birakis Konumu (opsiyonel)</Typography>

            <Box
              onClick={() => setDropoffDialogOpen(true)}
              sx={{
                mb: 2, p: 2, border: '1px solid',
                borderColor: form.dropoff_address ? '#ef4444' : '#e2e8f0',
                borderRadius: 2, cursor: 'pointer',
                bgcolor: form.dropoff_address ? '#fef2f2' : 'transparent',
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: form.dropoff_address ? '#ef4444' : '#0ea5e9', bgcolor: form.dropoff_address ? '#fef2f2' : '#f0f9ff' },
              }}
            >
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
                bgcolor: form.dropoff_address ? '#ef4444' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LocationOn sx={{ color: form.dropoff_address ? 'white' : '#94a3b8', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                {form.dropoff_address ? (
                  <>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                      Teslim Adresi
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
                      {form.dropoff_address}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5, fontFamily: 'monospace' }}>
                      {(form.dropoff_latitude || 0).toFixed(4)}, {(form.dropoff_longitude || 0).toFixed(4)}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>
                      Birakis konumunu secmek icin tiklayin (opsiyonel)
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#cbd5e1', mt: 0.25 }}>
                      Haritadan konum secin veya adres arayin
                    </Typography>
                  </>
                )}
              </Box>
              {form.dropoff_address && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDropoffLocation();
                  }}
                  sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' }, mt: 0.25 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Box>
            <MapPickerDialog
              open={dropoffDialogOpen}
              onClose={() => setDropoffDialogOpen(false)}
              onSelect={handleDropoffLocationSelect}
              initialLocation={
                form.dropoff_latitude && form.dropoff_latitude !== 0
                  ? { address: form.dropoff_address || '', latitude: form.dropoff_latitude, longitude: form.dropoff_longitude || 0 }
                  : null
              }
              title="Birakis Konumu Sec"
            />

            {/* Mesafe bilgisi */}
            {form.dropoff_address && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {distanceLoading ? (
                  <>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>Mesafe hesaplaniyor...</Typography>
                  </>
                ) : form.estimated_km ? (
                  <Typography sx={{ fontSize: 13, color: '#0f172a' }}>
                    <strong>{form.estimated_km} km</strong>
                    <Typography component="span" sx={{ fontSize: 12, color: '#94a3b8', ml: 1 }}>
                      {form.pickup_address?.split(',')[0]} → {form.dropoff_address?.split(',')[0]}
                    </Typography>
                  </Typography>
                ) : null}
              </Box>
            )}

            <TextField fullWidth label="Hizmet Detaylari" value={form.service_details} onChange={handleChange('service_details')} multiline rows={2} sx={{ mb: 3 }} />

            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Olusturuluyor...' : 'Talep Olustur'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
