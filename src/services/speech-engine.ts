import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { File, Paths } from 'expo-file-system';
import * as Speech from 'expo-speech';

import { getCloudFunctionUrl } from '@/firebase';

const USER_VOICE_ID_KEY = 'userVoiceId';

let activeSound: Audio.Sound | null = null;

export async function getUserVoiceId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_VOICE_ID_KEY);
}

export async function setUserVoiceId(voiceId: string | null): Promise<void> {
  if (voiceId) {
    await AsyncStorage.setItem(USER_VOICE_ID_KEY, voiceId);
  } else {
    await AsyncStorage.removeItem(USER_VOICE_ID_KEY);
  }
}

async function unloadActiveSound() {
  const sound = activeSound;
  activeSound = null;
  if (!sound) return;
  await sound.stopAsync().catch(() => undefined);
  await sound.unloadAsync().catch(() => undefined);
}

async function speakWithClonedVoice(text: string, voiceId: string, onDone?: () => void) {
  const response = await fetch(getCloudFunctionUrl('speak'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice_id: voiceId }),
  });

  if (!response.ok) {
    throw new Error(`speak function failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const file = new File(Paths.cache, `myvoice-speech-${Date.now()}.mp3`);
  file.write(new Uint8Array(arrayBuffer));

  await unloadActiveSound();

  const { sound } = await Audio.Sound.createAsync({ uri: file.uri }, { shouldPlay: true });
  activeSound = sound;
  sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      onDone?.();
      sound.unloadAsync().catch(() => undefined);
      if (activeSound === sound) activeSound = null;
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
  if (!trimmed) return;

  await stopSpeaking();

  const userVoiceId = await getUserVoiceId();

  if (userVoiceId) {
    try {
      callbacks.onStart?.();
      await speakWithClonedVoice(trimmed, userVoiceId, callbacks.onDone);
      return;
    } catch {
      // Silent fallback to system voice — intentional, no user-facing error.
    }
  }

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
