import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Zap,
  Clock,
  Shield,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MapPin,
  User,
  Wallet,
  CircleDot,
} from 'lucide-react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { darkMapStyle } from '@/constants/mapStyle';
import Colors from '@/constants/colors';
import { GOOGLE_ANDROID_GEO_API_KEY, hasGoogleAndroidGeoApiKey } from '@/constants/env';
import { useApp } from '@/providers/AppProvider';
import { ADDIS_ABABA_CENTER, isNightTime, PRICING } from '@/mocks/data';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { activeOrder } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  const night = isNightTime();

  const toggleExpanded = useCallback(() => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(animatedHeight, {
      toValue,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
    setExpanded(!expanded);
  }, [expanded, animatedHeight]);

  const extraHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            customMapStyle={darkMapStyle}
            initialRegion={{
              ...ADDIS_ABABA_CENTER,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            showsUserLocation
            showsMyLocationButton={false}
          />
        ) : (
          <View style={styles.webMapFallback}>
            {hasGoogleAndroidGeoApiKey ? (
              <Image
                source={{
                  uri: `https://maps.googleapis.com/maps/api/staticmap?center=${ADDIS_ABABA_CENTER.latitude},${ADDIS_ABABA_CENTER.longitude}&zoom=13&size=1200x700&scale=2&maptype=roadmap&markers=color:0x3B82F6|${ADDIS_ABABA_CENTER.latitude},${ADDIS_ABABA_CENTER.longitude}&key=${GOOGLE_ANDROID_GEO_API_KEY}`,
                }}
                style={styles.webStaticMap}
                resizeMode="cover"
              />
            ) : (
              <>
                <View style={styles.webMapGrid}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <View key={i} style={styles.webMapLine} />
                  ))}
                </View>
                <View style={styles.webMapDot} />
                <Text style={styles.webMapText}>Addis Ababa</Text>
                <Text style={styles.webMapSubtext}>አዲስ አበባ</Text>
              </>
            )}
          </View>
        )}

        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.topBarButton}
            onPress={() => router.push('/profile' as any)}
            testID="profile-button"
          >
            <User size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.brandBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.brandText}>ChargeRescue</Text>
          </View>

          <TouchableOpacity style={styles.topBarButton} testID="wallet-button">
            <Wallet size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <TouchableOpacity
          style={styles.handleArea}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <View style={styles.handle} />
          {expanded ? (
            <ChevronDown size={20} color={Colors.textMuted} />
          ) : (
            <ChevronUp size={20} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {activeOrder ? (
            <TouchableOpacity
              style={styles.activeOrderCard}
              onPress={() => router.push(`/tracking/${activeOrder.id}` as any)}
              activeOpacity={0.8}
              testID="active-order-card"
            >
              <View style={styles.activeOrderDot} />
              <View style={styles.activeOrderInfo}>
                <Text style={styles.activeOrderStatus}>
                  {activeOrder.status === 'pending'
                    ? 'Pending'
                    : activeOrder.status === 'driver_assigned'
                    ? 'Driver Assigned'
                    : activeOrder.status === 'on_the_way'
                    ? 'On the Way'
                    : activeOrder.status === 'charging'
                    ? 'Charging in Progress'
                    : 'Order Active'}
                </Text>
                <Text style={styles.activeOrderAddress}>
                  {activeOrder.location.address}
                </Text>
              </View>
              <View style={styles.etaBadge}>
                <Clock size={14} color="#fff" />
                <Text style={styles.etaText}>{activeOrder.eta} min</Text>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => router.push('/booking' as any)}
              activeOpacity={0.85}
              testID="request-charge-button"
            >
              <View style={styles.requestIconWrap}>
                <Zap size={28} color="#fff" fill="#fff" />
              </View>
              <View style={styles.requestTextWrap}>
                <Text style={styles.requestTitle}>Request Emergency Charge</Text>
                <Text style={styles.requestSubtitle}>
                  Service vehicle dispatched to you
                </Text>
              </View>
              <ChevronRight size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Clock size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>5–20 min</Text>
                <Text style={styles.statLabel}>Avg. response</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(132,204,22,0.15)' }]}>
                <Zap size={16} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.statValue}>From {PRICING.baseFee} ETB</Text>
                <Text style={styles.statLabel}>Starting price</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <Shield size={16} color={Colors.success} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: Colors.success }]}>Online</Text>
                <Text style={styles.statLabel}>Service status</Text>
              </View>
            </View>
          </View>

          <Animated.View style={{ height: extraHeight, overflow: 'hidden' }}>
            <View style={styles.expandedContent}>
              <View style={styles.coverageRow}>
                <CircleDot size={16} color={Colors.primary} />
                <Text style={styles.coverageText}>
                  Addis Ababa coverage zone active
                </Text>
              </View>

              {night && (
                <View style={styles.nightBadge}>
                  <Text style={styles.nightText}>
                    Night surcharge: +{PRICING.nightSurcharge} ETB
                  </Text>
                </View>
              )}

              <View style={styles.quickStats}>
                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatValue}>3</Text>
                  <Text style={styles.quickStatLabel}>Connectors</Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatValue}>24/7</Text>
                  <Text style={styles.quickStatLabel}>Available</Text>
                </View>
                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatValue}>Fast</Text>
                  <Text style={styles.quickStatLabel}>DC Charging</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    flex: 1,
  },
  webMapFallback: {
    flex: 1,
    backgroundColor: '#0D1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  webMapLine: {
    height: 1,
    backgroundColor: Colors.primary,
    marginVertical: 18,
    opacity: 0.3,
  },
  webMapDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  webMapText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 28,
    fontWeight: '300' as const,
    marginTop: 12,
  },
  webMapSubtext: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 20,
    marginTop: 4,
  },
  webStaticMap: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 26, 43, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 26, 43, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusOnline,
  },
  brandText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  bottomSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    gap: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  sheetContent: {
    paddingHorizontal: 16,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    overflow: 'hidden',
  },
  requestIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestTextWrap: {
    flex: 1,
  },
  requestTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  requestSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
    flexShrink: 1,
  },
  activeOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  activeOrderDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  activeOrderInfo: {
    flex: 1,
  },
  activeOrderStatus: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  activeOrderAddress: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    flexShrink: 1,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  etaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700' as const,
    flexShrink: 1,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  expandedContent: {
    gap: 12,
    paddingTop: 4,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coverageText: {
    color: Colors.textSecondary,
    fontSize: 14,
    flexShrink: 1,
  },
  nightBadge: {
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
    overflow: 'hidden',
  },
  nightText: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 10,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  quickStatValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800' as const,
  },
  quickStatLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
