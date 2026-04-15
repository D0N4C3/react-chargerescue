import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Smartphone,
  Building2,
  Banknote,
  X,
  CheckCircle,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { WalletTransaction } from '@/types';

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const TOP_UP_METHODS = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    icon: Smartphone,
    color: '#00A651',
    bgColor: 'rgba(0, 166, 81, 0.12)',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    icon: Building2,
    color: '#1E3A8A',
    bgColor: 'rgba(30, 58, 138, 0.12)',
  },
  {
    id: 'cash',
    name: 'Cash Deposit',
    icon: Banknote,
    color: Colors.warning,
    bgColor: Colors.warningBg,
  },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTransactionIcon(type: WalletTransaction['type']) {
  switch (type) {
    case 'topup':
      return { icon: ArrowDownLeft, color: Colors.success, bg: Colors.successBg };
    case 'payment':
      return { icon: ArrowUpRight, color: Colors.danger, bg: 'rgba(239, 68, 68, 0.12)' };
    case 'refund':
      return { icon: RotateCcw, color: Colors.primary, bg: 'rgba(59, 130, 246, 0.12)' };
  }
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { walletBalance, walletTransactions, topUpWallet } = useApp();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('telebirr');
  const [processing, setProcessing] = useState(false);

  const balanceAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(balanceAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleQuickAmount = useCallback((amount: number) => {
    setTopUpAmount(amount.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleTopUp = useCallback(() => {
    const amount = parseInt(topUpAmount, 10);
    if (!amount || amount < 10) {
      Alert.alert('Invalid Amount', 'Please enter at least 10 ETB.');
      return;
    }
    if (amount > 50000) {
      Alert.alert('Limit Exceeded', 'Maximum top-up is 50,000 ETB.');
      return;
    }

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      const method = TOP_UP_METHODS.find((m) => m.id === selectedMethod);
      topUpWallet(amount, method?.name ?? 'Unknown');
      setProcessing(false);
      setShowTopUp(false);
      setTopUpAmount('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Top Up Successful', `${amount.toLocaleString()} ETB has been added to your wallet.`);
    }, 1500);
  }, [topUpAmount, selectedMethod, topUpWallet]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={styles.headerBadge}>
          <Zap size={12} color={Colors.accent} />
          <Text style={styles.headerBadgeText}>ChargeRescue</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <Animated.View
          style={[
            styles.balanceCard,
            {
              opacity: balanceAnim,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <View style={styles.balanceGlow} />
          <View style={styles.balanceTop}>
            <View style={styles.walletIconWrap}>
              <Wallet size={20} color={Colors.primary} />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {walletBalance.toLocaleString()}
            <Text style={styles.balanceCurrency}> ETB</Text>
          </Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={styles.topUpBtn}
              onPress={() => setShowTopUp(true)}
              activeOpacity={0.8}
              testID="top-up-button"
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.topUpBtnText}>Top Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceFooter}>
            <TrendingUp size={12} color={Colors.accent} />
            <Text style={styles.balanceFooterText}>
              {walletTransactions.filter((t) => t.type === 'topup').length} top-ups this month
            </Text>
          </View>
        </Animated.View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              setTopUpAmount('500');
              setShowTopUp(true);
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <Zap size={18} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Quick 500</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              setTopUpAmount('1000');
              setShowTopUp(true);
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.successBg }]}>
              <Plus size={18} color={Colors.success} />
            </View>
            <Text style={styles.quickActionLabel}>Quick 1,000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => {
              setTopUpAmount('2500');
              setShowTopUp(true);
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(132, 204, 22, 0.12)' }]}>
              <TrendingUp size={18} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionLabel}>Quick 2,500</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.transactionCount}>
              <Text style={styles.transactionCountText}>{walletTransactions.length}</Text>
            </View>
          </View>

          {walletTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Clock size={28} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Top up your wallet to get started with fast payments
              </Text>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {walletTransactions.map((tx, idx) => {
                const txStyle = getTransactionIcon(tx.type);
                const Icon = txStyle.icon;
                return (
                  <View key={tx.id}>
                    {idx > 0 && <View style={styles.txDivider} />}
                    <View style={styles.txRow}>
                      <View style={[styles.txIcon, { backgroundColor: txStyle.bg }]}>
                        <Icon size={16} color={txStyle.color} />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txDescription}>{tx.description}</Text>
                        <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                      </View>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: tx.amount >= 0 ? Colors.success : Colors.danger },
                        ]}
                      >
                        {tx.amount >= 0 ? '+' : ''}{Math.abs(tx.amount).toLocaleString()} ETB
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showTopUp}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTopUp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Wallet</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowTopUp(false)}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Amount (ETB)</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.amountPrefix}>ETB</Text>
                <TextInput
                  style={styles.amountInput}
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  testID="topup-amount-input"
                />
              </View>

              <View style={styles.quickAmounts}>
                {QUICK_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={[
                      styles.quickAmountChip,
                      topUpAmount === amt.toString() && styles.quickAmountChipActive,
                    ]}
                    onPress={() => handleQuickAmount(amt)}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        topUpAmount === amt.toString() && styles.quickAmountTextActive,
                      ]}
                    >
                      {amt.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Payment Method</Text>
              {TOP_UP_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                const Icon = method.icon;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.methodRow,
                      isSelected && { borderColor: method.color },
                    ]}
                    onPress={() => {
                      setSelectedMethod(method.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.methodIconWrap, { backgroundColor: method.bgColor }]}>
                      <Icon size={20} color={method.color} />
                    </View>
                    <Text style={[styles.methodName, isSelected && { color: method.color }]}>
                      {method.name}
                    </Text>
                    <View style={[styles.radio, isSelected && { borderColor: method.color }]}>
                      {isSelected && (
                        <View style={[styles.radioInner, { backgroundColor: method.color }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  processing && styles.confirmBtnProcessing,
                  (!topUpAmount || parseInt(topUpAmount, 10) < 10) && styles.confirmBtnDisabled,
                ]}
                onPress={handleTopUp}
                disabled={processing || !topUpAmount || parseInt(topUpAmount, 10) < 10}
                activeOpacity={0.85}
                testID="confirm-topup"
              >
                {processing ? (
                  <Text style={styles.confirmBtnText}>Processing...</Text>
                ) : (
                  <>
                    <CheckCircle size={18} color="#fff" />
                    <Text style={styles.confirmBtnText}>
                      Add {topUpAmount ? parseInt(topUpAmount, 10).toLocaleString() : '0'} ETB
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800' as const,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  headerBadgeText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  balanceGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  balanceAmount: {
    color: Colors.textPrimary,
    fontSize: 42,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  balanceCurrency: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  topUpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  topUpBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  balanceFooterText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  transactionCount: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  transactionCountText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  transactionList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  txDate: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800' as const,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 10,
    marginTop: 4,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  amountPrefix: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '700' as const,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800' as const,
    paddingVertical: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickAmountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: Colors.primary,
  },
  quickAmountText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  quickAmountTextActive: {
    color: Colors.primary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600' as const,
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
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  confirmBtnProcessing: {
    backgroundColor: Colors.accentDark,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800' as const,
  },
});
