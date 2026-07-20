export const RECORDING_TIPS = [
  'Find a quiet room',
  'Hold your phone normally, about 12 inches from your mouth',
  'Speak naturally at your normal pace',
  'Read the script below — aim for about 2–3 minutes',
];

/**
 * Longer reading script (~2–3 minutes at a natural speaking pace).
 * Covers everyday phrases, questions, numbers, and varied emotion so
 * ElevenLabs has enough material for a stronger voice clone.
 */
export const VOICE_CLONE_SCRIPT =
  "Hi, my name is [your name], and this is my real voice. I'm recording this so that even when I can't speak out loud, " +
  'the people around me can still hear me the way I sound. MyVoice will use this sample to learn how I talk — my rhythm, ' +
  'my tone, and the little quirks that make my voice mine.\n\n' +
  "Good morning. Good afternoon. Good evening. Good night. Hello, how are you? I'm doing okay today, thank you for asking. " +
  "Yes. No. Maybe. Please. Thank you. You're welcome. Excuse me. I'm sorry. I understand. One moment, please. " +
  "Can you help me? I need a minute. Could you repeat that? I didn't quite catch what you said.\n\n" +
  "I'm thirsty — could I please have some water? I'm a little hungry. I'm not feeling well right now. " +
  "I'm tired and I'd like to rest. I'm cold. I'm warm. That feels better, thank you. " +
  "I love you. I miss you. You made my day. I'm proud of you. Please don't worry about me.\n\n" +
  "I'd like to order something to eat. I'll have a number three with no onions, please. " +
  "Can I get that with fries on the side? And a glass of water. That's everything, thank you. " +
  "How much do I owe? Keep the change. Have a nice day.\n\n" +
  "I have a voice condition, so I'm using an app to speak. Please be patient with me while I type. " +
  "I can hear you clearly. I need you to speak a little slower. Let's take this one step at a time. " +
  "Where is the bathroom? Where is my phone? What time is it? What day is it today?\n\n" +
  'Counting helps the model hear how I say numbers: one, two, three, four, five, six, seven, eight, nine, ten. ' +
  'Eleven, twelve, thirteen, twenty, thirty, forty, fifty, one hundred. ' +
  'My phone number is five five five, one two three, four five six seven — just as an example.\n\n' +
  "I'm happy to see you. I'm a bit nervous, but I'm okay. That surprised me. That made me laugh. " +
  "I'm frustrated, but I'll be fine. Please give me a little space. Come sit with me. " +
  "Tell me about your day. I want to hear everything. Let's go for a short walk when you're ready.\n\n" +
  "In the morning I like coffee or tea. In the afternoon I might want a snack. At night I wind down and get quiet. " +
  'The weather looks nice today. It might rain later. I hope tomorrow is a good day.\n\n' +
  "If something is wrong, please call for help. If everything is fine, you can relax. " +
  "I appreciate you taking the time to listen. Thank you for being here with me. " +
  'This is the end of my recording — I hope my voice comes through clearly and warmly.';

/** Minimum length before Create My Voice is enabled. */
export const MIN_RECORDING_SECONDS = 30;

/** Hard stop / max recording length (3 minutes). */
export const MAX_RECORDING_SECONDS = 180;

export const VOICE_CLONE_TEST_PHRASE = "This is what MyVoice sounds like, using your own voice.";
