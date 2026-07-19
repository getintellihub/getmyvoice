import { useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { VoiceTheme } from '@/constants/voice-theme';

interface SliderControlProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function SliderControl({
  label,
  hint,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: SliderControlProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);

  function valueFromLocationX(locationX: number) {
    if (trackWidth <= 0) return value;
    const ratio = clamp(locationX / trackWidth, 0, 1);
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    return Number(clamp(stepped, min, max).toFixed(2));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        onChange(valueFromLocationX(evt.nativeEvent.locationX));
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        onChange(valueFromLocationX(evt.nativeEvent.locationX));
      },
    }),
  ).current;

  const progress = (value - min) / (max - min);
  const displayValue = formatValue ? formatValue(value) : value.toFixed(1);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      <Text style={styles.hint}>{hint}</Text>

      <View style={styles.controlRow}>
        <Pressable
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          onPress={() => onChange(clamp(Number((value - step).toFixed(2)), min, max))}
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}>
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>

        <View
          ref={trackRef}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          style={styles.track}
          {...panResponder.panHandlers}>
          <View style={styles.trackBackground} />
          <View style={[styles.trackFill, { width: `${clamp(progress, 0, 1) * 100}%` }]} />
          <View style={[styles.thumb, { left: `${clamp(progress, 0, 1) * 100}%` }]} />
        </View>

        <Pressable
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          onPress={() => onChange(clamp(Number((value + step).toFixed(2)), min, max))}
          style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}>
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const THUMB_SIZE = 22;

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: VoiceTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    color: VoiceTheme.accentStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    color: VoiceTheme.textSecondary,
    fontSize: 12,
  },
  controlRow: {
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
    height: 28,
    justifyContent: 'center',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: VoiceTheme.surfaceElevated,
  },
  trackFill: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    backgroundColor: VoiceTheme.accent,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: VoiceTheme.text,
    borderWidth: 3,
    borderColor: VoiceTheme.accent,
    marginLeft: -THUMB_SIZE / 2,
    top: 3,
  },
});
