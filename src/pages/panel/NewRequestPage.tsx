import { useState, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, TextField, Button, Alert,
  MenuItem, IconButton, CircularProgress, Checkbox, FormControlLabel, Chip,
} from '@mui/material';
import { MyLocation, LocationOn, Close, Sms, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { createInsuranceRequest, initLocationShare, sendLocationSms } from '../../api';
import { ServiceType, ServiceTypeLabels } from '../../types';
import type { ServiceTypeValue, InsuranceRequestCreatePayload } from '../../types';
import MapPickerDialog, { type LocationResult } from '../../components/MapPickerDialog';
import { useLocationShareWebSocket } from '../../hooks/useLocationShareWebSocket';

const serviceTypeOptions = Object.entries(ServiceTypeLabels).map(([value, label]) => ({ value, label }));

// towTruck vehicle_type secenekleri (backend ServiceDetailsSerializer)
const towTruckVehicleTypes = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'van', label: 'Van' },
  { value: 'motorcycle', label: 'Motosiklet' },
  { value: 'truck', label: 'Kamyon' },
  { value: 'bus', label: 'Otobus' },
];

// roadAssistance problem_types secenekleri
const problemTypeOptions = [
  { value: 'tire_change', label: 'Lastik Degisimi' },
  { value: 'battery_boost', label: 'Aku Takviye' },
  { value: 'fuel_delivery', label: 'Yakit Ikmali' },
  { value: 'lockout', label: 'Anahtar Kilitli Kaldi' },
  { value: 'minor_repair', label: 'Kucuk Onarim' },
];

// Zaman dilimi secenekleri
const timeSlotOptions = [
  { value: 'morning', label: 'Sabah (08:00-12:00)' },
  { value: 'afternoon', label: 'Ogle (12:00-17:00)' },
  { value: 'evening', label: 'Aksam (17:00-21:00)' },
];

// Hangi hizmet tipleri teslim konumu gerektirir
const NEEDS_DROPOFF: ServiceTypeValue[] = [ServiceType.TowTruck, ServiceType.HomeToHomeMoving, ServiceType.CityToCity];

interface RequestFormState {
  service_type: ServiceTypeValue;
  insured_name: string;
  insured_phone: string;
  insured_plate: string;
  policy_number: string;
  insurance_name: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  estimated_km: number;

  // towTruck
  tw_vehicle_type: string;

  // crane
  cr_load_type: string;
  cr_load_weight: string;
  cr_lift_height: string;
  cr_floor: string;
  cr_has_obstacles: boolean;
  cr_obstacle_note: string;

  // roadAssistance
  ra_vehicle_type: string;
  ra_problem_types: string[];
  ra_problem_description: string;

  // homeToHomeMoving
  hm_home_type: string;
  hm_floor_from: string;
  hm_floor_to: string;
  hm_has_elevator_from: boolean;
  hm_has_elevator_to: boolean;
  hm_has_large_items: boolean;
  hm_has_fragile_items: boolean;
  hm_needs_packing: boolean;
  hm_needs_disassembly: boolean;
  hm_preferred_date: string;
  hm_preferred_time_slot: string;

  // cityToCity
  cc_load_type: string;
  cc_load_weight: string;
  cc_width: string;
  cc_length: string;
  cc_height: string;
  cc_preferred_date: string;
  cc_preferred_time_slot: string;
}

const initialFormState: RequestFormState = {
  service_type: ServiceType.TowTruck as ServiceTypeValue,
  insured_name: '',
  insured_phone: '',
  insured_plate: '',
  policy_number: '',
  insurance_name: '',
  pickup_address: '',
  pickup_latitude: 0,
  pickup_longitude: 0,
  dropoff_address: '',
  dropoff_latitude: 0,
  dropoff_longitude: 0,
  estimated_km: 0,

  tw_vehicle_type: 'sedan',

  cr_load_type: '',
  cr_load_weight: '',
  cr_lift_height: '',
  cr_floor: '',
  cr_has_obstacles: false,
  cr_obstacle_note: '',

  ra_vehicle_type: '',
  ra_problem_types: [],
  ra_problem_description: '',

  hm_home_type: '',
  hm_floor_from: '',
  hm_floor_to: '',
  hm_has_elevator_from: false,
  hm_has_elevator_to: false,
  hm_has_large_items: false,
  hm_has_fragile_items: false,
  hm_needs_packing: false,
  hm_needs_disassembly: false,
  hm_preferred_date: '',
  hm_preferred_time_slot: '',

  cc_load_type: '',
  cc_load_weight: '',
  cc_width: '',
  cc_length: '',
  cc_height: '',
  cc_preferred_date: '',
  cc_preferred_time_slot: '',
};

