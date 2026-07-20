import {
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  type AudioPlayer,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { getApiUrl } from '@/api';
import { MAX_RECORDING_SECONDS, MIN_RECORDING_SECONDS } from '@/constants/voice-clone';
import { getUserVoiceId, setUserVoiceId } from '@/services/speech-engine';

const STORAGE_KEY = 'userVoiceId';
const LOG = '[useVoiceClone]';
const FRIENDLY_ERROR = 'Something went wrong creating your voice. Please try again in a quiet environment.';
const MIC_DENIED_ERROR =
  'Microphone permission was denied. On iPhone, open Settings → Expo Go → Microphone, turn it on, then try again.';

export type VoiceCloneStage = 'intro' | 'recording' | 'recorded' | 'uploading' | 'success' | 'error';

type RecordingMime = {
  mimeType: string;
  extension: string;
};

function recordingMimeForPlatform(): RecordingMime {
  if (Platform.OS === 'web') {
    return { mimeType: 'audio/webm', extension: 'webm' };
  }
  return { mimeType: 'audio/m4a', extension: 'm4a' };
}

function formatCaughtError(error: unknown, fallback = FRIENDLY_ERROR): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return fallback;
}

function formatServerError(data: Record<string, unknown>, status: number): string {
  const detail = data?.detail;
  const error = data?.error;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail);
    } catch {
      // fall through
    }
  }
  return `Clone request failed (HTTP ${status}).`;
}

