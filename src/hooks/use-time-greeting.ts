import { useEffect, useState } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeGreeting {
  timeOfDay: TimeOfDay;
  emoji: string;
  greeting: string;
  message: string;
}

export function getTimeGreeting(date: Date = new Date()): TimeGreeting {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      timeOfDay: 'morning',
      emoji: '☀️',
      greeting: 'Good morning!',
      message: 'Ready to start the day?',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      timeOfDay: 'afternoon',
      emoji: '🌤️',
      greeting: 'Good afternoon!',
      message: 'Hope your day is going well.',
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      timeOfDay: 'evening',
      emoji: '🌆',
      greeting: 'Good evening!',
      message: 'Winding down for the night?',
    };
  }
  return {
    timeOfDay: 'night',
    emoji: '🌙',
    greeting: 'Good night!',
    message: 'Sleep well when you are ready.',
  };
}

export function useTimeGreeting() {
  const [greeting, setGreeting] = useState(() => getTimeGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getTimeGreeting());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return greeting;
}