function buildServiceDetails(form: RequestFormState): Record<string, unknown> {
  switch (form.service_type) {
    case 'towTruck':
      return { vehicle_type: form.tw_vehicle_type || 'sedan' };
    case 'crane':
      return {
        ...(form.cr_load_type && { load_type: form.cr_load_type }),
        ...(form.cr_load_weight && { load_weight: Number(form.cr_load_weight) }),
        ...(form.cr_lift_height && { lift_height: Number(form.cr_lift_height) }),
        ...(form.cr_floor && { floor: Number(form.cr_floor) }),
        has_obstacles: form.cr_has_obstacles,
        ...(form.cr_obstacle_note && { obstacle_note: form.cr_obstacle_note }),
      };
    case 'roadAssistance':
      return {
        ...(form.ra_vehicle_type && { vehicle_type: form.ra_vehicle_type }),
        ...(form.ra_problem_types.length && { problem_types: form.ra_problem_types }),
        ...(form.ra_problem_description && { problem_description: form.ra_problem_description }),
      };
    case 'homeToHomeMoving':
      return {
        ...(form.hm_home_type && { home_type: form.hm_home_type }),
        ...(form.hm_floor_from && { floor_from: Number(form.hm_floor_from) }),
        ...(form.hm_floor_to && { floor_to: Number(form.hm_floor_to) }),
        has_elevator_from: form.hm_has_elevator_from,
        has_elevator_to: form.hm_has_elevator_to,
        has_large_items: form.hm_has_large_items,
        has_fragile_items: form.hm_has_fragile_items,
        needs_packing: form.hm_needs_packing,
        needs_disassembly: form.hm_needs_disassembly,
        ...(form.hm_preferred_date && { preferred_date: form.hm_preferred_date }),
        ...(form.hm_preferred_time_slot && { preferred_time_slot: form.hm_preferred_time_slot }),
      };
    case 'cityToCity':
      return {
        ...(form.cc_load_type && { load_type: form.cc_load_type }),
        ...(form.cc_load_weight && { load_weight: Number(form.cc_load_weight) }),
        ...(form.cc_width && { width: Number(form.cc_width) }),
        ...(form.cc_length && { length: Number(form.cc_length) }),
        ...(form.cc_height && { height: Number(form.cc_height) }),
        ...(form.cc_preferred_date && { preferred_date: form.cc_preferred_date }),
        ...(form.cc_preferred_time_slot && { preferred_time_slot: form.cc_preferred_time_slot }),
      };
    default:
      return {};
  }
}

// --- Section Label ---
const SectionLabel = ({ children }: { children: string }) => (
  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, mt: 1 }}>
    {children}
  </Typography>
);

