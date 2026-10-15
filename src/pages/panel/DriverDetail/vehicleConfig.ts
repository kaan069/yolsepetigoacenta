import type { DriverServiceType, DriverVehicleType } from '../../../types';

// Hizmet tipi -> eklenebilecek arac tipi (nakliye iki hizmette ortak).
// Hizmet tipinde olmayan arac eklenirse backend 400 USER_TYPE_MISMATCH doner.
const SERVICE_TO_VEHICLE: Record<DriverServiceType, DriverVehicleType> = {
  towTruck: 'towTruck',
  crane: 'crane',
  roadAssistance: 'roadAssistance',
  homeToHomeMoving: 'moving',
  cityToCity: 'moving',
  transfer: 'transfer',
};

export const allowedVehicleTypes = (services: DriverServiceType[]): DriverVehicleType[] =>
  [...new Set(services.map((service) => SERVICE_TO_VEHICLE[service]).filter(Boolean))];

// --- Secenekler: surucu uygulamasindaki (helpermobile) arac formlariyla ayni degerler ---

export const TOWABLE_VEHICLE_OPTIONS = [
  { value: 'car', label: 'Otomobil' },
  { value: 'motorcycle', label: 'Motosiklet' },
  { value: 'suv', label: 'Arazi Aracı' },
  { value: 'commercial', label: 'Ticari Araç' },
  { value: 'minibus', label: 'Minibüs' },
  { value: 'truck', label: 'Tır' },
  { value: 'tractor', label: 'Traktör' },
];

export const ROAD_SERVICE_OPTIONS = [
  { value: 'tire_change', label: 'Lastik Değişimi' },
  { value: 'battery_boost', label: 'Akü Takviye' },
  { value: 'fuel_delivery', label: 'Yakıt İkmali' },
  { value: 'lockout', label: 'Kapı Açma' },
  { value: 'minor_repair', label: 'Küçük Onarım' },
];

export const MOVING_VEHICLE_OPTIONS = [
  { value: 'closed_truck', label: 'Kapalı Kasa Kamyon' },
  { value: 'closed_pickup', label: 'Kapalı Kasa Kamyonet' },
  { value: 'elevator_truck', label: 'Asansörlü Nakliye Aracı' },
  { value: 'panelvan', label: 'Panelvan (Kargo Van)' },
  { value: 'open_truck', label: 'Açık Kasa Kamyon' },
  { value: 'open_pickup', label: 'Açık Kasa Kamyonet' },
  { value: 'refrigerated', label: 'Frigorifik (Soğutuculu) Araç' },
  { value: 'tir', label: 'Tır' },
  { value: 'lowbed', label: 'Lowbed' },
  { value: 'partial_load', label: 'Parsiyel Yük Aracı' },
];

export const CAPACITY_TYPE_OPTIONS = [
  { value: 'small', label: 'Küçük' },
  { value: 'medium', label: 'Orta' },
  { value: 'large', label: 'Büyük' },
];

export const TRANSFER_TYPE_OPTIONS = [
  { value: 'organization', label: 'Organizasyon (servis)' },
  { value: 'vip', label: 'VIP' },
];

const VEHICLE_CLASS_OPTIONS = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'vip_car', label: 'VIP Araç' },
  { value: 'minibus', label: 'Minibüs' },
  { value: 'midibus', label: 'Midibüs' },
  { value: 'bus', label: 'Otobüs' },
];

// VIP transferde yalnizca binek siniflar secilebilir (surucu uygulamasindaki kural)
export const vehicleClassOptions = (transferType: string) =>
  transferType === 'vip'
    ? VEHICLE_CLASS_OPTIONS.filter((option) => option.value === 'sedan' || option.value === 'vip_car')
    : VEHICLE_CLASS_OPTIONS;

// --- Arac belgeleri ---

export interface DocumentFieldDef {
  key: string;
  label: string;
  required?: boolean;
}

const STANDARD_DOCUMENTS: DocumentFieldDef[] = [
  { key: 'vehicle_photo', label: 'Araç fotoğrafı (plaka görünür)', required: true },
  { key: 'insurance_document_photo', label: 'Sigorta belgesi' },
];

const TRANSFER_COMMON_DOCUMENTS: DocumentFieldDef[] = [
  { key: 'vehicle_photo', label: 'Araç fotoğrafı' },
  { key: 'license_photo', label: 'Ehliyet fotoğrafı' },
  { key: 'traffic_insurance_photo', label: 'Trafik sigortası' },
  { key: 'kasko_photo', label: 'Kasko poliçesi' },
];

const TRANSFER_VIP_DOCUMENTS: DocumentFieldDef[] = [
  { key: 'authority_certificate_photo', label: 'D2 yetki belgesi veya A1/A2 belgesi' },
  { key: 'src_certificate_photo', label: 'SRC1/SRC2 belgesi' },
  { key: 'psychotechnic_report_photo', label: 'Psikoteknik rapor' },
  { key: 'passenger_seat_insurance_photo', label: 'Yolcu koltuk sigortası' },
  { key: 'tourism_transport_certificate_photo', label: 'Turizm taşımacılık belgesi' },
  { key: 'interior_photo_1', label: 'Araç içi görsel 1' },
  { key: 'interior_photo_2', label: 'Araç içi görsel 2' },
  { key: 'interior_photo_3', label: 'Araç içi görsel 3' },
  { key: 'interior_photo_4', label: 'Araç içi görsel 4' },
];

const TRANSFER_ORGANIZATION_DOCUMENTS: DocumentFieldDef[] = [
  { key: 'authority_certificate_photo', label: 'D2 veya B2 yetki belgesi' },
  { key: 's_plate_certificate_photo', label: 'S plaka belgesi' },
  { key: 'route_permit_photo', label: 'Güzergah izin belgesi' },
  { key: 'src_certificate_photo', label: 'SRC-2 belgesi' },
  { key: 'psychotechnic_report_photo', label: 'Psikoteknik rapor' },
  { key: 'passenger_seat_insurance_photo', label: 'Yolcu koltuk sigortası' },
];

// Transfer belgeleri arac tipine (VIP / organizasyon) gore degisir ve parca parca yuklenebilir
export const documentFields = (vehicleType: DriverVehicleType, transferType: unknown): DocumentFieldDef[] => {
  if (vehicleType !== 'transfer') return STANDARD_DOCUMENTS;
  return [
    ...TRANSFER_COMMON_DOCUMENTS,
    ...(transferType === 'vip' ? TRANSFER_VIP_DOCUMENTS : TRANSFER_ORGANIZATION_DOCUMENTS),
  ];
};
