import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const FALLBACK_DEVICE_ID_KEY = 'myvoice:device-user-id';
const LOG = '[device-id]';

/**
 * Stable per-install identifier used as the Firestore `users/{id}` document
 * key until real auth exists.
 *
 * - Android: Application.getAndroidId()
 * - iOS: identifierForVendor
 * - Web / fallback: UUID persisted in AsyncStorage
 */
export async function getDeviceUserId(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      const androidId = Application.getAndroidId();
      if (androidId) {
        const id = `android-${androidId}`;
        console.log(`${LOG} using Android id`);
        return id;
      }
    }

    if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId) {
        const id = `ios-${iosId}`;
        console.log(`${LOG} using iOS vendor id`);
        return id;
      }
    }
  } catch (error) {
    console.warn(`${LOG} native id lookup failed, falling back to stored UUID`, error);
  }

  const existing = await AsyncStorage.getItem(FALLBACK_DEVICE_ID_KEY);
  if (existing) {
    console.log(`${LOG} using stored fallback id`);
    return existing;
  }

  const generated =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? `web-${globalThis.crypto.randomUUID()}`
      : `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  await AsyncStorage.setItem(FALLBACK_DEVICE_ID_KEY, generated);
  console.log(`${LOG} created fallback id`);
  return generated;
}
