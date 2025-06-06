import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : 'http://192.168.0.101:8000';

// 환경 변수에서 Google Client ID 가져오기
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;


export default function LoginScreen() {
  const [fontsLoaded] = useFonts({ Poppins_600SemiBold });
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientId, // 환경 변수 사용
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    scopes: ['openid', 'profile', 'email'],
    responseType: ResponseType.IdToken,
    redirectUri: makeRedirectUri({}), // useProxy: true 제거하여 에러 해결
  });

  const { setUserId } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    await promptAsync();
    setIsLoggingIn(false);
  };

  useEffect(() => {
    const handleLogin = async () => {
      if (response?.type !== 'success') return;
      const idToken = response.params.id_token ?? response.authentication?.idToken;
      if (!idToken) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
        });

        const data = await res.json();
        console.log('서버 응답:', data);

        if (data.user && data.user.id) {
          const userInfo = {
            id: data.user.id,
            email: data.user.email,
            nickname: data.user.nickname ?? data.user.name ?? '사용자',
          };
          await AsyncStorage.setItem('user', JSON.stringify(userInfo));
          await AsyncStorage.setItem('idToken', idToken);
          await AsyncStorage.setItem('user_id', userInfo.id);

          console.log('✅ 로그인 성공. userId 저장:', userInfo.id);
          if (setUserId) setUserId(userInfo.id);

          router.push('/select');
        } else {
          Alert.alert('로그인 실패', JSON.stringify(data));
        }
      } catch (err: any) {
        console.log('서버 연결 실패:', err);
        Alert.alert('서버 연결 실패', err.message);
      }
    };

    handleLogin();
  }, [response]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bottomBackground} />
      <View style={styles.content}>
        <Text style={styles.title}>Log In</Text>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={!request || isLoggingIn}
        >
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
            }}
            style={styles.googleLogo}
          />
          <Text style={styles.buttonText}>Log in with Google</Text>
        </TouchableOpacity>
        <Pressable onPress={() => Alert.alert('눌렀다!')}>
          <Text style={styles.subText}>이미 계정이 있으신가요?</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFD6A5', alignItems: 'center', justifyContent: 'center' },
  bottomBackground: {
    position: 'absolute', bottom: -50, width: '120%', height: 300,
    backgroundColor: '#F29C50', borderTopLeftRadius: 300, borderTopRightRadius: 300,
    zIndex: -1, alignSelf: 'center'
  },
  content: { alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 1 },
  title: { fontSize: 32, fontFamily: 'Poppins_600SemiBold', color: '#813D2C' },
  logo: { width: 140, height: 140 },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 2,
  },
  googleLogo: { width: 20, height: 20, marginRight: 10 },
  buttonText: { fontSize: 16, color: '#000', fontFamily: 'Poppins_600SemiBold' },
  subText: { fontSize: 14, color: '#5B2C20', textDecorationLine: 'underline', marginTop: 5 },
});
