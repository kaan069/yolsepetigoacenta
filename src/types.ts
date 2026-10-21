// ==========================================
// Insurance / Acenta Panel Types
// ==========================================

// Hizmet tipi
export const ServiceType = {
  TowTruck: 'towTruck',
  Crane: 'crane',
  RoadAssistance: 'roadAssistance',
  HomeToHomeMoving: 'homeToHomeMoving',
  CityToCity: 'cityToCity',
} as const;

export type ServiceTypeValue = (typeof ServiceType)[keyof typeof ServiceType];

export const ServiceTypeLabels: Record<ServiceTypeValue, string> = {
  [ServiceType.TowTruck]: 'Cekici',
  [ServiceType.Crane]: 'Vinc',
  [ServiceType.RoadAssistance]: 'Yol Yardimi',
  [ServiceType.HomeToHomeMoving]: 'Evden Eve Nakliyat',
  [ServiceType.CityToCity]: 'Sehirler Arasi',
};

// Talep durumu
export const RequestStatus = {
  PendingLocation: 'pending_location',
  Pending: 'pending',
  AwaitingApproval: 'awaiting_approval',
  AwaitingPayment: 'awaiting_payment',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;

export type RequestStatusValue = (typeof RequestStatus)[keyof typeof RequestStatus];

export const RequestStatusLabels: Record<RequestStatusValue, string> = {
  [RequestStatus.PendingLocation]: 'Konum Bekleniyor',
  [RequestStatus.Pending]: 'Beklemede',
  [RequestStatus.AwaitingApproval]: 'Onay Bekleniyor',
  [RequestStatus.AwaitingPayment]: 'Odeme Bekleniyor',
  [RequestStatus.InProgress]: 'Devam Ediyor',
  [RequestStatus.Completed]: 'Tamamlandi',
  [RequestStatus.Cancelled]: 'Iptal Edildi',
};

export const RequestStatusColors: Record<RequestStatusValue, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error'> = {
  pending_location: 'warning',
  pending: 'default',
  awaiting_approval: 'warning',
  awaiting_payment: 'info',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
};

// --- Auth ---

export interface RegisterPayload {
  name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  password: string;
  tax_number: string;
  tax_office: string;
  company_address: string;
  webhook_url?: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  status: 'pending_approval';
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  company: {
    id: number;
    name: string;
    contact_person: string;
    contact_email: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
  message: string;
}

export interface TokenRefreshPayload {
  refresh_token: string;
}

export interface TokenRefreshResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
  message: string;
}

// --- Profil (GET /me/) ---

export interface CompanyProfile {
  company: {
    id: number;
    name: string;
    contact_person: string;
    contact_email: string;
    contact_phone: string;
    tax_number: string;
    tax_office: string;
    company_address: string;
  };
  api: {
    api_key: string;
    webhook_url: string | null;
    rate_limit_per_minute: number;
  };
  status: {
    is_approved: boolean;
    is_active: boolean;
    approved_at: string | null;
    created_at: string;
    commission_rate: number;
  };
  statistics: {
    total_requests: number;
    pending_requests: number;
    in_progress_requests: number;
    completed_requests: number;
    cancelled_requests: number;
  };
}

// --- Talepler ---

export interface InsuranceRequestCreatePayload {
  service_type: ServiceTypeValue;
  insured_name: string;
  insured_phone: string;
  insured_plate?: string;
  // Opsiyonel; bos "" kabul edilir
  policy_number: string;
  insurance_name?: string;
  location_method?: 'manual' | 'customer_share';
  // customer_share akisinda konum musteriden gelecegi icin opsiyonel
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  estimated_km?: number;
  // Google rota metinleri ("12,4 km", "18 dakika"); cekici ve nakliye detayina yazilir (en fazla 50 karakter)
  route_distance?: string;
  route_duration?: string;
  // Alis konumunun ili (Google administrative_area_level_1). Gelmezse backend pickup_address'ten cikarir;
  // pazaryeri bildirimleri ve surucu is listeleri bu sehre gore suzulur.
  city?: string;
  // Musteriden konum istendiyse location-share/init token'i: token ve musterinin fotograflari talebe baglanir.
  // Bulunamazsa ya da baska talebe bagliysa 400 doner ve talep olusturulmaz.
  location_share_token?: string;
  service_details?: Record<string, unknown>;
  dispatch_mode?: DispatchMode;
}

