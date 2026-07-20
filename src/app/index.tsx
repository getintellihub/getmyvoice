import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MIN_TOUCH_TARGET, VoiceFonts } from '@/constants/voice-theme';

const LANDING = {
  gradientStart: '#7c5cbf',
  gradientEnd: '#5b3fa0',
  darkSection: '#3a2a68',
  white: '#ffffff',
  whiteSoft: 'rgba(255,255,255,0.92)',
  whiteMuted: 'rgba(255,255,255,0.78)',
  cardBg: 'rgba(255,255,255,0.14)',
  cardBorder: 'rgba(255,255,255,0.28)',
} as const;

const AUDIENCE = [
  {
    emoji: '🗣️',
    title: 'Dysphonia',
    body: 'Voice weakens or disappears between treatments',
  },
  {
    emoji: '🧠',
    title: 'Stroke & Aphasia',
    body: 'Difficulty speaking after a stroke or brain injury',
  },
  {
    emoji: '🔬',
    title: 'ALS & Parkinson\'s',
    body: 'Progressive voice loss conditions',
  },
  {
    emoji: '🏥',
    title: 'Post-Surgery',
    body: 'Voice loss after throat or larynx surgery',
  },
  {
    emoji: '👐',
    title: 'And many more',
    body: 'Anyone who needs a voice when theirs won\'t cooperate',
  },
] as const;

const STEPS = [
  {
    emoji: '⌨️',
    title: 'Type or tap',
    body: 'Type what you want to say or tap a quick phrase',
  },
  {
    emoji: '🔊',
    title: 'MyVoice speaks',
    body: 'The app speaks it out loud for everyone to hear',
  },
  {
    emoji: '🎤',
    title: 'Sound like you',
    body: 'Clone your voice so it sounds exactly like you',
  },
] as const;

