export type ConnectorType = 'GB/T' | 'CCS2' | 'Type 2';

export type ChargePackage = 'emergency' | 'standard';

export type OrderStatus =
  | 'pending'
  | 'driver_assigned'
  | 'on_the_way'
  | 'charging'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'telebirr' | 'cbe_birr' | 'cash';

export interface UserProfile {
  name: string;
  phone: string;
  vehicleModel: string;
  connectorType: ConnectorType;
}

export interface DriverInfo {
  name: string;
  phone: string;
  plateNumber: string;
  rating: number;
  avatar: string;
}

export interface PriceBreakdown {
  baseFee: number;
  energyCost: number;
  nightSurcharge: number;
  total: number;
  kWh: number;
  pricePerKWh: number;
}

export interface Order {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  connectorType: ConnectorType;
  chargePackage: ChargePackage;
  batteryLevel: number;
  status: OrderStatus;
  price: PriceBreakdown;
  paymentMethod: PaymentMethod;
  driver: DriverInfo;
  eta: number;
  rating?: number;
  feedback?: string;
  createdAt: string;
}

export interface BookingData {
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  batteryLevel: number;
  connectorType: ConnectorType;
  chargePackage: ChargePackage;
  paymentMethod: PaymentMethod;
}

export interface PricingConfig {
  baseFee: number;
  pricePerKWh: number;
  nightSurcharge: number;
  emergencyKWh: number;
  standardKWh: number;
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'payment' | 'refund';
  amount: number;
  description: string;
  date: string;
  method?: PaymentMethod;
}

export interface AppSettings {
  defaultPaymentMethod: PaymentMethod;
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    driverArrival: boolean;
    paymentReceipts: boolean;
  };
  mapStyle: 'default' | 'satellite' | 'terrain';
  autoDetectLocation: boolean;
  biometricLock: boolean;
  shareLocationHistory: boolean;
  theme: 'dark' | 'light' | 'system';
}

export interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isProfileComplete: boolean;
  authMethod?: 'phone' | 'google';
  phoneNumber?: string;
  googleEmail?: string;
}
