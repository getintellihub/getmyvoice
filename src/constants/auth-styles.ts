import { VoiceFonts, VoiceTheme, MIN_TOUCH_TARGET } from '@/constants/voice-theme';

/** Shared auth form styles for sign-in / sign-up / forgot-password. */
export const authStyles = {
  safeArea: {
    flex: 1,
    backgroundColor: VoiceTheme.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'center' as const,
    gap: 16,
  },
  brand: {
    color: VoiceTheme.text,
    fontSize: 36,
    fontFamily: VoiceFonts.display,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  subtitle: {
    color: VoiceTheme.textSecondary,
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 12,
    lineHeight: 22,
  },
  label: {
    color: VoiceTheme.textSecondary,
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: -8,
  },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
    backgroundColor: VoiceTheme.surface,
    paddingHorizontal: 14,
    color: VoiceTheme.text,
    fontSize: 16,
  },
  primaryButton: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 16,
    backgroundColor: VoiceTheme.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: VoiceTheme.onAccent,
    fontWeight: '700' as const,
    fontSize: 17,
  },
  googleButton: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 16,
    backgroundColor: VoiceTheme.surface,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  googleButtonText: {
    color: VoiceTheme.text,
    fontWeight: '700' as const,
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: VoiceTheme.border,
  },
  dividerText: {
    color: VoiceTheme.textMuted,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  linkRow: {
    alignItems: 'center' as const,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center' as const,
  },
  linkText: {
    color: VoiceTheme.accentStrong,
    fontWeight: '700' as const,
    fontSize: 15,
  },
  mutedLink: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  errorText: {
    color: VoiceTheme.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: VoiceTheme.success,
    fontSize: 14,
    lineHeight: 20,
  },
};
