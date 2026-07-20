import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AutoSpeakScheduleModal } from '@/components/auto-speak-schedule-modal';
import { GreetingBanner } from '@/components/greeting-banner';
import { HistoryModal } from '@/components/history-modal';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { PhraseGrid } from '@/components/phrase-grid';
import { QuickCommandsFab } from '@/components/quick-commands-fab';
import { CATEGORIES, CategoryId, DEFAULT_PHRASES } from '@/constants/phrases';
import { MIN_TOUCH_TARGET, VoiceFonts, VoiceTheme } from '@/constants/voice-theme';
import { useAutoSpeakSchedule } from '@/hooks/use-auto-speak-schedule';
import { useCustomPhrases } from '@/hooks/use-custom-phrases';
import { useHistory } from '@/hooks/use-history';
import { useTimeGreeting } from '@/hooks/use-time-greeting';
import { useVoiceSettings } from '@/hooks/use-voice-settings';
import { useAuth } from '@/providers/auth-provider';
import { speakText, stopSpeaking as stopSpeechEngine } from '@/services/speech-engine';

const MAX_CHARACTERS = 500;

export default function MyVoiceScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('greetings');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);

  const { onboardingLoaded, hasCompletedOnboarding, markOnboardingComplete, user } = useAuth();
  const { settings } = useVoiceSettings();
  const { history, addToHistory, clearHistory } = useHistory();
  const { phrases: myPhrases, addPhrase, removePhrase } = useCustomPhrases();
  const timeGreeting = useTimeGreeting();

  const activeCategoryMeta = useMemo(
    () => CATEGORIES.find((category) => category.id === activeCategory) ?? CATEGORIES[0],
    [activeCategory],
  );

  function speak(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    console.log('[MyVoice] speak() → speakText', {
      textPreview: trimmed.slice(0, 80),
      uid: user?.uid,
    });
    speakText(trimmed, settings, {
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    addToHistory(trimmed);
  }

  function stopSpeaking() {
    stopSpeechEngine();
    setIsSpeaking(false);
  }

  function clearInput() {
    setInputText('');
  }

  const { schedule, toggleEntry } = useAutoSpeakSchedule(speak);

  function speakTypedText() {
    if (!inputText.trim()) return;
    speak(inputText);
    setInputText('');
  }

  if (!onboardingLoaded) {
    return <View style={styles.safeArea} />;
  }

  // First-run onboarding only — returning logins skip via Firestore flag.
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingScreen
        onContinue={() => {
          void markOnboardingComplete();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>MyVoice</Text>
            <Text style={styles.appSubtitle}>Type or tap to speak</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Recently spoken history"
              onPress={() => setHistoryVisible(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
              <Text style={styles.iconButtonText}>🕘</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Auto-speak schedule"
              onPress={() => setScheduleVisible(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
              <Text style={styles.iconButtonText}>⏰</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Voice settings"
              onPress={() => router.push('/voice-settings' as Href)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
              <Text style={styles.iconButtonText}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        {!greetingDismissed && (
          <GreetingBanner greeting={timeGreeting} onSpeak={speak} onDismiss={() => setGreetingDismissed(true)} />
        )}

        <View style={styles.typeCard}>
          <TextInput
            value={inputText}
            onChangeText={(text) => setInputText(text.slice(0, MAX_CHARACTERS))}
            placeholder="Type what you want to say…"
            placeholderTextColor={VoiceTheme.textMuted}
            style={styles.textInput}
            multiline
            maxLength={MAX_CHARACTERS}
            submitBehavior="submit"
            onSubmitEditing={speakTypedText}
          />
          <View style={styles.typeMetaRow}>
            <Text style={styles.hintText}>⏎ Press Enter to speak</Text>
            <Text style={styles.charCounter}>
              {inputText.length}/{MAX_CHARACTERS}
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <Pressable
              disabled={!inputText.trim()}
              onPress={speakTypedText}
              style={({ pressed }) => [
                styles.speakButton,
                !inputText.trim() && styles.speakButtonDisabled,
                pressed && !!inputText.trim() && styles.speakButtonPressed,
              ]}>
              <Text style={styles.speakButtonText}>{isSpeaking ? '🔊 Speaking…' : '🔊 Speak'}</Text>
            </Pressable>
            <Pressable
              disabled={!isSpeaking}
              onPress={stopSpeaking}
              style={({ pressed }) => [
                styles.stopButton,
                !isSpeaking && styles.stopButtonDisabled,
                pressed && isSpeaking && styles.stopButtonPressed,
              ]}>
              <Text style={[styles.stopButtonText, !isSpeaking && styles.stopButtonTextDisabled]}>⏹ Stop</Text>
            </Pressable>
            <Pressable
              disabled={!inputText}
              onPress={clearInput}
              style={({ pressed }) => [
                styles.clearButton,
                !inputText && styles.clearButtonDisabled,
                pressed && !!inputText && styles.clearButtonPressed,
              ]}>
              <Text style={[styles.clearButtonText, !inputText && styles.clearButtonTextDisabled]}>✕ Clear</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}>
          {CATEGORIES.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <Pressable
                key={category.id}
                onPress={() => setActiveCategory(category.id)}
                style={({ pressed }) => [
                  styles.categoryPill,
                  isActive && { backgroundColor: category.color, borderColor: category.color },
                  pressed && styles.categoryPillPressed,
                ]}>
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.phraseScroll} contentContainerStyle={styles.phraseScrollContent}>
          <PhraseGrid
            categoryColor={activeCategoryMeta.color}
            phrases={activeCategory === 'myPhrases' ? [] : DEFAULT_PHRASES[activeCategory]}
            onSpeak={speak}
            isMyPhrases={activeCategory === 'myPhrases'}
            myPhrases={myPhrases}
            onAddPhrase={addPhrase}
            onRemovePhrase={removePhrase}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <QuickCommandsFab onSpeak={speak} />

      <HistoryModal
        visible={historyVisible}
        history={history}
        onClose={() => setHistoryVisible(false)}
        onSpeakAgain={speak}
        onClear={clearHistory}
      />

      <AutoSpeakScheduleModal
        visible={scheduleVisible}
        schedule={schedule}
        onClose={() => setScheduleVisible(false)}
        onToggle={toggleEntry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VoiceTheme.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appTitle: {
    color: VoiceTheme.text,
    fontSize: 30,
    fontFamily: VoiceFonts.display,
  },
  appSubtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: VoiceTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  iconButtonText: {
    fontSize: 18,
  },
  typeCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: VoiceTheme.surface,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  textInput: {
    minHeight: 56,
    maxHeight: 120,
    color: VoiceTheme.text,
    fontSize: 17,
    textAlignVertical: 'top',
  },
  typeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintText: {
    color: VoiceTheme.textMuted,
    fontSize: 12,
  },
  charCounter: {
    color: VoiceTheme.textMuted,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  speakButton: {
    flex: 2,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakButtonDisabled: {
    backgroundColor: VoiceTheme.surfaceElevated,
  },
  speakButtonPressed: {
    opacity: 0.85,
  },
  speakButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: VoiceTheme.onAccent,
  },
  stopButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.danger,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonDisabled: {
    backgroundColor: VoiceTheme.surfaceElevated,
  },
  stopButtonPressed: {
    opacity: 0.85,
  },
  stopButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: VoiceTheme.onAccent,
  },
  stopButtonTextDisabled: {
    color: VoiceTheme.textMuted,
  },
  clearButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: VoiceTheme.surfaceElevated,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  clearButtonDisabled: {
    opacity: 0.6,
  },
  clearButtonPressed: {
    opacity: 0.7,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: VoiceTheme.textSecondary,
  },
  clearButtonTextDisabled: {
    color: VoiceTheme.textMuted,
  },
  categoryScroll: {
    marginTop: 18,
    flexGrow: 0,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: VoiceTheme.surface,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  categoryPillPressed: {
    opacity: 0.7,
  },
  categoryEmoji: {
    fontSize: 15,
  },
  categoryLabel: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  categoryLabelActive: {
    color: VoiceTheme.onAccent,
  },
  phraseScroll: {
    flex: 1,
    marginTop: 16,
  },
  phraseScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
});
