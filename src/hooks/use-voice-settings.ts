import { useCallback, useEffect, useState } from 'react';

import { ensureUserDataHydrated, syncSetVoiceSettings } from '@/services/user-data-sync';
import { DEFAULT_VOICE_SETTINGS, type VoiceSettings } from '@/types/synced-user-data';

export type { VoiceSettings };
export { DEFAULT_VOICE_SETTINGS };

export const VOICE_SETTING_RANGES = {
  rate: { min: 0.5, max: 2, step: 0.1 },
  pitch: { min: 0.5, max: 2, step: 0.1 },
  volume: { min: 0, max: 1, step: 0.1 },
} as const;

export function useVoiceSettings() {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    ensureUserDataHydrated()
      .then((data) => setSettings(data.voiceSettings))
      .catch((error) => console.warn('[useVoiceSettings] hydrate failed', error))
      .finally(() => setIsLoaded(true));
  }, []);

  const updateSetting = useCallback((key: keyof typeof VOICE_SETTING_RANGES, value: number) => {
    setSettings((previous) => {
      const range = VOICE_SETTING_RANGES[key];
      const clamped = Math.min(range.max, Math.max(range.min, Number(value.toFixed(1))));
      const next = { ...previous, [key]: clamped };
      syncSetVoiceSettings(next).catch(() => undefined);
      return next;
    });
  }, []);

  const setVoiceIdentifier = useCallback((voiceIdentifier: string | null) => {
    setSettings((previous) => {
      const next = { ...previous, voiceIdentifier };
      syncSetVoiceSettings(next).catch(() => undefined);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_VOICE_SETTINGS);
    syncSetVoiceSettings(DEFAULT_VOICE_SETTINGS).catch(() => undefined);
  }, []);

  return { settings, isLoaded, updateSetting, setVoiceIdentifier, resetSettings };
}
