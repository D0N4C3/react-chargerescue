import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.circle,
                isCompleted && styles.circleCompleted,
                isCurrent && styles.circleCurrent,
              ]}
            >
              {isCompleted ? (
                <CheckCircle size={20} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    isCurrent && styles.stepNumberCurrent,
                  ]}
                >
                  {stepNum}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                (isCompleted || isCurrent) && styles.stepLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: Colors.success,
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  stepNumberCurrent: {
    color: '#fff',
  },
  stepLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '500' as const,
  },
  stepLabelActive: {
    color: Colors.textPrimary,
  },
});
