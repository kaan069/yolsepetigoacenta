// Arac tipi
export const VehicleType = {
  Car: 'car',
  Motorcycle: 'motorcycle',
  SUV: 'suv',
  Commercial: 'commercial',
  Minibus: 'minibus',
  Truck: 'truck',
  Tractor: 'tractor',
} as const;

export type VehicleTypeValue = typeof VehicleType[keyof typeof VehicleType];

// Arac tipi etiketleri
export const VehicleTypeLabels: Record<VehicleTypeValue, string> = {
  [VehicleType.Car]: 'Otomobil',
  [VehicleType.Motorcycle]: 'Motosiklet',
  [VehicleType.SUV]: 'Arazi Araci / SUV',
  [VehicleType.Commercial]: 'Ticari Arac',
  [VehicleType.Minibus]: 'Minibus',
  [VehicleType.Truck]: 'Kamyon / TIR',
  [VehicleType.Tractor]: 'Traktor',
};

// Konum tipi
export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

// Cekici talep formu
export interface TowTruckRequestForm {
  // Musteri bilgileri
  customerName: string;
  customerPhone: string;

  // Arac bilgileri
  vehicleType: VehicleTypeValue | '';
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;

  // Konum bilgileri
  pickupAddress: string;
  pickupLatitude: string;
  pickupLongitude: string;
  dropoffAddress: string;
  dropoffLatitude: string;
  dropoffLongitude: string;

  // Ek bilgiler
  isVehicleOperational: boolean;
  hasKeys: boolean;
  additionalNotes: string;
}

// API Response
export interface CreateRequestResponse {
  id: number;
  message: string;
  status: string;
  tracking_token: string;
  tracking_url: string;
  websocket_url: string;
}

// API Error
export interface ApiError {
  error: string;
  errorCode?: string;
  details?: Record<string, string[]>;
}

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
  policy_number: string;
  insurance_name?: string;
  external_reference?: string;
  location_method?: 'manual' | 'customer_share';
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  estimated_km?: number;
  service_details?: Record<string, unknown>;
}

export interface InsuranceRequestCreateResponse {
  request_id: number;
  status: 'pending' | 'pending_location';
  tracking_token: string;
  tracking_url: string;
  location_share_url?: string;
  ws_token?: string;
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
  tracking_url: string;
  driver: {
    name: string | null;
    phone: string | null;
  } | null;
  pricing: {
    estimated_price: string | null;
    currency: string;
  } | null;
  timeline: {
    created_at: string;
    accepted_at: string | null;
    completed_at: string | null;
  };
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
  | WsPaymentCompleted;

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

export interface WsLocationReceived {
  type: 'location_received';
  latitude: string;
  longitude: string;
  address: string;
}
