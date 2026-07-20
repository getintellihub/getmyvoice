import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SliderControl } from '@/components/slider-control';
import { VoiceCloneCard } from '@/components/voice-clone-card';
import { VoiceSelector } from '@/components/voice-selector';
import { VOICE_CLONE_TEST_PHRASE } from '@/constants/voice-clone';
import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { useVoiceClone } from '@/hooks/use-voice-clone';
import { VOICE_SETTING_RANGES, useVoiceSettings } from '@/hooks/use-voice-settings';
import { speakText } from '@/services/speech-engine';

export default function VoiceSettingsScreen() {
  const router = useRouter();
  const [isRerecording, setIsRerecording] = useState(false);
  const { settings, updateSetting, setVoiceIdentifier, resetSettings } = useVoiceSettings();
  const clone = useVoiceClone();

  const showCloneFlow = !clone.hasClone || isRerecording || clone.stage !== 'intro';
  const showCloneStatus = clone.hasClone && !showCloneFlow;

  function handleRemoveClone() {
    Alert.alert('Remove voice clone?', 'MyVoice will switch back to the system voice.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => clone.removeClone() },
    ]);
  }

  function handlePreviewVoice() {
    Speech.stop();
    Speech.speak('This is how I sound.', {
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      voice: settings.voiceIdentifier ?? undefined,
    });
  }

  function handleTestClonedVoice() {
    speakText(VOICE_CLONE_TEST_PHRASE, settings);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressedOpacity]}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Voice Settings</Text>

        {showCloneStatus && (
          <View style={styles.cloneStatusBlock}>
            <View style={styles.cloneBadge}>
              <Text style={styles.cloneBadgeText}>⭐ Using Your Voice</Text>
            </View>
            <View style={styles.cloneActionsRow}>
              <Pressable
                onPress={handleTestClonedVoice}
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
          </View>
        )}

        {!clone.hasClone && <Text style={styles.systemVoiceLabel}>Using System Voice</Text>}

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
            onTestVoice={handleTestClonedVoice}
            onDismissSuccess={() => {
              clone.startOver();
              setIsRerecording(false);
            }}
          />
        )}

        <View style={styles.section}>
          <VoiceSelector voiceIdentifier={settings.voiceIdentifier} onChange={setVoiceIdentifier} />
        </View>

        <View style={styles.section}>
          <SliderControl
            label="Speed"
            hint="How fast the voice talks"
            value={settings.rate}
            min={VOICE_SETTING_RANGES.rate.min}
            max={VOICE_SETTING_RANGES.rate.max}
            step={VOICE_SETTING_RANGES.rate.step}
            formatValue={(value) => `${value.toFixed(1)}x`}
            onChange={(value) => updateSetting('rate', value)}
          />
        </View>

        <View style={styles.section}>
          <SliderControl
            label="Pitch"
            hint="How high or low the voice sounds"
            value={settings.pitch}
            min={VOICE_SETTING_RANGES.pitch.min}
            max={VOICE_SETTING_RANGES.pitch.max}
            step={VOICE_SETTING_RANGES.pitch.step}
            formatValue={(value) => `${value.toFixed(1)}x`}
            onChange={(value) => updateSetting('pitch', value)}
          />
        </View>

        <View style={styles.section}>
          <SliderControl
            label="Volume"
            hint="How loud the voice is"
            value={settings.volume}
            min={VOICE_SETTING_RANGES.volume.min}
            max={VOICE_SETTING_RANGES.volume.max}
            step={VOICE_SETTING_RANGES.volume.step}
            formatValue={(value) => value.toFixed(1)}
            onChange={(value) => updateSetting('volume', value)}
          />
        </View>

        <Pressable
          onPress={handlePreviewVoice}
          style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}>
          <Text style={styles.previewButtonText}>🔊 Preview Voice</Text>
        </Pressable>

        <Pressable
          onPress={resetSettings}
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VoiceTheme.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingRight: 12,
  },
  backButtonText: {
    color: VoiceTheme.accentStrong,
    fontSize: 17,
    fontWeight: '700',
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 30,
    fontFamily: VoiceFonts.display,
    marginTop: -8,
  },
  systemVoiceLabel: {
    color: VoiceTheme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  cloneStatusBlock: {
    gap: 12,
  },
  cloneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: VoiceTheme.accent,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cloneBadgeText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  cloneActionsRow: {
    flexDirection: 'row',
    gap: 8,
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
  section: {
    gap: 8,
  },
  previewButton: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonPressed: {
    opacity: 0.85,
  },
  previewButtonText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700',
    fontSize: 17,
  },
  resetButton: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
    backgroundColor: VoiceTheme.surface,
  },
  resetButtonPressed: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '700',
    fontSize: 16,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
});
