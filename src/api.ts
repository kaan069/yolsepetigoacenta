import axios from 'axios';
import {
  TowTruckRequestForm,
  CreateRequestResponse,
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
  TokenRefreshResponse,
  CompanyProfile,
  InsuranceRequestCreatePayload,
  InsuranceRequestCreateResponse,
  InsuranceRequestListResponse,
  InsuranceRequestDetail,
  CancelRequestResponse,
  PricingEstimatePayload,
  PricingEstimateResponse,
  OffersResponse,
  AcceptOfferResponse,
  CreatePaymentLinkPayload,
  CreatePaymentLinkResponse,
  LocationShareInitPayload,
  LocationShareInitResponse,
  SendLocationSmsPayload,
  SendLocationSmsResponse,
  PricingQuestionsResponse,
  InvoiceResponse,
  HakedisListResponse,
} from './types';

const API_BASE_URL = 'https://api.yolpaketi.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * OTP kodu gonder
 */
export const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/api/otp/send/', {
    phoneNumber: phoneNumber,
  });
  return response.data;
};

/**
 * OTP kodunu dogrula
 */
export const verifyOTP = async (phoneNumber: string, code: string): Promise<{ success: boolean; message: string; verificationToken?: string }> => {
  const response = await api.post('/api/otp/verify/', {
    phoneNumber: phoneNumber,
    otpCode: code,
  });
  return response.data;
};

/**
 * Cekici talebi olustur
 */
export const createTowTruckRequest = async (form: TowTruckRequestForm, verificationToken: string): Promise<CreateRequestResponse> => {
  // Backend'in beklediği formata dönüştür
  const payload = {
    requestedServiceType: 'tow_truck',
    towTruckDetails: {
      vehicleType: form.vehicleType,
    },
    question_answers: [],
    pickupLocation: {
      address: form.pickupAddress,
      latitude: form.pickupLatitude,
      longitude: form.pickupLongitude,
    },
    dropoffLocation: {
      address: form.dropoffAddress,
      latitude: form.dropoffLatitude,
      longitude: form.dropoffLongitude,
    },
    routeInfo: null,
    estimatedPrice: '0',
    estimatedKm: 0,
    createdAt: new Date().toISOString(),
  };

  const response = await api.post('/requests/create/tow-truck/', payload, {
    headers: {
      'X-Verification-Token': verificationToken,
    },
  });
  return response.data;
};

export default api;

// ==========================================
// Insurance / Acenta API
// ==========================================

const insuranceApi = axios.create({
  baseURL: 'https://api.yolsepetigo.com/insurance',
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAccessToken = (): string => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Access token bulunamadi');
  return token;
};

const authHeader = () => ({
  Authorization: `Bearer ${getAccessToken()}`,
});

// --- Token Refresh Interceptor ---

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

insuranceApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return insuranceApi(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshTokenStr = localStorage.getItem('refresh_token');
      if (!refreshTokenStr) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/panel/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await insuranceApi.post<TokenRefreshResponse>('/token/refresh/', {
          refresh_token: refreshTokenStr,
        });
        const newAccessToken = data.tokens.access_token;
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', data.tokens.refresh_token);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return insuranceApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/panel/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- Auth ---

export const registerCompany = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await insuranceApi.post('/register/', payload);
  return response.data;
};

export const loginCompany = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await insuranceApi.post('/login/', payload);
  return response.data;
};

export const refreshToken = async (refresh_token: string): Promise<TokenRefreshResponse> => {
  const response = await insuranceApi.post('/token/refresh/', { refresh_token });
  return response.data;
};

// --- Profil ---

export const getProfile = async (): Promise<CompanyProfile> => {
  const response = await insuranceApi.get('/me/', {
    headers: authHeader(),
  });
  return response.data;
};

export const updateWebhook = async (webhook_url: string): Promise<{ message: string; webhook_url: string }> => {
  const response = await insuranceApi.put('/me/', { webhook_url }, {
    headers: authHeader(),
  });
  return response.data;
};

// --- Talepler ---