export interface InsuranceRequestCreateResponse {
  request_id: number;
  status: 'pending' | 'pending_location';
  tracking_token: string;
  tracking_url: string;
  location_share_url?: string;
  ws_token?: string;
  dispatch_mode?: DispatchMode;
  created_at: string;
}

export interface InsuranceRequestSummary {
  request_id: number;
  status: RequestStatusValue;
  service_type: ServiceTypeValue;
  insured_name: string;
  policy_number: string;
  created_at: string;
}

export interface InsuranceRequestListResponse {
  count: number;
  page: number;
  page_size: number;
  results: InsuranceRequestSummary[];
}

export interface InsuranceRequestDetail {
  request_id: number;
  status: RequestStatusValue;
  service_type: ServiceTypeValue;
  insured_name: string;
  insured_phone: string;
  insured_plate: string | null;
  policy_number: string;
  insurance_name: string | null;
  tracking_url: string;
  driver: {
    name: string | null;
    phone: string | null;
  } | null;
  pricing: {
    estimated_price: string | null;
    base_price: string | null;
    platform_commission: string | null;
    insurance_commission: string | null;
    total_amount: string | null;
    total_with_vat: string | null;
    vat_rate: number | null;
    commission_rates: {
      total: number;
      agency: number;
      platform: number;
    } | null;
    currency: string;
  } | null;
  timeline: {
    created_at: string;
    accepted_at: string | null;
    completed_at: string | null;
  };
  dispatch_mode?: DispatchMode;
  // Aktif tekil atama (toplu davetler broadcast_invites'ta)
  agency_assignment?: AgencyAssignment | null;
  agency_assignment_mode?: AssignmentMode | null;
  broadcast_invites?: AgencyAssignment[];
  // En yeni basta
  assignment_history?: AgencyAssignment[];
}

export interface CancelRequestResponse {
  request_id: number;
  status: 'cancelled';
  message: string;
}

// --- Surucu Teklifleri ---

export interface DriverOfferInfo {
  id: number;
  driver_info: {
    id: number;
    name: string;
    phone: string;
    average_rating: number | null;
    total_ratings: number;
  };
  vehicle_info: {
    id: number;
    brand: string;
    model: string;
    plate_number: string;
    vehicle_type: string;
  } | null;
  estimated_price: number;
  // Surucunun teklif anindaki musteriye uzakligi (km); cekici ve yol yardimda dolu, bilinmiyorsa null
  distance_to_customer_km?: number | null;
  driver_earnings: number;
  platform_commission: number;
  pricing_breakdown: Record<string, unknown>;
  offer_details: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
}

export interface OffersResponse {
  request_id: number;
  request_status: string;
  offers_count: number;
  offers: DriverOfferInfo[];
}

export interface AcceptOfferResponse {
  message: string;
  request_id: number;
  status: string;
  driver_name: string;
  driver_phone: string;
}

// --- WebSocket Message Types ---

export interface WsConnectionEstablished {
  type: 'connection_established';
  request_id: number;
  tracking_token: string;
  current_status: { status: string; service_type: string; estimated_price: number };
  message: string;
}

export interface WsNewOffer {
  type: 'new_offer';
  request_id: number;
  offer: DriverOfferInfo;
  message: string;
}

export interface WsOfferWithdrawn {
  type: 'offer_withdrawn';
  request_id: number;
  offer_id: number;
  message: string;
}

export interface WsOfferAccepted {
  type: 'offer_accepted';
  request_id: number;
  status: string;
  driver_name: string;
  estimated_price: string;
  message: string;
}

export interface WsRequestCompleted {
  type: 'request_completed';
  request_id: number;
  status: string;
  message: string;
}

export interface WsRequestCancelled {
  type: 'request_cancelled';
  request_id: number;
  status: string;
  reason: string;
  message: string;
}

export interface WsPaymentCompleted {
  type: 'payment_completed';
  message: { request_id: number; status: string; message: string };
}

export type WsMessage =
  | WsConnectionEstablished
  | WsNewOffer
  | WsOfferWithdrawn
  | WsOfferAccepted
  | WsRequestCompleted
  | WsRequestCancelled
  | WsPaymentCompleted
  | AgencyAssignmentEvent;

// --- Fiyatlandirma ---

export interface PricingEstimatePayload {
  service_type: ServiceTypeValue;
  vehicle_type?: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  estimated_km?: number;
}

export interface PricingEstimateResponse {
  service_type: ServiceTypeValue;
  estimated_price: string | null;
  currency: 'TRY';
  message: string;
  breakdown: {
    base_price: string;
    commission: string;
    tax: string;
    total: string;
  } | null;
}

