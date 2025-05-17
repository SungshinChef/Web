import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

let BACKEND_URL = '';

if (Platform.OS === 'web') {
  // 웹 환경: localhost 사용
  BACKEND_URL = 'http://localhost:8000';
} else {
  // 앱(Expo Go, 실기기): 내 컴퓨터의 IP 사용
  BACKEND_URL = 'http://192.168.0.35:8000'; // ← 본인 컴퓨터 IP로!
}

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "38901878904-lsb42e83dfei6ohv65q1t7kv6tbb7n1u.apps.googleusercontent.com", // 웹용 clientId
    iosClientId: "iOS용 clientId", // 예: 962992958749-xxxxxxx.apps.googleusercontent.com
    androidClientId: "Android용 clientId", // 예: 962992958749-xxxxxxx.apps.googleusercontent.com
    // redirectUri: Google.makeRedirectUri({ useProxy: true }), // 보통 생략해도 자동 처리됨
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        fetch(`${BACKEND_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: authentication.idToken }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('서버 응답:', data);
            if (data.result === 'success') {
              router.push('/select');
            } else {
              alert('로그인 실패: ' + JSON.stringify(data));
            }
          })
          .catch(err => {
            console.log('서버 연결 실패:', err);
            alert('서버 연결 실패: ' + err);
          });
      }
    }
  }, [response]);

  const handleGoogleLogin = () => {
    promptAsync();
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* 하단 주황 반원 */}
      <View style={styles.bottomBackground} />

      {/* 중앙 콘텐츠 */}
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
        >
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
            }}
            style={styles.googleLogo}
          />
          <Text style={styles.buttonText}>Log in with Google</Text>
        </TouchableOpacity>

        <Pressable onPress={() => alert('눌렀다!')}>
          <Text style={styles.subText}>이미 계정이 있으신가요?</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5', // 연한 살구색
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBackground: {
    position: 'absolute',
    bottom: -50, // 위로 올라오게!
    width: '120%',
    height: 300,
    backgroundColor: '#F29C50', // 진한 주황
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    zIndex: -1,
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_600SemiBold',
    color: '#813D2C',
  },
  logo: {
    width: 140,
    height: 140,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 2,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  subText: {
    fontSize: 14,
    color: '#5B2C20',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
});