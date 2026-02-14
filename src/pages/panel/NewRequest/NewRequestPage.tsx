import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, TextField, Button, Alert, MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createInsuranceRequest, initLocationShare, sendLocationSms, getPricingQuestions } from '../../../api';
import { ServiceType } from '../../../types';
import type { ServiceTypeValue, InsuranceRequestCreatePayload, PricingQuestion } from '../../../types';
import { useLocationShareWebSocket } from '../../../hooks/useLocationShareWebSocket';
import type { RequestFormState } from './types';
import { initialFormState } from './types';
import { serviceTypeOptions, NEEDS_DROPOFF } from './constants';
import { buildServiceDetails } from './buildServiceDetails';
import SectionLabel from './SectionLabel';
import ServiceFields from './ServiceFields';
import PickupSection from './PickupSection';
import DropoffSection from './DropoffSection';
import PricingQuestions from './PricingQuestions';
import type { LocationResult } from '../../../components/MapPickerDialog';

export default function NewRequestPage() {
  const [form, setForm] = useState<RequestFormState>(initialFormState);
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

  // Konum paylasimi
  const [locationSmsLoading, setLocationSmsLoading] = useState(false);
  const [locationToken, setLocationToken] = useState<string | null>(null);
  const [locationWsUrl, setLocationWsUrl] = useState<string | null>(null);
  const [locationReceived, setLocationReceived] = useState(false);
  const [locationSmsError, setLocationSmsError] = useState('');

  const { isWaiting: locationWaiting } = useLocationShareWebSocket({
    wsUrl: locationWsUrl,
    onLocationReceived: useCallback((loc: { latitude: number; longitude: number; address: string }) => {
      setForm(prev => ({
        ...prev,
        pickup_address: loc.address,
        pickup_latitude: loc.latitude,
        pickup_longitude: loc.longitude,
      }));
      setLocationReceived(true);
      setLocationWsUrl(null);
    }, []),
  });

  const handleSendLocationSms = async () => {
    if (!form.insured_phone) {
      setLocationSmsError('Lutfen once sigortali telefon numarasini girin');
      return;
    }
    setLocationSmsLoading(true);
    setLocationSmsError('');
    setLocationReceived(false);

    try {
      if (!locationToken) {
        const initRes = await initLocationShare({ insured_phone: form.insured_phone });
        setLocationToken(initRes.token);
        const accessToken = localStorage.getItem('access_token') || '';
        const fullWsUrl = `wss://api.yolsepetigo.com/${initRes.ws_url}?auth=${accessToken}`;
        setLocationWsUrl(fullWsUrl);
        await sendLocationSms({ token: initRes.token });
      } else {
        await sendLocationSms({ token: locationToken });
      }
    } catch {
      setLocationSmsError('SMS gonderilemedi');
    } finally {
      setLocationSmsLoading(false);
    }
  };

  const needsDropoff = NEEDS_DROPOFF.includes(form.service_type);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.insured_name || !form.insured_phone || !form.pickup_address || !form.pickup_latitude || !form.pickup_longitude) {
      setError('Lutfen zorunlu alanlari doldurun');
      return;
    }

    setLoading(true);
    try {
      const payload: InsuranceRequestCreatePayload = {
        service_type: form.service_type,
        insured_name: form.insured_name,
        insured_phone: form.insured_phone,
        location_method: 'manual',
        pickup_address: form.pickup_address,
        pickup_latitude: parseFloat(form.pickup_latitude.toFixed(6)),
        pickup_longitude: parseFloat(form.pickup_longitude.toFixed(6)),
        service_details: buildServiceDetails(form),
      };

      // Fiyatlandirma soru cevaplarini service_details icine ekle
      const answersArray = Object.entries(questionAnswers)
        .filter(([, opts]) => opts.length > 0)
        .map(([qId, opts]) => ({ question_id: Number(qId), option_ids: opts }));
      if (answersArray.length > 0) {
        payload.service_details = { ...payload.service_details, question_answers: answersArray };
      }

      if (needsDropoff) {
        if (form.dropoff_address) payload.dropoff_address = form.dropoff_address;
        if (form.dropoff_latitude) payload.dropoff_latitude = parseFloat(form.dropoff_latitude.toFixed(6));
        if (form.dropoff_longitude) payload.dropoff_longitude = parseFloat(form.dropoff_longitude.toFixed(6));
        if (form.estimated_km > 0) payload.estimated_km = form.estimated_km;
      }

      if (form.insured_plate) payload.insured_plate = form.insured_plate;
      if (form.policy_number) payload.policy_number = form.policy_number;
      if (form.insurance_name) payload.insurance_name = form.insurance_name;

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
              <TextField fullWidth label="Police Numarasi" value={form.policy_number} onChange={handleChange('policy_number')} />
            </Box>

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
              onSendLocationSms={handleSendLocationSms}
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

            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}>
              {loading ? 'Olusturuluyor...' : 'Talep Olustur'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
