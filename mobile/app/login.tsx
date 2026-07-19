import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, Lock } from "lucide-react-native";
import { colors, spacing, radius } from "../src/theme";
import { API_URL, setToken } from "../src/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleContinue = async () => {
    if (step === "email") {
      if (!email.includes('@')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
      setStep("password");
    } else {
      if (!password) {
        Alert.alert('Error', 'Please enter your password');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/mobile/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }
        
        if (data.token) {
          await setToken(data.token);
          router.replace("/(tabs)/boards");
        } else {
          throw new Error('No token received');
        }
      } catch (err: any) {
        Alert.alert('Login Failed', err.message || 'Check your connection');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>P</Text>
          </View>
          <Text style={styles.brandName}>Pluto.</Text>
        </View>

        <Text style={styles.welcomeTitle}>Welcome.</Text>
        <Text style={styles.welcomeSub}>Sign in or create an account</Text>

        <View style={styles.form}>
          <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrap}>
            <Mail color={colors.textMuted} size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {step === "password" && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Lock color={colors.textMuted} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </>
          )}

          <Pressable 
            style={({ pressed }) => [styles.continueBtn, pressed && styles.btnPressed, loading && { opacity: 0.7 }]} 
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueBtnText}>{step === "email" ? "Continue" : "Sign In"}</Text>
            )}
          </Pressable>

          <Text style={styles.signupHint}>
            Don't have an account?{" "}
            <Text style={styles.signupLink}>Sign Up</Text>
          </Text>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONNECT WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <Pressable style={({ pressed }) => [styles.socialBtn, pressed && styles.btnPressed]}>
              <Text style={styles.socialBtnText}>G  Google</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.socialBtn, pressed && styles.btnPressed]}>
              <Text style={styles.socialBtnText}>⊞  Microsoft</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.termsText}>
          By signing in, you agree to our terms of service and privacy policy.{"\n"}Your data is protected with enterprise-grade security.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: "center", 
    padding: spacing.xl,
    paddingTop: 48
  },
  
  brandRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginBottom: 48 
  },
  brandIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brandIconText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  brandName: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
  
  welcomeTitle: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, marginBottom: 6 },
  welcomeSub: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xl },

  form: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, fontSize: 16, color: colors.textPrimary },

  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  continueBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnPressed: {
    opacity: 0.8,
  },

  signupHint: { textAlign: "center", fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  signupLink: { color: colors.primary, fontWeight: "700" },

  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.5 },

  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  socialBtnText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },

  termsText: { fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 18, marginTop: "auto", paddingTop: spacing.xl },
});
