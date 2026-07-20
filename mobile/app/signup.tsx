import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, makeRedirectUri, DiscoveryDocument, ResponseType } from 'expo-auth-session';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { API_URL, setToken, setUser } from "../src/api";
import PlutoLogo from "../components/Logo";
import Svg, { Path } from 'react-native-svg';
import AuthInput from "../components/AuthInput";
import SocialButton from "../components/SocialButton";
import { colors, radius } from "../src/theme";

WebBrowser.maybeCompleteAuthSession();

const microsoftDiscovery: DiscoveryDocument = {
  authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

// Configure Native Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || 'dummy-web-client-id',
  offlineAccess: true,
});

function GoogleIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={24} height={24}>
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

function MicrosoftIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={24} height={24}>
      <Path fill="#f25022" d="M1 1h10v10H1z" />
      <Path fill="#00a4ef" d="M13 1h10v10H13z" />
      <Path fill="#7fba00" d="M1 13h10v10H1z" />
      <Path fill="#ffb900" d="M13 13h10v10H13z" />
    </Svg>
  );
}



const { height } = Dimensions.get('window');

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<"google" | "microsoft" | null>(null);
  const insets = useSafeAreaInsets();

  // 2. Microsoft Native Auth
  const [msRequest, msResponse, msPromptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_MS_CLIENT_ID || 'dummy-ms-client-id',
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: makeRedirectUri({ scheme: 'pluto' }),
      responseType: ResponseType.Token,
    },
    microsoftDiscovery
  );

  useEffect(() => {
    if (msResponse?.type === 'success' && msResponse.params.access_token) {
      handleOAuthSuccess('microsoft', msResponse.params.access_token);
    } else if (msResponse?.type === 'error') {
      setIsSocialLoading(null);
      Alert.alert('Microsoft Login Failed', 'Authentication was cancelled or failed.');
    }
  }, [msResponse]);

  const handleOAuthSuccess = async (provider: 'google' | 'microsoft', token: string) => {
    setIsSocialLoading(provider);
    try {
      const response = await fetch(`${API_URL}/mobile/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'OAuth verification failed');
      }
      
      if (data.token) {
        await setToken(data.token);
        if (data.user) await setUser(data.user);
        router.replace("/webview");
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Could not verify token with server');
    } finally {
      setIsSocialLoading(null);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSocialLoading("google");
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (idToken) {
        await handleOAuthSuccess('google', idToken);
      } else {
        throw new Error('No ID token received from Google');
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert("Authentication Failed", "Could not sign in with Google.");
      }
      setIsSocialLoading(null);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please enter name, email, and password');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/mobile/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      if (data.token) {
        await setToken(data.token);
        if (data.user) await setUser(data.user);
        router.replace("/webview");
      } else {
        throw new Error('No token received');
      }
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Check your connection');
    } finally {
      setLoading(false);
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
          
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <PlutoLogo size={42} />
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.title}>Create your Account</Text>

            <View style={styles.inputs}>
              <AuthInput
                placeholder="Name"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
              <AuthInput
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <AuthInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable 
              style={({ pressed }) => [
                styles.primaryBtn, 
                pressed ? styles.btnPressed : null, 
                loading ? { opacity: 0.7 } : null
              ]} 
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign up</Text>
              )}
            </Pressable>

            <Text style={styles.orText}>- Or sign up with -</Text>

            <View style={styles.socialRow}>
              <SocialButton
                icon={<GoogleIcon />}
                onPress={handleGoogleSignIn}
                disabled={loading || isSocialLoading === "google"}
              />
              <SocialButton
                icon={<MicrosoftIcon />}
                onPress={() => msPromptAsync()}
                disabled={!msRequest || loading}
              />
            </View>
          </View>

          {/* Footer Section */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.footerLink} onPress={() => router.push("/login")}>Sign in</Text>
            </Text>
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF" 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: "space-between", 
    paddingHorizontal: 24,
    minHeight: height - 50,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  formSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 24,
  },
  inputs: {
    gap: -4, // AuthInput has marginBottom 16
  },
  primaryBtn: {
    backgroundColor: colors.authPrimary,
    borderRadius: radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 40,
    // Shadow
    shadowColor: colors.authPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  orText: {
    textAlign: 'center',
    color: '#A0AEC0',
    fontSize: 13,
    marginBottom: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  footerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    color: '#718096',
    fontSize: 14,
  },
  footerLink: {
    color: colors.authPrimary,
    fontWeight: '600',
  },
});
