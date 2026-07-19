import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { ScheduleEntry } from '@/hooks/use-auto-speak-schedule';

interface AutoSpeakScheduleModalProps {
  visible: boolean;
  schedule: ScheduleEntry[];
  onClose: () => void;
  onAdd: (entry: { time: string; phrase: string; label: string }) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

function isValidTimeInput(time: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

export function AutoSpeakScheduleModal({
  visible,
  schedule,
  onClose,
  onAdd,
  onToggle,
  onRemove,
}: AutoSpeakScheduleModalProps) {
  const [time, setTime] = useState('');
  const [phrase, setPhrase] = useState('');

  function handleAdd() {
    if (!isValidTimeInput(time) || !phrase.trim()) return;
    onAdd({ time, phrase, label: phrase });
    setTime('');
    setPhrase('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Auto-Speak Schedule</Text>
          <Text style={styles.subtitle}>
            While the app is open, MyVoice will automatically speak these phrases at the times you set.
          </Text>

          <View style={styles.addRow}>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={VoiceTheme.textMuted}
              style={[styles.input, styles.timeInput]}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
            <TextInput
              value={phrase}
              onChangeText={setPhrase}
              placeholder="Phrase to speak..."
              placeholderTextColor={VoiceTheme.textMuted}
              style={[styles.input, styles.phraseInput]}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <Pressable onPress={handleAdd} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          <FlatList
            data={schedule}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No scheduled phrases yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleTimeWrap}>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                </View>
                <Text style={styles.schedulePhrase} numberOfLines={1}>
                  {item.phrase}
                </Text>
                <Switch
                  value={item.enabled}
                  onValueChange={() => onToggle(item.id)}
                  trackColor={{ false: VoiceTheme.border, true: VoiceTheme.accent }}
                  thumbColor={VoiceTheme.text}
                />
                <Pressable
                  accessibilityLabel={`Remove ${item.label}`}
                  onPress={() => onRemove(item.id)}
                  style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </Pressable>
              </View>
            )}
          />

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,4,24,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: VoiceTheme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '85%',
    gap: 14,
    borderTopWidth: 1,
    borderColor: VoiceTheme.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: VoiceTheme.border,
    alignSelf: 'center',
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 22,
    fontFamily: VoiceFonts.display,
  },
  subtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 12,
    marginTop: -8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: VoiceTheme.text,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  timeInput: {
    width: 76,
    textAlign: 'center',
  },
  phraseInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: VoiceTheme.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
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
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
  },
  emptyText: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  scheduleTimeWrap: {
    minWidth: 52,
  },
  scheduleTime: {
    color: VoiceTheme.accentStrong,
    fontWeight: '700',
    fontSize: 14,
  },
  schedulePhrase: {
    flex: 1,
    color: VoiceTheme.text,
    fontSize: 14,
  },
  removeButton: {
    paddingHorizontal: 4,
  },
  removeButtonText: {
    color: VoiceTheme.textMuted,
    fontSize: 13,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  closeButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
