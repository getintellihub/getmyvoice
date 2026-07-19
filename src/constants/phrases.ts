export type CategoryId =
  | 'greetings'
  | 'conversation'
  | 'commands'
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
  { id: 'greetings', label: 'Greetings', emoji: '👋', color: '#C084FC' },
  { id: 'conversation', label: 'Conversation', emoji: '💬', color: '#A78BFA' },
  { id: 'commands', label: 'Quick Commands', emoji: '⚡️', color: '#FB923C' },
  { id: 'driveThrough', label: 'Drive-Through', emoji: '🚗', color: '#818CF8' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#F472B6' },
  { id: 'phoneCalls', label: 'Phone Calls', emoji: '📞', color: '#22D3EE' },
  { id: 'medical', label: 'Medical', emoji: '⚕️', color: '#F87171' },
  { id: 'home', label: 'Home', emoji: '🏠', color: '#34D399' },
  { id: 'feelings', label: 'Feelings', emoji: '🙂', color: '#FB7185' },
  { id: 'myPhrases', label: 'My Phrases', emoji: '⭐️', color: '#FBBF24' },
];

export const DEFAULT_PHRASES: Record<Exclude<CategoryId, 'myPhrases'>, string[]> = {
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
  shopping: [
    'How much is this?',
    'Do you have this in a different size?',
    "I'd like to return this",
    'Can I pay with card?',
    'Where is the fitting room?',
    'Do you have a discount?',
    "I'm just browsing",
    'Can you gift wrap this?',
  ],
  phoneCalls: [
    'Hello, this is me speaking',
    'Can you hold on a moment?',
    "I can't hear you well",
    'Can you call back later?',
    'I need to end this call now',
    'Please speak a little slower',
    'Let me get someone else',
    'Thank you for calling',
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
