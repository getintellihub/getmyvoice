import * as Speech from 'expo-speech';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HistoryModal } from '@/components/history-modal';
import { PhraseGrid } from '@/components/phrase-grid';
import { VoiceSettingsModal } from '@/components/voice-settings-modal';
import { CATEGORIES, CategoryId, DEFAULT_PHRASES } from '@/constants/phrases';
import { VoiceTheme } from '@/constants/voice-theme';
import { useCustomPhrases } from '@/hooks/use-custom-phrases';
import { useHistory } from '@/hooks/use-history';
import { useVoiceSettings } from '@/hooks/use-voice-settings';

export default function MyVoiceScreen() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('greetings');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const { settings, updateSetting, resetSettings } = useVoiceSettings();
  const { history, addToHistory, clearHistory } = useHistory();
  const { phrases: customPhrases, addPhrase, removePhrase } = useCustomPhrases();

  const activeCategoryMeta = useMemo(
    () => CATEGORIES.find((category) => category.id === activeCategory) ?? CATEGORIES[0],
    [activeCategory],
  );

  function speak(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(trimmed, {
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    addToHistory(trimmed);
  }

  function speakTypedText() {
    speak(inputText);
    setInputText('');
  }

  function handlePreviewVoice() {
    Speech.stop();
    Speech.speak('This is how I sound.', {
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
    });
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
              accessibilityLabel="Voice settings"
              onPress={() => setSettingsVisible(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
              <Text style={styles.iconButtonText}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.typeCard}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type what you want to say..."
            placeholderTextColor={VoiceTheme.textMuted}
            style={styles.textInput}
            multiline
          />
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
            phrases={activeCategory === 'custom' ? [] : DEFAULT_PHRASES[activeCategory]}
            onSpeak={speak}
            isCustom={activeCategory === 'custom'}
            customPhrases={customPhrases}
            onAddCustomPhrase={addPhrase}
            onRemoveCustomPhrase={removePhrase}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <VoiceSettingsModal
        visible={settingsVisible}
        settings={settings}
        onChange={updateSetting}
        onReset={resetSettings}
        onClose={() => setSettingsVisible(false)}
        onPreview={handlePreviewVoice}
      />

      <HistoryModal
        visible={historyVisible}
        history={history}
        onClose={() => setHistoryVisible(false)}
        onSpeakAgain={speak}
        onClear={clearHistory}
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
    fontSize: 28,
    fontWeight: '800',
  },
  appSubtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginTop: 8,
    backgroundColor: VoiceTheme.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
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
  speakButton: {
    backgroundColor: VoiceTheme.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
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
    color: '#04121F',
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
    color: '#04121F',
  },
  phraseScroll: {
    flex: 1,
    marginTop: 16,
  },
  phraseScrollContent: {
    paddingHorizontal: 20,
  },
});
