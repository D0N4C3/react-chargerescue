import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  MapPin,
  Plug,
  Zap,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Navigation,
  BatteryCharging,
  CircleDot,
  Moon,
} from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkMapStyle } from '@/constants/mapStyle';
import Colors from '@/constants/colors';
import StepIndicator from '@/components/StepIndicator';
import { useApp } from '@/providers/AppProvider';
import {
  ADDIS_ABABA_CENTER,
  CONNECTORS,
  PACKAGES,
  calculatePrice,
  isNightTime,
  PRICING,
} from '@/mocks/data';
import { ConnectorType, ChargePackage } from '@/types';

const STEPS = ['Location', 'Connector', 'Package', 'Summary'];

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const { createOrder } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState('Bole Road, Addis Ababa');
  const [batteryLevel, setBatteryLevel] = useState('15');
  const [selectedConnector, setSelectedConnector] = useState<ConnectorType>('GB/T');
  const [selectedPackage, setSelectedPackage] = useState<ChargePackage>('emergency');
  const [mapCoords, setMapCoords] = useState(ADDIS_ABABA_CENTER);

  const night = isNightTime();
  const price = useMemo(
    () => calculatePrice(selectedPackage, night),
    [selectedPackage, night]
  );

  const emergencyPrice = useMemo(() => calculatePrice('emergency', night), [night]);
  const standardPrice = useMemo(() => calculatePrice('standard', night), [night]);

  const canContinue = useCallback(() => {
    if (currentStep === 1) return address.length > 0 && batteryLevel.length > 0;
    if (currentStep === 2) return !!selectedConnector;
    if (currentStep === 3) return !!selectedPackage;
    return true;
  }, [currentStep, address, batteryLevel, selectedConnector, selectedPackage]);

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleConfirm = useCallback(() => {
    const order = createOrder({
      location: {
        ...mapCoords,
        address,
      },
      batteryLevel: parseInt(batteryLevel, 10) || 15,
      connectorType: selectedConnector,
      chargePackage: selectedPackage,
      paymentMethod: 'telebirr',
    });
    console.log('[Booking] Order confirmed, navigating to payment:', order.id);
    router.replace({
      pathname: '/payment',
      params: {
        orderId: order.id,
        total: String(price.total),
        baseFee: String(price.baseFee),
        energyCost: String(price.energyCost),
        nightSurcharge: String(price.nightSurcharge),
        packageName: selectedPackage === 'emergency' ? 'Emergency Top-Up' : 'Standard Top-Up',
        connector: selectedConnector,
      },
    } as any);
  }, [createOrder, mapCoords, address, batteryLevel, selectedConnector, selectedPackage, price]);

  const progressWidth = `${(currentStep / STEPS.length) * 100}%`;

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconWrap, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
          <MapPin size={24} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.stepTitle}>Confirm Location</Text>
          <Text style={styles.stepSubtitle}>Drag the pin to adjust your pickup point</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={styles.miniMap}
            provider={PROVIDER_GOOGLE}
            customMapStyle={darkMapStyle}
            initialRegion={{
              ...mapCoords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onRegionChangeComplete={(region) => {
              setMapCoords({
                latitude: region.latitude,
                longitude: region.longitude,
              });
            }}
          >
            <Marker coordinate={mapCoords} />
          </MapView>
        ) : (
          <View style={styles.webMiniMap}>
            <MapPin size={32} color={Colors.primary} />
            <Text style={styles.webMapLabel}>Map Preview</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Navigation size={18} color={Colors.primary} />
        <Text style={styles.infoCardText}>{address}</Text>
      </View>

      <View style={styles.batteryCard}>
        <BatteryCharging size={18} color={Colors.accent} />
        <Text style={styles.batteryLabel}>Battery Level</Text>
        <View style={styles.batteryInputWrap}>
          <TextInput
            style={styles.batteryInput}
            value={batteryLevel}
            onChangeText={setBatteryLevel}
            keyboardType="number-pad"
            maxLength={3}
            placeholderTextColor={Colors.textMuted}
            testID="battery-input"
          />
          <Text style={styles.batteryPercent}>%</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconWrap, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
          <Plug size={24} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.stepTitle}>Select Connector</Text>
          <Text style={styles.stepSubtitle}>Choose your vehicle's charging port</Text>
        </View>
      </View>

      {CONNECTORS.map((connector) => {
        const isSelected = selectedConnector === connector.type;
        return (
          <TouchableOpacity
            key={connector.type}
            style={[styles.connectorCard, isSelected && styles.connectorCardSelected]}
            onPress={() => setSelectedConnector(connector.type)}
            activeOpacity={0.7}
            testID={`connector-${connector.type}`}
          >
            <View
              style={[
                styles.connectorIcon,
                {
                  backgroundColor: isSelected
                    ? 'rgba(59,130,246,0.2)'
                    : Colors.surfaceLight,
                },
              ]}
            >
              <Plug size={22} color={isSelected ? Colors.primary : Colors.textMuted} />
            </View>
            <View style={styles.connectorInfo}>
              <Text
                style={[
                  styles.connectorName,
                  isSelected && { color: Colors.primary },
                ]}
              >
                {connector.type}
              </Text>
              <Text style={styles.connectorDesc}>{connector.description}</Text>
            </View>
            {isSelected && (
              <View style={styles.selectedDot}>
                <View style={styles.selectedDotInner} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconWrap, { backgroundColor: 'rgba(132,204,22,0.15)' }]}>
          <Zap size={24} color={Colors.accent} />
        </View>
        <View>
          <Text style={styles.stepTitle}>Charge Package</Text>
          <Text style={styles.stepSubtitle}>Select how much charge you need</Text>
        </View>
      </View>

      {PACKAGES.map((pkg) => {
        const isSelected = selectedPackage === pkg.type;
        const pkgPrice = pkg.type === 'emergency' ? emergencyPrice : standardPrice;
        const kWh = pkg.type === 'emergency' ? PRICING.emergencyKWh : PRICING.standardKWh;

        return (
          <TouchableOpacity
            key={pkg.type}
            style={[styles.packageCard, isSelected && styles.packageCardSelected]}
            onPress={() => setSelectedPackage(pkg.type)}
            activeOpacity={0.7}
            testID={`package-${pkg.type}`}
          >
            <View style={styles.packageHeader}>
              <View style={styles.packageHeaderLeft}>
                <Zap
                  size={18}
                  color={isSelected ? Colors.accent : Colors.textMuted}
                  fill={isSelected ? Colors.accent : 'transparent'}
                />
                <Text
                  style={[
                    styles.packageName,
                    isSelected && { color: Colors.accent },
                  ]}
                >
                  {pkg.name}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </View>

            <Text style={styles.packageDesc}>{pkg.description}</Text>

            <View style={styles.packageSpecs}>
              <View style={styles.specChip}>
                <CircleDot size={12} color={Colors.textSecondary} />
                <Text style={styles.specText}>{pkg.range}</Text>
              </View>
              <View style={styles.specChip}>
                <Zap size={12} color={Colors.textSecondary} />
                <Text style={styles.specText}>{kWh} kWh</Text>
              </View>
              <View style={styles.specChip}>
                <Clock size={12} color={Colors.textSecondary} />
                <Text style={styles.specText}>{pkg.time}</Text>
              </View>
            </View>

            <View style={styles.packagePriceRow}>
              <Text style={styles.packagePriceLabel}>Estimated total</Text>
              <Text style={styles.packagePrice}>{pkgPrice.total} ETB</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconWrap, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
          <CheckCircle size={24} color={Colors.success} />
        </View>
        <View>
          <Text style={styles.stepTitle}>Price Summary</Text>
          <Text style={styles.stepSubtitle}>Review charges before dispatch</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <MapPin size={16} color={Colors.textMuted} />
            <Text style={styles.summaryLabel}>Location</Text>
          </View>
          <Text style={styles.summaryValue}>{address}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <Plug size={16} color={Colors.textMuted} />
            <Text style={styles.summaryLabel}>Connector</Text>
          </View>
          <Text style={styles.summaryValue}>{selectedConnector}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <Zap size={16} color={Colors.textMuted} />
            <Text style={styles.summaryLabel}>Package</Text>
          </View>
          <Text style={styles.summaryValue}>
            {selectedPackage === 'emergency' ? 'Emergency Top-Up' : 'Standard Top-Up'}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryRowLeft}>
            <BatteryCharging size={16} color={Colors.textMuted} />
            <Text style={styles.summaryLabel}>Battery</Text>
          </View>
          <Text style={styles.summaryValue}>{batteryLevel}%</Text>
        </View>
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.priceCardTitle}>Price Breakdown</Text>

        <View style={styles.priceRow}>
          <View style={styles.priceRowLeft}>
            <CircleDot size={12} color={Colors.textMuted} />
            <Text style={styles.priceLabel}>Base call-out fee</Text>
          </View>
          <Text style={styles.priceValue}>{price.baseFee} ETB</Text>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceRowLeft}>
            <CircleDot size={12} color={Colors.textMuted} />
            <Text style={styles.priceLabel}>
              Energy cost ({price.kWh} kWh × {price.pricePerKWh} ETB)
            </Text>
          </View>
          <Text style={styles.priceValue}>{price.energyCost} ETB</Text>
        </View>

        {price.nightSurcharge > 0 && (
          <View style={styles.priceRow}>
            <View style={styles.priceRowLeft}>
              <Moon size={12} color={Colors.warning} />
              <Text style={[styles.priceLabel, { color: Colors.warning }]}>
                Night surcharge
              </Text>
            </View>
            <Text style={[styles.priceValue, { color: Colors.warning }]}>
              +{price.nightSurcharge} ETB
            </Text>
          </View>
        )}

        <View style={styles.totalDivider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{price.total} ETB</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          testID="close-booking"
        >
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Booking</Text>
          <Text style={styles.headerSubtitle}>
            {currentStep} of {STEPS.length}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: progressWidth as any }]} />
      </View>

      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {currentStep > 1 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            testID="back-button"
          >
            <ChevronLeft size={18} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="cancel-button"
          >
            <Text style={styles.backButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[styles.nextButton, !canContinue() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canContinue()}
            testID="continue-button"
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            testID="confirm-button"
          >
            <Zap size={18} color="#fff" fill="#fff" />
            <Text style={styles.confirmButtonText}>Pay & Dispatch</Text>
          </TouchableOpacity>
        )}
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.surfaceLight,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  stepIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  stepSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  mapCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniMap: {
    flex: 1,
  },
  webMiniMap: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  webMapLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  infoCardText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  batteryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  batteryLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  batteryInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  batteryInput: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '700' as const,
    minWidth: 36,
    textAlign: 'right',
    padding: 0,
  },
  batteryPercent: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  connectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectorCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59,130,246,0.05)',
  },
  connectorIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorInfo: {
    flex: 1,
  },
  connectorName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  connectorDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  selectedDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  packageCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packageCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59,130,246,0.05)',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  packageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageName: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  packageDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
  },
  packageSpecs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  specText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packagePriceLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  packagePrice: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
    maxWidth: '50%',
    textAlign: 'right' as const,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceCardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  priceLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  priceValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  totalValue: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '800' as const,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
