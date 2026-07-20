import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, BackHandler, ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { router } from 'expo-router';
import { getToken, removeToken, API_URL } from '../src/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme';

export default function AppWebView() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Extract the base frontend URL from API_URL, or use the hardcoded Vercel URL
  // Assuming API_URL is something like https://pluto-v2.vercel.app/api/mobile
  const baseUrl = API_URL ? API_URL.replace('/api/mobile', '') : 'https://pluto-v2.vercel.app';

  useEffect(() => {
    const loadToken = async () => {
      const t = await getToken();
      if (!t) {
        router.replace('/login');
      } else {
        setToken(t);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [canGoBack]);

  const handleNavigationStateChange = async (navState: any) => {
    setCanGoBack(navState.canGoBack);
    
    // If the web app navigates to the login page, it means the session expired
    // or the user explicitly logged out from the web interface.
    if (navState.url.includes('/login') && !navState.url.includes('/mobile-sync')) {
      await removeToken();
      router.replace('/login');
    }
  };

  if (!token) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // We point the webview to our mobile-sync endpoint to establish the NextAuth session
  const targetUrl = `${baseUrl}/mobile-sync?token=${token}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <WebView
        ref={webViewRef}
        source={{ uri: targetUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        // Ensures the web view takes up the full space properly
        bounces={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
  },
});
