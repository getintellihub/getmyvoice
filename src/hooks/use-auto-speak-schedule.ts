import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'myvoice:auto-speak-schedule-v2';

export interface ScheduleEntry {
  id: string;
  time: string;
  phrase: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_SCHEDULE: ScheduleEntry[] = [
  {
    id: 'morning-6am',
    time: '06:00',
    label: '6:00 AM',
    phrase: 'Good morning! Hope you have a wonderful day.',
    enabled: false,
  },
  {
    id: 'afternoon-12pm',
    time: '12:00',
    label: '12:00 PM',
    phrase: 'Good afternoon! Hope your day is going well.',
    enabled: false,
  },
  {
    id: 'evening-5pm',
    time: '17:00',
    label: '5:00 PM',
    phrase: "Good evening! It's nice to see you.",
    enabled: false,
  },
  {
    id: 'night-9pm',
    time: '21:00',
    label: '9:00 PM',
    phrase: 'Good night! Sleep well and take care.',
    enabled: false,
  },
];

export function useAutoSpeakSchedule(onTrigger: (phrase: string) => void) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE);
  const lastFiredMinuteRef = useRef<Record<string, string>>({});
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const savedEnabled: Record<string, boolean> = JSON.parse(raw);
      setSchedule((previous) =>
        previous.map((entry) =>
          entry.id in savedEnabled ? { ...entry, enabled: savedEnabled[entry.id] } : entry,
        ),
      );
    });
  }, []);

  const toggleEntry = useCallback((id: string) => {
    setSchedule((previous) => {
      const next = previous.map((entry) => (entry.id === id ? { ...entry, enabled: !entry.enabled } : entry));
      const enabledMap = Object.fromEntries(next.map((entry) => [entry.id, entry.enabled]));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabledMap)).catch(() => undefined);
      return next;
    });
  }, []);

  useEffect(() => {
    function check() {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const minuteKey = `${now.toDateString()} ${currentTime}`;

      for (const entry of schedule) {
        if (!entry.enabled || entry.time !== currentTime) continue;
        if (lastFiredMinuteRef.current[entry.id] === minuteKey) continue;
        lastFiredMinuteRef.current[entry.id] = minuteKey;
        onTriggerRef.current(entry.phrase);
      }
    }

    check();
    const interval = setInterval(check, 20 * 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  return { schedule, toggleEntry };
}
