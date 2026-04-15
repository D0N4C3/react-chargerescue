import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Smartphone,
  Building2,
  Banknote,
  Shield,
  CheckCircle,
  Zap,
  Lock,
  CreditCard,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { PaymentMethod } from '@/types';

const PAYMENT_METHODS: {
  id: PaymentMethod;
  name: string;
  subtitle: string;
  icon: typeof Smartphone;
  color: string;
  bgColor: string;
}[] = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    subtitle: 'Ethio Telecom mobile money',
    icon: Smartphone,
    color: '#00A651',
    bgColor: 'rgba(0, 166, 81, 0.12)',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    subtitle: 'Commercial Bank of Ethiopia',
    icon: Building2,
    color: '#1E3A8A',
    bgColor: 'rgba(30, 58, 138, 0.12)',
  },
  {
    id: 'cash',
    name: 'Cash',
    subtitle: 'Pay driver upon arrival',
    icon: Banknote,
    color: Colors.warning,
    bgColor: Colors.warningBg,
  },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    orderId?: string;
    total?: string;
    baseFee?: string;
    energyCost?: string;
    nightSurcharge?: string;
    packageName?: string;
    connector?: string;
  }>();

  const { orders, updateOrderStatus } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('telebirr');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const total = params.total ? parseInt(params.total, 10) : 0;
  const baseFee = params.baseFee ? parseInt(params.baseFee, 10) : 0;
  const energyCost = params.energyCost ? parseInt(params.energyCost, 10) : 0;
  const nightSurcharge = params.nightSurcharge ? parseInt(params.nightSurcharge, 10) : 0;

  const handleSelectMethod = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePay = useCallback(() => {
    if (processing) return;
    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(checkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        if (params.orderId) {
          router.replace(`/tracking/${params.orderId}` as any);
        } else {
          router.replace('/(tabs)/(home)' as any);
        }
      }, 2000);
    }, 2500);
  }, [processing, scaleAnim, checkAnim, params.orderId]);

  if (success) {
    return (
      <View style={[styles.container, styles.successContainer, { paddingTop: insets.top }]}>
        <Animated.View
          style={[
            styles.successCircle,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <CheckCircle size={56} color="#fff" />
        </Animated.View>
        <Animated.View style={{ opacity: checkAnim }}>
          <Text style={styles.successTitle}>Payment Successful</Text>
          <Text style={styles.successSubtitle}>
            Your charger is being dispatched now
          </Text>
          <View style={styles.successAmountBadge}>
            <Text style={styles.successAmount}>{total.toLocaleString()} ETB</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="payment-back"
        >
          <ChevronLeft size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.secureBadge}>
            <Lock size={10} color={Colors.success} />
            <Text style={styles.secureText}>Secured</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.amountCard}>
          <View style={styles.amountGlow} />
          <CreditCard size={24} color={Colors.primary} />
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>{total.toLocaleString()} ETB</Text>
          {params.packageName && (
            <View style={styles.packageBadge}>
              <Zap size={12} color={Colors.accent} />
              <Text style={styles.packageBadgeText}>{params.packageName}</Text>
            </View>
          )}
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base call-out fee</Text>
            <Text style={styles.breakdownValue}>{baseFee.toLocaleString()} ETB</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Energy charge</Text>
            <Text style={styles.breakdownValue}>{energyCost.toLocaleString()} ETB</Text>
          </View>
          {nightSurcharge > 0 && (
            <>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: Colors.warning }]}>
                  Night surcharge
                </Text>
                <Text style={[styles.breakdownValue, { color: Colors.warning }]}>
                  +{nightSurcharge.toLocaleString()} ETB
                </Text>
              </View>
            </>
          )}
          <View style={styles.totalDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} ETB</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>

        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;
          const Icon = method.icon;
          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                isSelected && { borderColor: method.color },
              ]}
              onPress={() => handleSelectMethod(method.id)}
              activeOpacity={0.7}
              testID={`payment-method-${method.id}`}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.bgColor }]}>
                <Icon size={22} color={method.color} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodName, isSelected && { color: method.color }]}>
                  {method.name}
                </Text>
                <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
              </View>
              <View style={[styles.radio, isSelected && { borderColor: method.color }]}>
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: method.color }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {selectedMethod === 'cash' && (
          <View style={styles.cashNotice}>
            <Banknote size={16} color={Colors.warning} />
            <Text style={styles.cashNoticeText}>
              Cash payment will be collected by the driver upon arrival. 
              Please have the exact amount ready.
            </Text>
          </View>
        )}

        <View style={styles.trustRow}>
          <Shield size={14} color={Colors.textMuted} />
          <Text style={styles.trustText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonProcessing]}
          onPress={handlePay}
          disabled={processing}
          activeOpacity={0.85}
          testID="pay-button"
        >
          {processing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.payButtonText}>Processing...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {selectedMethod === 'cash' ? 'Confirm & Dispatch' : `Pay ${total.toLocaleString()} ETB`}
              </Text>
              <Zap size={18} color="#fff" fill="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  secureText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  amountGlow: {
    position: 'absolute',
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  amountLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 12,
  },
  amountValue: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '800' as const,
    marginTop: 4,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  packageBadgeText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  breakdownTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    flexShrink: 1,
    paddingRight: 12,
  },
  breakdownValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 6,
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  totalValue: {
    color: Colors.accent,
    fontSize: 20,
    fontWeight: '800' as const,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 14,
    overflow: 'hidden',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  methodSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    flexShrink: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cashNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    overflow: 'hidden',
  },
  cashNoticeText: {
    flex: 1,
    color: Colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  trustText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
  },
  payButtonProcessing: {
    backgroundColor: Colors.accentDark,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800' as const,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  successTitle: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800' as const,
    textAlign: 'center',
  },
  successSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  successAmountBadge: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successAmount: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '800' as const,
  },
});
