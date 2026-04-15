import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyOtpScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string; method?: string; email?: string }>();
  const { signIn } = useApp();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = useCallback(
    (text: string, index: number) => {
      const newOtp = [...otp];

      if (text.length > 1) {
        const digits = text.replace(/\D/g, '').split('').slice(0, OTP_LENGTH);
        digits.forEach((d, i) => {
          if (i + index < OTP_LENGTH) {
            newOtp[i + index] = d;
          }
        });
        setOtp(newOtp);
        const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
        setActiveIndex(nextIndex);
        inputRefs.current[nextIndex]?.focus();

        if (newOtp.every((d) => d !== '')) {
          handleVerify(newOtp.join(''));
        }
        return;
      }

      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < OTP_LENGTH - 1) {
        setActiveIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }

      if (newOtp.every((d) => d !== '')) {
        handleVerify(newOtp.join(''));
      }
    },
    [otp]
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerify = useCallback(
    (code: string) => {
      setVerifying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('[VerifyOTP] Verifying code:', code);

      setTimeout(() => {
        setVerifying(false);

        const isValid = true;

        if (isValid) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(successScale, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }).start();

          const method = (params.method as 'phone' | 'google') ?? 'phone';
          const identifier = method === 'phone' ? (params.phone ?? '') : (params.email ?? '');
          signIn(method, identifier);

          setTimeout(() => {
            router.replace('/complete-profile' as any);
          }, 800);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          ]).start();
          setOtp(Array(OTP_LENGTH).fill(''));
          setActiveIndex(0);
          inputRefs.current[0]?.focus();
          Alert.alert('Invalid Code', 'Please check the code and try again.');
        }
      }, 1500);
    },
    [params, signIn, shakeAnim, successScale]
  );

  const handleResend = useCallback(() => {
    if (!canResend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCanResend(false);
    setResendTimer(RESEND_COOLDOWN);
    setOtp(Array(OTP_LENGTH).fill(''));
    setActiveIndex(0);
    inputRefs.current[0]?.focus();
    console.log('[VerifyOTP] Resend OTP requested');
    Alert.alert('Code Sent', 'A new verification code has been sent.');
  }, [canResend]);

  const isGoogle = params.method === 'google';
  const displayIdentifier = isGoogle
    ? params.email ?? 'your Google account'
    : params.phone ?? '';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="otp-back"
        >
          <ArrowLeft size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <ShieldCheck size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          {isGoogle
            ? `We sent a verification code to ${displayIdentifier}`
            : `Enter the 6-digit code sent to ${displayIdentifier}`}
        </Text>

        <Animated.View
          style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {otp.map((digit, index) => {
            const isActive = activeIndex === index;
            const isFilled = digit !== '';
            return (
              <View
                key={index}
                style={[
                  styles.otpCell,
                  isActive && styles.otpCellActive,
                  isFilled && styles.otpCellFilled,
                  verifying && styles.otpCellVerifying,
                ]}
              >
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setActiveIndex(index)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  selectTextOnFocus
                  editable={!verifying}
                  testID={`otp-input-${index}`}
                />
              </View>
            );
          })}
        </Animated.View>

        {verifying && (
          <View style={styles.verifyingRow}>
            <View style={styles.verifyingDot} />
            <Text style={styles.verifyingText}>Verifying...</Text>
          </View>
        )}

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResend}
              testID="resend-otp"
            >
              <RefreshCw size={14} color={Colors.primary} />
              <Text style={styles.resendButtonText}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Resend code in {resendTimer}s
            </Text>
          )}
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintText}>
            For testing, any 6-digit code will work
          </Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    maxWidth: 300,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  otpCell: {
    width: 50,
    height: 60,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCellActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  otpCellFilled: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  otpCellVerifying: {
    opacity: 0.6,
  },
  otpInput: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    width: '100%',
    height: '100%',
    padding: 0,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verifyingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  verifyingText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  resendRow: {
    marginBottom: 32,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  resendTimer: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  hintCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
