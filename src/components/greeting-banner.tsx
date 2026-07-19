import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { TimeGreeting } from '@/hooks/use-time-greeting';

interface GreetingBannerProps {
  greeting: TimeGreeting;
  onSpeak: (text: string) => void;
}

export function GreetingBanner({ greeting, onSpeak }: GreetingBannerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textWrap}>
        <Text style={styles.emoji}>{greeting.emoji}</Text>
        <View>
          <Text style={styles.greeting}>{greeting.greeting}</Text>
          <Text style={styles.message}>{greeting.message}</Text>
        </View>
      </View>
      <Pressable
        onPress={() => onSpeak(greeting.greeting)}
        style={({ pressed }) => [styles.speakPill, pressed && styles.speakPillPressed]}>
        <Text style={styles.speakPillText}>🔊 Speak</Text>
      </Pressable>
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
});
