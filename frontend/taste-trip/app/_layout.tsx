import { Slot } from 'expo-router';
import { AuthProviderWithInit } from '../context/AuthContext'; // 경로 주의

export default function RootLayout() {
  return (
    <AuthProviderWithInit>
      <Slot />
    </AuthProviderWithInit>
  );
}
