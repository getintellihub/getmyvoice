import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';

interface VoiceSelectorProps {
  voiceIdentifier: string | null;
  onChange: (voiceIdentifier: string | null) => void;
}

export function VoiceSelector({ voiceIdentifier, onChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<Speech.Voice[]>([]);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((available) => setVoices(available ?? []))
      .catch(() => setVoices([]));
  }, []);

  const selectedVoice = voices.find((voice) => voice.identifier === voiceIdentifier);
  const selectedLabel = selectedVoice
    ? `${selectedVoice.name}${selectedVoice.language ? ` (${selectedVoice.language})` : ''}`
    : 'System default';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Voice</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.selectorButton, pressed && styles.selectorButtonPressed]}>
        <Text style={styles.selectorButtonText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Choose a Voice</Text>
            <FlatList
              data={[{ identifier: '__default__', name: 'System default', language: '' }, ...voices]}
              keyExtractor={(item) => item.identifier}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected =
                  item.identifier === '__default__' ? voiceIdentifier === null : voiceIdentifier === item.identifier;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.identifier === '__default__' ? null : item.identifier);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.voiceRow,
                      isSelected && styles.voiceRowSelected,
                      pressed && styles.voiceRowPressed,
                    ]}>
                    <Text style={styles.voiceRowText} numberOfLines={1}>
                      {item.name}
                      {item.language ? ` (${item.language})` : ''}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                );
              }}
            />
            <Pressable onPress={() => setOpen(false)} style={({ pressed }) => [styles.closeButton, pressed && styles.pressedOpacity]}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: VoiceTheme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  selectorButton: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  selectorButtonPressed: {
    opacity: 0.8,
  },
  selectorButtonText: {
    color: VoiceTheme.text,
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  chevron: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,4,24,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: VoiceTheme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '70%',
    gap: 12,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
    borderBottomWidth: 0,
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 20,
    fontFamily: VoiceFonts.display,
  },
  list: {
    flexGrow: 0,
  },
  voiceRow: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: VoiceTheme.surfaceElevated,
  },
  voiceRowSelected: {
    borderWidth: 1.5,
    borderColor: VoiceTheme.accent,
  },
  voiceRowPressed: {
    opacity: 0.7,
  },
  voiceRowText: {
    color: VoiceTheme.text,
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  checkmark: {
    color: VoiceTheme.accentStrong,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
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
