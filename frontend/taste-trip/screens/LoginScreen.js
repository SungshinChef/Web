import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useFonts, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
  });

  const handleGoogleLogin = () => {
    // 테스트 화면으로 이동
    router.push('/select');
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
