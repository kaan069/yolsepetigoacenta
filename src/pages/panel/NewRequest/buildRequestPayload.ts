import type { DispatchMode, InsuranceRequestCreatePayload } from '../../../types';
import type { RequestFormState } from './types';
import { NEEDS_DROPOFF } from './constants';
import { buildServiceDetails } from './buildServiceDetails';

// Talep her zaman alis konumuyla birlikte olusturulur ('manual'): konum haritadan secilmis ya da
// musteriden paylasim linkiyle gelmis olabilir. Boylece backend konum detayini olusturma aninda yazar.
export function buildRequestPayload(
  form: RequestFormState,
  questionAnswers: Record<number, number[]>,
  dispatchMode: DispatchMode,
): InsuranceRequestCreatePayload {
  const payload: InsuranceRequestCreatePayload = {
    service_type: form.service_type,
    insured_name: form.insured_name,
    insured_phone: form.insured_phone,
    policy_number: form.policy_number.trim(),
    location_method: 'manual',
    pickup_address: form.pickup_address,
    pickup_latitude: parseFloat(form.pickup_latitude.toFixed(6)),
    pickup_longitude: parseFloat(form.pickup_longitude.toFixed(6)),
    service_details: buildServiceDetails(form),
    dispatch_mode: dispatchMode,
  };

  // Fiyatlandirma soru cevaplarini service_details icine ekle
  const answersArray = Object.entries(questionAnswers)
    .filter(([, opts]) => opts.length > 0)
    .map(([qId, opts]) => ({ question_id: Number(qId), option_ids: opts }));
  if (answersArray.length > 0) {
    payload.service_details = { ...payload.service_details, question_answers: answersArray };
  }

  if (NEEDS_DROPOFF.includes(form.service_type)) {
    if (form.dropoff_address) payload.dropoff_address = form.dropoff_address;
    if (form.dropoff_latitude) payload.dropoff_latitude = parseFloat(form.dropoff_latitude.toFixed(6));
    if (form.dropoff_longitude) payload.dropoff_longitude = parseFloat(form.dropoff_longitude.toFixed(6));
    if (form.estimated_km > 0) payload.estimated_km = form.estimated_km;
  }

  if (form.insured_plate) payload.insured_plate = form.insured_plate;
  if (form.insurance_name) payload.insurance_name = form.insurance_name;

  return payload;
}
