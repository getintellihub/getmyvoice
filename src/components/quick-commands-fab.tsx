import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QUICK_COMMAND_SECTIONS } from '@/constants/quick-commands';
import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';

interface QuickCommandsFabProps {
  onSpeak: (text: string) => void;
}

const FAB_SIZE = 64;

export function QuickCommandsFab({ onSpeak }: QuickCommandsFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityLabel="Quick commands"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <Text style={styles.fabIcon}>⚡️</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⚡️ Quick Commands</Text>
              <Text style={styles.subtitle}>Tap any phrase to speak it right away</Text>
            </View>
            <Pressable
              onPress={() => setOpen(false)}
              accessibilityLabel="Close quick commands"
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressedOpacity]}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {QUICK_COMMAND_SECTIONS.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {section.emoji} {section.label}
                </Text>
                <View style={styles.grid}>
                  {section.phrases.map((phrase) => (
                    <Pressable
                      key={phrase}
                      onPress={() => {
                        onSpeak(phrase);
                        setOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        { borderColor: section.color },
                        section.id === 'emergency' && { backgroundColor: 'rgba(239,68,68,0.16)' },
                        pressed && styles.chipPressed,
                      ]}>
                      <Text style={styles.chipText}>{phrase}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VoiceTheme.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabIcon: {
    fontSize: 28,
  },
  screen: {
    flex: 1,
    backgroundColor: VoiceTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 22,
    fontFamily: VoiceFonts.display,
  },
  subtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VoiceTheme.surfaceElevated,
  },
  pressedOpacity: {
    opacity: 0.6,
  },
  closeButtonText: {
    color: VoiceTheme.text,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: VoiceTheme.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: VoiceTheme.surfaceElevated,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    flexGrow: 1,
    minWidth: '46%',
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipText: {
    color: VoiceTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
