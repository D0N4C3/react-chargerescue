import { DriverInfo, PricingConfig } from '@/types';

export const ADDIS_ABABA_CENTER = {
  latitude: 9.0192,
  longitude: 38.7525,
};

export const DEFAULT_DRIVER: DriverInfo = {
  name: 'Abebe Kebede',
  phone: '+251911234567',
  plateNumber: 'AA 3-12345',
  rating: 4.8,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
};

export const PRICING: PricingConfig = {
  baseFee: 500,
  pricePerKWh: 15,
  nightSurcharge: 200,
  emergencyKWh: 5,
  standardKWh: 12,
};

export const CONNECTORS = [
  {
    type: 'GB/T' as const,
    description: 'Chinese standard - Most common in Ethiopia',
    color: '#3B82F6',
  },
  {
    type: 'CCS2' as const,
    description: 'European DC fast charging',
    color: '#3B82F6',
  },
  {
    type: 'Type 2' as const,
    description: 'European AC charging',
    color: '#22C55E',
  },
];

export const PACKAGES = [
  {
    type: 'emergency' as const,
    name: 'Emergency Top-Up',
    description: 'Quick boost to reach nearest station',
    range: '~20 km range',
    time: '~15 min',
  },
  {
    type: 'standard' as const,
    name: 'Standard Top-Up',
    description: 'Extended charge for longer trips',
    range: '~40 km range',
    time: '~35 min',
  },
];

export function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
}

export function calculatePrice(
  chargePackage: 'emergency' | 'standard',
  includeNight: boolean = isNightTime()
): {
  baseFee: number;
  energyCost: number;
  nightSurcharge: number;
  total: number;
  kWh: number;
  pricePerKWh: number;
} {
  const kWh = chargePackage === 'emergency' ? PRICING.emergencyKWh : PRICING.standardKWh;
  const energyCost = kWh * PRICING.pricePerKWh;
  const nightSurcharge = includeNight ? PRICING.nightSurcharge : 0;
  const total = PRICING.baseFee + energyCost + nightSurcharge;

  return {
    baseFee: PRICING.baseFee,
    energyCost,
    nightSurcharge,
    total,
    kWh,
    pricePerKWh: PRICING.pricePerKWh,
  };
}
