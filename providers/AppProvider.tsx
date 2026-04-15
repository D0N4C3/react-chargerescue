import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Order, UserProfile, BookingData, OrderStatus, AuthState, WalletTransaction, AppSettings } from '@/types';
import { DEFAULT_DRIVER, calculatePrice, isNightTime } from '@/mocks/data';

const ORDERS_KEY = 'chargerescue_orders';
const PROFILE_KEY = 'chargerescue_profile';
const AUTH_KEY = 'chargerescue_auth';
const WALLET_KEY = 'chargerescue_wallet';
const SETTINGS_KEY = 'chargerescue_settings';

const DEFAULT_SETTINGS: AppSettings = {
  defaultPaymentMethod: 'telebirr',
  notifications: {
    orderUpdates: true,
    promotions: false,
    driverArrival: true,
    paymentReceipts: true,
  },
  mapStyle: 'default',
  autoDetectLocation: true,
  biometricLock: false,
  shareLocationHistory: false,
  theme: 'dark',
};

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    isOnboarded: false,
    isProfileComplete: false,
  });
  const [authLoaded, setAuthLoaded] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      return stored ? (JSON.parse(stored) as AuthState) : null;
    },
  });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ORDERS_KEY);
      return stored ? (JSON.parse(stored) as Order[]) : [];
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(PROFILE_KEY);
      return stored ? (JSON.parse(stored) as UserProfile) : null;
    },
  });

  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(WALLET_KEY);
      return stored ? (JSON.parse(stored) as { balance: number; transactions: WalletTransaction[] }) : { balance: 0, transactions: [] };
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      return stored ? (JSON.parse(stored) as AppSettings) : DEFAULT_SETTINGS;
    },
  });

  useEffect(() => {
    if (authQuery.data !== undefined) {
      if (authQuery.data) {
        setAuth(authQuery.data);
      }
      setAuthLoaded(true);
      console.log('[AppProvider] Auth loaded:', authQuery.data);
    } else if (!authQuery.isLoading) {
      setAuthLoaded(true);
    }
  }, [authQuery.data, authQuery.isLoading]);

  useEffect(() => {
    if (ordersQuery.data) {
      setOrders(ordersQuery.data);
    }
  }, [ordersQuery.data]);

  useEffect(() => {
    if (profileQuery.data !== undefined) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (walletQuery.data) {
      setWalletBalance(walletQuery.data.balance);
      setWalletTransactions(walletQuery.data.transactions);
    }
  }, [walletQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const syncAuth = useMutation({
    mutationFn: async (updated: AuthState) => {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const syncOrders = useMutation({
    mutationFn: async (updated: Order[]) => {
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const syncProfile = useMutation({
    mutationFn: async (updated: UserProfile) => {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const syncWallet = useMutation({
    mutationFn: async (data: { balance: number; transactions: WalletTransaction[] }) => {
      await AsyncStorage.setItem(WALLET_KEY, JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const syncSettings = useMutation({
    mutationFn: async (updated: AppSettings) => {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const completeOnboarding = useCallback(() => {
    const updated = { ...auth, isOnboarded: true };
    setAuth(updated);
    syncAuth.mutate(updated);
    console.log('[AppProvider] Onboarding completed');
  }, [auth, syncAuth]);

  const signIn = useCallback(
    (method: 'phone' | 'google', identifier: string) => {
      const updated: AuthState = {
        ...auth,
        isAuthenticated: true,
        authMethod: method,
        phoneNumber: method === 'phone' ? identifier : auth.phoneNumber,
        googleEmail: method === 'google' ? identifier : auth.googleEmail,
      };
      setAuth(updated);
      syncAuth.mutate(updated);
      console.log('[AppProvider] Signed in via', method, identifier);
    },
    [auth, syncAuth]
  );

  const completeProfile = useCallback(() => {
    const updated = { ...auth, isProfileComplete: true };
    setAuth(updated);
    syncAuth.mutate(updated);
    console.log('[AppProvider] Profile completion marked');
  }, [auth, syncAuth]);

  const signOut = useCallback(async () => {
    const reset: AuthState = {
      isAuthenticated: false,
      isOnboarded: true,
      isProfileComplete: false,
    };
    setAuth(reset);
    setProfile(null);
    await AsyncStorage.removeItem(AUTH_KEY);
    await AsyncStorage.removeItem(PROFILE_KEY);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    console.log('[AppProvider] Signed out');
  }, [queryClient]);

  const createOrder = useCallback(
    (booking: BookingData): Order => {
      const price = calculatePrice(booking.chargePackage, isNightTime());
      const newOrder: Order = {
        id: Date.now().toString(),
        location: booking.location,
        connectorType: booking.connectorType,
        chargePackage: booking.chargePackage,
        batteryLevel: booking.batteryLevel,
        status: 'pending',
        price,
        paymentMethod: booking.paymentMethod,
        driver: DEFAULT_DRIVER,
        eta: Math.floor(Math.random() * 15) + 5,
        createdAt: new Date().toISOString(),
      };
      const updated = [newOrder, ...orders];
      setOrders(updated);
      syncOrders.mutate(updated);
      console.log('[AppProvider] Order created:', newOrder.id);
      return newOrder;
    },
    [orders, syncOrders]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      );
      setOrders(updated);
      syncOrders.mutate(updated);
      console.log('[AppProvider] Order status updated:', orderId, status);
    },
    [orders, syncOrders]
  );

  const rateOrder = useCallback(
    (orderId: string, rating: number, feedback?: string) => {
      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, rating, feedback } : o
      );
      setOrders(updated);
      syncOrders.mutate(updated);
      console.log('[AppProvider] Order rated:', orderId, rating);
    },
    [orders, syncOrders]
  );

  const updateProfile = useCallback(
    (updated: UserProfile) => {
      setProfile(updated);
      syncProfile.mutate(updated);
      console.log('[AppProvider] Profile updated:', updated.name);
    },
    [syncProfile]
  );

  const topUpWallet = useCallback(
    (amount: number, method: string) => {
      const newBalance = walletBalance + amount;
      const transaction: WalletTransaction = {
        id: Date.now().toString(),
        type: 'topup',
        amount,
        description: `Top up via ${method}`,
        date: new Date().toISOString(),
      };
      const updated = [transaction, ...walletTransactions];
      setWalletBalance(newBalance);
      setWalletTransactions(updated);
      syncWallet.mutate({ balance: newBalance, transactions: updated });
      console.log('[AppProvider] Wallet topped up:', amount, 'New balance:', newBalance);
    },
    [walletBalance, walletTransactions, syncWallet]
  );

  const deductFromWallet = useCallback(
    (amount: number, description: string) => {
      if (walletBalance < amount) return false;
      const newBalance = walletBalance - amount;
      const transaction: WalletTransaction = {
        id: Date.now().toString(),
        type: 'payment',
        amount: -amount,
        description,
        date: new Date().toISOString(),
      };
      const updated = [transaction, ...walletTransactions];
      setWalletBalance(newBalance);
      setWalletTransactions(updated);
      syncWallet.mutate({ balance: newBalance, transactions: updated });
      console.log('[AppProvider] Wallet deducted:', amount, 'New balance:', newBalance);
      return true;
    },
    [walletBalance, walletTransactions, syncWallet]
  );

  const updateSettings = useCallback(
    (updated: AppSettings) => {
      setSettings(updated);
      syncSettings.mutate(updated);
      console.log('[AppProvider] Settings updated');
    },
    [syncSettings]
  );

  const activeOrder = useMemo(
    () =>
      orders.find(
        (o) =>
          o.status !== 'completed' && o.status !== 'cancelled'
      ) ?? null,
    [orders]
  );

  return {
    orders,
    profile,
    activeOrder,
    auth,
    authLoaded,
    walletBalance,
    walletTransactions,
    settings,
    isLoading: ordersQuery.isLoading || profileQuery.isLoading,
    createOrder,
    updateOrderStatus,
    rateOrder,
    updateProfile,
    topUpWallet,
    deductFromWallet,
    updateSettings,
    completeOnboarding,
    signIn,
    completeProfile,
    signOut,
  };
});
