import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Zap,
  MapPin,
  Shield,
  Clock,
  ChevronRight,
  BatteryCharging,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: typeof Zap;
  iconColor: string;
  iconBg: string;
  accentShape: string;
  title: string;
  subtitle: string;
  highlight: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: BatteryCharging,
    iconColor: Colors.primary,
    iconBg: 'rgba(59, 130, 246, 0.15)',
    accentShape: Colors.primary,
    title: 'Never Get Stranded',
    subtitle: 'Emergency EV charging delivered to your exact location in Addis Ababa',
    highlight: 'ChargeRescue Ethiopia',
  },
  {
    id: '2',
    icon: MapPin,
    iconColor: Colors.accent,
    iconBg: 'rgba(132, 204, 22, 0.15)',
    accentShape: Colors.accent,
    title: 'Pinpoint Precision',
    subtitle: 'Share your live GPS location and we dispatch the nearest service vehicle to you',
    highlight: 'Fast & Accurate',
  },
  {
    id: '3',
    icon: Clock,
    iconColor: Colors.orange,
    iconBg: Colors.orangeBg,
    accentShape: Colors.orange,
    title: 'Quick Top-Up',
    subtitle: 'Choose from emergency or standard charge packages — get back on the road in minutes',
    highlight: '15–35 min charge',
  },
  {
    id: '4',
    icon: Shield,
    iconColor: Colors.success,
    iconBg: Colors.successBg,
    accentShape: Colors.success,
    title: 'Secure & Trusted',
    subtitle: 'Pay with Telebirr, CBE Birr, or cash. Track your driver in real-time with full transparency',
    highlight: 'Multiple payment options',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      router.replace('/auth' as any);
    }
  }, [currentIndex, completeOnboarding]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
    router.replace('/auth' as any);
  }, [completeOnboarding]);

  const renderSlide = useCallback(({ item }: { item: OnboardingSlide }) => {
    const Icon = item.icon;
    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.illustrationArea}>
          <View style={[styles.glowOrb, { backgroundColor: `${item.accentShape}10` }]} />
          <View style={[styles.glowOrbSmall, { backgroundColor: `${item.accentShape}08` }]} />
          <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
            <Icon size={48} color={item.iconColor} />
          </View>
          <View style={[styles.accentLine, { backgroundColor: item.accentShape }]} />
        </View>

        <View style={styles.textArea}>
          <View style={[styles.highlightBadge, { backgroundColor: `${item.accentShape}15` }]}>
            <Text style={[styles.highlightText, { color: item.iconColor }]}>
              {item.highlight}
            </Text>
          </View>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Zap size={20} color={Colors.primary} fill={Colors.primary} />
          <Text style={styles.brandName}>ChargeRescue</Text>
        </View>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} testID="skip-onboarding">
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
      />

      <View style={styles.bottomArea}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: SLIDES[currentIndex]?.accentShape ?? Colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: SLIDES[currentIndex]?.accentShape ?? Colors.primary },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
          testID="onboarding-next"
        >
          <Text style={styles.nextButtonText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800' as const,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glowOrbSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: '20%',
    right: '10%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLine: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginTop: 24,
    opacity: 0.4,
  },
  textArea: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  highlightBadge: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  slideTitle: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideSubtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 18,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800' as const,
  },
});