export default function NewRequestPage() {
  const [form, setForm] = useState<RequestFormState>(initialFormState);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [dropoffDialogOpen, setDropoffDialogOpen] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);

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

    // WS ping testi
    const pingSocket = new WebSocket('wss://api.yolsepetigo.com/ws/insurance-ping/');
    pingSocket.onopen = () => { console.log('✅ PING Baglandi!'); pingSocket.send(JSON.stringify({ type: 'ping' })); };
    pingSocket.onmessage = (e) => { console.log('📩 PING Cevap:', JSON.parse(e.data)); pingSocket.close(); };
    pingSocket.onerror = (e) => { console.error('❌ PING Hata:', e); };
    pingSocket.onclose = (e) => { console.warn('🔒 PING Kapandi:', e.code); };

    try {
      if (!locationToken) {
        // Ilk kez: init + sms
        const initRes = await initLocationShare({ insured_phone: form.insured_phone });
        setLocationToken(initRes.token);
        // Backend relative ws_url donuyor, full URL olustur + JWT auth ekle
        const accessToken = localStorage.getItem('access_token') || '';
        const fullWsUrl = `wss://api.yolsepetigo.com/${initRes.ws_url}?auth=${accessToken}`;
        console.log('🔗 Location WS URL:', fullWsUrl);
        setLocationWsUrl(fullWsUrl);
        await sendLocationSms({ token: initRes.token });
      } else {
        // Tekrar gonder: sadece sms
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
    const value = ['pickup_latitude', 'pickup_longitude', 'dropoff_latitude', 'dropoff_longitude', 'estimated_km'].includes(field)
      ? Number(e.target.value) || 0
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as ServiceTypeValue;
    const willNeedDropoff = NEEDS_DROPOFF.includes(newType);

    setForm((prev) => ({
      ...prev,
      service_type: newType,
      // Dropoff gerektirmeyen tiplere geciste dropoff alanlarini sifirla
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
        location_method: 'manual',
        pickup_address: form.pickup_address,
        pickup_latitude: form.pickup_latitude,
        pickup_longitude: form.pickup_longitude,
        service_details: buildServiceDetails(form),
      };

      if (needsDropoff) {
        if (form.dropoff_address) payload.dropoff_address = form.dropoff_address;
        if (form.dropoff_latitude) payload.dropoff_latitude = form.dropoff_latitude;
        if (form.dropoff_longitude) payload.dropoff_longitude = form.dropoff_longitude;
        if (form.estimated_km > 0) payload.estimated_km = form.estimated_km;
      }

      if (form.insured_plate) payload.insured_plate = form.insured_plate;
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

  // --- Hizmet tipine ozel form bolumleri ---

  const renderTowTruckFields = () => (
    <>
      <SectionLabel>Arac Bilgileri</SectionLabel>
      <TextField
        select fullWidth label="Arac Tipi *" value={form.tw_vehicle_type}
        onChange={handleChange('tw_vehicle_type')} sx={{ mb: 2 }}
      >
        {towTruckVehicleTypes.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
        ))}
      </TextField>
    </>
  );

  const renderCraneFields = () => (
    <>
      <SectionLabel>Vinc Detaylari</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField fullWidth label="Yuk Tipi" value={form.cr_load_type} onChange={handleChange('cr_load_type')} placeholder="Orn: Klima dis unitesi" />
        <TextField fullWidth label="Yuk Agirligi (kg)" value={form.cr_load_weight} onChange={handleChange('cr_load_weight')} type="number" />
        <TextField fullWidth label="Kaldirma Yuksekligi (m)" value={form.cr_lift_height} onChange={handleChange('cr_lift_height')} type="number" />
        <TextField fullWidth label="Kat" value={form.cr_floor} onChange={handleChange('cr_floor')} type="number" />
      </Box>
      <FormControlLabel
        control={<Checkbox checked={form.cr_has_obstacles} onChange={handleCheckboxChange('cr_has_obstacles')} />}
        label="Cevrede engel var"
        sx={{ mb: 1, '& .MuiTypography-root': { fontSize: 14 } }}
      />
      {form.cr_has_obstacles && (
        <TextField
          fullWidth label="Engel Aciklamasi" value={form.cr_obstacle_note}
          onChange={handleChange('cr_obstacle_note')} sx={{ mb: 2 }}
          placeholder="Orn: Dar sokak, agac dallari"
        />
      )}
    </>
  );

  const renderRoadAssistanceFields = () => (
    <>
      <SectionLabel>Yol Yardimi Detaylari</SectionLabel>
      <TextField
        fullWidth label="Arac Tipi" value={form.ra_vehicle_type}
        onChange={handleChange('ra_vehicle_type')} sx={{ mb: 2 }}
        placeholder="Orn: Sedan, SUV"
      />
      <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1 }}>Sorun Tipi (birden fazla secilebilir)</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {problemTypeOptions.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            onClick={() => toggleProblemType(opt.value)}
            color={form.ra_problem_types.includes(opt.value) ? 'primary' : 'default'}
            variant={form.ra_problem_types.includes(opt.value) ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>
      <TextField
        fullWidth label="Sorun Aciklamasi" value={form.ra_problem_description}
        onChange={handleChange('ra_problem_description')} multiline rows={2} sx={{ mb: 2 }}
        placeholder="Sorunu detayli aciklayiniz"
      />
    </>
  );

  const renderHomeToHomeMovingFields = () => (
    <>
      <SectionLabel>Nakliyat Detaylari</SectionLabel>
      <TextField
        fullWidth label="Ev Tipi" value={form.hm_home_type}
        onChange={handleChange('hm_home_type')} sx={{ mb: 2 }}
        placeholder="Orn: 3+1 daire, villa"
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 1 }}>
        <TextField fullWidth label="Cikis Kati" value={form.hm_floor_from} onChange={handleChange('hm_floor_from')} type="number" />
        <TextField fullWidth label="Varis Kati" value={form.hm_floor_to} onChange={handleChange('hm_floor_to')} type="number" />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0, mb: 1 }}>
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_elevator_from} onChange={handleCheckboxChange('hm_has_elevator_from')} />}
          label="Cikis asansoru var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_elevator_to} onChange={handleCheckboxChange('hm_has_elevator_to')} />}
          label="Varis asansoru var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0, mb: 1 }}>
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_large_items} onChange={handleCheckboxChange('hm_has_large_items')} />}
          label="Buyuk esya var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={form.hm_has_fragile_items} onChange={handleCheckboxChange('hm_has_fragile_items')} />}
          label="Kirilacak esya var"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0, mb: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={form.hm_needs_packing} onChange={handleCheckboxChange('hm_needs_packing')} />}
          label="Paketleme gerekli"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={form.hm_needs_disassembly} onChange={handleCheckboxChange('hm_needs_disassembly')} />}
          label="Sokum/montaj gerekli"
          sx={{ '& .MuiTypography-root': { fontSize: 14 } }}
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          fullWidth label="Tercih Edilen Tarih" value={form.hm_preferred_date}
          onChange={handleChange('hm_preferred_date')} type="date"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select fullWidth label="Tercih Edilen Zaman" value={form.hm_preferred_time_slot}
          onChange={handleChange('hm_preferred_time_slot')}
        >
          <MenuItem value="">Secilmedi</MenuItem>
          {timeSlotOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );

  const renderCityToCityFields = () => (
    <>
      <SectionLabel>Sehirler Arasi Tasima Detaylari</SectionLabel>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField fullWidth label="Yuk Tipi" value={form.cc_load_type} onChange={handleChange('cc_load_type')} placeholder="Orn: Mobilya, palet" />
        <TextField fullWidth label="Yuk Agirligi (kg)" value={form.cc_load_weight} onChange={handleChange('cc_load_weight')} type="number" />
      </Box>
      <Typography sx={{ fontSize: 13, color: '#64748b', mb: 1 }}>Yuk Boyutlari (cm)</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
        <TextField fullWidth label="En" value={form.cc_width} onChange={handleChange('cc_width')} type="number" />
        <TextField fullWidth label="Boy" value={form.cc_length} onChange={handleChange('cc_length')} type="number" />
        <TextField fullWidth label="Yukseklik" value={form.cc_height} onChange={handleChange('cc_height')} type="number" />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <TextField
          fullWidth label="Tercih Edilen Tarih" value={form.cc_preferred_date}
          onChange={handleChange('cc_preferred_date')} type="date"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select fullWidth label="Tercih Edilen Zaman" value={form.cc_preferred_time_slot}
          onChange={handleChange('cc_preferred_time_slot')}
        >
          <MenuItem value="">Secilmedi</MenuItem>
          {timeSlotOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </Box>
    </>
  );

  const renderServiceFields = () => {
    switch (form.service_type) {
      case ServiceType.TowTruck: return renderTowTruckFields();
      case ServiceType.Crane: return renderCraneFields();
      case ServiceType.RoadAssistance: return renderRoadAssistanceFields();
      case ServiceType.HomeToHomeMoving: return renderHomeToHomeMovingFields();
      case ServiceType.CityToCity: return renderCityToCityFields();
      default: return null;
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
              <TextField fullWidth label="Plaka" value={form.insured_plate} onChange={handleChange('insured_plate')} />
              <TextField fullWidth label="Police Numarasi *" value={form.policy_number} onChange={handleChange('policy_number')} />
            </Box>

            <SectionLabel>Alis Konumu</SectionLabel>

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

            {/* Musteriden konum al */}
            {locationWaiting ? (
              <Box sx={{ mb: 2, p: 2, border: '1px solid #f59e0b', borderRadius: 2, bgcolor: '#fffbeb' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <CircularProgress size={18} sx={{ color: '#f59e0b' }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
                    Musteri konumu bekleniyor...
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: '#a16207' }}>
                  {form.insured_phone} numarasina SMS gonderildi
                </Typography>
                <Button
                  size="small" variant="text"
                  onClick={handleSendLocationSms}
                  disabled={locationSmsLoading}
                  sx={{ mt: 1, fontSize: 12, color: '#92400e', fontWeight: 600 }}
                >
                  Tekrar Gonder
                </Button>
              </Box>
            ) : locationReceived ? (
              <Box sx={{ mb: 2, p: 2, border: '1px solid #10b981', borderRadius: 2, bgcolor: '#ecfdf5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: '#10b981' }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#065f46' }}>
                    Musteri konumu alindi
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                {locationSmsError && (
                  <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }}>{locationSmsError}</Alert>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleSendLocationSms}
                  disabled={locationSmsLoading}
                  startIcon={locationSmsLoading ? <CircularProgress size={16} /> : <Sms />}
                  sx={{ borderColor: '#e2e8f0', color: '#64748b', fontWeight: 600, borderRadius: 2 }}
                >
                  {locationSmsLoading ? 'Gonderiliyor...' : 'Musteriden Konum Al'}
                </Button>
              </Box>
            )}

            {/* Teslim konumu - sadece gerektiren hizmet tipleri icin */}
            {needsDropoff && (
              <>
                <SectionLabel>Birakis Konumu (opsiyonel)</SectionLabel>

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
              </>
            )}

            {/* Hizmet tipine ozel alanlar */}
            {renderServiceFields()}

            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1 }}>
              {loading ? 'Olusturuluyor...' : 'Talep Olustur'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
