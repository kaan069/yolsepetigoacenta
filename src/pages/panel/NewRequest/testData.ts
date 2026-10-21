import { TEST_PHONE } from '../../../config';
import type { RequestFormState } from './types';

// Istanbul icinde iki nokta: alis Basaksehir, birakis Kadikoy (rota ~35 km). Adresler Google bicimindedir;
// backend il bilgisini bu bicimden de cikarabilir.
const TEST_PICKUP = {
  address: 'Başak, 34480 Başakşehir/İstanbul, Türkiye',
  latitude: 41.093100,
  longitude: 28.802200,
};
const TEST_DROPOFF = {
  address: 'Caferağa, 34710 Kadıköy/İstanbul, Türkiye',
  latitude: 40.991000,
  longitude: 29.027000,
};

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

// Formu "Talep Oluştur"a hazir hale getirir. Hizmet tipi ve secili digerleri korunur; sadece o
// hizmetin alanlari gonderildigi icin butun hizmetlerin alanlari doldurulur.
export function fillTestData(prev: RequestFormState): RequestFormState {
  // Ayni anda acilan test talepleri listede ayirt edilsin
  const stamp = new Date().toISOString().slice(5, 16).replace(/[-T:]/g, '');
  return {
    ...prev,
    insured_name: 'Test Sigortali',
    insurance_name: 'Test Sigorta',
    insured_phone: TEST_PHONE,
    insured_plate: '34 TEST 34',
    policy_number: `TEST-${stamp}`,

    pickup_address: TEST_PICKUP.address,
    pickup_latitude: TEST_PICKUP.latitude,
    pickup_longitude: TEST_PICKUP.longitude,
    pickup_city: 'İstanbul',
    dropoff_address: TEST_DROPOFF.address,
    dropoff_latitude: TEST_DROPOFF.latitude,
    dropoff_longitude: TEST_DROPOFF.longitude,

    tw_vehicle_type: prev.tw_vehicle_type || 'car',

    cr_load_type: 'Klima dış ünitesi',
    cr_load_weight: '100',
    cr_lift_height: '10',
    cr_floor: '3',
    cr_duration: '2',

    ra_vehicle_type: prev.ra_vehicle_type || 'car',
    ra_problem_types: prev.ra_problem_types.length > 0 ? prev.ra_problem_types : ['battery_boost'],
    ra_problem_description: 'Test talebi: akü bitti, araç çalışmıyor',

    hm_home_type: '2+1 daire',
    hm_floor_from: '2',
    hm_floor_to: '4',
    hm_preferred_date: tomorrow(),
    hm_preferred_time_slot: 'morning',

    cc_load_type: 'Mobilya',
    cc_load_weight: '500',
    cc_width: '2',
    cc_length: '3',
    cc_height: '2',
    cc_preferred_date: tomorrow(),
    cc_preferred_time_slot: 'morning',
  };
}
