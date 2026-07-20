import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/firebase';
import {
  DEFAULT_VOICE_SETTINGS,
  type CustomPhrase,
  type HistoryEntry,
  type SyncedUserData,
  type VoiceSettings,
} from '@/types/synced-user-data';

const LOG = '[user-data-sync]';

export const STORAGE_KEYS = {
  userVoiceId: 'userVoiceId',
  customPhrases: 'myvoice:custom-phrases',
  voiceSettings: 'myvoice:voice-settings',
  history: 'myvoice:history',
  onboardingComplete: 'myvoice:onboarding-complete',
} as const;

const EMPTY_DATA: SyncedUserData = {
  userVoiceId: null,
  customPhrases: [],
  voiceSettings: DEFAULT_VOICE_SETTINGS,
  history: [],
  onboardingComplete: false,
  updatedAt: 0,
};

let hydratePromise: Promise<SyncedUserData> | null = null;
let hydrateUid: string | null = null;

function usersDoc(userId: string) {
  return doc(db, 'users', userId);
}

/** Never throws — returns null when logged out. */
function getUid(explicitUid?: string): string | null {
  return explicitUid || auth.currentUser?.uid || null;
}

function emptyUserData(): SyncedUserData {
  return {
    ...EMPTY_DATA,
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS },
    customPhrases: [],
    history: [],
  };
}

function normalizeCloudData(raw: Record<string, unknown> | undefined): SyncedUserData {
  if (!raw) return emptyUserData();

  const voiceSettingsRaw =
    raw.voiceSettings && typeof raw.voiceSettings === 'object'
      ? (raw.voiceSettings as Partial<VoiceSettings>)
      : {};

  return {
    userVoiceId: typeof raw.userVoiceId === 'string' ? raw.userVoiceId : null,
    customPhrases: Array.isArray(raw.customPhrases) ? (raw.customPhrases as CustomPhrase[]) : [],
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, ...voiceSettingsRaw },
    history: Array.isArray(raw.history) ? (raw.history as HistoryEntry[]) : [],
    onboardingComplete:
      typeof raw.onboardingComplete === 'boolean'
        ? raw.onboardingComplete
        : true, // legacy docs without the field skip onboarding
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  };
}

async function readLocalData(): Promise<SyncedUserData> {
  const [userVoiceId, phrasesRaw, settingsRaw, historyRaw, onboardingRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.userVoiceId),
    AsyncStorage.getItem(STORAGE_KEYS.customPhrases),
    AsyncStorage.getItem(STORAGE_KEYS.voiceSettings),
    AsyncStorage.getItem(STORAGE_KEYS.history),
    AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete),
  ]);

  let customPhrases: CustomPhrase[] = [];
  let voiceSettings: VoiceSettings = { ...DEFAULT_VOICE_SETTINGS };
  let history: HistoryEntry[] = [];

  try {
    if (phrasesRaw) customPhrases = JSON.parse(phrasesRaw);
  } catch {
    // ignore corrupt local cache
  }
  try {
    if (settingsRaw) voiceSettings = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(settingsRaw) };
  } catch {
    // ignore
  }
  try {
    if (historyRaw) history = JSON.parse(historyRaw);
  } catch {
    // ignore
  }

  return {
    userVoiceId,
    customPhrases,
    voiceSettings,
    history,
    onboardingComplete: onboardingRaw === 'true',
    updatedAt: Date.now(),
  };
}

async function writeLocalData(data: SyncedUserData): Promise<void> {
  const ops: Promise<void>[] = [
    AsyncStorage.setItem(STORAGE_KEYS.customPhrases, JSON.stringify(data.customPhrases)),
    AsyncStorage.setItem(STORAGE_KEYS.voiceSettings, JSON.stringify(data.voiceSettings)),
    AsyncStorage.setItem(STORAGE_KEYS.history, JSON.stringify(data.history)),
    AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, data.onboardingComplete ? 'true' : 'false'),
  ];

  if (data.userVoiceId) {
    ops.push(AsyncStorage.setItem(STORAGE_KEYS.userVoiceId, data.userVoiceId));
  } else {
    ops.push(AsyncStorage.removeItem(STORAGE_KEYS.userVoiceId));
  }

  await Promise.all(ops);
}

