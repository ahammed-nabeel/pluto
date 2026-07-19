import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, Lock } from "lucide-react-native";
import { colors, spacing, radius } from "../src/theme";
import { API_URL, setToken } from "../src/api";
import PlutoLogo from "../components/Logo";

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
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar style="dark" />

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <PlutoLogo size={24} />
            </View>

            {/* Headers */}
            <View style={styles.headerContainer}>
              <Text style={styles.welcomeTitle}>Welcome</Text>
              <Text style={styles.welcomeSub}>Sign in or create an account</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
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
              </View>

              {step === "password" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
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
                </View>
              )}

              <Pressable 
                style={({ pressed }) => [
                  styles.continueBtn, 
                  pressed ? styles.btnPressed : null, 
                  loading ? { opacity: 0.7 } : null
                ]} 
                onPress={handleContinue}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueBtnText}>{step === "email" ? "Continue" : "Log In"}</Text>
                )}
              </Pressable>

              {step === "email" && (
                <Text style={styles.signupHint}>
                  Don't have an account?{" "}
                  <Text style={styles.signupLink} onPress={() => Alert.alert('Notice', 'Signup via mobile coming soon. Please sign up on the web.')}>Sign Up</Text>
                </Text>
              )}

              {step === "email" && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR CONNECT WITH</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialRow}>
                    <Pressable style={({ pressed }) => [styles.socialBtn, pressed ? styles.btnPressed : null]} onPress={() => Alert.alert('Google Sign-in', 'Coming soon')}>
                      <Text style={styles.socialBtnText}>Google</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.socialBtn, pressed ? styles.btnPressed : null]} onPress={() => Alert.alert('Microsoft Sign-in', 'Coming soon')}>
                      <Text style={styles.socialBtnText}>Microsoft</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
            
            <Text style={styles.termsText}>
              By signing in, you agree to our terms of service and privacy policy.{"\n"}Your data is protected with enterprise-grade security.
            </Text>
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: "center", 
    padding: spacing.lg,
  },
  
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  
  headerContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  welcomeTitle: { 
    fontSize: 28, 
    fontWeight: "800", 
    color: "#0F172A", 
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  welcomeSub: { 
    fontSize: 15, 
    color: "#64748B", 
  },

  form: { 
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: { 
    fontSize: 12, 
    fontWeight: "700", 
    color: "#64748B", 
    letterSpacing: 0.8, 
    marginBottom: 8 
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
  },
  inputIcon: { 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    height: 52, 
    fontSize: 16, 
    color: "#0F172A" 
  },

  continueBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  continueBtnText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
  btnPressed: {
    opacity: 0.8,
  },

  signupHint: { 
    textAlign: "center", 
    fontSize: 14, 
    color: "#64748B", 
    marginBottom: spacing.lg 
  },
  signupLink: { 
    color: "#2563EB", 
    fontWeight: "700" 
  },

  divider: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    marginBottom: spacing.lg 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: "#E2E8F0" 
  },
  dividerText: { 
    fontSize: 11, 
    fontWeight: "700", 
    color: "#94A3B8", 
    letterSpacing: 0.5 
  },

  socialRow: { 
    flexDirection: "row", 
    gap: 12,
    marginBottom: spacing.xl,
  },
  socialBtn: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  socialBtnText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#334155" 
  },

  termsText: { 
    fontSize: 12, 
    color: "#94A3B8", 
    textAlign: "center", 
    lineHeight: 18,
  },
});