export const createInsuranceRequest = async (payload: InsuranceRequestCreatePayload): Promise<InsuranceRequestCreateResponse> => {
  const response = await insuranceApi.post('/requests/create/', payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const listInsuranceRequests = async (params?: { status?: string; page?: number; page_size?: number }): Promise<InsuranceRequestListResponse> => {
  const response = await insuranceApi.get('/requests/', {
    params,
    headers: authHeader(),
  });
  return response.data;
};

export const getInsuranceRequest = async (requestId: number): Promise<InsuranceRequestDetail> => {
  const response = await insuranceApi.get(`/requests/${requestId}/`, {
    headers: authHeader(),
  });
  return response.data;
};

export const cancelInsuranceRequest = async (requestId: number): Promise<CancelRequestResponse> => {
  const response = await insuranceApi.post(`/requests/${requestId}/cancel/`, {}, {
    headers: authHeader(),
  });
  return response.data;
};

// --- Fiyatlandirma ---

export const estimatePrice = async (payload: PricingEstimatePayload): Promise<PricingEstimateResponse> => {
  const response = await insuranceApi.post('/pricing/estimate/', payload, {
    headers: authHeader(),
  });
  return response.data;
};

// ==========================================
// Tracking Token & Teklifler (Ana API)
// ==========================================

const mainApi = axios.create({
  baseURL: 'https://api.yolsepetigo.com',
  headers: { 'Content-Type': 'application/json' },
});

export const extractTrackingToken = (trackingUrl: string): string => {
  const parts = trackingUrl.replace(/\/$/, '').split('/');
  return parts[parts.length - 1];
};

export const getRequestOffers = async (trackingToken: string): Promise<OffersResponse> => {
  const response = await mainApi.get(`/requests/location/${trackingToken}/offers/`);
  return response.data;
};

export const acceptOffer = async (trackingToken: string, offerId: number): Promise<AcceptOfferResponse> => {
  const response = await mainApi.post(`/requests/location/${trackingToken}/accept-offer/${offerId}/`);
  return response.data;
};

/**
 * iyzico odeme linki olustur ve musteriye SMS gonder
 */
export const createPaymentLink = async (
  requestId: number,
  payload: CreatePaymentLinkPayload,
): Promise<CreatePaymentLinkResponse> => {
  const response = await insuranceApi.post(
    `/requests/${requestId}/resend-sms/`,
    payload,
    { headers: authHeader() },
  );
  return response.data;
};

/**
 * Musteri konum paylasimi - GPS koordinatlarini gonder (public, auth yok)
 */
export const submitSharedLocation = async (
  token: string,
  coords: { latitude: number; longitude: number },
): Promise<{ success: boolean; message: string }> => {
  const response = await mainApi.post(`/insurance/location-share/${token}/submit/`, coords);
  return response.data;
};

/**
 * Konum paylasim token durumunu kontrol et (polling fallback)
 */
export const checkLocationShareStatus = async (
  token: string,
): Promise<{ is_used: boolean; latitude?: string; longitude?: string; address?: string }> => {
  const response = await mainApi.get(`/insurance/location-share/${token}/status/`);
  return response.data;
};

/**
 * Konum paylasimi basla (token al)
 */
export const initLocationShare = async (payload: LocationShareInitPayload): Promise<LocationShareInitResponse> => {
  const response = await insuranceApi.post('/location-share/init/', payload, {
    headers: authHeader(),
  });
  return response.data;
};

/**
 * Musteriye konum paylasim SMS'i gonder
 */
export const sendLocationSms = async (payload: SendLocationSmsPayload): Promise<SendLocationSmsResponse> => {
  const response = await insuranceApi.post('/location-share/send-sms/', payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const getPricingQuestions = async (): Promise<PricingQuestionsResponse> => {
  const response = await mainApi.get('/pricing/questions/');
  return response.data;
};

export const getInvoice = async (requestId: number): Promise<InvoiceResponse> => {
  const response = await insuranceApi.get(`/requests/${requestId}/invoice/`, {
    headers: authHeader(),
  });
  return response.data;
};

// --- Hakedisler ---

// Mock data - backend hazir olunca asagidaki gercek API fonksiyonuyla degistirilecek
const MOCK_HAKEDIS_DATA: HakedisListResponse = {
  count: 8,
  page: 1,
  page_size: 20,
  results: [
    { request_id: 1042, service_type: 'towTruck', insured_name: 'Ahmet Yilmaz', status: 'completed', completed_at: '2026-02-15T14:30:00+03:00', estimated_price: '2500.00', insurance_commission: '250.00', currency: 'TRY' },
    { request_id: 1038, service_type: 'crane', insured_name: 'Fatma Demir', status: 'completed', completed_at: '2026-02-14T11:20:00+03:00', estimated_price: '4200.00', insurance_commission: '420.00', currency: 'TRY' },
    { request_id: 1035, service_type: 'roadAssistance', insured_name: 'Mehmet Kaya', status: 'completed', completed_at: '2026-02-13T09:45:00+03:00', estimated_price: '800.00', insurance_commission: '80.00', currency: 'TRY' },
    { request_id: 1029, service_type: 'towTruck', insured_name: 'Ayse Ozturk', status: 'completed', completed_at: '2026-02-12T16:00:00+03:00', estimated_price: '1800.00', insurance_commission: '180.00', currency: 'TRY' },
    { request_id: 1024, service_type: 'homeToHomeMoving', insured_name: 'Ali Celik', status: 'completed', completed_at: '2026-02-10T13:15:00+03:00', estimated_price: '6500.00', insurance_commission: '650.00', currency: 'TRY' },
    { request_id: 1019, service_type: 'towTruck', insured_name: 'Zeynep Arslan', status: 'completed', completed_at: '2026-02-08T10:30:00+03:00', estimated_price: '2200.00', insurance_commission: '220.00', currency: 'TRY' },
    { request_id: 1015, service_type: 'crane', insured_name: 'Hasan Yildiz', status: 'completed', completed_at: '2026-02-05T15:45:00+03:00', estimated_price: '3800.00', insurance_commission: '380.00', currency: 'TRY' },
    { request_id: 1010, service_type: 'roadAssistance', insured_name: 'Elif Sahin', status: 'completed', completed_at: '2026-02-03T08:20:00+03:00', estimated_price: '950.00', insurance_commission: '95.00', currency: 'TRY' },
  ],
  summary: {
    total_earnings: '2275.00',
    total_completed: 8,
    this_month_earnings: '2275.00',
    this_month_completed: 8,
    commission_rate: 10,
  },
};

export const listHakedisler = async (_params?: {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
}): Promise<HakedisListResponse> => {
  // TODO: Backend hazir olunca asagidaki gercek API cagrisini aktif et
  // const response = await insuranceApi.get('/hakedisler/', {
  //   params,
  //   headers: authHeader(),
  // });
  // return response.data;

  // Mock: 300ms gecikme simule et
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_HAKEDIS_DATA;
};

