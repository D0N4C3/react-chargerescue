import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CreditCard,
  Bell,
  MapPin,
  Shield,
  Palette,
  Smartphone,
  Building2,
  Banknote,
  ChevronRight,
  Map,
  Crosshair,
  Fingerprint,
  Eye,
  Moon,
  Sun,
  Monitor,
  Check,
  Receipt,
  Megaphone,
  Truck,
  BellRing,
  Globe,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { PaymentMethod, AppSettings } from '@/types';

type SettingsSection = 'payment' | 'notifications' | 'location' | 'security' | 'appearance' | null;

const PAYMENT_OPTIONS: {
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

const MAP_STYLES: { id: AppSettings['mapStyle']; label: string; desc: string }[] = [
  { id: 'default', label: 'Default', desc: 'Standard map view' },
  { id: 'satellite', label: 'Satellite', desc: 'Aerial imagery' },
  { id: 'terrain', label: 'Terrain', desc: 'Elevation details' },
];

const THEME_OPTIONS: { id: AppSettings['theme']; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useApp();
  const [expandedSection, setExpandedSection] = useState<SettingsSection>(null);

  const toggleSection = useCallback((section: SettingsSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleUpdateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      updateSettings(updated);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [settings, updateSettings]
  );

  const handleToggleNotification = useCallback(
    (key: keyof AppSettings['notifications']) => {
      const updated = {
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: !settings.notifications[key],
        },
      };
      updateSettings(updated);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [settings, updateSettings]
  );

  const renderSectionHeader = (
    section: SettingsSection,
    icon: typeof CreditCard,
    title: string,
    subtitle: string,
    color: string,
    bgColor: string
  ) => {
    const Icon = icon;
    const isExpanded = expandedSection === section;
    return (
      <TouchableOpacity
        style={[styles.sectionHeader, isExpanded && styles.sectionHeaderExpanded]}
        onPress={() => toggleSection(section)}
        activeOpacity={0.7}
        testID={`settings-${section}`}
      >
        <View style={[styles.sectionIcon, { backgroundColor: bgColor }]}>
          <Icon size={18} color={color} />
        </View>
        <View style={styles.sectionInfo}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight
          size={18}
          color={Colors.textMuted}
          style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="settings-back"
        >
          <ChevronLeft size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        <View style={styles.card}>
          {renderSectionHeader(
            'payment',
            CreditCard,
            'Payment Settings',
            'Default method & preferences',
            Colors.accent,
            'rgba(132, 204, 22, 0.12)'
          )}
          {expandedSection === 'payment' && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyLabel}>Default Payment Method</Text>
              {PAYMENT_OPTIONS.map((method) => {
                const isSelected = settings.defaultPaymentMethod === method.id;
                const Icon = method.icon;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.optionRow, isSelected && { borderColor: method.color }]}
                    onPress={() => handleUpdateSettings({ defaultPaymentMethod: method.id })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: method.bgColor }]}>
                      <Icon size={18} color={method.color} />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionName}>{method.name}</Text>
                      <Text style={styles.optionDesc}>{method.subtitle}</Text>
                    </View>
                    {isSelected && <Check size={18} color={method.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          {renderSectionHeader(
            'notifications',
            Bell,
            'Notifications',
            'Alerts & push preferences',
            Colors.primary,
            'rgba(59, 130, 246, 0.12)'
          )}
          {expandedSection === 'notifications' && (
            <View style={styles.sectionBody}>
              {[
                {
                  key: 'orderUpdates' as const,
                  label: 'Order Updates',
                  desc: 'Status changes for your bookings',
                  icon: Receipt,
                  color: Colors.primary,
                },
                {
                  key: 'promotions' as const,
                  label: 'Promotions',
                  desc: 'Deals, discounts & offers',
                  icon: Megaphone,
                  color: Colors.orange,
                },
                {
                  key: 'driverArrival' as const,
                  label: 'Driver Arrival',
                  desc: 'Alert when driver is near',
                  icon: Truck,
                  color: Colors.success,
                },
                {
                  key: 'paymentReceipts' as const,
                  label: 'Payment Receipts',
                  desc: 'Confirmation for payments',
                  icon: BellRing,
                  color: Colors.accent,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <View key={item.key}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.toggleRow}>
                      <View style={[styles.toggleIcon, { backgroundColor: `${item.color}15` }]}>
                        <Icon size={16} color={item.color} />
                      </View>
                      <View style={styles.toggleInfo}>
                        <Text style={styles.toggleLabel}>{item.label}</Text>
                        <Text style={styles.toggleDesc}>{item.desc}</Text>
                      </View>
                      <Switch
                        value={settings.notifications[item.key]}
                        onValueChange={() => handleToggleNotification(item.key)}
                        trackColor={{ false: Colors.surfaceLight, true: `${item.color}40` }}
                        thumbColor={settings.notifications[item.key] ? item.color : Colors.textMuted}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          {renderSectionHeader(
            'location',
            MapPin,
            'Location & Map',
            'GPS, map style & preferences',
            Colors.orange,
            Colors.orangeBg
          )}
          {expandedSection === 'location' && (
            <View style={styles.sectionBody}>
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Crosshair size={16} color={Colors.primary} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Auto-Detect Location</Text>
                  <Text style={styles.toggleDesc}>Use GPS for current position</Text>
                </View>
                <Switch
                  value={settings.autoDetectLocation}
                  onValueChange={(val) => handleUpdateSettings({ autoDetectLocation: val })}
                  trackColor={{ false: Colors.surfaceLight, true: 'rgba(59, 130, 246, 0.4)' }}
                  thumbColor={settings.autoDetectLocation ? Colors.primary : Colors.textMuted}
                />
              </View>

              <View style={styles.divider} />
              <Text style={styles.bodyLabel}>Map Style</Text>
              <View style={styles.mapStyleGrid}>
                {MAP_STYLES.map((ms) => {
                  const isActive = settings.mapStyle === ms.id;
                  return (
                    <TouchableOpacity
                      key={ms.id}
                      style={[styles.mapStyleCard, isActive && styles.mapStyleCardActive]}
                      onPress={() => handleUpdateSettings({ mapStyle: ms.id })}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.mapStyleIconWrap,
                          isActive && styles.mapStyleIconWrapActive,
                        ]}
                      >
                        <Map size={20} color={isActive ? Colors.primary : Colors.textMuted} />
                      </View>
                      <Text
                        style={[styles.mapStyleLabel, isActive && styles.mapStyleLabelActive]}
                      >
                        {ms.label}
                      </Text>
                      <Text style={styles.mapStyleDesc}>{ms.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {renderSectionHeader(
            'security',
            Shield,
            'Security & Privacy',
            'Biometrics, data & permissions',
            Colors.success,
            Colors.successBg
          )}
          {expandedSection === 'security' && (
            <View style={styles.sectionBody}>
              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: Colors.successBg }]}>
                  <Fingerprint size={16} color={Colors.success} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Biometric Lock</Text>
                  <Text style={styles.toggleDesc}>Require fingerprint or Face ID</Text>
                </View>
                <Switch
                  value={settings.biometricLock}
                  onValueChange={(val) => {
                    handleUpdateSettings({ biometricLock: val });
                    if (val) {
                      Alert.alert(
                        'Biometric Lock Enabled',
                        'You will need to authenticate to open the app.'
                      );
                    }
                  }}
                  trackColor={{ false: Colors.surfaceLight, true: 'rgba(34, 197, 94, 0.4)' }}
                  thumbColor={settings.biometricLock ? Colors.success : Colors.textMuted}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={[styles.toggleIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Eye size={16} color={Colors.primary} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Share Location History</Text>
                  <Text style={styles.toggleDesc}>Allow app to save trip history</Text>
                </View>
                <Switch
                  value={settings.shareLocationHistory}
                  onValueChange={(val) => handleUpdateSettings({ shareLocationHistory: val })}
                  trackColor={{ false: Colors.surfaceLight, true: 'rgba(59, 130, 246, 0.4)' }}
                  thumbColor={settings.shareLocationHistory ? Colors.primary : Colors.textMuted}
                />
              </View>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() =>
                  Alert.alert('Privacy Policy', 'This will open the privacy policy page.')
                }
              >
                <View style={[styles.toggleIcon, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                  <Globe size={16} color={Colors.orange} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Privacy Policy</Text>
                  <Text style={styles.toggleDesc}>Review our data practices</Text>
                </View>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() =>
                  Alert.alert(
                    'Change Password',
                    'A verification code will be sent to your phone.'
                  )
                }
              >
                <View style={[styles.toggleIcon, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                  <Lock size={16} color={Colors.warning} />
                </View>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Change PIN / Password</Text>
                  <Text style={styles.toggleDesc}>Update your security credentials</Text>
                </View>
                <ChevronRight size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {renderSectionHeader(
            'appearance',
            Palette,
            'Appearance',
            'Theme & display settings',
            '#A855F7',
            'rgba(168, 85, 247, 0.12)'
          )}
          {expandedSection === 'appearance' && (
            <View style={styles.sectionBody}>
              <Text style={styles.bodyLabel}>Theme</Text>
              <View style={styles.themeGrid}>
                {THEME_OPTIONS.map((opt) => {
                  const isActive = settings.theme === opt.id;
                  const Icon = opt.icon;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.themeCard, isActive && styles.themeCardActive]}
                      onPress={() => handleUpdateSettings({ theme: opt.id })}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.themeIconWrap,
                          isActive && styles.themeIconWrapActive,
                        ]}
                      >
                        <Icon
                          size={22}
                          color={isActive ? Colors.primary : Colors.textMuted}
                        />
                      </View>
                      <Text
                        style={[styles.themeLabel, isActive && styles.themeLabelActive]}
                      >
                        {opt.label}
                      </Text>
                      {isActive && (
                        <View style={styles.themeCheck}>
                          <Check size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.themeNote}>
                <Text style={styles.themeNoteText}>
                  Currently using dark theme. Light and system themes coming soon.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>ChargeRescue Ethiopia v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with care for Ethiopian EV drivers</Text>
        </View>
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionBody: {
    padding: 16,
  },
  bodyLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  optionDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  toggleDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
    marginLeft: 48,
  },
  mapStyleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  mapStyleCard: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  mapStyleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  mapStyleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mapStyleIconWrapActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  mapStyleLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  mapStyleLabelActive: {
    color: Colors.primary,
  },
  mapStyleDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  themeCard: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  themeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  themeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  themeIconWrapActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  themeLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  themeLabelActive: {
    color: Colors.primary,
  },
  themeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeNote: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  themeNoteText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  versionSubtext: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
});
