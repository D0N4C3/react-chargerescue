import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Car,
  Plug,
  ChevronRight,
  Zap,
  CheckCircle,
  Phone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { ConnectorType } from '@/types';
import { CONNECTORS } from '@/mocks/data';

const VEHICLE_SUGGESTIONS = [
  'BYD Seal',
  'BYD Atto 3',
  'BYD Han',
  'BYD Dolphin',
  'Tesla Model 3',
  'Tesla Model Y',
  'Changan Deepal',
  'MG ZS EV',
  'Hyundai Kona EV',
  'VW ID.4',
];

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const { auth, profile, updateProfile, completeProfile } = useApp();

  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(
    profile?.phone ?? auth.phoneNumber ?? ''
  );
  const [vehicleModel, setVehicleModel] = useState(profile?.vehicleModel ?? '');
  const [connectorType, setConnectorType] = useState<ConnectorType>(
    profile?.connectorType ?? 'GB/T'
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const filteredSuggestions = vehicleModel.length > 0
    ? VEHICLE_SUGGESTIONS.filter((v) =>
        v.toLowerCase().includes(vehicleModel.toLowerCase())
      )
    : VEHICLE_SUGGESTIONS;

  const animateStep = useCallback(
    (next: number) => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setCurrentStep(next), 150);
    },
    [fadeAnim]
  );

  const handleNextStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep === 1) {
      if (!name.trim()) {
        Alert.alert('Required', 'Please enter your full name.');
        return;
      }
      animateStep(2);
    } else if (currentStep === 2) {
      if (!vehicleModel.trim()) {
        Alert.alert('Required', 'Please enter your vehicle model.');
        return;
      }
      animateStep(3);
    }
  }, [currentStep, name, vehicleModel, animateStep]);

  const handleFinish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({
      name: name.trim(),
      phone: phone.trim() || auth.phoneNumber || '',
      vehicleModel: vehicleModel.trim(),
      connectorType,
    });
    completeProfile();
    console.log('[CompleteProfile] Profile saved, navigating to home');
    router.replace('/(tabs)/(home)' as any);
  }, [name, phone, vehicleModel, connectorType, auth, updateProfile, completeProfile]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateStep(currentStep - 1);
    }
  }, [currentStep, animateStep]);

  const progressWidth = `${(currentStep / 3) * 100}%`;

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconRow}>
        <View style={[styles.stepIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
          <User size={28} color={Colors.primary} />
        </View>
      </View>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <Text style={styles.stepSubtitle}>
        This is how drivers will identify you
      </Text>

      <View style={styles.inputCard}>
        <View style={styles.inputIconWrap}>
          <User size={18} color={Colors.primary} />
        </View>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
          autoFocus
          testID="profile-name-input"
        />
      </View>

      {auth.authMethod === 'google' && (
        <View style={styles.inputCard}>
          <View style={styles.inputIconWrap}>
            <Phone size={18} color={Colors.primary} />
          </View>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number (optional)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            testID="profile-phone-input"
          />
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconRow}>
        <View style={[styles.stepIcon, { backgroundColor: 'rgba(132,204,22,0.12)' }]}>
          <Car size={28} color={Colors.accent} />
        </View>
      </View>
      <Text style={styles.stepTitle}>Your Vehicle</Text>
      <Text style={styles.stepSubtitle}>
        Tell us what EV you drive
      </Text>

      <View style={styles.inputCard}>
        <View style={[styles.inputIconWrap, { backgroundColor: 'rgba(132,204,22,0.1)' }]}>
          <Car size={18} color={Colors.accent} />
        </View>
        <TextInput
          style={styles.textInput}
          value={vehicleModel}
          onChangeText={(text) => {
            setVehicleModel(text);
            setShowSuggestions(true);
          }}
          placeholder="e.g. BYD Seal"
          placeholderTextColor={Colors.textMuted}
          autoFocus
          onFocus={() => setShowSuggestions(true)}
          testID="profile-vehicle-input"
        />
      </View>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsCard}>
          {filteredSuggestions.slice(0, 5).map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={styles.suggestionRow}
              onPress={() => {
                setVehicleModel(suggestion);
                setShowSuggestions(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Car size={14} color={Colors.textMuted} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIconRow}>
        <View style={[styles.stepIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
          <Plug size={28} color={Colors.success} />
        </View>
      </View>
      <Text style={styles.stepTitle}>Connector Type</Text>
      <Text style={styles.stepSubtitle}>
        Select your vehicle's charging port
      </Text>

      {CONNECTORS.map((connector) => {
        const isSelected = connectorType === connector.type;
        return (
          <TouchableOpacity
            key={connector.type}
            style={[
              styles.connectorCard,
              isSelected && styles.connectorCardSelected,
            ]}
            onPress={() => {
              setConnectorType(connector.type);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
            testID={`profile-connector-${connector.type}`}
          >
            <View
              style={[
                styles.connectorIcon,
                {
                  backgroundColor: isSelected
                    ? 'rgba(59,130,246,0.15)'
                    : Colors.surfaceLight,
                },
              ]}
            >
              <Plug
                size={20}
                color={isSelected ? Colors.primary : Colors.textMuted}
              />
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
              <CheckCircle size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {currentStep > 1 ? (
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={handleBack}
                testID="profile-back"
              >
                <Text style={styles.headerBackText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerStep}>Step {currentStep} of 3</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: progressWidth as any }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {currentStep < 3 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextStep}
              activeOpacity={0.85}
              testID="profile-next"
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <ChevronRight size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinish}
              activeOpacity={0.85}
              testID="profile-finish"
            >
              <Zap size={18} color="#fff" fill="#fff" />
              <Text style={styles.finishButtonText}>Start Using ChargeRescue</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    width: 60,
  },
  headerBackBtn: {
    paddingVertical: 4,
  },
  headerBackText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerStep: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600' as const,
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
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    paddingTop: 32,
  },
  stepIconRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 58,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    marginBottom: 12,
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500' as const,
    padding: 0,
  },
  suggestionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  connectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 14,
  },
  connectorCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  connectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorInfo: {
    flex: 1,
  },
  connectorName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  connectorDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800' as const,
  },
});
