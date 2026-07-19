import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { VoiceTheme } from '@/constants/voice-theme';
import { VOICE_SETTING_RANGES, VoiceSettings } from '@/hooks/use-voice-settings';

interface VoiceSettingsModalProps {
  visible: boolean;
  settings: VoiceSettings;
  onChange: (key: keyof VoiceSettings, value: number) => void;
  onReset: () => void;
  onClose: () => void;
  onPreview: () => void;
}

const ROWS: { key: keyof VoiceSettings; label: string; hint: string }[] = [
  { key: 'rate', label: 'Speed', hint: 'How fast the voice talks' },
  { key: 'pitch', label: 'Pitch', hint: 'How high or low the voice sounds' },
  { key: 'volume', label: 'Volume', hint: 'How loud the voice is' },
];

function SettingRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onDecrease,
  onIncrease,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const progress = (value - min) / (max - min);

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>{value.toFixed(1)}x</Text>
      </View>
      <Text style={styles.settingHint}>{hint}</Text>
      <View style={styles.sliderRow}>
        <Pressable
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          onPress={onDecrease}
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
        </View>
        <Pressable
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          onPress={onIncrease}
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function VoiceSettingsModal({
  visible,
  settings,
  onChange,
  onReset,
  onClose,
  onPreview,
}: VoiceSettingsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Voice Settings</Text>

          {ROWS.map((row) => {
            const range = VOICE_SETTING_RANGES[row.key];
            return (
              <SettingRow
                key={row.key}
                label={row.label}
                hint={row.hint}
                value={settings[row.key]}
                min={range.min}
                max={range.max}
                step={range.step}
                onDecrease={() => onChange(row.key, settings[row.key] - range.step)}
                onIncrease={() => onChange(row.key, settings[row.key] + range.step)}
              />
            );
          })}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onPreview}
              style={({ pressed }) => [styles.previewButton, pressed && styles.previewButtonPressed]}>
              <Text style={styles.previewButtonText}>🔊 Preview voice</Text>
            </Pressable>
            <Pressable onPress={onReset} style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: VoiceTheme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
    borderTopWidth: 1,
    borderColor: VoiceTheme.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: VoiceTheme.border,
    alignSelf: 'center',
  },
  title: {
    color: VoiceTheme.text,
    fontSize: 20,
    fontWeight: '700',
  },
  settingRow: {
    gap: 6,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    color: VoiceTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  settingValue: {
    color: VoiceTheme.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  settingHint: {
    color: VoiceTheme.textSecondary,
    fontSize: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: VoiceTheme.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  stepButtonPressed: {
    opacity: 0.6,
  },
  stepButtonText: {
    color: VoiceTheme.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: VoiceTheme.surfaceElevated,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: VoiceTheme.accent,
    borderRadius: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  previewButton: {
    flex: 1,
    backgroundColor: VoiceTheme.accent,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  previewButtonPressed: {
    opacity: 0.8,
  },
  previewButtonText: {
    color: '#04121F',
    fontWeight: '700',
    fontSize: 15,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: VoiceTheme.border,
  },
  resetButtonPressed: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
  closeButtonText: {
    color: VoiceTheme.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
});
