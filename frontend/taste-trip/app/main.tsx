import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BottomTabBar from '../components/BottomTabBar';

const { width, height } = Dimensions.get('window');

export default function Main() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dietary = params.dietary as string;
  const allergies = params.allergies as string;

  const handleInputPress = () => {
    router.push({
      pathname: "/ingredient",
      params: {
        dietary: dietary,
        allergies: allergies
      }
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 제목 */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleLine1}>무엇을</Text>
          <View style={styles.titleSpacing} />
          <Text style={styles.titleLine2}>요리할까요?</Text>
        </View>

        {/* 냉장고 이미지와 입력 버튼을 포함하는 컨테이너 */}
        <View style={styles.mainContentContainer}>
          <View style={styles.fridgeContainer}>
            {/* 냉장고 이미지 */}
            <Image
              source={require('../assets/main_logo.png')}
              style={styles.fridgeImage}
              resizeMode="contain"
            />
          </View>

          {/* 입력 버튼 */}
          <TouchableOpacity 
            style={styles.buttonContainer}
            onPress={handleInputPress}
          >
            <View style={styles.inputBox}>
              <Text style={styles.inputText}>재료를</Text>
              <Text style={styles.inputText}>입력해주세요.</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFD6A5',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: height * 0.04,
  },
  titleSpacing: {
    height: height * 0.02,
  },
  titleLine1: {
    fontSize: Math.min(width * 0.1, 40),
    fontWeight: 'bold',
    color: '#813D2C',
  },
  titleLine2: {
    fontSize: Math.min(width * 0.1, 40),
    fontWeight: 'bold',
    color: '#813D2C',
  },
  mainContentContainer: {
    width: width * 0.85,
    height: height * 0.5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fridgeContainer: {
    width: width * 0.85,
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD6A5',
  },
  fridgeImage: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
  buttonContainer: {
    width: '100%',
    height: '25%',
    marginTop: Math.min(-height * 0.02, -15),
  },
  inputBox: {
    backgroundColor: '#FFEFD5',
    width: '100%',
    height: Math.min(height * 0.16, 160),
    borderRadius: Math.min(width * 0.05, 20),
    borderWidth: 1,
    borderColor: '#B88655',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputText: {
    color: '#5B2C20',
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: '500',
    lineHeight: Math.min(width * 0.07, 28),
  },
});
