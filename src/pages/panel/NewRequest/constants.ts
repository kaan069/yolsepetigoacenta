import { ServiceType, ServiceTypeLabels } from '../../../types';
import type { ServiceTypeValue } from '../../../types';

export const serviceTypeOptions = Object.entries(ServiceTypeLabels).map(([value, label]) => ({ value, label }));

// Degerler backend'in cekici arac kodlariyla ayni (core/validators.py validate_vehicle_types).
// Surucu, ancak cekicisinin "cekebildigi araclar" listesinde bu kod varsa talebe uygun sayilir;
// backend'in tanimadigi degerler (orn. 'pickup', 'van', 'bus') sessizce 'car' olarak kaydediliyordu.
// Traktor bilerek yok: backend talepte 'traktor', surucu aracinda 'tractor' kullandigi icin eslesmiyor.
export const towTruckVehicleTypes = [
  { value: 'car', label: 'Otomobil' },
  { value: 'suv', label: 'Arazi Aracı / SUV' },
  { value: 'commercial', label: 'Ticari (Kamyonet, Van, Pickup)' },
  { value: 'minibus', label: 'Minibüs / Otobüs' },
  { value: 'motorcycle', label: 'Motosiklet' },
  { value: 'truck', label: 'Kamyon / Tır' },
];

export const craneDurationOptions = [
  { value: '1', label: '1 Saat' },
  { value: '2', label: '2 Saat' },
  { value: '3', label: '3 Saat' },
  { value: '4', label: '4 Saat' },
  { value: '5', label: '5 Saat' },
  { value: '6', label: '6 Saat' },
  { value: '7', label: '7 Saat' },
  { value: '8', label: '8 Saat' },
  { value: '9', label: '9 Saat' },
  { value: '10', label: '10 Saat' },
  { value: '11', label: '11 Saat' },
  { value: '12', label: '12 Saat' },
];

export const problemTypeOptions = [
  { value: 'tire_change', label: 'Lastik Degisimi' },
  { value: 'battery_boost', label: 'Aku Takviye' },
  { value: 'fuel_delivery', label: 'Yakit Ikmali' },
  { value: 'lockout', label: 'Anahtar Kilitli Kaldi' },
  { value: 'minor_repair', label: 'Kucuk Onarim' },
];

export const timeSlotOptions = [
  { value: 'morning', label: 'Sabah (08:00-12:00)' },
  { value: 'afternoon', label: 'Ogle (12:00-17:00)' },
  { value: 'evening', label: 'Aksam (17:00-21:00)' },
];

export const NEEDS_DROPOFF: ServiceTypeValue[] = [ServiceType.TowTruck, ServiceType.HomeToHomeMoving, ServiceType.CityToCity];
