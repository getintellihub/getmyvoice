import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS } from '@/constants/voice-clone';
import { getCloudFunctionUrl } from '@/firebase';

const STORAGE_KEY = 'userVoiceId';
const FRIENDLY_ERROR = 'Something went wrong creating your voice. Please try again in a quiet environment.';

export type VoiceCloneStage = 'intro' | 'recording' | 'recorded' | 'uploading' | 'success' | 'error';

type RecordingMime = {
  mimeType: string;
  extension: string;
};

function pickWebRecorderMime(): RecordingMime {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: 'audio/webm', extension: 'webm' };
  }
  const candidates: RecordingMime[] = [
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/mp4', extension: 'm4a' },
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported?.(candidate.mimeType)) {
      return candidate;
    }
  }
  return { mimeType: 'audio/webm', extension: 'webm' };
}

export function useVoiceClone() {
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stage, setStage] = useState<VoiceCloneStage>('intro');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  const recordingBlobRef = useRef<Blob | null>(null);
  const recordingMimeRef = useRef<RecordingMime>({ mimeType: 'audio/m4a', extension: 'm4a' });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
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
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingUriRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(recordingUriRef.current);
      }
      webAudioRef.current?.pause();
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    setDurationSeconds(0);
    timerRef.current = setInterval(() => {
      setDurationSeconds((previous) => {
        const next = previous + 1;
        if (next >= MAX_RECORDING_SECONDS) {
          stopRecordingRef.current();
        }
        return next;
      });
    }, 1000);
  }, []);

  const stopWebRecording = useCallback(async () => {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      try {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        } else {
          resolve();
        }
      } catch (error) {
        console.error('[useVoiceClone] MediaRecorder.stop failed', error);
        resolve();
      }
    });

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;

    const mime = recordingMimeRef.current;
    const blob = new Blob(mediaChunksRef.current, { type: mime.mimeType });
    mediaChunksRef.current = [];

    if (blob.size === 0) {
      console.error('[useVoiceClone] Web recording produced empty blob');
      setErrorMessage(FRIENDLY_ERROR);
      setStage('error');
      return;
    }

    if (recordingUriRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(recordingUriRef.current);
    }
    recordingBlobRef.current = blob;
    recordingUriRef.current = URL.createObjectURL(blob);
    console.log('[useVoiceClone] Web recording ready', {
      bytes: blob.size,
      mimeType: blob.type || mime.mimeType,
    });
    setStage('recorded');
  }, [clearTimer]);

  const stopNativeRecording = useCallback(async () => {
    clearTimer();
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      recordingUriRef.current = recording.getURI();
      recordingBlobRef.current = null;
      recordingMimeRef.current = { mimeType: 'audio/m4a', extension: 'm4a' };
      recordingRef.current = null;
      setStage('recorded');
    } catch (error) {
      console.error('[useVoiceClone] Native stopRecording failed', error);
      setErrorMessage(FRIENDLY_ERROR);
      setStage('error');
    }
  }, [clearTimer]);

  const stopRecording = useCallback(async () => {
    if (Platform.OS === 'web') {
      await stopWebRecording();
      return;
    }
    await stopNativeRecording();
  }, [stopNativeRecording, stopWebRecording]);

  stopRecordingRef.current = stopRecording;

  const startWebRecording = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support microphone recording.');
    }
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('This browser does not support MediaRecorder.');
    }

    const mime = pickWebRecorderMime();
    recordingMimeRef.current = mime;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    mediaChunksRef.current = [];

    const recorder = new MediaRecorder(stream, { mimeType: mime.mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        mediaChunksRef.current.push(event.data);
      }
    };
    recorder.onerror = (event) => {
      console.error('[useVoiceClone] MediaRecorder error', event);
    };

    recorder.start(250);
    recordingUriRef.current = null;
    recordingBlobRef.current = null;
    setStage('recording');
    startTimer();
    console.log('[useVoiceClone] Web MediaRecorder started', mime);
  }, [startTimer]);

  const startNativeRecording = useCallback(async () => {
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
    recordingBlobRef.current = null;
    recordingMimeRef.current = { mimeType: 'audio/m4a', extension: 'm4a' };
    setStage('recording');
    startTimer();
  }, [startTimer]);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (Platform.OS === 'web') {
        await startWebRecording();
        return;
      }
      await startNativeRecording();
    } catch (error) {
      console.error('[useVoiceClone] startRecording failed', error);
      setErrorMessage(
        error instanceof Error && error.message.includes('microphone')
          ? error.message
          : FRIENDLY_ERROR,
      );
      setStage('error');
    }
  }, [startNativeRecording, startWebRecording]);

  const playPreview = useCallback(async () => {
    const uri = recordingUriRef.current;
    if (!uri) return;

    try {
      setIsPlayingPreview(true);

      if (Platform.OS === 'web') {
        webAudioRef.current?.pause();
        // Use the browser Audio element — not expo-av's Audio module.
        const BrowserAudio = (globalThis as typeof globalThis & { Audio?: typeof window.Audio }).Audio;
        if (!BrowserAudio) {
          throw new Error('Browser audio playback is unavailable');
        }
        const audio = new BrowserAudio(uri);
        webAudioRef.current = audio;
        audio.onended = () => setIsPlayingPreview(false);
        audio.onerror = (event) => {
          console.error('[useVoiceClone] Web preview playback failed', event);
          setIsPlayingPreview(false);
        };
        await audio.play();
        return;
      }

      if (previewSoundRef.current) {
        await previewSoundRef.current.unloadAsync().catch(() => undefined);
        previewSoundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      previewSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingPreview(false);
        }
      });
    } catch (error) {
      console.error('[useVoiceClone] playPreview failed', error);
      setIsPlayingPreview(false);
    }
  }, []);

  const createVoiceClone = useCallback(
    async (name: string) => {
      const uri = recordingUriRef.current;
      const blob = recordingBlobRef.current;
      if (!uri && !blob) return;

      if (durationSeconds < MIN_RECORDING_SECONDS) {
        setErrorMessage(`Please record at least ${MIN_RECORDING_SECONDS} seconds so MyVoice can learn your voice.`);
        setStage('error');
        return;
      }

      setStage('uploading');
      setErrorMessage(null);

      try {
        const mime = recordingMimeRef.current;
        const filename = `voice-sample.${mime.extension}`;
        const formData = new FormData();
        formData.append('name', name.trim() || 'My Voice');

        if (Platform.OS === 'web') {
          // Browser FormData requires a real Blob/File — RN's { uri, name, type } shape fails on web.
          let uploadBlob = blob;
          if (!uploadBlob && uri) {
            const fetched = await fetch(uri);
            uploadBlob = await fetched.blob();
          }
          if (!uploadBlob || uploadBlob.size === 0) {
            throw new Error('Recording blob is empty');
          }
          formData.append('files', uploadBlob, filename);
          console.log('[useVoiceClone] Uploading web recording', {
            bytes: uploadBlob.size,
            type: uploadBlob.type || mime.mimeType,
            filename,
          });
        } else {
          if (!uri) throw new Error('Missing recording URI');
          formData.append('files', {
            uri,
            name: filename,
            type: mime.mimeType,
          } as unknown as Blob);
          console.log('[useVoiceClone] Uploading native recording', { uri, filename, mimeType: mime.mimeType });
        }

        const response = await fetch(getCloudFunctionUrl('cloneVoice'), {
          method: 'POST',
          body: formData,
        });
        const data = await response.json().catch(() => ({}));

        console.log('[useVoiceClone] cloneVoice response', {
          status: response.status,
          ok: response.ok,
          data,
        });

        if (!response.ok || !data.voice_id) {
          const detail = data?.detail || data?.error || `HTTP ${response.status}`;
          console.error('[useVoiceClone] cloneVoice failed', detail, data);
          throw new Error(typeof detail === 'string' ? detail : FRIENDLY_ERROR);
        }

        await AsyncStorage.setItem(STORAGE_KEY, data.voice_id);
        setVoiceId(data.voice_id);
        setStage('success');
      } catch (error) {
        console.error('[useVoiceClone] createVoiceClone failed', error);
        setErrorMessage(FRIENDLY_ERROR);
        setStage('error');
      }
    },
    [durationSeconds],
  );

  const removeClone = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setVoiceId(null);
    recordingUriRef.current = null;
    recordingBlobRef.current = null;
    setDurationSeconds(0);
    setStage('intro');
  }, []);

  const startOver = useCallback(() => {
    if (recordingUriRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(recordingUriRef.current);
    }
    recordingUriRef.current = null;
    recordingBlobRef.current = null;
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
    hasRecording: !!(recordingUriRef.current || recordingBlobRef.current),
    startRecording,
    stopRecording,
    playPreview,
    createVoiceClone,
    removeClone,
    startOver,
  };
}
