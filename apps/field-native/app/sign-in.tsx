import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { T } from '@clearwire/brand';
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithMagicLink,
  verifyEmailOtp,
} from '../lib/auth';

type Mode = 'signin' | 'register' | 'code';
type Busy = 'idle' | 'submitting' | 'sending-code' | 'verifying-code';

export default function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState<Busy>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 6;
  const codeValid = /^\d{6,10}$/.test(code);

  function switchMode(m: Mode) {
    setMode(m);
    setErrorMsg(null);
    setCode('');
    setCodeSent(false);
  }

  async function handleSignIn() {
    if (!emailValid || !passwordValid) return;
    setBusy('submitting');
    setErrorMsg(null);
    const { error } = await signInWithPassword(email.trim(), password);
    setBusy('idle');
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.replace('/profile');
  }

  async function handleRegister() {
    if (!emailValid || !passwordValid) return;
    setBusy('submitting');
    setErrorMsg(null);
    const { error } = await signUpWithPassword(email.trim(), password);
    setBusy('idle');
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    // If email confirmation is on in Supabase, user must verify. Sign in
    // attempt will fail until they do. Give them a clear message either way.
    const { error: siErr } = await signInWithPassword(email.trim(), password);
    if (siErr) {
      setErrorMsg(
        'Account created. Check your email to confirm, then sign in.'
      );
      setMode('signin');
      return;
    }
    router.replace('/profile');
  }

  async function handleSendCode() {
    if (!emailValid) return;
    setBusy('sending-code');
    setErrorMsg(null);
    const { error } = await signInWithMagicLink(email.trim());
    setBusy('idle');
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setCodeSent(true);
  }

  async function handleVerifyCode() {
    if (!codeValid) return;
    setBusy('verifying-code');
    setErrorMsg(null);
    const { error } = await verifyEmailOtp(email.trim(), code);
    setBusy('idle');
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.replace('/profile');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backBtnText}>← Back</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>
            {mode === 'register' ? 'Create an account' : 'Sign in as a pro'}
          </Text>
          <Text style={styles.subtitle}>
            Pros get proximity push alerts when damage is reported nearby.
          </Text>

          {mode !== 'code' && (
            <View style={styles.tabs}>
              <Pressable
                onPress={() => switchMode('signin')}
                style={[styles.tab, mode === 'signin' && styles.tabActive]}
              >
                <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                  Sign in
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode('register')}
                style={[styles.tab, mode === 'register' && styles.tabActive]}
              >
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                  Register
                </Text>
              </Pressable>
            </View>
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor={T.textDim}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            style={styles.input}
            editable={busy === 'idle' && !codeSent}
          />

          {mode !== 'code' && (
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password (6+ chars)"
                placeholderTextColor={T.textDim}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={mode === 'register' ? 'new-password' : 'password'}
                style={[styles.input, styles.passwordInput]}
                editable={busy === 'idle'}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.showBtn}
                hitSlop={8}
              >
                <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          )}

          {mode === 'code' && codeSent && (
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter code"
              placeholderTextColor={T.textDim}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              style={styles.codeInput}
              maxLength={10}
              editable={busy !== 'verifying-code'}
            />
          )}

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {mode === 'signin' && (
            <Pressable
              onPress={handleSignIn}
              disabled={!emailValid || !passwordValid || busy !== 'idle'}
              style={[
                styles.primaryBtn,
                (!emailValid || !passwordValid || busy !== 'idle') && styles.primaryBtnDisabled,
              ]}
            >
              {busy === 'submitting' ? (
                <ActivityIndicator color={T.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Sign in</Text>
              )}
            </Pressable>
          )}

          {mode === 'register' && (
            <Pressable
              onPress={handleRegister}
              disabled={!emailValid || !passwordValid || busy !== 'idle'}
              style={[
                styles.primaryBtn,
                (!emailValid || !passwordValid || busy !== 'idle') && styles.primaryBtnDisabled,
              ]}
            >
              {busy === 'submitting' ? (
                <ActivityIndicator color={T.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Create account</Text>
              )}
            </Pressable>
          )}

          {mode === 'code' && !codeSent && (
            <Pressable
              onPress={handleSendCode}
              disabled={!emailValid || busy !== 'idle'}
              style={[
                styles.primaryBtn,
                (!emailValid || busy !== 'idle') && styles.primaryBtnDisabled,
              ]}
            >
              {busy === 'sending-code' ? (
                <ActivityIndicator color={T.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Send code</Text>
              )}
            </Pressable>
          )}

          {mode === 'code' && codeSent && (
            <Pressable
              onPress={handleVerifyCode}
              disabled={!codeValid || busy !== 'idle'}
              style={[
                styles.primaryBtn,
                (!codeValid || busy !== 'idle') && styles.primaryBtnDisabled,
              ]}
            >
              {busy === 'verifying-code' ? (
                <ActivityIndicator color={T.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Verify code</Text>
              )}
            </Pressable>
          )}

          {mode !== 'code' ? (
            <Pressable onPress={() => switchMode('code')} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>
                Forgot password? Sign in with email code
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => switchMode('signin')} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>Back to password sign-in</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: { flex: 1 },
  header: { paddingHorizontal: T.space.lg, paddingVertical: T.space.md },
  backBtn: { paddingVertical: T.space.xs },
  backBtnText: { color: T.primary, fontSize: T.font.md, fontWeight: '600' },
  body: {
    flex: 1,
    paddingHorizontal: T.space.lg,
    paddingTop: T.space.xl,
    gap: T.space.md,
  },
  title: { color: T.text, fontSize: T.font.xxl, fontWeight: '700' },
  subtitle: { color: T.textMuted, fontSize: T.font.md, lineHeight: 22 },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: T.surfaceAlt,
    borderRadius: T.radius.md,
    padding: 4,
    marginBottom: T.space.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: T.space.sm + 2,
    alignItems: 'center',
    borderRadius: T.radius.sm,
  },
  tabActive: { backgroundColor: T.primary },
  tabText: { color: T.textMuted, fontSize: T.font.sm, fontWeight: '600' },
  tabTextActive: { color: T.bg, fontWeight: '700' },
  input: {
    backgroundColor: T.surface,
    borderColor: T.border,
    borderWidth: 1,
    borderRadius: T.radius.md,
    padding: T.space.md,
    color: T.text,
    fontSize: T.font.md,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 60 },
  showBtn: {
    position: 'absolute',
    right: T.space.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showBtnText: { color: T.primary, fontSize: T.font.sm, fontWeight: '600' },
  codeInput: {
    backgroundColor: T.bg,
    borderColor: T.border,
    borderWidth: 1,
    borderRadius: T.radius.md,
    padding: T.space.md,
    color: T.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  errorText: { color: T.danger, fontSize: T.font.sm },
  primaryBtn: {
    backgroundColor: T.primary,
    paddingVertical: T.space.lg,
    borderRadius: T.radius.lg,
    alignItems: 'center',
    marginTop: T.space.sm,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: T.bg, fontSize: T.font.lg, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: T.space.md },
  linkBtnText: { color: T.textMuted, fontSize: T.font.sm, textDecorationLine: 'underline' },
});
