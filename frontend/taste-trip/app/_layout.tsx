import { Slot } from 'expo-router';
import { AuthProviderWithInit } from '../context/AuthContext'; // 경로 주의
import { RecipeFilterProvider } from '../context/RecipeFilterContext'; // RecipeFilterContext 추가

export default function RootLayout() {
  return (
    <AuthProviderWithInit>
      <RecipeFilterProvider>
        <Slot />
      </RecipeFilterProvider>
    </AuthProviderWithInit>
  );
}
