import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MIN_TOUCH_TARGET, VoiceTheme } from '@/constants/voice-theme';

interface VoiceSetupBannerProps {
  onPress: () => void;
  onDismiss: () => void;
}

export function VoiceSetupBanner({ onPress, onDismiss }: VoiceSetupBannerProps) {
  return (
    <View style={styles.banner}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Set up your voice — open Voice Settings"
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.bannerPressable}>
        <Text style={styles.message}>
          🎤 Set up your voice — tap the ⚙️ settings icon to clone your voice and make MyVoice sound like you.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Dismiss voice setup banner"
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={onDismiss}
        style={styles.dismissButton}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Small pulsing attention dot for the settings gear until voice clone exists. */
export function SettingsAttentionDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.dot, { opacity }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: VoiceTheme.accent,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: VoiceTheme.accentStrong,
    overflow: 'hidden',
  },
  bannerPressable: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingRight: 48,
    minHeight: MIN_TOUCH_TARGET + 8,
    justifyContent: 'center',
  },
  message: {
    color: VoiceTheme.onAccent,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  dismissButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dismissText: {
    color: VoiceTheme.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff5c7a',
    borderWidth: 1.5,
    borderColor: VoiceTheme.background,
  },
});
