import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Clock,
  Truck,
  BatteryCharging,
  CheckCircle,
  Phone,
  MapPin,
  Zap,
  Star,
  Send,
  XCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { OrderStatus } from '@/types';

const STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  icon: typeof Clock;
  activeColor: string;
}[] = [
  { key: 'pending', label: 'Pending', icon: Clock, activeColor: Colors.warning },
  { key: 'driver_assigned', label: 'Driver Assigned', icon: Truck, activeColor: Colors.orange },
  { key: 'on_the_way', label: 'On the Way', icon: Truck, activeColor: Colors.primary },
  { key: 'charging', label: 'Charging in Progress', icon: BatteryCharging, activeColor: Colors.accent },
  { key: 'completed', label: 'Completed', icon: CheckCircle, activeColor: Colors.success },
];

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'driver_assigned',
  'on_the_way',
  'charging',
  'completed',
];

function getStatusIndex(status: OrderStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, updateOrderStatus, rateOrder } = useApp();
  const order = orders.find((o) => o.id === id);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!order || order.status === 'completed' || order.status === 'cancelled') return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [order?.status, pulseAnim]);

  useEffect(() => {
    if (!order || order.status === 'completed' || order.status === 'cancelled') return;

    const currentIdx = getStatusIndex(order.status);
    if (currentIdx < STATUS_ORDER.length - 1) {
      const timer = setTimeout(() => {
        const nextStatus = STATUS_ORDER[currentIdx + 1];
        updateOrderStatus(order.id, nextStatus);
        console.log('[Tracking] Auto-advancing to:', nextStatus);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, order?.id, updateOrderStatus]);

  const handleCall = useCallback(() => {
    if (order?.driver?.phone) {
      const url = `tel:${order.driver.phone}`;
      if (Platform.OS === 'web') {
        Alert.alert('Call Driver', `Phone: ${order.driver.phone}`);
      } else {
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'Unable to make call');
        });
      }
    }
  }, [order?.driver?.phone]);

  const handleCancel = useCallback(() => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          if (order) {
            updateOrderStatus(order.id, 'cancelled');
            router.back();
          }
        },
      },
    ]);
  }, [order, updateOrderStatus]);

  const handleSubmitRating = useCallback(() => {
    if (rating === 0) {
      Alert.alert('Rate', 'Please select a star rating');
      return;
    }
    if (order) {
      rateOrder(order.id, rating, feedback.trim() || undefined);
      Alert.alert('Thank you!', 'Your rating has been submitted.');
    }
  }, [order, rating, feedback, rateOrder]);

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Order not found</Text>
        </View>
      </View>
    );
  }

  const currentStatusIdx = getStatusIndex(order.status);
  const currentStep = STATUS_STEPS[currentStatusIdx];
  const isActive = order.status !== 'completed' && order.status !== 'cancelled';
  const isCompleted = order.status === 'completed';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="back-tracking"
        >
          <ArrowLeft size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        {isActive && (
          <View style={styles.statusHero}>
            <Animated.View
              style={[
                styles.statusCircleOuter,
                { borderColor: currentStep.activeColor, transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View
                style={[
                  styles.statusCircleInner,
                  { backgroundColor: `${currentStep.activeColor}20` },
                ]}
              >
                <currentStep.icon size={36} color={currentStep.activeColor} />
              </View>
            </Animated.View>
            <Text style={[styles.statusHeroLabel, { color: currentStep.activeColor }]}>
              {currentStep.label}
            </Text>
            <View style={styles.etaPill}>
              <Clock size={14} color={Colors.textSecondary} />
              <Text style={styles.etaPillText}>ETA: {order.eta} min</Text>
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={styles.statusHero}>
            <View
              style={[
                styles.statusCircleOuter,
                { borderColor: Colors.success },
              ]}
            >
              <View
                style={[
                  styles.statusCircleInner,
                  { backgroundColor: `${Colors.success}20` },
                ]}
              >
                <CheckCircle size={36} color={Colors.success} />
              </View>
            </View>
            <Text style={[styles.statusHeroLabel, { color: Colors.success }]}>
              Completed
            </Text>
          </View>
        )}

        <View style={styles.timeline}>
          {STATUS_STEPS.map((step, index) => {
            const isReached = index <= currentStatusIdx;
            const isCurrent = index === currentStatusIdx;
            const isLast = index === STATUS_STEPS.length - 1;
            const StepIcon = step.icon;

            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      isReached && { backgroundColor: step.activeColor },
                    ]}
                  >
                    <StepIcon
                      size={14}
                      color={isReached ? '#fff' : Colors.textMuted}
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        isReached &&
                          index < currentStatusIdx && {
                            backgroundColor: step.activeColor,
                          },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    isReached && styles.timelineLabelActive,
                    isCurrent && { fontWeight: '700' as const },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.driverCard}>
          <Text style={styles.driverCardLabel}>YOUR DRIVER</Text>
          <View style={styles.driverRow}>
            <Image
              source={{ uri: order.driver.avatar }}
              style={styles.driverAvatar}
              contentFit="cover"
            />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{order.driver.name}</Text>
              <View style={styles.driverRatingRow}>
                <Star size={14} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.driverRating}>{order.driver.rating}</Text>
              </View>
              <Text style={styles.driverPlate}>{order.driver.plateNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              testID="call-driver"
            >
              <Phone size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{order.location.address}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Zap size={16} color={Colors.accent} />
            <Text style={styles.detailText}>
              {order.chargePackage === 'emergency'
                ? 'Emergency Top-Up'
                : 'Standard Top-Up'}{' '}
              · {order.connectorType}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <BatteryCharging size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>Battery: {order.batteryLevel}%</Text>
          </View>
          <View style={styles.detailDivider} />
          <Text style={styles.priceTotal}>{order.price.total} ETB</Text>
        </View>

        {isCompleted && !order.rating && (
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Rate your experience</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setRating(s)}
                  testID={`star-${s}`}
                >
                  <Star
                    size={36}
                    color={s <= rating ? Colors.warning : Colors.textMuted}
                    fill={s <= rating ? Colors.warning : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.feedbackInput}
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Optional feedback..."
              placeholderTextColor={Colors.textMuted}
              multiline
              testID="feedback-input"
            />
            <TouchableOpacity
              style={[
                styles.submitRatingBtn,
                rating === 0 && styles.submitRatingBtnDisabled,
              ]}
              onPress={handleSubmitRating}
              testID="submit-rating"
            >
              <Text style={styles.submitRatingText}>Submit Rating</Text>
              <Send size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {order.rating && (
          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Your Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={28}
                  color={s <= (order.rating ?? 0) ? Colors.warning : Colors.textMuted}
                  fill={s <= (order.rating ?? 0) ? Colors.warning : 'transparent'}
                />
              ))}
            </View>
            {order.feedback && (
              <Text style={styles.feedbackDisplay}>{order.feedback}</Text>
            )}
          </View>
        )}

        {isActive && order.status !== 'charging' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            testID="cancel-order"
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
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
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statusHero: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statusCircleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusHeroLabel: {
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  etaPillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  timeline: {
    paddingLeft: 8,
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: Colors.surfaceLight,
  },
  timelineLabel: {
    color: Colors.textMuted,
    fontSize: 15,
    marginLeft: 12,
    paddingTop: 6,
  },
  timelineLabelActive: {
    color: Colors.textPrimary,
  },
  driverCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  driverCardLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 14,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  driverRating: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  driverPlate: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  priceTotal: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '800' as const,
    paddingTop: 12,
  },
  ratingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  ratingTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  feedbackInput: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitRatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
  },
  submitRatingBtnDisabled: {
    opacity: 0.5,
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  feedbackDisplay: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 10,
  },
  cancelBtnText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
