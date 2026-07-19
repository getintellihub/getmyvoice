import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { VoiceFonts, VoiceTheme } from '@/constants/voice-theme';

interface QuickCommandsFabProps {
  phrases: string[];
  color: string;
  onSpeak: (text: string) => void;
}

export function QuickCommandsFab({ phrases, color, onSpeak }: QuickCommandsFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityLabel="Quick commands"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: color }, pressed && styles.fabPressed]}>
        <Text style={styles.fabIcon}>⚡️</Text>
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>⚡️ Quick Commands</Text>
            <Text style={styles.subtitle}>Tap any phrase to speak it right away</Text>
            <View style={styles.grid}>
              {phrases.map((phrase) => (
                <Pressable
                  key={phrase}
                  onPress={() => {
                    onSpeak(phrase);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.chip, { borderColor: color }, pressed && styles.chipPressed]}>
                  <Text style={styles.chipText}>{phrase}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setOpen(false)} style={({ pressed }) => [styles.closeButton, pressed && styles.pressedOpacity]}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const FAB_SIZE = 60;

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
    fontSize: 26,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,4,24,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  panel: {
    backgroundColor: VoiceTheme.surface,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    gap: 12,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 20,
    fontFamily: VoiceFonts.display,
  },
  subtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 12,
    marginTop: -8,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipText: {
    color: VoiceTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  pressedOpacity: {
    opacity: 0.6,
  },
  closeButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
