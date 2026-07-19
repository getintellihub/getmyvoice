export type CategoryId =
  | 'greetings'
  | 'conversation'
  | 'commands'
  | 'driveThrough'
  | 'medical'
  | 'home'
  | 'feelings'
  | 'custom';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'greetings', label: 'Greetings', emoji: '👋', color: '#38BDF8' },
  { id: 'conversation', label: 'Conversation', emoji: '💬', color: '#818CF8' },
  { id: 'commands', label: 'Quick Commands', emoji: '⚡️', color: '#FB923C' },
  { id: 'driveThrough', label: 'Drive-Through', emoji: '🚗', color: '#FBBF24' },
  { id: 'medical', label: 'Medical', emoji: '⚕️', color: '#F87171' },
  { id: 'home', label: 'Home', emoji: '🏠', color: '#34D399' },
  { id: 'feelings', label: 'Feelings', emoji: '🙂', color: '#F472B6' },
  { id: 'custom', label: 'Custom', emoji: '⭐️', color: '#A78BFA' },
];

export const DEFAULT_PHRASES: Record<Exclude<CategoryId, 'custom'>, string[]> = {
  greetings: [
    'Hello!',
    'Good morning!',
    'Good afternoon!',
    'Good evening!',
    'How are you?',
    'Nice to meet you.',
    'Goodbye!',
    'See you later!',
  ],
  conversation: [
    'Yes',
    'No',
    'Maybe',
    "I don't know",
    'Can you repeat that?',
    'Can you speak slower, please?',
    'Thank you',
    "You're welcome",
    'Please',
    'Excuse me',
    'I need a moment',
    "Let's talk about something else",
  ],
  commands: [
    'Wait, please',
    'Stop',
    'Come here',
    'Help me',
    'One moment, please',
    'I need help',
    'Please call someone for me',
    'Give me a minute',
  ],
  driveThrough: [
    "I'd like to order, please",
    "One moment, I'm reading the menu",
    'Can I get a combo meal?',
    'No onions, please',
    'Can I get that to go?',
    "I'll pay with card",
    'Can you repeat my order?',
    "That's all, thank you",
  ],
  medical: [
    "I'm in pain",
    'I need my medication',
    'Can you call my doctor?',
    'I feel dizzy',
    'I need water',
    "I'm allergic to this",
    'Please call 911',
    'I need to see a nurse',
  ],
  home: [
    "I'm hungry",
    "I'm thirsty",
    'I need to use the bathroom',
    "I'm cold",
    "I'm tired",
    'Can you turn on the lights?',
    'Can you turn on the TV?',
    'I need help getting up',
  ],
  feelings: [
    "I'm happy",
    "I'm sad",
    "I'm frustrated",
    "I'm anxious",
    "I'm scared",
    "I'm excited",
    "I'm in pain",
    "I'm okay",
  ],
};
