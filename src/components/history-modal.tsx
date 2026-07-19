import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { HistoryEntry } from '@/hooks/use-history';

interface HistoryModalProps {
  visible: boolean;
  history: HistoryEntry[];
  onClose: () => void;
  onSpeakAgain: (text: string) => void;
  onClear: () => void;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function HistoryModal({ visible, history, onClose, onSpeakAgain, onClear }: HistoryModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Recently Spoken</Text>
            {history.length > 0 && (
              <Pressable onPress={onClear} style={({ pressed }) => pressed && styles.pressedOpacity}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            )}
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🕘</Text>
              <Text style={styles.emptyText}>Phrases you speak will show up here.</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSpeakAgain(item.text)}
                  style={({ pressed }) => [styles.historyItem, pressed && styles.historyItemPressed]}>
                  <View style={styles.historyTextWrap}>
                    <Text style={styles.historyText}>{item.text}</Text>
                    <Text style={styles.historyTime}>{formatTime(item.spokenAt)}</Text>
                  </View>
                  <Text style={styles.replayIcon}>🔊</Text>
                </Pressable>
              )}
            />
          )}

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressedOpacity]}>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '75%',
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 22,
    fontFamily: VoiceFonts.display,
  },
  clearText: {
    color: VoiceTheme.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  pressedOpacity: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyText: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  historyItemPressed: {
    opacity: 0.7,
  },
  historyTextWrap: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  historyText: {
    color: VoiceTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  historyTime: {
    color: VoiceTheme.textMuted,
    fontSize: 12,
  },
  replayIcon: {
    fontSize: 18,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
