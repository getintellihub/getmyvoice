import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '@/firebase';
import { getDeviceUserId } from '@/services/device-id';
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
} as const;

const EMPTY_DATA: SyncedUserData = {
  userVoiceId: null,
  customPhrases: [],
  voiceSettings: DEFAULT_VOICE_SETTINGS,
  history: [],
  updatedAt: 0,
};

let hydratePromise: Promise<SyncedUserData> | null = null;

function usersDoc(userId: string) {
  return doc(db, 'users', userId);
}

function hasLocalContent(data: SyncedUserData): boolean {
  return Boolean(
    data.userVoiceId ||
      data.customPhrases.length > 0 ||
      data.history.length > 0 ||
      data.voiceSettings.voiceIdentifier ||
      data.voiceSettings.rate !== DEFAULT_VOICE_SETTINGS.rate ||
      data.voiceSettings.pitch !== DEFAULT_VOICE_SETTINGS.pitch ||
      data.voiceSettings.volume !== DEFAULT_VOICE_SETTINGS.volume,
  );
}

function normalizeCloudData(raw: Record<string, unknown> | undefined): SyncedUserData {
  if (!raw) return { ...EMPTY_DATA, voiceSettings: { ...DEFAULT_VOICE_SETTINGS } };

  const voiceSettingsRaw =
    raw.voiceSettings && typeof raw.voiceSettings === 'object'
      ? (raw.voiceSettings as Partial<VoiceSettings>)
      : {};

  return {
    userVoiceId: typeof raw.userVoiceId === 'string' ? raw.userVoiceId : null,
    customPhrases: Array.isArray(raw.customPhrases) ? (raw.customPhrases as CustomPhrase[]) : [],
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS, ...voiceSettingsRaw },
    history: Array.isArray(raw.history) ? (raw.history as HistoryEntry[]) : [],
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  };
}

async function readLocalData(): Promise<SyncedUserData> {
  const [userVoiceId, phrasesRaw, settingsRaw, historyRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.userVoiceId),
    AsyncStorage.getItem(STORAGE_KEYS.customPhrases),
    AsyncStorage.getItem(STORAGE_KEYS.voiceSettings),
    AsyncStorage.getItem(STORAGE_KEYS.history),
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
    updatedAt: Date.now(),
  };
}

async function writeLocalData(data: SyncedUserData): Promise<void> {
  const ops: Promise<void>[] = [
    AsyncStorage.setItem(STORAGE_KEYS.customPhrases, JSON.stringify(data.customPhrases)),
    AsyncStorage.setItem(STORAGE_KEYS.voiceSettings, JSON.stringify(data.voiceSettings)),
    AsyncStorage.setItem(STORAGE_KEYS.history, JSON.stringify(data.history)),
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

async function hydrateFromCloudOrLocal(): Promise<SyncedUserData> {
  const userId = await getDeviceUserId();
  console.log(`${LOG} hydrating for user`, userId);

  try {
    const snapshot = await getDoc(usersDoc(userId));
    if (snapshot.exists()) {
      const cloud = normalizeCloudData(snapshot.data() as Record<string, unknown>);
      console.log(`${LOG} loaded from Firestore`, {
        hasVoiceId: Boolean(cloud.userVoiceId),
        phrases: cloud.customPhrases.length,
        history: cloud.history.length,
      });
      await writeLocalData(cloud);
      return cloud;
    }
    console.log(`${LOG} no Firestore doc — falling back to AsyncStorage`);
  } catch (error) {
    console.warn(`${LOG} Firestore read failed — using AsyncStorage`, error);
  }

  const local = await readLocalData();
  if (hasLocalContent(local)) {
    try {
      await writeCloudData(userId, local);
      console.log(`${LOG} seeded Firestore from local AsyncStorage`);
    } catch (error) {
      console.warn(`${LOG} failed to seed Firestore from local data`, error);
    }
  }
  return local;
}

/** Ensures cloud→local (or local fallback) hydration runs once per app session. */
export function ensureUserDataHydrated(): Promise<SyncedUserData> {
  if (!hydratePromise) {
    hydratePromise = hydrateFromCloudOrLocal().catch((error) => {
      console.warn(`${LOG} hydration failed`, error);
      hydratePromise = null;
      return readLocalData();
    });
  }
  return hydratePromise;
}

async function dualWrite(partial: Partial<SyncedUserData>, localWriter: () => Promise<void>): Promise<void> {
  await localWriter();
  try {
    const userId = await getDeviceUserId();
    await writeCloudData(userId, partial);
    console.log(`${LOG} dual-write ok`, Object.keys(partial));
  } catch (error) {
    console.warn(`${LOG} Firestore write failed (local cache kept)`, error);
  }
}

export async function syncGetUserVoiceId(): Promise<string | null> {
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
