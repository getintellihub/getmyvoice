import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';

interface OnboardingScreenProps {
  onContinue: () => void;
}

export function OnboardingScreen({ onContinue }: OnboardingScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎙️</Text>
        <Text style={styles.title}>MyVoice speaks for you.</Text>
        <Text style={styles.body}>
          Tap any phrase to load it, then tap Speak. For quick moments tap the ⚡ button anytime.
        </Text>
      </View>
      <Pressable
        onPress={onContinue}
        style={({ pressed }) => [styles.continueButton, pressed && styles.continueButtonPressed]}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VoiceTheme.background,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 30,
    fontFamily: VoiceFonts.display,
    textAlign: 'center',
  },
  body: {
    color: VoiceTheme.textSecondary,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 340,
  },
  continueButton: {
    backgroundColor: VoiceTheme.accent,
    borderRadius: 18,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  continueButtonPressed: {
    opacity: 0.85,
  },
  continueButtonText: {
    color: VoiceTheme.onAccent,
    fontSize: 19,
    fontWeight: '700',
  },
});
