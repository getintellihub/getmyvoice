export type CategoryId =
  | 'greetings'
  | 'conversation'
  | 'driveThrough'
  | 'shopping'
  | 'phoneCalls'
  | 'medical'
  | 'home'
  | 'feelings'
  | 'myPhrases';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'greetings', label: 'Greetings', emoji: '🌅', color: '#C084FC' },
  { id: 'conversation', label: 'Conversation', emoji: '💬', color: '#A78BFA' },
  { id: 'driveThrough', label: 'Drive-Through', emoji: '🚗', color: '#818CF8' },
  { id: 'shopping', label: 'Shopping', emoji: '🛒', color: '#F472B6' },
  { id: 'phoneCalls', label: 'Phone Calls', emoji: '📞', color: '#22D3EE' },
  { id: 'medical', label: 'Medical', emoji: '🏥', color: '#F87171' },
  { id: 'home', label: 'Home / Daily', emoji: '🏠', color: '#34D399' },
  { id: 'feelings', label: 'Feelings', emoji: '❤️', color: '#FB7185' },
  { id: 'myPhrases', label: 'My Phrases', emoji: '⭐️', color: '#FBBF24' },
];

export const DEFAULT_PHRASES: Record<Exclude<CategoryId, 'myPhrases'>, string[]> = {
  greetings: [
    'Good morning! How are you?',
    'Good afternoon!',
    'Good evening!',
    'Good night, sleep well!',
    'Hi there! Nice to see you.',
    "Hello! How's your day going?",
    'Welcome! Come on in.',
    'Have a great day!',
  ],
  conversation: [
    'Yes, absolutely.',
    'No, thank you.',
    'Can you repeat that please?',
    'I understand.',
    "I don't understand, can you explain?",
    'Please speak slowly.',
    'One moment please.',
    'I agree with you.',
    'I disagree.',
    'Can you write that down?',
  ],
  driveThrough: [
    "Hi! I'll have…",
    'Can I get a…',
    'No onions please.',
    'No salt please.',
    'Can I add…?',
    'What comes with that?',
    'Is that everything?',
    "That's all, thank you!",
    'How much is that?',
    'Can I get that with no ice?',
    'Extra sauce please.',
  ],
  shopping: [
    'Where is the…?',
    'Do you have this in a different size?',
    'Can someone help me?',
    "I'm looking for…",
    'Do you take Apple Pay?',
    "I'd like to return this.",
    'How much is this?',
    'Do you have this in stock?',
  ],
  phoneCalls: [
    'I have a voice condition. I\u2019m using a voice app to communicate.',
    "I can hear you perfectly — I just can't speak right now.",
    "I'm on speaker, please speak normally.",
    'Please hold for just a moment.',
    "Yes I'm still here — typing my reply.",
    'Can you call back in a few minutes?',
    'Can you speak more slowly please?',
    "I'll send you a text instead.",
  ],
  medical: [
    "I'm not feeling well.",
    'I have pain here.',
    'I need my medication.',
    'Please call my doctor.',
    'I need water.',
    "I'm feeling dizzy.",
    'I need to rest.',
    "I'm feeling better, thank you.",
    'My pain level is…',
  ],
  home: [
    'Can you help me please?',
    "I'm hungry.",
    "I'm cold.",
    "I'm hot.",
    'Can you turn on the TV?',
    'Can you open the window?',
    'I need to use the bathroom.',
    'Can we sit outside?',
  ],
  feelings: [
    'Thank you so much, I appreciate it.',
    'I love you.',
    "I'm happy!",
    "I'm feeling anxious.",
    "I'm frustrated.",
    "I'm okay, don't worry about me.",
    'I missed you!',
    'You made my day.',
  ],
};
