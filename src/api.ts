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
  LocationShareInitPayload,
  LocationShareInitResponse,
  SendLocationSmsResponse,
  PricingQuestionsResponse,
  InvoiceResponse,
  HakedisListResponse,
  PoolDriverListResponse,
  DriverMembershipResponse,
  RegisterDriverPayload,
  AvailableDriversResponse,
  AssignDriverResponse,
  AssignmentStateResponse,
  AgencyAssignment,
  BroadcastResponse,
  OpenToMarketplaceResponse,
  DriverProfile,
  UpdateDriverInfoPayload,
  DriverLicenseResponse,
  DriverCompanyInfoResponse,
  DriverPaymentMethodResponse,
  DriverVehicleType,
  DriverVehicleResponse,
} from './types';

// ==========================================
// Hata Ayristirma
// ==========================================

export interface ApiErrorInfo {
  status?: number;
  // Akis kararlari bu koda gore verilir (orn. DRIVER_BUSY)
  code?: string;
  // Kullaniciya gosterilecek Turkce mesaj
  message?: string;
  // DRF alan hatalari: { alan: ["mesaj"] } -> { alan: "mesaj" }
  fieldErrors: Record<string, string>;
  data: Record<string, unknown>;
}

export const getApiError = (err: unknown): ApiErrorInfo => {
  if (!axios.isAxiosError(err) || !err.response) return { fieldErrors: {}, data: {} };

  const raw = err.response.data;
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && typeof value[0] === 'string') fieldErrors[key] = value[0];
  }
  const code = data.error_code ?? data.errorCode;
  const message = data.error ?? data.detail;

  return {
    status: err.response.status,
    code: typeof code === 'string' ? code : undefined,
    message: typeof message === 'string' ? message : undefined,
    fieldErrors,
    data,
  };
};

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
 * Talep olusturmadan konum paylasim token'i al. Musteri konum ve gorselleri bu token'a gonderir;
 * talep, form tamamlaninca konumla birlikte olusturulur.
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


// --- Surucu havuzu ---

export const listPoolDrivers = async (): Promise<PoolDriverListResponse> => {
  const response = await insuranceApi.get('/drivers/', {
    headers: authHeader(),
  });
  return response.data;
};

// Telefon "0532 111 22 33" bicimiyle gelebilir; backend normalize eder
export const linkDriver = async (phone_number: string): Promise<DriverMembershipResponse> => {
  const response = await insuranceApi.post('/drivers/link/', { phone_number }, {
    headers: authHeader(),
  });
  return response.data;
};

