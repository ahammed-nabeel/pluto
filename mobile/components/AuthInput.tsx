import React from 'react';
import { View, TextInput, TextInputProps, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../src/theme';

interface AuthInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
}

export default function AuthInput({ label, icon, ...props }: AuthInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? { paddingLeft: 40 } : null]}
          placeholderTextColor="#A0AEC0"
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 1,
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    height: '100%',
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    height: 52,
    width: '100%',
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
