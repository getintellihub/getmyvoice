import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS } from '@/constants/voice-clone';
import { getCloudFunctionUrl } from '@/firebase';

const STORAGE_KEY = 'userVoiceId';
const FRIENDLY_ERROR = 'Something went wrong creating your voice. Please try again in a quiet environment.';

export type VoiceCloneStage = 'intro' | 'recording' | 'recorded' | 'uploading' | 'success' | 'error';

export function useVoiceClone() {
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stage, setStage] = useState<VoiceCloneStage>('intro');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewSoundRef = useRef<Audio.Sound | null>(null);
  const stopRecordingRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setVoiceId(stored))
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      previewSoundRef.current?.unloadAsync().catch(() => undefined);
      recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    clearTimer();
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      recordingUriRef.current = recording.getURI();
      recordingRef.current = null;
      setStage('recorded');
    } catch {
      setErrorMessage(FRIENDLY_ERROR);
      setStage('error');
    }
  }, [clearTimer]);

  stopRecordingRef.current = stopRecording;

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Microphone access is needed to record your voice. Please allow it in your device settings.');
        setStage('error');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      recordingUriRef.current = null;
      setDurationSeconds(0);
      setStage('recording');

      timerRef.current = setInterval(() => {
        setDurationSeconds((previous) => {
          const next = previous + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecordingRef.current();
          }
          return next;
        });
      }, 1000);
    } catch {
      setErrorMessage(FRIENDLY_ERROR);
      setStage('error');
    }
  }, []);

  const playPreview = useCallback(async () => {
    const uri = recordingUriRef.current;
    if (!uri) return;

    try {
      if (previewSoundRef.current) {
        await previewSoundRef.current.unloadAsync().catch(() => undefined);
        previewSoundRef.current = null;
      }
      setIsPlayingPreview(true);
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      previewSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingPreview(false);
        }
      });
    } catch {
      setIsPlayingPreview(false);
    }
  }, []);

  const createVoiceClone = useCallback(async (name: string) => {
    const uri = recordingUriRef.current;
    if (!uri) return;

    if (durationSeconds < MIN_RECORDING_SECONDS) {
      setErrorMessage(`Please record at least ${MIN_RECORDING_SECONDS} seconds so MyVoice can learn your voice.`);
      setStage('error');
      return;
    }

    setStage('uploading');
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim() || 'My Voice');
      formData.append('files', {
        uri,
        name: 'voice-sample.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);

      const response = await fetch(getCloudFunctionUrl('cloneVoice'), {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.voice_id) {
        throw new Error(data?.error || 'Failed to create voice clone');
      }

      await AsyncStorage.setItem(STORAGE_KEY, data.voice_id);
      setVoiceId(data.voice_id);
      setStage('success');
    } catch {
      setErrorMessage(FRIENDLY_ERROR);
      setStage('error');
    }
  }, [durationSeconds]);

  const removeClone = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setVoiceId(null);
    recordingUriRef.current = null;
    setDurationSeconds(0);
    setStage('intro');
  }, []);

  const startOver = useCallback(() => {
    recordingUriRef.current = null;
    setDurationSeconds(0);
    setErrorMessage(null);
    setStage('intro');
  }, []);

  return {
    isLoaded,
    voiceId,
    hasClone: !!voiceId,
    stage,
    durationSeconds,
    errorMessage,
    isPlayingPreview,
    hasRecording: !!recordingUriRef.current,
    startRecording,
    stopRecording,
    playPreview,
    createVoiceClone,
    removeClone,
    startOver,
  };
}