export const registerDriver = async (payload: RegisterDriverPayload): Promise<DriverMembershipResponse> => {
  const response = await insuranceApi.post('/drivers/register/', payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const removeDriver = async (driverId: number): Promise<{ message: string }> => {
  const response = await insuranceApi.delete(`/drivers/${driverId}/`, {
    headers: authHeader(),
  });
  return response.data;
};

// --- Dogrudan atama ---

// radius_km: 0 = sinirsiz
export const getAvailableDrivers = async (
  requestId: number,
  opts: { radius_km?: number } = {},
): Promise<AvailableDriversResponse> => {
  const response = await insuranceApi.get(`/requests/${requestId}/available-drivers/`, {
    // Cevrimdisi suruculer her zaman listelenir (is adresinde, gri). Yeni backend include_offline'i
    // yok sayiyor; eski surum ise 1 gelmezse cevrimdisilari eliyor, bu yuzden her zaman 1 gonderilir.
    params: { radius_km: opts.radius_km, include_offline: 1 },
    headers: authHeader(),
  });
  return response.data;
};

export const assignDriver = async (requestId: number, driver_id: number): Promise<AssignDriverResponse> => {
  const response = await insuranceApi.post(`/requests/${requestId}/assign-driver/`, { driver_id }, {
    headers: authHeader(),
  });
  return response.data;
};

export const getAssignment = async (requestId: number): Promise<AssignmentStateResponse> => {
  const response = await insuranceApi.get(`/requests/${requestId}/assignment/`, {
    headers: authHeader(),
  });
  return response.data;
};

export const cancelAssignment = async (requestId: number): Promise<{ message: string; assignment: AgencyAssignment }> => {
  const response = await insuranceApi.delete(`/requests/${requestId}/assignment/`, {
    headers: authHeader(),
  });
  return response.data;
};

// "Tum suruculere gonder": havuzdaki, musteriye 50 km icindeki uygun ve bos suruculere toplu davet
export const broadcastToPool = async (requestId: number): Promise<BroadcastResponse> => {
  const response = await insuranceApi.post(`/requests/${requestId}/broadcast/`, {}, {
    headers: authHeader(),
  });
  return response.data;
};

export const openToMarketplace = async (requestId: number): Promise<OpenToMarketplaceResponse> => {
  const response = await insuranceApi.post(`/requests/${requestId}/open-to-marketplace/`, {}, {
    headers: authHeader(),
  });
  return response.data;
};

// --- Yonetilen surucu: belge ve bilgiler (sadece managed === true; aksi halde 403 DRIVER_NOT_MANAGED) ---

// insuranceApi varsayilan olarak JSON gonderir; axios 1.x bu baslikla FormData'yi JSON'a cevirir ve
// dosyalar gitmez. Dosya yuklemede baslik ezilir; tarayici boundary'yi kendisi ekler.
const multipartHeaders = () => ({ ...authHeader(), 'Content-Type': 'multipart/form-data' });

const toFormData = (files: Record<string, File | undefined>) => {
  const form = new FormData();
  Object.entries(files).forEach(([key, file]) => {
    if (file) form.append(key, file);
  });
  return form;
};

export const getDriverProfile = async (driverId: number): Promise<DriverProfile> => {
  const response = await insuranceApi.get(`/drivers/${driverId}/profile/`, {
    headers: authHeader(),
  });
  return response.data;
};

// Sadece degisen alanlar gonderilir; yanit guncel profilin tamamidir
export const updateDriverInfo = async (
  driverId: number,
  payload: UpdateDriverInfoPayload,
): Promise<DriverProfile & { message: string }> => {
  const response = await insuranceApi.patch(`/drivers/${driverId}/profile/`, payload, {
    headers: authHeader(),
  });
  return response.data;
};

// Ehliyet ve vergi levhasi birlikte zorunlu; yeniden yukleme onayi sifirlar
export const uploadDriverLicense = async (
  driverId: number,
  files: { license_photo: File; tax_plate_photo: File; k_document_photo?: File },
): Promise<DriverLicenseResponse> => {
  const response = await insuranceApi.post(`/drivers/${driverId}/license/`, toFormData(files), {
    headers: multipartHeaders(),
  });
  return response.data;
};

export const saveDriverCompanyInfo = async (
  driverId: number,
  payload: { company_name?: string; tax_number?: string },
): Promise<DriverCompanyInfoResponse> => {
  const response = await insuranceApi.put(`/drivers/${driverId}/company-info/`, payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const saveDriverPaymentMethod = async (
  driverId: number,
  payload: { account_holder_name?: string; iban?: string },
): Promise<DriverPaymentMethodResponse> => {
  const response = await insuranceApi.put(`/drivers/${driverId}/payment-method/`, payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const createDriverVehicle = async (
  driverId: number,
  vehicleType: DriverVehicleType,
  payload: Record<string, unknown>,
): Promise<DriverVehicleResponse> => {
  const response = await insuranceApi.post(`/drivers/${driverId}/vehicles/${vehicleType}/`, payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const updateDriverVehicle = async (
  driverId: number,
  vehicleType: DriverVehicleType,
  vehicleId: number,
  payload: Record<string, unknown>,
): Promise<DriverVehicleResponse> => {
  const response = await insuranceApi.patch(`/drivers/${driverId}/vehicles/${vehicleType}/${vehicleId}/`, payload, {
    headers: authHeader(),
  });
  return response.data;
};

export const uploadDriverVehicleDocuments = async (
  driverId: number,
  vehicleType: DriverVehicleType,
  vehicleId: number,
  files: Record<string, File | undefined>,
): Promise<DriverVehicleResponse> => {
  const response = await insuranceApi.post(
    `/drivers/${driverId}/vehicles/${vehicleType}/${vehicleId}/documents/`,
    toFormData(files),
    { headers: multipartHeaders() },
  );
  return response.data;
};