const SCENARIOS = [
  {
    emoji: '🚗',
    title: 'Drive-through',
    body: 'Order food without struggling to be heard',
  },
  {
    emoji: '🏥',
    title: "Doctor's office",
    body: 'Communicate clearly with your care team',
  },
  {
    emoji: '📞',
    title: 'Phone calls',
    body: 'Stay connected even when your voice is gone',
  },
  {
    emoji: '🏠',
    title: 'At home',
    body: 'Talk to family naturally every day',
  },
] as const;

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const cardWidth = isWide ? Math.min(220, (width - 80) / 3 - 12) : width - 48;

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroRise = useRef(new Animated.Value(18)).current;
  const micPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(heroRise, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(micPulse, {
          toValue: 1.08,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(micPulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [heroFade, heroRise, micPulse]);

  function goSignUp() {
    router.push('/sign-up' as Href);
  }

  function goSignIn() {
    router.push('/sign-in' as Href);
  }

  return (
    <LinearGradient colors={[LANDING.gradientStart, LANDING.gradientEnd]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.nav}>
          <Text style={styles.navBrand}>MyVoice</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            activeOpacity={0.7}
            onPress={goSignIn}
            style={styles.navLink}>
            <Text style={styles.navLinkText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* SECTION 1 — Hero */}
          <Animated.View
            style={[
              styles.hero,
              {
                opacity: heroFade,
                transform: [{ translateY: heroRise }],
              },
            ]}>
            <Animated.Text style={[styles.heroMic, { transform: [{ scale: micPulse }] }]}>
              🎤
            </Animated.Text>
            <Text style={styles.heroHeadline}>Your voice, even when you can't speak.</Text>
            <Text style={styles.heroSub}>
              MyVoice speaks for you — instantly, naturally, and in your own voice.
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Get Started Free"
              activeOpacity={0.85}
              onPress={goSignUp}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started Free</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Sign In"
              activeOpacity={0.85}
              onPress={goSignIn}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* SECTION 2 — Who it's for */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MyVoice is for anyone who loses their voice.</Text>
            <View style={[styles.cardGrid, isWide && styles.cardGridWide]}>
              {AUDIENCE.map((item) => (
                <View key={item.title} style={[styles.infoCard, { width: cardWidth }]}>
                  <Text style={styles.cardEmoji}>{item.emoji}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardBody}>{item.body}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 3 — How it works */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={styles.stepsColumn}>
              {STEPS.map((step, index) => (
                <View key={step.title} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepCopy}>
                    <Text style={styles.stepTitle}>
                      {step.emoji} {step.title}
                    </Text>
                    <Text style={styles.stepBody}>{step.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 4 — Real situations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Built for real moments</Text>
            <View style={[styles.cardGrid, isWide && styles.cardGridWide]}>
              {SCENARIOS.map((item) => (
                <View key={item.title} style={[styles.infoCard, { width: isWide ? (width - 80) / 2 - 10 : width - 48 }]}>
                  <Text style={styles.cardEmoji}>{item.emoji}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardBody}>{item.body}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 5 — Not TTS */}
          <View style={styles.darkSection}>
            <Text style={styles.darkHeadline}>This is not text-to-speech.</Text>
            <Text style={styles.darkBody}>
              Text-to-speech reads documents. MyVoice speaks for you — in real conversations, in real
              moments, in your real voice. Built by someone whose sister has Dysphonia.
            </Text>
          </View>

          {/* SECTION 6 — CTA */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaHeadline}>Ready to find your voice?</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Get Started Free"
              activeOpacity={0.85}
              onPress={goSignUp}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started Free</Text>
            </TouchableOpacity>
            <Text style={styles.ctaFinePrint}>
              No credit card required · Works on any device · Your voice, your privacy
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: MIN_TOUCH_TARGET,
  },
  navBrand: {
    color: LANDING.white,
    fontFamily: VoiceFonts.display,
    fontSize: 28,
  },
  navLink: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  navLinkText: {
    color: LANDING.white,
    fontWeight: '700',
    fontSize: 16,
  },
  scroll: {
    paddingBottom: 56,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroMic: {
    fontSize: 64,
    marginBottom: 18,
  },
  heroHeadline: {
    color: LANDING.white,
    fontFamily: VoiceFonts.display,
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
    marginBottom: 14,
  },
  heroSub: {
    color: LANDING.whiteSoft,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 520,
  },
  primaryButton: {
    alignSelf: 'stretch',
    maxWidth: 420,
    width: '100%',
    minHeight: MIN_TOUCH_TARGET + 4,
    backgroundColor: LANDING.white,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: LANDING.gradientEnd,
    fontWeight: '800',
    fontSize: 18,
  },
  secondaryButton: {
    alignSelf: 'stretch',
    maxWidth: 420,
    width: '100%',
    minHeight: MIN_TOUCH_TARGET + 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: LANDING.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: LANDING.white,
    fontWeight: '700',
    fontSize: 17,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  sectionTitle: {
    color: LANDING.white,
    fontFamily: VoiceFonts.display,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 22,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  cardGridWide: {
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: LANDING.cardBg,
    borderWidth: 1,
    borderColor: LANDING.cardBorder,
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    color: LANDING.white,
    fontWeight: '800',
    fontSize: 18,
  },
  cardBody: {
    color: LANDING.whiteMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  stepsColumn: {
    gap: 16,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: LANDING.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LANDING.cardBorder,
    padding: 16,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LANDING.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: LANDING.gradientEnd,
    fontWeight: '800',
    fontSize: 16,
  },
  stepCopy: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    color: LANDING.white,
    fontWeight: '800',
    fontSize: 18,
  },
  stepBody: {
    color: LANDING.whiteMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  darkSection: {
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: LANDING.darkSection,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  darkHeadline: {
    color: LANDING.white,
    fontFamily: VoiceFonts.display,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 14,
  },
  darkBody: {
    color: LANDING.whiteSoft,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    alignItems: 'center',
  },
  ctaHeadline: {
    color: LANDING.white,
    fontFamily: VoiceFonts.display,
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    marginBottom: 22,
  },
  ctaFinePrint: {
    color: LANDING.whiteMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
});
