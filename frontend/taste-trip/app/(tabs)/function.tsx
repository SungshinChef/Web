// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import { Text, TextInput, Button, View, ScrollView, Linking, StyleSheet, Alert, Platform, Modal, TouchableOpacity, FlatList } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  instructions?: string;
  ingredients: string[];
}

interface DietaryOption {
  name: string;
  apiValue: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchIngredients, setSearchIngredients] = useState('');  // 검색할 재료
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [substituteLoading, setSubstituteLoading] = useState(false);
  const [showRecipes, setShowRecipes] = useState(true);  // 레시피/대체재료 화면 토글
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [showCuisinePicker, setShowCuisinePicker] = useState(false);
  const allergies = params.allergies as string || '';  // 알레르기 재료는 읽기 전용
  const dietaryString = params.dietary as string || '';  // 식단 정보는 읽기 전용
  const dietary: DietaryOption[] = dietaryString ? JSON.parse(dietaryString) : [];

  const BACKEND_URL = "http://172.30.1.25:8000";  // 현재 개발 컴퓨터의 IP 주소

  const cuisines = [
    { label: '선택 안함', value: '' },
    { label: '아프리카 요리', value: 'African' },
    { label: '미국 요리', value: 'American' },
    { label: '영국 요리', value: 'British' },
    { label: '케이준', value: 'Cajun' },
    { label: '카리브해', value: 'Caribbean' },
    { label: '중국 요리', value: 'Chinese' },
    { label: '동유럽 요리', value: 'Eastern European' },
    { label: '유럽 전반', value: 'European' },
    { label: '프랑스 요리', value: 'French' },
    { label: '독일 요리', value: 'German' },
    { label: '그리스 요리', value: 'Greek' },
    { label: '인도 요리', value: 'Indian' },
    { label: '아일랜드 요리', value: 'Irish' },
    { label: '이탈리아 요리', value: 'Italian' },
    { label: '일본 요리', value: 'Japanese' },
    { label: '유대 요리', value: 'Jewish' },
    { label: '한국 요리', value: 'Korean' },
    { label: '라틴 아메리카', value: 'Latin American' },
    { label: '지중해 요리', value: 'Mediterranean' },
    { label: '멕시코 요리', value: 'Mexican' },
    { label: '중동 요리', value: 'Middle Eastern' },
    { label: '북유럽 요리', value: 'Nordic' },
    { label: '남부 미국', value: 'Southern' },
    { label: '스페인 요리', value: 'Spanish' },
    { label: '태국 요리', value: 'Thai' },
    { label: '베트남 요리', value: 'Vietnamese' }
  ];

  const fetchFilteredRecipes = async () => {
    if (!searchIngredients.trim()) {
      Alert.alert("입력 오류", "검색할 재료를 입력해주세요.");
      return;
    }

    setRecipeLoading(true);
    setShowRecipes(true);  // 레시피 화면으로 전환
    try {
      console.log("🌐 백엔드 URL:", BACKEND_URL);
      
      const requestBody = {
        ingredients: searchIngredients.split(',').map(i => i.trim()),
        allergies: allergies,
        cuisine: selectedCuisine,
        dietary: dietary.length > 0 ? dietary[0].apiValue : null
      };
      
      console.log("📤 API 요청 데이터:", requestBody);

      const response = await fetch(`${BACKEND_URL}/get_recipes/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("📥 API 응답 상태:", response.status);
      const data = await response.json();
      console.log("📥 API 응답 데이터:", data);

      if (data.error) {
        Alert.alert("오류", data.error);
        return;
      }
      setRecipes(data || []);
    } catch (error: any) {
      console.error("❌ 레시피 검색 오류:", error);
      Alert.alert("오류", "레시피를 가져오는데 실패했습니다.");
    } finally {
      setRecipeLoading(false);
    }
  };
  

  const fetchSubstitutes = async () => {
    if (!searchIngredients.trim()) {
      Alert.alert("입력 오류", "재료를 입력해주세요.");
      return;
    }

    setSubstituteLoading(true);
    setShowRecipes(false);  // 대체 재료 화면으로 전환
    setSubstitutes([]); // 이전 결과 초기화
    try {
      const ingredient = searchIngredients.split(',')[0].trim(); // 첫 번째 재료만 사용
      
      const response = await fetch(`${BACKEND_URL}/get_substitutes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: [ingredient],  // 배열로 전송
          allergies: "",
          cuisine: null,
          dietary: null
        }),
      });
  
      const data = await response.json();
      console.log("대체 재료 응답:", data);
      
      if (data.error) {
        Alert.alert("오류", data.error);
        return;
      }
      
      setSubstitutes(data.substitutes || []);
    } catch (error: any) {
      console.error("❌ 대체 재료 검색 오류:", error);
      Alert.alert("오류", "대체 재료를 가져오는데 실패했습니다.");
    } finally {
      setSubstituteLoading(false);
    }
  };
  
  

  const handleRecipePress = (recipeId: number) => {
    router.push(`/recipe/${recipeId}`);
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
      bounces={true}
      overScrollMode="always"
    >
      <Text style={styles.title}>🍽️ 이색 레시피 추천기</Text>

      {dietary.length > 0 && (
        <View style={styles.dietaryInfo}>
          <Text style={styles.dietaryTitle}>🥗 선택된 식단</Text>
          <Text style={styles.dietaryText}>
            {dietary.map(d => d.name).join(', ')}
          </Text>
        </View>
      )}

      {allergies && (
        <View style={styles.allergyInfo}>
          <Text style={styles.allergyTitle}>⚠️ 제외될 알레르기 재료</Text>
          <Text style={styles.allergyText}>{allergies}</Text>
        </View>
      )}
  
      <Text style={styles.label}>검색할 재료</Text>
      <TextInput
        style={styles.input}
        placeholder="예: 김치, 돼지고기"
        value={searchIngredients}
        onChangeText={setSearchIngredients}
      />

      <Text style={styles.label}>나라별 요리</Text>
      <TouchableOpacity
        style={styles.cuisineButton}
        onPress={() => setShowCuisinePicker(true)}
      >
        <Text style={styles.cuisineButtonText}>
          {selectedCuisine ? cuisines.find(c => c.value === selectedCuisine)?.label : '나라 선택하기'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showCuisinePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCuisinePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>나라별 요리 선택</Text>
            <FlatList
              data={cuisines}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cuisineItem,
                    selectedCuisine === item.value && styles.selectedCuisineItem
                  ]}
                  onPress={() => {
                    setSelectedCuisine(item.value);
                    setShowCuisinePicker(false);
                  }}
                >
                  <Text style={[
                    styles.cuisineItemText,
                    selectedCuisine === item.value && styles.selectedCuisineText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCuisinePicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonContainer}>
        <Button
          title="레시피 찾기"
          onPress={fetchFilteredRecipes}
          color="#FF6B00"
        />
        <View style={{ height: 10 }} />
        <Button
          title="대체 재료 찾기"
          onPress={fetchSubstitutes}
          color="#FF8C00"
        />
      </View>

      {recipeLoading && showRecipes && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>레시피를 찾고 있어요...</Text>
        </View>
      )}

      {substituteLoading && !showRecipes && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text style={styles.loadingText}>대체 재료를 찾고 있어요...</Text>
        </View>
      )}

      {!recipeLoading && showRecipes && recipes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 추천 레시피</Text>
          {recipes.map((recipe, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => handleRecipePress(recipe.id)}
            >
              <Text style={styles.recipeTitle}>{recipe.title}</Text>
              <Text>⏱️ 조리시간: {recipe.readyInMinutes}분</Text>
              <Text>👥 인분: {recipe.servings}인분</Text>
              <Text style={styles.ingredientsTitle}>🥘 사용된 재료:</Text>
              <Text style={styles.ingredients}>
                {recipe.ingredients && recipe.ingredients.length > 0 
                  ? recipe.ingredients.join(', ')
                  : '재료 정보가 없습니다.'
                }
              </Text>
              {recipe.instructions && (
                <Text style={styles.instructions}>
                  👩‍🍳 조리방법:{'\n'}{recipe.instructions}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!substituteLoading && !showRecipes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 대체 재료</Text>
          {substitutes.length > 0 ? (
            substitutes.map((sub, i) => (
              <View key={i} style={styles.substituteCard}>
                <Text style={styles.substituteText}>• {sub}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noResults}>대체 재료를 찾을 수 없어요.</Text>
          )}
        </View>
      )}

      {!recipeLoading && showRecipes && recipes.length === 0 && (
        <Text style={styles.noResults}>
          아직 레시피가 없어요. 다른 조건으로 검색해보세요!
        </Text>
      )}
    </ScrollView>
  );
  
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  container: {
    padding: 24,
    paddingBottom: 40,  // 하단 여백 추가
  },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#FF6B00' },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: { borderWidth: 1, borderColor: '#aaa', padding: 10, borderRadius: 8, backgroundColor: '#fff', marginBottom: 20 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
    marginHorizontal: 10,
  },
  pickerIOS: {
    height: 150,
    width: '100%',
  },
  pickerAndroid: {
    width: '100%',
    height: 50,
    color: '#000',
  },
  pickerItemAndroid: {
    fontSize: 16,
    color: '#000',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
  },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  recipeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#FF6B00' },
  instructions: { marginTop: 8, marginBottom: 8, lineHeight: 20 },
  link: { color: '#1E90FF', marginTop: 8, textDecorationLine: 'underline' },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
  substituteCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  substituteText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  ingredients: {
    color: '#666',
    lineHeight: 20,
  },
  allergyInfo: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  allergyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4444',
    marginBottom: 4,
  },
  allergyText: {
    color: '#666',
  },
  dietaryInfo: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dietaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  dietaryText: {
    color: '#666',
  },
  cuisineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  cuisineButtonText: {
    fontSize: 16,
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  cuisineItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCuisineItem: {
    backgroundColor: '#FFE5D1',
  },
  cuisineItemText: {
    fontSize: 16,
    color: '#000',
  },
  selectedCuisineText: {
    color: '#FF6B00',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F2B28A',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
});
