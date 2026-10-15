import type { MissingStep } from '../../../types';

// Kontrol listesindeki adima tiklayinca ilgili karta kaydirilir
export const CARD_IDS = {
  basic: 'driver-card-basic',
  license: 'driver-card-license',
  company: 'driver-card-company',
  payment: 'driver-card-payment',
  vehicles: 'driver-card-vehicles',
};

export const STEP_CARD_IDS: Record<MissingStep['step'], string> = {
  license: CARD_IDS.license,
  company_info: CARD_IDS.company,
  payment_method: CARD_IDS.payment,
  vehicle: CARD_IDS.vehicles,
};

// Formda karsiligi olmayan DRF alan hatalarini tek metinde topla
export const otherFieldErrors = (fieldErrors: Record<string, string>, formFields: string[]) =>
  Object.entries(fieldErrors)
    .filter(([key]) => !formFields.includes(key))
    .map(([, message]) => message)
    .join(' ');
