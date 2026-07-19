export interface QuickCommandSection {
  id: string;
  label: string;
  emoji: string;
  color: string;
  phrases: string[];
}

export const QUICK_COMMAND_SECTIONS: QuickCommandSection[] = [
  {
    id: 'holdWait',
    label: 'Hold / Wait',
    emoji: '✋',
    color: '#818CF8',
    phrases: [
      'Hold on.',
      'One second please.',
      'Give me just a moment.',
      'Almost ready!',
      'Please wait.',
      'Sorry for the delay.',
    ],
  },
  {
    id: 'voiceConditionExplainers',
    label: 'Voice Condition Explainers',
    emoji: '🗣️',
    color: '#A78BFA',
    phrases: [
      "I have a voice condition — I'm using an app to speak.",
      "I can hear you perfectly, I just can't speak right now.",
      "My voice isn't working great today — I'm using this app to help me communicate.",
      "Please be patient with me — I have a voice condition and I'm typing my responses.",
      "I'm not ignoring you — I just can't talk right now.",
    ],
  },
  {
    id: 'phoneCallCommands',
    label: 'Phone Call Commands',
    emoji: '📞',
    color: '#22D3EE',
    phrases: [
      "I'm on speaker — please speak normally, I can hear you.",
      "I have a voice condition. I'm using a voice app — please wait while I type my response.",
      "Yes I'm still here — just typing my reply.",
      'Can you call me back in a few minutes?',
      'Can you speak more slowly please?',
    ],
  },
  {
    id: 'simpleYesNo',
    label: 'Simple Yes / No',
    emoji: '👍',
    color: '#34D399',
    phrases: ['Yes!', 'No thank you.', "That's correct.", 'Thank you!', "I'm okay.", 'I understand.'],
  },
  {
    id: 'emergency',
    label: 'Emergency',
    emoji: '🚨',
    color: '#EF4444',
    phrases: ['I need help.', 'Please call 911.', 'I am having a medical emergency.', 'Please call my emergency contact.'],
  },
];
