import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Zap,
  Phone,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handlePhoneFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const handlePhoneBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const handlePhoneSubmit = useCallback(() => {
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (cleaned.length < 9) {
      Alert.alert('Invalid Number', 'Please enter a valid Ethiopian phone number.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fullNumber = cleaned.startsWith('+251')
      ? cleaned
      : cleaned.startsWith('0')
      ? `+251${cleaned.slice(1)}`
      : `+251${cleaned}`;
    console.log('[Auth] Phone submit:', fullNumber);
    router.push({ pathname: '/verify-otp', params: { phone: fullNumber, method: 'phone' } } as any);
  }, [phoneNumber]);

  const handleGoogleSignIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('[Auth] Google sign-in initiated');
    router.push({ pathname: '/verify-otp', params: { method: 'google', email: 'user@gmail.com' } } as any);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.scroll, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="auth-back"
        >
          <ArrowLeft size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.logoBg}>
            <Zap size={32} color={Colors.primary} fill={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Welcome to{'\n'}ChargeRescue</Text>
          <Text style={styles.heroSubtitle}>
            Sign in or create an account to get started
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <Animated.View style={[styles.phoneInputRow, { borderColor }]}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇪🇹</Text>
              <Text style={styles.codeText}>+251</Text>
            </View>
            <View style={styles.inputDivider} />
            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="9XX XXX XXXX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={13}
              onFocus={handlePhoneFocus}
              onBlur={handlePhoneBlur}
              testID="phone-number-input"
            />
            <Phone size={18} color={isFocused ? Colors.primary : Colors.textMuted} />
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              phoneNumber.replace(/\s/g, '').length < 9 && styles.continueButtonDisabled,
            ]}
            onPress={handlePhoneSubmit}
            disabled={phoneNumber.replace(/\s/g, '').length < 9}
            activeOpacity={0.85}
            testID="continue-phone"
          >
            <Text style={styles.continueButtonText}>Continue with Phone</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            testID="google-signin"
          >
            <View style={styles.googleIconWrap}>
              <Text style={styles.googleIcon}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 36,
  },
  logoBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '800' as const,
    textAlign: 'center',
    lineHeight: 40,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  formSection: {
    gap: 0,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginLeft: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 58,
    marginBottom: 16,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  codeText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  inputDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '500' as const,
    padding: 0,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '800' as const,
  },
  googleButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  termsSection: {
    paddingTop: 32,
    paddingHorizontal: 12,
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
