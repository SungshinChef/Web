// app/ingredient.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function IngredientScreen() {
  const [ingredient, setIngredient] = useState('');
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const router = useRouter();

  const addIngredient = () => {
    if (ingredient.trim() !== '') {
      setIngredientsList((prev) => [...prev, ingredient.trim()]);
      setIngredient('');
    }
  };

  const removeIngredient = (item: string) => {
    setIngredientsList((prev) => prev.filter((i) => i !== item));
  };

  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/main')}>
        <Ionicons name="chevron-back" size={28} color="#5B2C20" />
      </TouchableOpacity>

      {/* 제목 */}
      <Text style={styles.title}>
        <Text style={styles.orangeText}>요리</Text>하려는 {'\n'}
        <Text style={styles.orangeText}>재료</Text>를 입력해주세요.
      </Text>

      <Text style={styles.subText}>최적의 <Text style={styles.orangeText}>레시피</Text>를 추천해 드립니다.</Text>

      {/* 입력창 및 추가 버튼 */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="직접 입력"
          style={styles.input}
          value={ingredient}
          onChangeText={setIngredient}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
          <Text style={styles.addBtnText}>입력하여 추가하기</Text>
        </TouchableOpacity>
      </View>

      {/* 선택된 재료 리스트 */}
      <View style={styles.box}>
        <ScrollView
          contentContainerStyle={styles.tagContainer}
          keyboardShouldPersistTaps="handled"
        >
          {ingredientsList.map((item, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
              <TouchableOpacity onPress={() => removeIngredient(item)}>
                <Text style={styles.removeBtn}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.tip}>2가지 이상의 재료는 <Text style={styles.bold}>띄어쓰기</Text>로 구분해 주세요.</Text>
      </View>

      {/* 추천 받기 버튼 */}
      <TouchableOpacity style={styles.recommendBtn}>
        <Text style={styles.recommendText}>추천 받기</Text>
      </TouchableOpacity>

      {/* 하단 탭바 */}
      <View style={styles.tabBar}>
        <View style={styles.tabBorder} />
        <TouchableOpacity onPress={() => console.log('추천')}>
          <Image source={require('../assets/recommend_logo.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('대체')}>
          <Image source={require('../assets/substitute_logo.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('내 정보')}>
          <Image source={require('../assets/user_info_logo.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD6A5',
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B2C20',
    marginBottom: 8,
  },
  orangeText: {
    color: '#F29C50',
    fontWeight: 'bold',
  },
  subText: {
    marginBottom: 20,
    color: '#5B2C20',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  addBtn: {
    alignSelf: 'center',
    borderColor: '#5B2C20',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  addBtnText: {
    color: '#5B2C20',
  },
  box: {
    backgroundColor: '#FFEFD5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    minHeight: 100,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    backgroundColor: '#D9BFA9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  tagText: {
    color: '#5B2C20',
    fontWeight: 'bold',
    marginRight: 4,
  },
  removeBtn: {
    color: '#5B2C20',
    fontSize: 16,
  },
  tip: {
    marginTop: 10,
    fontSize: 12,
    color: '#5B2C20',
  },
  bold: {
    fontWeight: 'bold',
  },
  recommendBtn: {
    backgroundColor: '#5B2C20',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  recommendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFEFD5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  tabBorder: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#5B2C20',
  },
  icon: {
    width: 28,
    height: 28,
  },
});
