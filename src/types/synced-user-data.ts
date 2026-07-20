export interface CustomPhrase {
  id: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  text: string;
  spokenAt: number;
}

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

export type SyncedUserData = {
  userVoiceId: string | null;
  customPhrases: CustomPhrase[];
  voiceSettings: VoiceSettings;
  history: HistoryEntry[];
  updatedAt: number;
};
