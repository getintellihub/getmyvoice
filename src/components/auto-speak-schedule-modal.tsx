import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { ScheduleEntry } from '@/hooks/use-auto-speak-schedule';

interface AutoSpeakScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: ScheduleEntry[];
  onToggle: (id: string) => void;
}

export function AutoSpeakScheduleModal({ visible, onClose, schedule, onToggle }: AutoSpeakScheduleModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>🕒 Auto-Speak Schedule</Text>
          <Text style={styles.subtitle}>Turn on a time slot to have MyVoice speak it automatically while the app is open.</Text>

          <ScrollView contentContainerStyle={styles.list}>
            {schedule.map((entry) => (
              <View key={entry.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTime}>{entry.label}</Text>
                  <Text style={styles.rowPhrase}>{entry.phrase}</Text>
                </View>
                <Switch
                  value={entry.enabled}
                  onValueChange={() => onToggle(entry.id)}
                  trackColor={{ false: VoiceTheme.border, true: VoiceTheme.accent }}
                  thumbColor={VoiceTheme.text}
                />
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.doneButton, pressed && styles.pressedOpacity]}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
    padding: 20,
    maxHeight: '80%',
    gap: 12,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
    borderBottomWidth: 0,
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 22,
    fontFamily: VoiceFonts.display,
  },
  subtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    marginTop: -6,
    lineHeight: 18,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTime: {
    color: VoiceTheme.accentStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  rowPhrase: {
    color: VoiceTheme.text,
    fontSize: 14,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
    backgroundColor: VoiceTheme.accent,
    borderRadius: 16,
  },
  pressedOpacity: {
    opacity: 0.8,
  },
  doneButtonText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700',
    fontSize: 16,
  },
});
