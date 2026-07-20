import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MIN_RECORDING_SECONDS, RECORDING_TIPS, VOICE_CLONE_SCRIPT } from '@/constants/voice-clone';
import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { VoiceCloneStage } from '@/hooks/use-voice-clone';

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface VoiceCloneCardProps {
  stage: VoiceCloneStage;
  durationSeconds: number;
  errorMessage: string | null;
  isPlayingPreview: boolean;
  hasRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  playPreview: () => void;
  createVoiceClone: (name: string) => void;
  startOver: () => void;
  onTestVoice: () => void;
  onDismissSuccess: () => void;
}

function ScriptBlock() {
  return (
    <View style={styles.scriptBox}>
      <Text style={styles.scriptTitle}>Reading script</Text>
      <Text style={styles.scriptText}>{VOICE_CLONE_SCRIPT}</Text>
    </View>
  );
}

export function VoiceCloneCard({
  stage,
  durationSeconds,
  errorMessage,
  isPlayingPreview,
  startRecording,
  stopRecording,
  playPreview,
  createVoiceClone,
  startOver,
  onTestVoice,
  onDismissSuccess,
}: VoiceCloneCardProps) {
  const [voiceName, setVoiceName] = useState('My Voice');

  return (
    <View style={styles.card}>
      <Text style={styles.headline}>Make MyVoice sound like you</Text>
      <Text style={styles.subtext}>
        Record 30-60 seconds of yourself speaking naturally. MyVoice will learn your voice and use it every time you
        speak.
      </Text>

      {stage === 'intro' && (
        <View style={styles.stageBlock}>
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>Before you start</Text>
            {RECORDING_TIPS.map((tip) => (
              <Text key={tip} style={styles.tipItem}>
                •  {tip}
              </Text>
            ))}
          </View>

          <ScriptBlock />

          <Pressable
            onPress={startRecording}
            style={({ pressed }) => [styles.recordButton, styles.bottomAction, pressed && styles.recordButtonPressed]}>
            <Text style={styles.recordButtonText}>🎙️ Record</Text>
          </Pressable>
        </View>
      )}

      {stage === 'recording' && (
        <View style={styles.stageBlock}>
          <Text style={styles.timer}>{formatDuration(durationSeconds)}</Text>
          <Text style={styles.recordingHint}>Read the script below, or say anything for 30-60 seconds.</Text>
          <ScriptBlock />
          <Pressable
            onPress={stopRecording}
            style={({ pressed }) => [styles.stopButton, styles.bottomAction, pressed && styles.stopButtonPressed]}>
            <Text style={styles.recordButtonText}>⏹ Stop Recording</Text>
          </Pressable>
        </View>
      )}

      {stage === 'recorded' && (
        <View style={styles.stageBlock}>
          <Text style={styles.recordedLabel}>Recorded {formatDuration(durationSeconds)}</Text>
          {durationSeconds < MIN_RECORDING_SECONDS && (
            <Text style={styles.durationHint}>
              Tip: aim for at least {MIN_RECORDING_SECONDS} seconds for the best clone.
            </Text>
          )}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={playPreview}
              disabled={isPlayingPreview}
              style={({ pressed }) => [
                styles.previewButton,
                pressed && !isPlayingPreview && styles.previewButtonPressed,
                isPlayingPreview && styles.previewButtonDisabled,
              ]}>
              <Text style={styles.previewButtonText}>{isPlayingPreview ? '▶ Playing…' : '▶ Play Preview'}</Text>
            </Pressable>
            <Pressable
              onPress={startOver}
              style={({ pressed }) => [styles.recordAgainButton, pressed && styles.pressedOpacity]}>
              <Text style={styles.recordAgainButtonText}>Record Again</Text>
            </Pressable>
          </View>
          <TextInput
            value={voiceName}
            onChangeText={setVoiceName}
            placeholder="Name your voice"
            placeholderTextColor={VoiceTheme.textMuted}
            style={styles.nameInput}
          />
          <Pressable
            onPress={() => createVoiceClone(voiceName)}
            disabled={durationSeconds < MIN_RECORDING_SECONDS}
            style={({ pressed }) => [
              styles.recordButton,
              styles.bottomAction,
              durationSeconds < MIN_RECORDING_SECONDS && styles.recordButtonDisabled,
              pressed && durationSeconds >= MIN_RECORDING_SECONDS && styles.recordButtonPressed,
            ]}>
            <Text style={styles.recordButtonText}>✨ Create My Voice</Text>
          </Pressable>
        </View>
      )}

      {stage === 'uploading' && (
        <View style={styles.centeredBox}>
          <ActivityIndicator size="large" color={VoiceTheme.accent} />
          <Text style={styles.uploadingText}>Creating your voice…</Text>
        </View>
      )}

      {stage === 'success' && (
        <View style={styles.centeredBox}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Your voice is ready</Text>
          <Pressable
            onPress={onTestVoice}
            style={({ pressed }) => [styles.recordButton, pressed && styles.recordButtonPressed]}>
            <Text style={styles.recordButtonText}>🔊 Speak</Text>
          </Pressable>
          <Pressable onPress={onDismissSuccess} style={({ pressed }) => [styles.doneButton, pressed && styles.pressedOpacity]}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      )}

      {stage === 'error' && (
        <View style={styles.centeredBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            onPress={startOver}
            style={({ pressed }) => [styles.recordButton, pressed && styles.recordButtonPressed]}>
            <Text style={styles.recordButtonText}>Try Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  headline: {
    color: VoiceTheme.text,
    fontSize: 20,
    fontFamily: VoiceFonts.display,
  },
  subtext: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -6,
  },
  stageBlock: {
    gap: 16,
  },
  tipsBox: {
    backgroundColor: VoiceTheme.surface,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  tipsTitle: {
    color: VoiceTheme.accentStrong,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  tipItem: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  scriptBox: {
    backgroundColor: VoiceTheme.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  scriptTitle: {
    color: VoiceTheme.accentStrong,
    fontWeight: '700',
    fontSize: 13,
  },
  scriptText: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  bottomAction: {
    marginTop: 4,
  },
  recordButton: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonPressed: {
    opacity: 0.85,
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordButtonText: {
    color: VoiceTheme.onAccent,
    fontSize: 17,
    fontWeight: '700',
  },
  durationHint: {
    color: VoiceTheme.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  timer: {
    color: VoiceTheme.text,
    fontSize: 36,
    fontFamily: VoiceFonts.display,
    textAlign: 'center',
  },
  recordingHint: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  stopButton: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.danger,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonPressed: {
    opacity: 0.85,
  },
  recordedLabel: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  previewButtonPressed: {
    opacity: 0.7,
  },
  previewButtonDisabled: {
    opacity: 0.6,
  },
  previewButtonText: {
    color: VoiceTheme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  recordAgainButton: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedOpacity: {
    opacity: 0.6,
  },
  recordAgainButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  nameInput: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: VoiceTheme.text,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  centeredBox: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  uploadingText: {
    color: VoiceTheme.textSecondary,
    fontSize: 15,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    color: VoiceTheme.text,
    fontSize: 20,
    fontFamily: VoiceFonts.display,
  },
  doneButton: {
    paddingVertical: 8,
  },
  doneButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: VoiceTheme.danger,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
});
