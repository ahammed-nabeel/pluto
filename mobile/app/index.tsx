import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import PlutoLogo from "../components/Logo";
import { getToken } from "../src/api";

export default function Index() {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Check token and redirect after animation
    const checkAuth = async () => {
      const token = await getToken();
      setTimeout(() => {
        if (token) {
          router.replace("/(tabs)/boards");
        } else {
          router.replace("/login");
        }
      }, 1500); // Wait 1.5 seconds to show splash
    };

    checkAuth();
  }, [scale, opacity]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <PlutoLogo size={64} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
