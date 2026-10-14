import axios from 'axios';
import { API_BASE_URL } from './config';
import {
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
  LocationShareStatusResponse,
  SendLocationSmsPayload,
  SendLocationSmsResponse,
  PricingQuestionsResponse,
  InvoiceResponse,
  HakedisListResponse,
} from './types';

// ==========================================
// Insurance / Acenta API
// ==========================================

const INSURANCE_BASE_URL = `${API_BASE_URL}/insurance`;

const insuranceApi = axios.create({
  baseURL: INSURANCE_BASE_URL,
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

// Bu uclardaki 401 "oturum dustu" degil "bilgiler hatali" demektir; refresh denenmez
const AUTH_ENDPOINTS = ['/login/', '/register/'];

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

    if (error.response?.status === 401 && !originalRequest._retry && !AUTH_ENDPOINTS.includes(originalRequest.url)) {
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
        // Interceptor'suz axios: refresh 401 donerse kuyruga girip kendini beklemesin
        const { data } = await axios.post<TokenRefreshResponse>(`${INSURANCE_BASE_URL}/token/refresh/`, {
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
  baseURL: API_BASE_URL,
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
 * Konum paylasim snapshot'i - konum + arac gorselleri + durum (public, auth yok)
 */
export const getLocationShareStatus = async (
  token: string,
): Promise<LocationShareStatusResponse> => {
  const response = await mainApi.get(`/insurance/location-share/${token}/status/`);
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

export const listHakedisler = async (params?: {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
}): Promise<HakedisListResponse> => {
  const response = await insuranceApi.get('/earnings/', {
    params,
    headers: authHeader(),
  });
  return response.data;
};

