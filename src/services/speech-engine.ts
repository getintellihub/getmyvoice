import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { getApiUrl } from '@/api';

const USER_VOICE_ID_KEY = 'userVoiceId';
const LOG = '[speech-engine]';

let activeSound: Audio.Sound | null = null;

export async function getUserVoiceId(): Promise<string | null> {
  const value = await AsyncStorage.getItem(USER_VOICE_ID_KEY);
  console.log(`${LOG} getUserVoiceId key="${USER_VOICE_ID_KEY}" →`, value);
  return value;
}

export async function setUserVoiceId(voiceId: string | null): Promise<void> {
  if (voiceId) {
    await AsyncStorage.setItem(USER_VOICE_ID_KEY, voiceId);
    console.log(`${LOG} setUserVoiceId saved key="${USER_VOICE_ID_KEY}" value=`, voiceId);
  } else {
    await AsyncStorage.removeItem(USER_VOICE_ID_KEY);
    console.log(`${LOG} setUserVoiceId removed key="${USER_VOICE_ID_KEY}"`);
  }
}

async function unloadActiveSound() {
  const sound = activeSound;
  activeSound = null;
  if (!sound) return;
  await sound.stopAsync().catch(() => undefined);
  await sound.unloadAsync().catch(() => undefined);
}

async function createPlayableUri(arrayBuffer: ArrayBuffer): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
    const uri = URL.createObjectURL(blob);
    console.log(`${LOG} speakWithClonedVoice created web blob URI`, { byteLength: arrayBuffer.byteLength });
    return uri;
  }

  const file = new File(Paths.cache, `myvoice-speech-${Date.now()}.mp3`);
  file.write(new Uint8Array(arrayBuffer));
  console.log(`${LOG} speakWithClonedVoice wrote cache file`, {
    uri: file.uri,
    byteLength: arrayBuffer.byteLength,
  });
  return file.uri;
}

async function speakWithClonedVoice(text: string, voiceId: string, onDone?: () => void) {
  const speakUrl = getApiUrl('speak');
  console.log(`${LOG} speakWithClonedVoice calling API`, {
    url: speakUrl,
    voice_id: voiceId,
    textPreview: text.slice(0, 80),
  });

  const response = await fetch(speakUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice_id: voiceId }),
  });

  console.log(`${LOG} speakWithClonedVoice response`, {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type'),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`speak function failed with status ${response.status}: ${errorBody.slice(0, 300)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log(`${LOG} speakWithClonedVoice audio bytes`, arrayBuffer.byteLength);

  if (!arrayBuffer.byteLength) {
    throw new Error('speak function returned empty audio');
  }

  const uri = await createPlayableUri(arrayBuffer);

  await unloadActiveSound();

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  }).catch((error) => {
    console.warn(`${LOG} setAudioModeAsync warning`, error);
  });

  console.log(`${LOG} speakWithClonedVoice starting playback`, { uri: uri.slice(0, 120) });
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  activeSound = sound;
  sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      console.log(`${LOG} speakWithClonedVoice playback finished`);
      onDone?.();
      sound.unloadAsync().catch(() => undefined);
      if (activeSound === sound) activeSound = null;
      if (Platform.OS === 'web' && uri.startsWith('blob:')) {
        URL.revokeObjectURL(uri);
      }
    }
  });
}

export interface SpeakVoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceIdentifier: string | null;
}

export interface SpeakCallbacks {
  onStart?: () => void;
  onDone?: () => void;
  onError?: () => void;
}

/**
 * Speaks `text` using the user's cloned ElevenLabs voice if one exists,
 * otherwise falls back to the on-device system voice via expo-speech.
 * Per spec: if the cloud "speak" call fails, we fall back silently —
 * no error is ever shown to the user for this path.
 */
export async function speakText(text: string, settings: SpeakVoiceSettings, callbacks: SpeakCallbacks = {}): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    console.log(`${LOG} speakText skipped empty text`);
    return;
  }

  console.log(`${LOG} speakText start`, {
    textPreview: trimmed.slice(0, 80),
    systemVoice: settings.voiceIdentifier,
  });

  await stopSpeaking();

  const userVoiceId = await getUserVoiceId();

  if (userVoiceId) {
    console.log(`${LOG} speakText found userVoiceId — using ElevenLabs`, userVoiceId);
    try {
      callbacks.onStart?.();
      await speakWithClonedVoice(trimmed, userVoiceId, callbacks.onDone);
      console.log(`${LOG} speakText ElevenLabs path succeeded`);
      return;
    } catch (error) {
      console.error(`${LOG} speakText ElevenLabs failed — falling back to expo-speech`, error);
      // Silent fallback to system voice — intentional, no user-facing error.
    }
  } else {
    console.log(`${LOG} speakText no userVoiceId in AsyncStorage — using expo-speech`);
  }

  console.log(`${LOG} speakText using system voice (expo-speech)`, {
    rate: settings.rate,
    pitch: settings.pitch,
    voice: settings.voiceIdentifier,
  });
  callbacks.onStart?.();
  Speech.speak(trimmed, {
    rate: settings.rate,
    pitch: settings.pitch,
    volume: settings.volume,
    voice: settings.voiceIdentifier ?? undefined,
    onDone: () => callbacks.onDone?.(),
    onStopped: () => callbacks.onDone?.(),
    onError: () => callbacks.onError?.(),
  });
}

export async function stopSpeaking(): Promise<void> {
  Speech.stop();
  await unloadActiveSound();
}
