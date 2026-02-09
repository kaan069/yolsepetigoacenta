import { useState, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, Button, Alert, IconButton,
  CircularProgress,
} from '@mui/material';
import { MyLocation, LocationOn, Close } from '@mui/icons-material';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { ServiceType } from '../../types';
import { estimatePrice } from '../../api';
import type { ServiceTypeValue, PricingEstimatePayload, PricingEstimateResponse } from '../../types';
import MapPickerDialog, { type LocationResult } from '../../components/MapPickerDialog';

export default function PricingPage() {
  const [form, setForm] = useState<PricingEstimatePayload>({
    service_type: ServiceType.TowTruck as ServiceTypeValue,
    pickup_latitude: 0,
    pickup_longitude: 0,
    dropoff_latitude: 0,
    dropoff_longitude: 0,
  });
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PricingEstimateResponse | null>(null);
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [dropoffDialogOpen, setDropoffDialogOpen] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [estimatedKm, setEstimatedKm] = useState(0);

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
            setEstimatedKm(km);
            setForm((prev) => ({ ...prev, estimated_km: km }));
          }
        }
      }
    );
  }, [routesLib]);

  const handlePickupLocationSelect = (loc: LocationResult) => {
    setPickupAddress(loc.address);
    setForm((prev) => {
      const updated = {
        ...prev,
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
    setDropoffAddress(loc.address);
    setForm((prev) => {
      const updated = {
        ...prev,
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
    setDropoffAddress('');
    setEstimatedKm(0);
    setForm((prev) => ({
      ...prev,
      dropoff_latitude: 0,
      dropoff_longitude: 0,
      estimated_km: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.pickup_latitude || !form.pickup_longitude) {
      setError('Alis konumu zorunludur');
      return;
    }

    setLoading(true);
    try {
      const payload: PricingEstimatePayload = {
        service_type: form.service_type,
        pickup_latitude: form.pickup_latitude,
        pickup_longitude: form.pickup_longitude,
      };
      if (form.dropoff_latitude) payload.dropoff_latitude = form.dropoff_latitude;
      if (form.dropoff_longitude) payload.dropoff_longitude = form.dropoff_longitude;
      if (form.estimated_km) payload.estimated_km = form.estimated_km;

      const data = await estimatePrice(payload);
      setResult(data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Fiyat hesaplanirken hata olustu');
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
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Fiyat Hesapla</Typography>
        <Typography sx={{ fontSize: 14, color: '#64748b' }}>Cekici hizmeti icin tahmini fiyat hesaplayin</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {/* Hizmet Tipi - sabit Cekici */}
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>Hizmet Tipi</Typography>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>Cekici</Typography>
            </Box>

            {/* Alis Konumu */}
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, mt: 1 }}>Alis Konumu</Typography>

            <Box
              onClick={() => setPickupDialogOpen(true)}
              sx={{
                mb: 2, p: 2, border: '1px solid',
                borderColor: pickupAddress ? '#0ea5e9' : '#e2e8f0',
                borderRadius: 2, cursor: 'pointer',
                bgcolor: pickupAddress ? '#f0f9ff' : 'transparent',
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: '#0ea5e9', bgcolor: '#f0f9ff' },
              }}
            >
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
                bgcolor: pickupAddress ? '#0ea5e9' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MyLocation sx={{ color: pickupAddress ? 'white' : '#94a3b8', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                {pickupAddress ? (
                  <>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                      Alis Adresi
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
                      {pickupAddress}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8', mt: 0.5, fontFamily: 'monospace' }}>
                      {form.pickup_latitude.toFixed(4)}, {form.pickup_longitude.toFixed(4)}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>
                      Alis konumunu secmek icin tiklayin *
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
                  ? { address: pickupAddress, latitude: form.pickup_latitude, longitude: form.pickup_longitude }
                  : null
              }
              title="Alis Konumu Sec"
            />

            {/* Birakis Konumu */}
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, mt: 1 }}>Birakis Konumu (opsiyonel)</Typography>

            <Box
              onClick={() => setDropoffDialogOpen(true)}
              sx={{
                mb: 2, p: 2, border: '1px solid',
                borderColor: dropoffAddress ? '#ef4444' : '#e2e8f0',
                borderRadius: 2, cursor: 'pointer',
                bgcolor: dropoffAddress ? '#fef2f2' : 'transparent',
                display: 'flex', alignItems: 'flex-start', gap: 1.5,
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: dropoffAddress ? '#ef4444' : '#0ea5e9', bgcolor: dropoffAddress ? '#fef2f2' : '#f0f9ff' },
              }}
            >
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0, mt: 0.25,
                bgcolor: dropoffAddress ? '#ef4444' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LocationOn sx={{ color: dropoffAddress ? 'white' : '#94a3b8', fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                {dropoffAddress ? (
                  <>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.25 }}>
                      Teslim Adresi
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#0f172a', lineHeight: 1.4 }}>
                      {dropoffAddress}
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
              {dropoffAddress && (
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
                  ? { address: dropoffAddress, latitude: form.dropoff_latitude, longitude: form.dropoff_longitude || 0 }
                  : null
              }
              title="Birakis Konumu Sec"
            />

            {/* Mesafe bilgisi */}
            {dropoffAddress && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                {distanceLoading ? (
                  <>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: 13, color: '#64748b' }}>Mesafe hesaplaniyor...</Typography>
                  </>
                ) : estimatedKm ? (
                  <Typography sx={{ fontSize: 13, color: '#0f172a' }}>
                    <strong>{estimatedKm} km</strong>
                    <Typography component="span" sx={{ fontSize: 12, color: '#94a3b8', ml: 1 }}>
                      {pickupAddress?.split(',')[0]} → {dropoffAddress?.split(',')[0]}
                    </Typography>
                  </Typography>
                ) : null}
              </Box>
            )}

            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}>
              {loading ? 'Hesaplaniyor...' : 'Fiyat Hesapla'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {result && (
        <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Sonuc</Typography>

            {result.estimated_price ? (
              <>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  {result.estimated_price} {result.currency}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {result.message}
                </Typography>
                {result.breakdown && (
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">Taban Fiyat</Typography>
                      <Typography variant="body2">{result.breakdown.base_price} TRY</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">Komisyon</Typography>
                      <Typography variant="body2">{result.breakdown.commission} TRY</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">Vergi</Typography>
                      <Typography variant="body2">{result.breakdown.tax} TRY</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderTop: 1, borderColor: 'divider', mt: 1, pt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Toplam</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{result.breakdown.total} TRY</Typography>
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">{result.message}</Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