export function useVoiceClone() {
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stage, setStage] = useState<VoiceCloneStage>('intro');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const previewPlayer = useAudioPlayer(null);
  const previewStatus = useAudioPlayerStatus(previewPlayer);

  const recordingUriRef = useRef<string | null>(null);
  const recordingMimeRef = useRef<RecordingMime>(recordingMimeForPlatform());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRecordingRef = useRef<() => Promise<void>>(async () => undefined);
  const previewFallbackPlayerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    getUserVoiceId()
      .then((stored) => {
        console.log(`${LOG} hydrated from AsyncStorage`, { key: STORAGE_KEY, voiceId: stored });
        setVoiceId(stored);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (previewStatus.didJustFinish) {
      setIsPlayingPreview(false);
    }
  }, [previewStatus.didJustFinish]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        if (audioRecorder.isRecording) {
          audioRecorder.stop().catch(() => undefined);
        }
      } catch {
        // ignore
      }
      try {
        previewFallbackPlayerRef.current?.remove();
      } catch {
        // ignore
      }
    };
  }, [audioRecorder]);

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

  const stopRecording = useCallback(async () => {
    clearTimer();

    try {
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }

      const uri = audioRecorder.uri;
      if (!uri) {
        throw new Error('Recording finished but no audio file was saved. Please try again.');
      }

      recordingUriRef.current = uri;
      recordingMimeRef.current = recordingMimeForPlatform();
      setHasRecording(true);
      console.log(`${LOG} Recording ready (expo-audio)`, { uri, mime: recordingMimeRef.current });
      setStage('recorded');
    } catch (error) {
      console.error(`${LOG} stopRecording failed`, error);
      setErrorMessage(formatCaughtError(error));
      setStage('error');
    }
  }, [audioRecorder, clearTimer]);

  stopRecordingRef.current = stopRecording;

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      console.log(`${LOG} Requesting microphone permission…`);
      const permission = await requestRecordingPermissionsAsync();
      console.log(`${LOG} Microphone permission result`, permission);

      if (!permission.granted) {
        setErrorMessage(MIC_DENIED_ERROR);
        setStage('error');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      recordingUriRef.current = null;
      setHasRecording(false);
      recordingMimeRef.current = recordingMimeForPlatform();

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setStage('recording');
      startTimer();
      console.log(`${LOG} expo-audio HIGH_QUALITY recording started`);
    } catch (error) {
      console.error(`${LOG} startRecording failed`, error);
      const message = formatCaughtError(error);
      const lower = message.toLowerCase();
      if (lower.includes('permission') || lower.includes('not authorized') || lower.includes('denied')) {
        setErrorMessage(MIC_DENIED_ERROR);
      } else {
        setErrorMessage(message);
      }
      setStage('error');
    }
  }, [audioRecorder, startTimer]);

  const playPreview = useCallback(async () => {
    const uri = recordingUriRef.current;
    if (!uri) return;

    try {
      setIsPlayingPreview(true);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      console.log(`${LOG} playPreview via expo-audio`, { uri: uri.slice(0, 120) });
      previewPlayer.replace({ uri });
      previewPlayer.seekTo(0).catch(() => undefined);
      previewPlayer.play();
    } catch (error) {
      console.error(`${LOG} playPreview failed`, error);
      // Fallback path using createAudioPlayer if hook player fails
      try {
        previewFallbackPlayerRef.current?.remove();
        const player = createAudioPlayer({ uri });
        previewFallbackPlayerRef.current = player;
        player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            setIsPlayingPreview(false);
            player.remove();
            if (previewFallbackPlayerRef.current === player) {
              previewFallbackPlayerRef.current = null;
            }
          }
        });
        player.play();
      } catch (fallbackError) {
        console.error(`${LOG} playPreview fallback failed`, fallbackError);
        setIsPlayingPreview(false);
        setErrorMessage(formatCaughtError(error, 'Could not play the recording preview.'));
      }
    }
  }, [previewPlayer]);

  const createVoiceClone = useCallback(
    async (name: string) => {
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
        const mime = recordingMimeRef.current;
        const filename = `voice-sample.${mime.extension}`;
        const formData = new FormData();
        formData.append('name', name.trim() || 'My Voice');

        if (Platform.OS === 'web') {
          const fetched = await fetch(uri);
          const uploadBlob = await fetched.blob();
          if (!uploadBlob.size) {
            throw new Error('Recording blob is empty');
          }
          formData.append('files', uploadBlob, filename);
          console.log(`${LOG} Uploading web recording`, {
            bytes: uploadBlob.size,
            type: uploadBlob.type || mime.mimeType,
            filename,
          });
        } else {
          formData.append('files', {
            uri,
            name: filename,
            type: mime.mimeType,
          } as unknown as Blob);
          console.log(`${LOG} Uploading native recording`, {
            uri,
            filename,
            mimeType: mime.mimeType,
            durationSeconds,
          });
        }

        const response = await fetch(getApiUrl('cloneVoice'), {
          method: 'POST',
          body: formData,
        });

        const rawText = await response.text();
        let data: Record<string, unknown> = {};
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          data = { raw: rawText };
        }

        const voiceIdFromServer = data.voice_id != null ? String(data.voice_id) : null;
        console.log(`${LOG} cloneVoice response`, {
          status: response.status,
          ok: response.ok,
          voice_id: voiceIdFromServer,
          data,
          rawText: rawText.slice(0, 2000),
        });

        if (!response.ok || !voiceIdFromServer) {
          const detail = formatServerError(data, response.status);
          console.error(`${LOG} cloneVoice failed`, detail, data);
          throw new Error(detail);
        }

        console.log(`${LOG} cloneVoice succeeded — saving userVoiceId`, voiceIdFromServer);
        await setUserVoiceId(voiceIdFromServer);
        const verified = await getUserVoiceId();
        console.log(`${LOG} AsyncStorage verify after save`, {
          key: STORAGE_KEY,
          expected: voiceIdFromServer,
          actual: verified,
          matches: verified === voiceIdFromServer,
        });
        setVoiceId(voiceIdFromServer);
        setStage('success');
      } catch (error) {
        console.error(`${LOG} createVoiceClone failed`, error);
        setErrorMessage(formatCaughtError(error));
        setStage('error');
      }
    },
    [durationSeconds],
  );

  const removeClone = useCallback(async () => {
    console.log(`${LOG} removeClone clearing userVoiceId`);
    await setUserVoiceId(null);
    setVoiceId(null);
    recordingUriRef.current = null;
    setHasRecording(false);
    setDurationSeconds(0);
    setErrorMessage(null);
    setStage('intro');
  }, []);

  /** Clear saved clone and return to the intro recording UI. */
  const resetClone = useCallback(async () => {
    console.log(`${LOG} resetClone`);
    await removeClone();
  }, [removeClone]);

  /**
   * Clear the existing clone and prepare a fresh recording session
   * (same storage clear as reset, then leave stage on intro).
   */
  const reclone = useCallback(async () => {
    console.log(`${LOG} reclone — clearing voice and returning to recording UI`);
    await removeClone();
  }, [removeClone]);

  const startOver = useCallback(() => {
    recordingUriRef.current = null;
    setHasRecording(false);
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
    hasRecording,
    startRecording,
    stopRecording,
    playPreview,
    createVoiceClone,
    removeClone,
    resetClone,
    reclone,
    startOver,
  };
}
