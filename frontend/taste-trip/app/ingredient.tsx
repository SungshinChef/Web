import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../components/BottomTabBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function IngredientScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 식단 및 알레르기 정보 받아오기
  const dietary = params.dietary as string;
  const allergies = params.allergies as string;
  
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addIngredient = (text: string) => {
    if (text.trim() !== '') {
      setIngredientsList((prev) => [...prev, text.trim()]);
      setInputValue('');
    }
  };

  const handleInputChange = (text: string) => {
    // 마지막 문자가 공백이나 쉼표인 경우
    if ((text.endsWith(' ') || text.endsWith(',')) && inputValue.trim() !== '') {
      addIngredient(inputValue.trim());
    } else {
      setInputValue(text);
    }
  };

  const handleSubmitEditing = () => {
    if (inputValue.trim() !== '') {
      addIngredient(inputValue.trim());
      Keyboard.dismiss();  // 완료 버튼 눌렀을 때만 키보드 닫기
    }
  };

  const removeIngredient = (item: string) => {
    setIngredientsList((prev) => prev.filter((i) => i !== item));
  };

  const handleRecommend = () => {
    if (ingredientsList.length === 0) {
      Alert.alert('알림', '재료를 하나 이상 입력해주세요.');
      return;
    }
    // AsyncStorage는 fallback 용도로만 사용
    router.push({
      pathname: '/(tabs)/function',
      params: { ingredients: ingredientsList.join(',') }
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.replace('/main')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#5B2C20" />
        </TouchableOpacity>

        {/* 제목 */}
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>
            <Text style={styles.orangeText}>요리</Text>하려는{'\n'}
            <Text style={styles.orangeText}>재료</Text>를 입력해주세요.
          </Text>

          <Text style={styles.subText}>
            <Text style={styles.orangeText}>최적의 레시피</Text>를 추천해 드립니다.
          </Text>
        </View>

        {/* 재료 입력 박스 */}
        <View style={styles.box}>
          <TextInput
            placeholder="재료를 입력하세요"
            style={styles.boxInput}
            value={inputValue}
            onChangeText={handleInputChange}
            onSubmitEditing={handleSubmitEditing}
            returnKeyType="done"
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <View style={styles.tagContainer}>
            {ingredientsList.map((item, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{item}</Text>
                <TouchableOpacity 
                  onPress={() => removeIngredient(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.removeBtn}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.tip}>재료 입력 후 <Text style={styles.bold}>띄어쓰기</Text> 또는 <Text style={styles.bold}>쉼표(,)</Text>를 누르면 자동으로 추가됩니다.</Text>

        {/* 추천 받기 버튼 */}
        <TouchableOpacity 
          style={styles.recommendBtn} 
          onPress={() => {
            Keyboard.dismiss();
            handleRecommend();
          }}
        >
          <Text style={styles.recommendText}>추천 받기</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: width * 0.06,
    paddingBottom: 100,
  },
  backButton: {
    marginBottom: height * 0.02,
  },
  titleWrapper: {
    marginBottom: height * 0.04,
  },
  title: {
    fontSize: Math.min(width * 0.07, 28),
    color: '#5B2C20',
    marginBottom: height * 0.015,
    lineHeight: Math.min(width * 0.1, 40),
  },
  orangeText: {
    color: '#DC4F06',
  },
  subText: {
    color: '#5B2C20',
    fontSize: Math.min(width * 0.045, 18),
  },
  box: {
    backgroundColor: '#FFEFD5',
    borderRadius: 16,
    padding: width * 0.05,
    marginVertical: height * 0.03,
    minHeight: height * 0.2,
    borderWidth: 1,
    borderColor: '#B88655',
  },
  boxInput: {
    fontSize: Math.min(width * 0.045, 18),
    color: '#5B2C20',
    padding: 0,
    marginBottom: height * 0.015,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    backgroundColor: '#D9BFA9',
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.01,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  tagText: {
    color: '#5B2C20',
    fontWeight: '500',
    fontSize: Math.min(width * 0.04, 16),
    marginRight: 6,
  },
  removeBtn: {
    color: '#5B2C20',
    fontSize: Math.min(width * 0.05, 20),
    marginTop: -2,
  },
  tip: {
    marginTop: height * 0.01,
    fontSize: Math.min(width * 0.035, 14),
    color: '#5B2C20',
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  recommendBtn: {
    backgroundColor: '#5B2C20',
    paddingVertical: height * 0.02,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: height * 0.04,
  },
  recommendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Math.min(width * 0.045, 18),
  },
}); 