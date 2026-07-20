/**
 * Backend API base URL (Railway Express server).
 * The ElevenLabs API key lives only on the server as ELEVENLABS_API_KEY —
 * it is never shipped in the app.
 *
 * Override locally with EXPO_PUBLIC_API_URL if needed.
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'https://getmyvoice-production.up.railway.app';

export const API_ROUTES = {
  cloneVoice: '/api/clone-voice',
  speak: '/api/speak',
};

/**
 * Builds a full URL for an Express API route on Railway.
 * Accepts either a route key ("cloneVoice" | "speak") or a path ("/api/...").
 */
export function getApiUrl(routeOrPath) {
  if (routeOrPath.startsWith('http://') || routeOrPath.startsWith('https://')) {
    return routeOrPath;
  }

  const path = API_ROUTES[routeOrPath] || routeOrPath;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** @deprecated Use getApiUrl — kept so older imports keep working during migration. */
export function getCloudFunctionUrl(functionName) {
  return getApiUrl(functionName);
}
