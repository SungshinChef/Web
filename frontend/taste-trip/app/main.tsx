import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import BottomTabBar from '../components/BottomTabBar';

export default function Main() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dietary = params.dietary as string;
  const allergies = params.allergies as string;
  const { width, height } = useWindowDimensions();

  const handleInputPress = () => {
    router.push({
      pathname: "/ingredient",
      params: { dietary, allergies },
    });
  };

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
      marginBottom: height * 0.09,
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
    fridgeAndButton: {
      alignItems: 'center',
      justifyContent: 'center',
      width: width * 0.85,
    },
    fridgeImage: {
      width: 250,
      height: 250,
      marginBottom: 0, // 여백 제거
    },
    buttonContainer: {
      width: '100%',
      marginTop: -30,
    },
    inputBox: {
      backgroundColor: '#FFEFD5',
      width: '100%',
      paddingVertical: 50,
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
      lineHeight: Math.min(width * 0.07, 45),
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* 제목 */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleLine1}>무엇을</Text>
          <View style={styles.titleSpacing} />
          <Text style={styles.titleLine2}>요리할까요?</Text>
        </View>

        {/* 냉장고 + 버튼 */}
        <View style={styles.fridgeAndButton}>
          <Image
            source={require('../assets/main_logo.png')}
            style={styles.fridgeImage}
            resizeMode="contain"
          />

          <TouchableOpacity style={styles.buttonContainer} onPress={handleInputPress}>
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
