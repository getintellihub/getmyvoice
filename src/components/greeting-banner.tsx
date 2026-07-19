import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { TimeGreeting } from '@/hooks/use-time-greeting';

interface GreetingBannerProps {
  greeting: TimeGreeting;
  onSpeak: (text: string) => void;
  onDismiss: () => void;
}

export function GreetingBanner({ greeting, onSpeak, onDismiss }: GreetingBannerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textWrap}>
        <Text style={styles.emoji}>{greeting.emoji}</Text>
        <View style={styles.textInner}>
          <Text style={styles.greeting}>{greeting.greeting}</Text>
          <Text style={styles.message}>{greeting.message}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onSpeak(greeting.greeting)}
          style={({ pressed }) => [styles.speakPill, pressed && styles.speakPillPressed]}>
          <Text style={styles.speakPillText}>🔊 Speak it</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Dismiss greeting"
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}>
          <Text style={styles.dismissButtonText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  textWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  textInner: {
    flex: 1,
  },
  emoji: {
    fontSize: 28,
  },
  greeting: {
    color: VoiceTheme.text,
    fontSize: 19,
    fontFamily: VoiceFonts.display,
  },
  message: {
    color: VoiceTheme.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakPill: {
    backgroundColor: VoiceTheme.accent,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  speakPillPressed: {
    opacity: 0.8,
  },
  speakPillText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700',
    fontSize: 13,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonPressed: {
    opacity: 0.6,
  },
  dismissButtonText: {
    color: VoiceTheme.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
});