// --- iyzico Odeme Linki ---

export interface CreatePaymentLinkPayload {
  price: number;
  description?: string;
}

export interface CreatePaymentLinkResponse {
  success: boolean;
  message: string;
  payment_link: {
    id: number;
    url: string;
    amount: number;
    sms_sent_to: string;
  };
}

// --- Konum Paylasimi ---

// Talep olusturulmadan once alinan paylasim token'i (POST /location-share/init/)
export interface LocationShareInitPayload {
  insured_phone: string;
}

export interface LocationShareInitResponse {
  token: string;
  share_url: string;
  expires_at: string;
  ws_url: string;
}

export interface SendLocationSmsPayload {
  token: string;
}

export interface SendLocationSmsResponse {
  success: boolean;
  message: string;
}

export interface WsLocationReceived {
  type: 'location_received';
  latitude: string;
  longitude: string;
  address: string;
}

// --- Konum Paylasimi: Galeri & Durum ---

export interface LocationShareImage {
  id: number;
  url: string;
  order: number;
  uploaded_at: string;
}

export interface LocationShareState {
  location: { lat: number; lng: number; address: string } | null;
  images: LocationShareImage[];
  imageCount: number;
  maxImages: number;
  isSubmitted: boolean;
  isExpired: boolean;
}

// HTTP snapshot (GET /status/) - genisletilmis sozlesme
export interface LocationShareStatusResponse {
  location: { lat: number; lng: number; address: string } | null;
  images: LocationShareImage[];
  image_count: number;
  max_images: number;
  is_used: boolean;
  is_expired: boolean;
}

// --- WS event'leri (ayni soket: ws/location-share/{token}/) ---

export interface WsImageUploaded {
  type: 'image_uploaded';
  image_id: number;
  url: string;
  order: number;
}

export interface WsImageDeleted {
  type: 'image_deleted';
  image_id: number;
}

export interface WsImageModerated {
  type: 'image_moderated';
  image_id: number;
  reason: string;
}

export interface WsSubmissionCompleted {
  type: 'submission_completed';
}

export type WsLocationShareEvent =
  | WsLocationReceived
  | WsImageUploaded
  | WsImageDeleted
  | WsImageModerated
  | WsSubmissionCompleted;

// --- Fiyatlandirma Sorulari ---

export interface PricingQuestionOption {
  id: number;
  option_text: string;
  surcharge_amount: string;
  order: number;
}

export interface PricingQuestion {
  id: number;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'boolean';
  order: number;
  options: PricingQuestionOption[];
}

export interface PricingQuestionsResponse {
  count: number;
  questions: PricingQuestion[];
}

// --- Fatura ---

export interface InvoiceResponse {
  status: 'ready' | 'processing' | 'no_payment';
  pdf_url?: string;
  message?: string;
}

// --- Hakedisler ---

export interface HakedisListItem {
  request_id: number;
  service_type: ServiceTypeValue;
  insured_name: string;
  status: RequestStatusValue;
  completed_at: string;
  estimated_price: string;
  insurance_commission: string;
  currency: string;
}

export interface HakedisListResponse {
  count: number;
  page: number;
  page_size: number;
  results: HakedisListItem[];
  summary: {
    total_earnings: string;
    total_completed: number;
    this_month_earnings: string;
    this_month_completed: number;
    commission_rate: number;
  };
}

// ==========================================
// Surucu Havuzu ve Dogrudan Atama
// ==========================================

// marketplace: talep uygun tum suruculere yayinlanir. agency_direct: yalnizca atanan surucu gorur.
export type DispatchMode = 'marketplace' | 'agency_direct';

// Surucunun verebildigi hizmetler: talep tiplerine ek olarak transfer
export type DriverServiceType = ServiceTypeValue | 'transfer';

export const DriverServiceLabels: Record<DriverServiceType, string> = {
  towTruck: 'Çekici',
  crane: 'Vinç',
  roadAssistance: 'Yol Yardım',
  homeToHomeMoving: 'Evden Eve',
  cityToCity: 'Şehirler Arası',
  transfer: 'Transfer',
};

// live: 45 dk'dan yeni, last_known: 45 dk - 24 saat, business: is adresi
export type LocationSource = 'live' | 'last_known' | 'business';

// Surucu uygulamasinin gonderdigi son konum (app-ping); "son gorulme" icin
export interface AppLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
  trigger: 'app_open' | 'foreground' | 'online' | 'periodic';
}

