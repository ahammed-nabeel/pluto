import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// For Android Emulator to access host's localhost, use 10.0.2.2
// For physical device, replace with your machine's local IP address (e.g. 192.168.1.100)
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

export async function getToken() {
  try {
    return await SecureStore.getItemAsync('token');
  } catch (e) {
    return null;
  }
}

export async function setToken(token: string) {
  try {
    await SecureStore.setItemAsync('token', token);
  } catch (e) {
    console.error('Error saving token', e);
  }
}

export async function removeToken() {
  try {
    await SecureStore.deleteItemAsync('token');
  } catch (e) {
    console.error('Error removing token', e);
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });
}
