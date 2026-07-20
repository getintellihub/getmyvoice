import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getUserVoiceId } from '@/services/speech-engine';

/** Tracks whether the signed-in user has a cloned ElevenLabs voice. */
export function useHasClonedVoice() {
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUserVoiceId()
        .then((id) => {
          if (!active) return;
          setVoiceId(id);
        })
        .finally(() => {
          if (active) setIsLoaded(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return {
    voiceId,
    hasClone: !!voiceId,
    isLoaded,
  };
}