export type AssignmentStatus = 'pending' | 'offered' | 'declined' | 'expired' | 'cancelled';
// single: tek surucuye sureli atama; broadcast: "Tum suruculere gonder" toplu daveti (suresiz)
export type AssignmentMode = 'single' | 'broadcast';

export const AssignmentStatusLabels: Record<AssignmentStatus, string> = {
  pending: 'Yanıt bekleniyor',
  offered: 'Teklif verdi',
  declined: 'Reddetti',
  expired: 'Süre doldu',
  cancelled: 'İptal edildi',
};

export const AssignmentCancelReasonLabels: Record<string, string> = {
  reassigned: 'Başka sürücü seçildi',
  agency_cancelled: 'Acente iptal etti',
  driver_removed: 'Sürücü listeden çıkarıldı',
  offer_withdrawn: 'Sürücü teklifini geri çekti',
  opened_to_marketplace: 'Pazaryerine açıldı',
  request_cancelled: 'Talep iptal edildi',
  admin_reverted: 'Yönetici geri aldı',
  timeout: 'Süre doldu',
  driver_declined: 'Sürücü reddetti',
  switched_to_broadcast: 'Tüm sürücülere gönderildi',
  other_selected: 'Başka teklif seçildi',
};

export interface AgencyDriverInfo {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: DriverServiceType[];
  is_online: boolean;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  source: LocationSource;
  // business kaynaginda null
  updated_at: string | null;
}

// Dokumandaki VehicleType; talepteki "vehicle_type" alanlariyla karismasin diye boyle adlandirildi
export type DriverVehicleType = 'towTruck' | 'crane' | 'roadAssistance' | 'moving' | 'transfer';

export const DriverVehicleTypeLabels: Record<DriverVehicleType, string> = {
  towTruck: 'Çekici',
  crane: 'Vinç',
  roadAssistance: 'Yol Yardım',
  moving: 'Nakliye',
  transfer: 'Transfer',
};

// Surucunun is almaya hazir olmasi icin eksik ya da onay bekleyen adim
export interface MissingStep {
  step: 'license' | 'company_info' | 'payment_method' | 'vehicle';
  status: 'missing' | 'pending' | 'rejected' | 'documents_missing';
  // Sadece step === 'vehicle' iken dolu
  vehicle_type: DriverVehicleType | null;
  // Turkce, dogrudan gosterilebilir
  message: string;
  rejection_reason: string | null;
}

export interface PoolDriver {
  membership_id: number;
  source: 'linked' | 'registered';
  // true: acente panelden kaydetti, belge ve bilgilerini duzenleyebilir
  managed: boolean;
  // Bossa surucu is almaya hazir
  missing_steps: MissingStep[];
  added_at: string;
  driver: AgencyDriverInfo;
  license_status: 'pending' | 'approved' | 'rejected' | null;
  // Bossa surucu atanamaz, haritada gorunmez
  eligible_services: DriverServiceType[];
  is_busy: boolean;
  location: DriverLocation | null;
  // Uygulama hic konum gondermediyse null; eski backend surumunde alan yok
  app_location?: AppLocation | null;
  business_address: string | null;
}

export interface PoolDriverListResponse {
  count: number;
  results: PoolDriver[];
}

export interface DriverMembershipResponse {
  message: string;
  membership_id: number;
  driver: AgencyDriverInfo;
}

export interface RegisterDriverPayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  tc_no?: string;
  user_type: DriverServiceType[];
  service_cities?: string[];
  business_address?: string;
  business_address_il?: string;
  business_address_ilce?: string;
  // 6 ondalikli metin: "40.991000"
  business_latitude?: string;
  business_longitude?: string;
}

export interface AvailableDriver {
  driver: AgencyDriverInfo;
  location: DriverLocation | null;
  app_location?: AppLocation | null;
  distance_km: number | null;
  vehicles: { id: number; brand: string; model: string; plate_number: string }[];
}

export interface AvailableDriversResponse {
  request_id: number;
  service_type: ServiceTypeValue;
  customer_location: { latitude: number; longitude: number };
  radius_km: number | null;
  // Mesafeye gore sirali; konumsuzlar en sonda
  drivers: AvailableDriver[];
}

export interface AgencyAssignment {
  id: number;
  request_id: number;
  status: AssignmentStatus;
  // Eski backend gondermez; yoksa single sayilir
  mode?: AssignmentMode;
  driver: AgencyDriverInfo;
  // Toplu davette null (suresiz)
  expires_at: string | null;
  responded_at: string | null;
  // Bos ya da AssignmentCancelReasonLabels anahtarlarindan biri
  cancel_reason: string;
  created_at: string;
}

