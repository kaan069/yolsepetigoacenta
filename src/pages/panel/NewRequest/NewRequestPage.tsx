import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, TextField, Button, Alert, MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { createInsuranceRequest, initLocationShare, sendLocationSms, getPricingQuestions, getApiError } from '../../../api';
import { ServiceType } from '../../../types';
import type { ServiceTypeValue, PricingQuestion, DispatchMode } from '../../../types';
import { useLocationShareWebSocket } from '../../../hooks/useLocationShareWebSocket';
import { WS_BASE_URL } from '../../../config';
import type { RequestFormState } from './types';
import { initialFormState } from './types';
import { serviceTypeOptions, NEEDS_DROPOFF } from './constants';
import { buildRequestPayload } from './buildRequestPayload';
import SectionLabel from './SectionLabel';
import ServiceFields from './ServiceFields';
import PickupSection from './PickupSection';
import DropoffSection from './DropoffSection';
import PricingQuestions from './PricingQuestions';
import DispatchModeSection from './DispatchModeSection';
import type { LocationResult } from '../../../components/MapPickerDialog';

export default function NewRequestPage() {
  const [form, setForm] = useState<RequestFormState>(initialFormState);
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('marketplace');
  const isDirect = dispatchMode === 'agency_direct';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [dropoffDialogOpen, setDropoffDialogOpen] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);

  // Fiyatlandirma sorulari
  const [pricingQuestions, setPricingQuestions] = useState<PricingQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, number[]>>({});

  useEffect(() => {
    setQuestionsLoading(true);
    getPricingQuestions()
      .then((res) => setPricingQuestions(res.questions))
      .catch(() => {})
      .finally(() => setQuestionsLoading(false));
  }, []);

  const handleQuestionAnswer = (questionId: number, optionId: number, questionType: PricingQuestion['question_type']) => {
    setQuestionAnswers((prev) => {
      if (questionType === 'single_choice' || questionType === 'boolean') {
        return { ...prev, [questionId]: [optionId] };
      }
      const current = prev[questionId] || [];
      const exists = current.includes(optionId);
      return {
        ...prev,
        [questionId]: exists ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
  };

  // Musteriden konum: once talepsiz paylasim token'i alinir ve SMS bu token'la gider. Talep burada
  // OLUSTURULMAZ; form tamamlanip "Talep Olustur"a basilinca musterinin konumuyla birlikte olusturulur.
  // (Talebi erken olusturmak, WS ile gelen konumun talebe islenmemesi sorununa yol aciyordu.)
  const [locationSmsLoading, setLocationSmsLoading] = useState(false);
  const [locationToken, setLocationToken] = useState<string | null>(null);
  const [locationWsUrl, setLocationWsUrl] = useState<string | null>(null);
  const [locationReceived, setLocationReceived] = useState(false);
  const [locationSmsError, setLocationSmsError] = useState('');
  // Alis konumu musteriden mi geldi? Geldiyse talep icin musteriden arac gorseli de beklenir.
  const [pickupFromCustomer, setPickupFromCustomer] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const { state: shareState, isWaiting: locationWaiting } = useLocationShareWebSocket({
    token: locationToken,
    wsUrl: locationWsUrl,
    enabled: !!(locationToken && locationWsUrl),
    onLocationReceived: useCallback((loc: { latitude: number; longitude: number; address: string }) => {
      setForm(prev => ({
        ...prev,
        // Musteri sayfasi adresi bos gonderebiliyor; backend ise talepte adres istiyor
        pickup_address: loc.address || `Müşteri konumu (${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)})`,
        pickup_latitude: loc.latitude,
        pickup_longitude: loc.longitude,
      }));
      setLocationReceived(true);
      setPickupFromCustomer(true);
    }, []),
    onNotify: useCallback((severity: 'info' | 'success' | 'warning' | 'error', message: string) => {
      enqueueSnackbar(message, { variant: severity });
    }, [enqueueSnackbar]),
  });

  const handleStartCustomerShare = async () => {
    if (!form.insured_name || !form.insured_phone) {
      setLocationSmsError('Lutfen once sigortali ad ve telefon bilgisini girin');
      return;
    }
    setLocationSmsLoading(true);
    setLocationSmsError('');

    try {
      let token = locationToken;
      // Ilk istek ya da suresi dolmus link: yeni token. Aksi halde ayni linke SMS yeniden gider.
      if (!token || shareState.isExpired) {
        const res = await initLocationShare({ insured_phone: form.insured_phone });
        token = res.token;
        setLocationToken(token);
        const accessToken = localStorage.getItem('access_token') || '';
        setLocationWsUrl(`${WS_BASE_URL}/ws/location-share/${token}/?auth=${accessToken}`);
      }
      await sendLocationSms({ token });
    } catch (err: unknown) {
      setLocationSmsError(getApiError(err).message || 'SMS gonderilemedi. Lutfen tekrar deneyin.');
    } finally {
      setLocationSmsLoading(false);
    }
  };

  const needsDropoff = NEEDS_DROPOFF.includes(form.service_type);

  // "Talep Olustur" ancak bunlar tamamsa aktif; eksikler butonun ustunde listelenir
  const hasPickup = !!form.pickup_address && !!form.pickup_latitude && !!form.pickup_longitude;
  const missingItems: string[] = [];
  if (!form.insured_name.trim()) missingItems.push('Sigortalı adını girin');
  if (!form.insured_phone.trim()) missingItems.push('Sigortalı telefonunu girin');
  if (!form.policy_number.trim()) missingItems.push('Poliçe numarasını girin');
  if (!hasPickup) {
    missingItems.push(locationToken ? 'Müşterinin konumu bekleniyor' : 'Alış konumunu seçin ya da müşteriden isteyin');
  }
  if (hasPickup && pickupFromCustomer && shareState.images.length === 0) {
    missingItems.push('Müşteriden araç görseli bekleniyor');
  }
  if (form.service_type === ServiceType.TowTruck && !form.tw_vehicle_type) missingItems.push('Araç tipini seçin');

  const calculateDistance = useCallback((
    pickup: { lat: number; lng: number },
    dropoff: { lat: number; lng: number },
  ) => {
    if (typeof google === 'undefined' || !google.maps) return;
    setDistanceLoading(true);
    const service = new google.maps.DistanceMatrixService();
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
  }, []);

  const handlePickupLocationSelect = (loc: LocationResult) => {
    // Haritadan elle secilen konum musteriden gelmedi; musteri gorseli sart degil
    setPickupFromCustomer(false);
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

  const handleChange = (field: keyof RequestFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: string | number = e.target.value;

    if (['pickup_latitude', 'pickup_longitude', 'dropoff_latitude', 'dropoff_longitude', 'estimated_km'].includes(field)) {
      value = Number(value) || 0;
    } else if (field === 'insured_name' || field === 'insurance_name') {
      value = value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
    } else if (field === 'insured_phone') {
      value = value.replace(/[^0-9]/g, '');
    } else if (field === 'insured_plate') {
      value = value.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as ServiceTypeValue;
    const willNeedDropoff = NEEDS_DROPOFF.includes(newType);

    setForm((prev) => ({
      ...prev,
      service_type: newType,
      ...(!willNeedDropoff && {
        dropoff_address: '',
        dropoff_latitude: 0,
        dropoff_longitude: 0,
        estimated_km: 0,
      }),
    }));
  };

  const handleCheckboxChange = (field: keyof RequestFormState) => (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setForm((prev) => ({ ...prev, [field]: checked }));
  };

  const toggleProblemType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      ra_problem_types: prev.ra_problem_types.includes(type)
        ? prev.ra_problem_types.filter((t) => t !== type)
        : [...prev.ra_problem_types, type],
    }));
  };

  // Talep yalnizca burada, konumuyla birlikte olusturulur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (missingItems.length > 0) {
      setError(missingItems[0]);
      return;
    }
    setError('');

    setLoading(true);
    try {
      const response = await createInsuranceRequest(buildRequestPayload(form, questionAnswers, dispatchMode));
      // Dogrudan atamada konum hazir; dogrudan harita ekranina gidilir
      const path = isDirect ? `/panel/requests/${response.request_id}/assign` : `/panel/requests/${response.request_id}`;
      navigate(path, {
        state: { trackingToken: response.tracking_token },
      });
    } catch (err: unknown) {
      const apiError = getApiError(err);
      setError(
        apiError.message
        || Object.values(apiError.fieldErrors)[0]
        || 'Talep olusturulurken hata olustu. Lutfen tekrar deneyin.',
      );
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
            <SectionLabel>Hizmet Bilgileri</SectionLabel>

            <TextField
              select fullWidth label="Hizmet Tipi *" value={form.service_type}
              onChange={handleServiceTypeChange} sx={{ mb: 2 }}
            >
              {serviceTypeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            <SectionLabel>Sigortali Bilgileri</SectionLabel>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField fullWidth label="Sigortali Adi *" value={form.insured_name} onChange={handleChange('insured_name')} />
              <TextField fullWidth label="Sigorta Sirketi" value={form.insurance_name} onChange={handleChange('insurance_name')} placeholder="Orn: Axa, Allianz, Anadolu Sigorta" />
              <TextField fullWidth label="Sigortali Telefon *" value={form.insured_phone} onChange={handleChange('insured_phone')} />
              {form.service_type !== ServiceType.Crane && (
                <TextField fullWidth label="Plaka" value={form.insured_plate} onChange={handleChange('insured_plate')} />
              )}
              <TextField fullWidth label="Police Numarasi *" value={form.policy_number} onChange={handleChange('policy_number')} />
            </Box>

            <SectionLabel>Dağıtım Yöntemi</SectionLabel>

            <DispatchModeSection value={dispatchMode} onChange={setDispatchMode} />

            <SectionLabel>Alis Konumu</SectionLabel>

            <PickupSection
              pickupAddress={form.pickup_address}
              pickupLatitude={form.pickup_latitude}
              pickupLongitude={form.pickup_longitude}
              dialogOpen={pickupDialogOpen}
              onDialogOpen={() => setPickupDialogOpen(true)}
              onDialogClose={() => setPickupDialogOpen(false)}
              onLocationSelect={handlePickupLocationSelect}
              locationWaiting={locationWaiting}
              locationReceived={locationReceived}
              locationSmsLoading={locationSmsLoading}
              locationSmsError={locationSmsError}
              insuredPhone={form.insured_phone}
              onSendLocationSms={handleStartCustomerShare}
              images={shareState.images}
              imageCount={shareState.imageCount}
              maxImages={shareState.maxImages}
              isSubmitted={shareState.isSubmitted}
              isExpired={shareState.isExpired}
              onResendLink={handleStartCustomerShare}
            />

            {needsDropoff && (
              <>
                <SectionLabel>Birakis Konumu (opsiyonel)</SectionLabel>
                <DropoffSection
                  dropoffAddress={form.dropoff_address}
                  dropoffLatitude={form.dropoff_latitude}
                  dropoffLongitude={form.dropoff_longitude}
                  pickupAddress={form.pickup_address}
                  estimatedKm={form.estimated_km}
                  distanceLoading={distanceLoading}
                  dialogOpen={dropoffDialogOpen}
                  onDialogOpen={() => setDropoffDialogOpen(true)}
                  onDialogClose={() => setDropoffDialogOpen(false)}
                  onLocationSelect={handleDropoffLocationSelect}
                  onClear={clearDropoffLocation}
                />
              </>
            )}

            <ServiceFields
              form={form}
              onChange={handleChange}
              onCheckboxChange={handleCheckboxChange}
              onToggleProblemType={toggleProblemType}
            />

            {form.service_type === ServiceType.TowTruck && (
              <PricingQuestions
                questions={pricingQuestions}
                loading={questionsLoading}
                answers={questionAnswers}
                onChange={handleQuestionAnswer}
              />
            )}

            {missingItems.length > 0 && (
              <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, p: 1.5, mt: 1, mb: 1.5 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                  Talebi oluşturmak için:
                </Typography>
                {missingItems.map((item) => (
                  <Typography key={item} sx={{ fontSize: 13, color: '#334155' }}>• {item}</Typography>
                ))}
              </Box>
            )}

            <Button
              fullWidth type="submit" variant="contained" size="large"
              disabled={loading || missingItems.length > 0}
              sx={{ mt: 1 }}
            >
              {loading ? 'Olusturuluyor...' : isDirect ? 'Talep Oluştur ve Sürücü Ata' : 'Talep Olustur'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
