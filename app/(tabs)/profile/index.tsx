import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Phone,
  Car,
  Plug,
  Save,
  ChevronRight,
  Shield,
  HelpCircle,
  LogOut,
  Zap,
  Settings,
  Wallet,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { ConnectorType } from '@/types';
import { CONNECTORS } from '@/mocks/data';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, orders, signOut } = useApp();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [vehicleModel, setVehicleModel] = useState(profile?.vehicleModel ?? '');
  const [connectorType, setConnectorType] = useState<ConnectorType>(
    profile?.connectorType ?? 'GB/T'
  );
  const [editing, setEditing] = useState(!profile);

  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const totalSpent = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.price.total, 0);

  const handleSave = useCallback(() => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Info', 'Please fill in your name and phone number.');
      return;
    }
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      vehicleModel: vehicleModel.trim(),
      connectorType,
    });
    setEditing(false);
    console.log('[Profile] Saved');
  }, [name, phone, vehicleModel, connectorType, updateProfile]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User size={36} color={Colors.primary} />
          </View>
          <Text style={styles.avatarName} numberOfLines={1}>
            {profile?.name || 'Set up profile'}
          </Text>
          <Text style={styles.avatarPhone} numberOfLines={1}>
            {profile?.phone || 'Add your phone number'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedOrders}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>ETB Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Zap size={18} color={Colors.accent} />
            <Text style={styles.statLabel}>EV Driver</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <User size={16} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.textMuted}
                    testID="name-input"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile?.name || '—'}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Phone size={16} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+251..."
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    testID="phone-input"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile?.phone || '—'}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Car size={16} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Vehicle Model</Text>
                {editing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="e.g. BYD Seal"
                    placeholderTextColor={Colors.textMuted}
                    testID="vehicle-input"
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {profile?.vehicleModel || '—'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.fieldDivider} />

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Plug size={16} color={Colors.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Connector Type</Text>
                {editing ? (
                  <View style={styles.connectorPicker}>
                    {CONNECTORS.map((c) => (
                      <TouchableOpacity
                        key={c.type}
                        style={[
                          styles.connectorChip,
                          connectorType === c.type && styles.connectorChipSelected,
                        ]}
                        onPress={() => setConnectorType(c.type)}
                      >
                        <Text
                          style={[
                            styles.connectorChipText,
                            connectorType === c.type &&
                              styles.connectorChipTextSelected,
                          ]}
                        >
                          {c.type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>
                    {profile?.connectorType || '—'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              testID="save-profile"
            >
              <Save size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.menuCard}>
            {[
              { icon: Settings, label: 'Settings', color: Colors.primary, onPress: () => router.push('/settings' as any) },
              { icon: Wallet, label: 'Wallet', color: Colors.accent, onPress: () => router.push('/(tabs)/wallet' as any) },
              { icon: Shield, label: 'Privacy & Safety', color: Colors.success, onPress: undefined },
              { icon: HelpCircle, label: 'Help & Support', color: Colors.warning, onPress: undefined },
            ].map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <View style={styles.fieldDivider} />}
                <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: `${item.color}15` },
                    ]}
                  >
                    <item.icon size={16} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: () => signOut(),
                },
              ]);
            }}
            testID="sign-out-button"
          >
            <LogOut size={18} color={Colors.danger} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800' as const,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    maxWidth: '90%',
  },
  avatarPhone: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '90%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    overflow: 'hidden',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800' as const,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  editButton: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  fieldCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  fieldValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500' as const,
    flexShrink: 1,
  },
  fieldInput: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500' as const,
    padding: 0,
    margin: 0,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  connectorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  connectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectorChipSelected: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: Colors.primary,
  },
  connectorChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  connectorChipTextSelected: {
    color: Colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    overflow: 'hidden',
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
