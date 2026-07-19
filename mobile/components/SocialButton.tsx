import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius } from '../src/theme';

interface SocialButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

export default function SocialButton({ icon, onPress, disabled }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null
      ]}
    >
      <View style={styles.content}>
        {icon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  disabled: {
    opacity: 0.5,
  }
});
