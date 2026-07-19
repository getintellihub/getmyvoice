import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SliderControl } from '@/components/slider-control';
import { VoiceCloneCard } from '@/components/voice-clone-card';
import { VoiceSelector } from '@/components/voice-selector';
import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { useVoiceClone } from '@/hooks/use-voice-clone';
import { VOICE_SETTING_RANGES, VoiceSettings } from '@/hooks/use-voice-settings';

interface VoiceSettingsModalProps {
  visible: boolean;
  settings: VoiceSettings;
  onChange: (key: keyof typeof VOICE_SETTING_RANGES, value: number) => void;
  onVoiceChange: (voiceIdentifier: string | null) => void;
  onReset: () => void;
  onClose: () => void;
  onPreview: () => void;
  onTestClonedVoice: () => void;
}

const ROWS: { key: keyof typeof VOICE_SETTING_RANGES; label: string; hint: string; suffix: string }[] = [
  { key: 'rate', label: 'Speed', hint: 'How fast the voice talks', suffix: 'x' },
  { key: 'pitch', label: 'Pitch', hint: 'How high or low the voice sounds', suffix: 'x' },
  { key: 'volume', label: 'Volume', hint: 'How loud the voice is', suffix: '' },
];

export function VoiceSettingsModal({
  visible,
  settings,
  onChange,
  onVoiceChange,
  onReset,
  onClose,
  onPreview,
  onTestClonedVoice,
}: VoiceSettingsModalProps) {
  const [isRerecording, setIsRerecording] = useState(false);
  const clone = useVoiceClone();

  function handleRemoveClone() {
    Alert.alert('Remove voice clone?', 'MyVoice will switch back to the system voice.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => clone.removeClone() },
    ]);
  }

  // Show the clone card when the user has no clone yet, is mid-flow (recording /
  // uploading / success / error), or explicitly chose to re-record.
  const showCloneFlow = !clone.hasClone || isRerecording || clone.stage !== 'intro';
  const showCloneStatus = clone.hasClone && !showCloneFlow;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Voice Settings</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {showCloneStatus && (
              <View style={styles.cloneStatusRow}>
                <View style={styles.cloneBadge}>
                  <Text style={styles.cloneBadgeText}>⭐ Using Your Voice</Text>
                </View>
              </View>
            )}
            {!clone.hasClone && <Text style={styles.systemVoiceLabel}>Using System Voice</Text>}

            {showCloneStatus && (
              <View style={styles.cloneActionsRow}>
                <Pressable
                  onPress={onTestClonedVoice}
                  style={({ pressed }) => [styles.cloneActionButton, pressed && styles.pressedOpacity]}>
                  <Text style={styles.cloneActionButtonText}>🔊 Test Voice</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    clone.startOver();
                    setIsRerecording(true);
                  }}
                  style={({ pressed }) => [styles.cloneActionButton, pressed && styles.pressedOpacity]}>
                  <Text style={styles.cloneActionButtonText}>🎙️ Re-record</Text>
                </Pressable>
                <Pressable
                  onPress={handleRemoveClone}
                  style={({ pressed }) => [styles.cloneActionButton, styles.cloneRemoveButton, pressed && styles.pressedOpacity]}>
                  <Text style={[styles.cloneActionButtonText, styles.cloneRemoveButtonText]}>Remove Clone</Text>
                </Pressable>
              </View>
            )}

            {showCloneFlow && (
              <VoiceCloneCard
                stage={clone.stage}
                durationSeconds={clone.durationSeconds}
                errorMessage={clone.errorMessage}
                isPlayingPreview={clone.isPlayingPreview}
                hasRecording={clone.hasRecording}
                startRecording={clone.startRecording}
                stopRecording={clone.stopRecording}
                playPreview={clone.playPreview}
                createVoiceClone={clone.createVoiceClone}
                startOver={clone.startOver}
                onTestVoice={onTestClonedVoice}
                onDismissSuccess={() => {
                  clone.startOver();
                  setIsRerecording(false);
                }}
              />
            )}

            <View style={styles.divider} />

            {ROWS.map((row) => {
              const range = VOICE_SETTING_RANGES[row.key];
              return (
                <SliderControl
                  key={row.key}
                  label={row.label}
                  hint={row.hint}
                  value={settings[row.key]}
                  min={range.min}
                  max={range.max}
                  step={range.step}
                  formatValue={(value) => `${value.toFixed(1)}${row.suffix}`}
                  onChange={(value) => onChange(row.key, value)}
                />
              );
            })}

            <VoiceSelector voiceIdentifier={settings.voiceIdentifier} onChange={onVoiceChange} />

            <View style={styles.actionsRow}>
              <Pressable
                onPress={onPreview}
                style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}>
                <Text style={styles.previewButtonText}>🔊 Preview voice</Text>
              </Pressable>
              <Pressable onPress={onReset} style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>
          </ScrollView>

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
    gap: 20,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  previewButton: {
    flex: 1,
    backgroundColor: VoiceTheme.accent,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  previewButtonPressed: {
    opacity: 0.8,
  },
  previewButtonText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  resetButtonPressed: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 15,
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
  cloneStatusRow: {
    marginBottom: 6,
  },
  cloneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: VoiceTheme.accent,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cloneBadgeText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700',
    fontSize: 13,
  },
  systemVoiceLabel: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  cloneActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  cloneActionButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.surface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
    paddingHorizontal: 6,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  cloneActionButtonText: {
    color: VoiceTheme.text,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  cloneRemoveButton: {
    borderColor: VoiceTheme.danger,
  },
  cloneRemoveButtonText: {
    color: VoiceTheme.danger,
  },
  divider: {
    height: 1,
    backgroundColor: VoiceTheme.border,
    marginVertical: 16,
  },
});
