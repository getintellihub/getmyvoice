import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'myvoice:voice-settings';

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceIdentifier: string | null;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  rate: 1,
  pitch: 1,
  volume: 1,
  voiceIdentifier: null,
};

export const VOICE_SETTING_RANGES = {
  rate: { min: 0.5, max: 2, step: 0.1 },
  pitch: { min: 0.5, max: 2, step: 0.1 },
  volume: { min: 0, max: 1, step: 0.1 },
} as const;

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) });
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const updateSetting = useCallback((key: keyof typeof VOICE_SETTING_RANGES, value: number) => {
    setSettings((previous) => {
      const range = VOICE_SETTING_RANGES[key];
      const clamped = Math.min(range.max, Math.max(range.min, Number(value.toFixed(1))));
      const next = { ...previous, [key]: clamped };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const setVoiceIdentifier = useCallback((voiceIdentifier: string | null) => {
    setSettings((previous) => {
      const next = { ...previous, voiceIdentifier };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_VOICE_SETTINGS);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VOICE_SETTINGS)).catch(() => undefined);
  }, []);

  return { settings, isLoaded, updateSetting, setVoiceIdentifier, resetSettings };
}
