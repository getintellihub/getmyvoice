import * as Speech from 'expo-speech';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { RECOMMENDED_IOS_VOICES } from '@/constants/recommended-voices';
import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';

interface VoiceSelectorProps {
  voiceIdentifier: string | null;
  onChange: (voiceIdentifier: string | null) => void;
}

type VoiceListItem =
  | { kind: 'default' }
  | { kind: 'recommended-header' }
  | { kind: 'recommended'; voice: Speech.Voice; friendlyLabel: string }
  | { kind: 'all-header' }
  | { kind: 'voice'; voice: Speech.Voice };

export function VoiceSelector({ voiceIdentifier, onChange }: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [voices, setVoices] = useState<Speech.Voice[]>([]);

  useEffect(() => {
    Speech.getAvailableVoicesAsync()
      .then((available) => setVoices(available ?? []))
      .catch(() => setVoices([]));
  }, []);

  const recommendedEntries = useMemo(() => {
    if (Platform.OS !== 'ios') return [];
    return RECOMMENDED_IOS_VOICES.map((recommended) => {
      const match = voices.find((voice) => voice.name.toLowerCase() === recommended.name.toLowerCase());
      return match ? { voice: match, friendlyLabel: recommended.label } : null;
    }).filter((entry): entry is { voice: Speech.Voice; friendlyLabel: string } => entry !== null);
  }, [voices]);

  const recommendedIdentifiers = useMemo(
    () => new Set(recommendedEntries.map((entry) => entry.voice.identifier)),
    [recommendedEntries],
  );

  const otherVoices = useMemo(
    () => voices.filter((voice) => !recommendedIdentifiers.has(voice.identifier)),
    [voices, recommendedIdentifiers],
  );

  const selectedRecommended = recommendedEntries.find((entry) => entry.voice.identifier === voiceIdentifier);
  const selectedVoice = selectedRecommended?.voice ?? voices.find((voice) => voice.identifier === voiceIdentifier);
  const selectedLabel = selectedRecommended
    ? `${selectedRecommended.voice.name} — ${selectedRecommended.friendlyLabel}`
    : selectedVoice
      ? `${selectedVoice.name}${selectedVoice.language ? ` (${selectedVoice.language})` : ''}`
      : 'System default';

  const listData: VoiceListItem[] = [
    { kind: 'default' },
    ...(recommendedEntries.length > 0
      ? [
          { kind: 'recommended-header' } as VoiceListItem,
          ...recommendedEntries.map(
            (entry): VoiceListItem => ({ kind: 'recommended', voice: entry.voice, friendlyLabel: entry.friendlyLabel }),
          ),
          { kind: 'all-header' } as VoiceListItem,
        ]
      : []),
    ...otherVoices.map((voice): VoiceListItem => ({ kind: 'voice', voice })),
  ];

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
            <Text style={styles.subtitle}>Choose the voice that feels most like you.</Text>
            <FlatList
              data={listData}
              keyExtractor={(item, index) => {
                if (item.kind === 'default') return '__default__';
                if (item.kind === 'recommended-header') return '__recommended-header__';
                if (item.kind === 'all-header') return '__all-header__';
                return `${item.kind}-${item.voice.identifier}-${index}`;
              }}
              style={styles.list}
              renderItem={({ item }) => {
                if (item.kind === 'recommended-header') {
                  return <Text style={styles.sectionHeader}>⭐ Recommended Voices</Text>;
                }
                if (item.kind === 'all-header') {
                  return <Text style={styles.sectionHeader}>All Voices</Text>;
                }

                const identifier = item.kind === 'default' ? '__default__' : item.voice.identifier;
                const isSelected = item.kind === 'default' ? voiceIdentifier === null : voiceIdentifier === identifier;
                const primaryText =
                  item.kind === 'default'
                    ? 'System default'
                    : item.kind === 'recommended'
                      ? `${item.voice.name} — ${item.friendlyLabel}`
                      : `${item.voice.name}${item.voice.language ? ` (${item.voice.language})` : ''}`;

                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.kind === 'default' ? null : identifier);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.voiceRow,
                      isSelected && styles.voiceRowSelected,
                      pressed && styles.voiceRowPressed,
                    ]}>
                    <Text style={styles.voiceRowText} numberOfLines={1}>
                      {primaryText}
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
    maxHeight: '80%',
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
  subtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    marginTop: -8,
    fontStyle: 'italic',
  },
  list: {
    flexGrow: 0,
  },
  sectionHeader: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
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
