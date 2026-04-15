import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  Zap,
  MapPin,
  ChevronRight,
  CheckCircle,
  XCircle,
  Truck,
  BatteryCharging,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { Order, OrderStatus } from '@/types';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: 'Pending', color: Colors.warning, bg: Colors.warningBg },
  driver_assigned: {
    label: 'Driver Assigned',
    color: Colors.orange,
    bg: Colors.orangeBg,
  },
  on_the_way: {
    label: 'On the Way',
    color: Colors.primary,
    bg: 'rgba(59,130,246,0.15)',
  },
  charging: {
    label: 'Charging',
    color: Colors.accent,
    bg: 'rgba(132,204,22,0.15)',
  },
  completed: {
    label: 'Completed',
    color: Colors.success,
    bg: Colors.successBg,
  },
  cancelled: {
    label: 'Cancelled',
    color: Colors.danger,
    bg: 'rgba(239,68,68,0.15)',
  },
};

function OrderCard({ order }: { order: Order }) {
  const config = STATUS_CONFIG[order.status];
  const date = new Date(order.createdAt);
  const formattedDate = `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} · ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/tracking/${order.id}` as any)}
      activeOpacity={0.7}
      testID={`order-${order.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <Text style={styles.dateText} numberOfLines={1}>
          {formattedDate}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={Colors.primary} />
          <Text style={styles.detailText} numberOfLines={1}>
            {order.location.address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Zap size={14} color={Colors.accent} />
          <Text style={styles.detailText} numberOfLines={1}>
            {order.chargePackage === 'emergency'
              ? 'Emergency Top-Up'
              : 'Standard Top-Up'}{' '}
            · {order.connectorType}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <BatteryCharging size={14} color={Colors.textMuted} />
          <Text style={styles.detailText}>Battery: {order.batteryLevel}%</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{order.price.total} ETB</Text>
        <ChevronRight size={18} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { orders } = useApp();

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [orders]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} total order{orders.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Truck size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Your charging requests will appear here
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/booking' as any)}
          >
            <Zap size={18} color="#fff" fill="#fff" />
            <Text style={styles.emptyButtonText}>Request First Charge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800' as const,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
    flexShrink: 1,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginLeft: 8,
    flexShrink: 1,
    textAlign: 'right',
  },
  cardBody: {
    gap: 8,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceText: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
