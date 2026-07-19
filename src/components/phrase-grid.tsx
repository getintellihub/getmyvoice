import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { VoiceTheme } from '@/constants/voice-theme';
import { CustomPhrase } from '@/hooks/use-custom-phrases';

interface PhraseGridProps {
  categoryColor: string;
  phrases: string[];
  onSpeak: (text: string) => void;
  isMyPhrases?: boolean;
  myPhrases?: CustomPhrase[];
  onAddPhrase?: (text: string) => void;
  onRemovePhrase?: (id: string) => void;
}

export function PhraseGrid({
  categoryColor,
  phrases,
  onSpeak,
  isMyPhrases,
  myPhrases = [],
  onAddPhrase,
  onRemovePhrase,
}: PhraseGridProps) {
  const [newPhrase, setNewPhrase] = useState('');

  function handleAdd() {
    if (!newPhrase.trim()) return;
    onAddPhrase?.(newPhrase);
    setNewPhrase('');
  }

  return (
    <View style={styles.wrap}>
      {isMyPhrases && (
        <View style={styles.addRow}>
          <TextInput
            value={newPhrase}
            onChangeText={setNewPhrase}
            placeholder="Add your own phrase..."
            placeholderTextColor={VoiceTheme.textMuted}
            style={styles.addInput}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.addButton, { backgroundColor: categoryColor }, pressed && styles.addButtonPressed]}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      )}

      {isMyPhrases && myPhrases.length === 0 && phrases.length === 0 && (
        <Text style={styles.emptyText}>No custom phrases yet. Add one above!</Text>
      )}

      <View style={styles.grid}>
        {phrases.map((phrase) => (
          <Pressable
            key={phrase}
            onPress={() => onSpeak(phrase)}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: categoryColor },
              pressed && styles.chipPressed,
            ]}>
            <Text style={styles.chipText}>{phrase}</Text>
          </Pressable>
        ))}

        {isMyPhrases &&
          myPhrases.map((phrase) => (
            <Pressable
              key={phrase.id}
              onPress={() => onSpeak(phrase.text)}
              onLongPress={() => onRemovePhrase?.(phrase.id)}
              style={({ pressed }) => [
                styles.chip,
                styles.customChip,
                { borderColor: categoryColor },
                pressed && styles.chipPressed,
              ]}>
              <Text style={styles.chipText}>{phrase.text}</Text>
              <Pressable
                accessibilityLabel={`Remove ${phrase.text}`}
                onPress={() => onRemovePhrase?.(phrase.id)}
                style={styles.removeButton}>
                <Text style={styles.removeButtonText}>✕</Text>
              </Pressable>
            </Pressable>
          ))}
      </View>

      {isMyPhrases && myPhrases.length > 0 && (
        <Text style={styles.hintText}>Tap to speak · long-press or tap ✕ to remove</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    paddingBottom: 24,
  },
  addRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: VoiceTheme.text,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  addButton: {
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700',
  },
  emptyText: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
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
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipText: {
    color: VoiceTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 2,
  },
  removeButtonText: {
    color: VoiceTheme.textMuted,
    fontSize: 12,
  },
  hintText: {
    color: VoiceTheme.textMuted,
    fontSize: 11,
  },
});