async function writeCloudData(userId: string, partial: Partial<SyncedUserData>): Promise<void> {
  await setDoc(
    usersDoc(userId),
    {
      ...partial,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

async function hydrateFromCloudOrLocal(userId: string): Promise<SyncedUserData> {
  console.log(`${LOG} hydrating for uid`, userId);

  try {
    const snapshot = await getDoc(usersDoc(userId));
    if (snapshot.exists()) {
      const cloud = normalizeCloudData(snapshot.data() as Record<string, unknown>);
      console.log(`${LOG} loaded from Firestore`, {
        hasVoiceId: Boolean(cloud.userVoiceId),
        phrases: cloud.customPhrases.length,
        history: cloud.history.length,
        onboardingComplete: cloud.onboardingComplete,
      });
      await writeLocalData(cloud);
      return cloud;
    }
    console.log(`${LOG} no Firestore doc — falling back to AsyncStorage`);
  } catch (error) {
    console.warn(`${LOG} Firestore read failed — using AsyncStorage`, error);
  }

  const local = await readLocalData();
  const seeded: SyncedUserData = {
    ...EMPTY_DATA,
    ...local,
    onboardingComplete: local.onboardingComplete,
  };

  try {
    await writeCloudData(userId, seeded);
    console.log(`${LOG} seeded Firestore user doc`);
  } catch (error) {
    console.warn(`${LOG} failed to seed Firestore`, error);
  }

  return seeded;
}

export function resetUserDataHydration() {
  hydratePromise = null;
  hydrateUid = null;
}

export async function clearLocalUserCache(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.userVoiceId,
    STORAGE_KEYS.customPhrases,
    STORAGE_KEYS.voiceSettings,
    STORAGE_KEYS.history,
    STORAGE_KEYS.onboardingComplete,
  ]);
}

/**
 * Ensures cloud→local hydration for the signed-in Firebase UID.
 * When logged out, resolves to empty data — never throws.
 */
export function ensureUserDataHydrated(explicitUid?: string): Promise<SyncedUserData> {
  const uid = getUid(explicitUid);
  if (!uid) {
    console.log(`${LOG} skip hydrate — not signed in`);
    return Promise.resolve(emptyUserData());
  }

  if (!hydratePromise || hydrateUid !== uid) {
    hydrateUid = uid;
    hydratePromise = hydrateFromCloudOrLocal(uid).catch((error) => {
      console.warn(`${LOG} hydration failed`, error);
      hydratePromise = null;
      hydrateUid = null;
      return readLocalData();
    });
  }

  return hydratePromise;
}

async function dualWrite(partial: Partial<SyncedUserData>, localWriter: () => Promise<void>): Promise<void> {
  await localWriter();
  const userId = getUid();
  if (!userId) {
    console.log(`${LOG} skip cloud write — not signed in`, Object.keys(partial));
    return;
  }
  try {
    await writeCloudData(userId, partial);
    console.log(`${LOG} dual-write ok`, Object.keys(partial));
  } catch (error) {
    console.warn(`${LOG} Firestore write failed (local cache kept)`, error);
  }
}

export async function syncGetUserVoiceId(): Promise<string | null> {
  if (!getUid()) return null;
  await ensureUserDataHydrated();
  return AsyncStorage.getItem(STORAGE_KEYS.userVoiceId);
}

export async function syncSetUserVoiceId(voiceId: string | null): Promise<void> {
  await dualWrite({ userVoiceId: voiceId }, async () => {
    if (voiceId) {
      await AsyncStorage.setItem(STORAGE_KEYS.userVoiceId, voiceId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.userVoiceId);
    }
  });
}

export async function syncSetCustomPhrases(phrases: CustomPhrase[]): Promise<void> {
  await dualWrite({ customPhrases: phrases }, async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.customPhrases, JSON.stringify(phrases));
  });
}

export async function syncSetVoiceSettings(settings: VoiceSettings): Promise<void> {
  await dualWrite({ voiceSettings: settings }, async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.voiceSettings, JSON.stringify(settings));
  });
}

export async function syncSetHistory(history: HistoryEntry[]): Promise<void> {
  await dualWrite({ history }, async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  });
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await dualWrite({ onboardingComplete: complete }, async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, complete ? 'true' : 'false');
  });
}
