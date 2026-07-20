import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
      {/* Extra space so the Record / Stop button never sits on top of the script. */}
      <View style={styles.scriptBottomSpacer} />
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
  const canCreate = durationSeconds >= MIN_RECORDING_SECONDS;

  return (
    <View style={styles.card}>
      <Text style={styles.headline}>Make MyVoice sound like you</Text>
      <Text style={styles.subtext}>
        Record about 2–3 minutes of yourself speaking naturally. MyVoice will learn your voice and use it every time
        you speak.
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

          <View style={styles.actionSpacer} />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            activeOpacity={0.7}
            onPress={startRecording}
            style={styles.recordButton}>
            <Text style={styles.recordButtonText}>🎙️ Record</Text>
          </TouchableOpacity>
        </View>
      )}

      {stage === 'recording' && (
        <View style={styles.stageBlock}>
          <Text style={styles.timer}>{formatDuration(durationSeconds)}</Text>
          <Text style={styles.recordingHint}>Read the script below — about 2–3 minutes gives the best clone.</Text>
          <ScriptBlock />
          <View style={styles.actionSpacer} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            activeOpacity={0.7}
            onPress={stopRecording}
            style={styles.stopButton}>
            <Text style={styles.recordButtonText}>⏹ Stop Recording</Text>
          </TouchableOpacity>
        </View>
      )}

      {stage === 'recorded' && (
        <View style={styles.stageBlock}>
          <Text style={styles.recordedLabel}>Recorded {formatDuration(durationSeconds)}</Text>
          {!canCreate && (
            <Text style={styles.durationHint}>
              Tip: aim for at least {MIN_RECORDING_SECONDS} seconds for the best clone.
            </Text>
          )}
          <View style={styles.actionsColumn}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Play recording preview"
              activeOpacity={0.7}
              disabled={isPlayingPreview}
              onPress={playPreview}
              style={[styles.previewButton, isPlayingPreview && styles.previewButtonDisabled]}>
              <Text style={styles.previewButtonText}>{isPlayingPreview ? '▶ Playing…' : '▶ Play Preview'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Record again"
              activeOpacity={0.7}
              onPress={startOver}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Record Again</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={voiceName}
            onChangeText={setVoiceName}
            placeholder="Name your voice"
            placeholderTextColor={VoiceTheme.textMuted}
            style={styles.nameInput}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Create my voice"
            activeOpacity={0.7}
            disabled={!canCreate}
            onPress={() => createVoiceClone(voiceName)}
            style={[styles.recordButton, !canCreate && styles.recordButtonDisabled]}>
            <Text style={styles.recordButtonText}>✨ Create My Voice</Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Test speak with cloned voice"
            activeOpacity={0.7}
            onPress={onTestVoice}
            style={styles.recordButton}>
            <Text style={styles.recordButtonText}>🔊 Speak</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Done"
            activeOpacity={0.7}
            onPress={onDismissSuccess}
            style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {stage === 'error' && (
        <View style={styles.centeredBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Try again"
            activeOpacity={0.7}
            onPress={startOver}
            style={styles.recordButton}>
            <Text style={styles.recordButtonText}>Try Again</Text>
          </TouchableOpacity>
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
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 20,
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
  scriptBottomSpacer: {
    height: 12,
  },
  actionSpacer: {
    height: 12,
  },
  recordButton: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
    marginTop: 4,
  },
  recordedLabel: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  actionsColumn: {
    gap: 10,
  },
  previewButton: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  previewButtonDisabled: {
    opacity: 0.6,
  },
  previewButtonText: {
    color: VoiceTheme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
    backgroundColor: VoiceTheme.surface,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '700',
    fontSize: 15,
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
    alignSelf: 'stretch',
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
  errorText: {
    color: VoiceTheme.danger,
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 21,
    alignSelf: 'stretch',
  },
});