export interface AssignDriverResponse {
  message: string;
  assignment: AgencyAssignment;
}

export interface AssignmentStateResponse {
  request_id: number;
  dispatch_mode: DispatchMode;
  // Sadece tekil atama
  active: AgencyAssignment | null;
  assignment_mode?: AssignmentMode | null;
  // Aktif toplu davetler (pending: teklif bekleniyor, offered: teklif verdi)
  broadcast?: AgencyAssignment[];
  history: AgencyAssignment[];
}

export interface BroadcastResponse {
  message: string;
  request_id: number;
  radius_km: number;
  // Bu cagride yeni davet edilenler; invites ise butun aktif davetler
  invited_count: number;
  invites: AgencyAssignment[];
}

export interface OpenToMarketplaceResponse {
  message: string;
  request_id: number;
  dispatch_mode: DispatchMode;
}

// Surucu Haritasindan "İş aç": Yeni Talep formuna router state ile gelir; talep olusunca is bu surucuye atanir
export interface NewRequestPresetDriver {
  id: number;
  name: string;
  // Surucunun atanabildigi hizmetler (eligible_services)
  services: DriverServiceType[];
}

// ws/agency/drivers/ kanali: havuzdaki surucunun yeni konumu (available-drivers satiriyla ayni bicim, distance_km yok)
export interface AgencyDriverLocationEvent {
  type: 'driver_location';
  driver: AgencyDriverInfo;
  location: DriverLocation | null;
  app_location: AppLocation | null;
}

// ws/requests/{tracking_token}/ kanalindaki atama olayi
export interface AgencyAssignmentEvent {
  type: 'agency_assignment';
  event: 'assignment_offered' | 'assignment_declined' | 'assignment_expired' | 'assignment_cancelled';
  request_id: number;
  assignment: AgencyAssignment;
  reason: string | null;
  // Sadece assignment_offered olayinda dolu
  offer_id: number | null;
  estimated_price: string | null;
}

// ==========================================
// Yonetilen Surucu: Belge ve Bilgiler (sadece managed === true)
// ==========================================

export type DocumentVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface DriverLicense {
  id: number;
  license_photo: string;
  tax_plate_photo: string;
  k_document_photo: string | null;
  verification_status: DocumentVerificationStatus;
  rejection_reason: string | null;
}

export interface DriverCompanyInfo {
  id: number;
  company_name: string;
  tax_number: string;
}

// IBAN asla tam donmez
export interface DriverPaymentMethod {
  account_holder_name: string;
  iban_masked: string;
  updated_at: string;
}

export interface DriverVehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  plate_number: string;
  verification_status: 'no_document' | DocumentVerificationStatus;
  verification_rejection_reason: string | null;
  // Tipe ozel alanlar (max_height, transfer_type, ...)
  [key: string]: unknown;
}

export interface DriverVehicleEntry {
  vehicle_type: DriverVehicleType;
  vehicle: DriverVehicle;
  // Dosya URL'leri + verification_status
  documents: Record<string, unknown> | null;
}

export interface DriverProfile {
  driver: AgencyDriverInfo & {
    service_cities: string[];
    business_address: string | null;
    business_address_il: string | null;
    business_address_ilce: string | null;
    business_latitude: number | null;
    business_longitude: number | null;
  };
  license: DriverLicense | null;
  company_info: DriverCompanyInfo | null;
  payment_method: DriverPaymentMethod | null;
  vehicles: DriverVehicleEntry[];
  missing_steps: MissingStep[];
}

// Telefon degistirilemez (giris kullanici adi)
export type UpdateDriverInfoPayload = Partial<Omit<RegisterDriverPayload, 'phone_number'>>;

// Profil disindaki her basarili yanitta guncel missing_steps doner
interface DriverStepsResponse {
  message: string;
  missing_steps: MissingStep[];
}

export interface DriverLicenseResponse extends DriverStepsResponse {
  license: DriverLicense;
}

export interface DriverCompanyInfoResponse extends DriverStepsResponse {
  company_info: DriverCompanyInfo;
}

export interface DriverPaymentMethodResponse extends DriverStepsResponse {
  payment_method: DriverPaymentMethod;
}

export interface DriverVehicleResponse extends DriverStepsResponse, DriverVehicleEntry {}
