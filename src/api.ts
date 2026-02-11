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
  SendLocationSmsPayload,
  SendLocationSmsResponse,
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
 * Musteriye konum paylasim SMS'i gonder
 */
export const sendLocationSms = async (payload: SendLocationSmsPayload): Promise<SendLocationSmsResponse> => {
  const response = await insuranceApi.post('/location-share/send-sms/', payload, {
    headers: authHeader(),
  });
  return response.data;
};

