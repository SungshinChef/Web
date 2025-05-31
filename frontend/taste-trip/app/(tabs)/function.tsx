// app/(tabs)/function.tsx
import React, { useState, useEffect } from 'react';
import { Text, TextInput, Button, View, ScrollView, Linking, StyleSheet, Alert, Platform, Modal, TouchableOpacity, FlatList } from 'react-native';
import { ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Recipe {
  id: number;
  title: string;
  title_kr?: string;  // 한글 제목 추가
  image: string;
  readyInMinutes: number; 
  servings: number;
  sourceUrl: string;
  instructions?: string;
  ingredients: string[];
  match_percentage?: string;  // 매칭 퍼센트 추가
}

interface DietaryOption {
  name: string;
  apiValue: string;
}

export default function HomeScreen() {
    // BACKEND_URL 설정
    const BACKEND_URL = __DEV__ 
    ? Platform.select({
        ios: 'http://192.168.0.101:8000',
        android: 'http://192.168.0.101:8000',
        default: 'http://192.168.0.101:8000'
      })
    : 'https://your-production-backend-url.com'; // 실제 프로덕션 URL로 변경 필요

  const router = useRouter();

  // 훅 선언부: 항상 최상단에
  // 라우터 params에서 ingredients만 꺼내서 초기값으로 설정
  const params = useLocalSearchParams();
  const initIngredients = (params.ingredients as string) ?? '';
  const [searchIngredients, setSearchIngredients] = useState(initIngredients);
  // dietary, allergies는 DB fetch 후에만 세팅
  const [dietary, setDietary]                 = useState<DietaryOption[]>([]);
  const [allergies, setAllergies]             = useState<string>('');
  const [prefsLoading, setPrefsLoading]       = useState(true);
  const [recipes, setRecipes]                 = useState<Recipe[]>([]);
  const [substitutes, setSubstitutes]         = useState<string[]>([]);
  const [recipeLoading, setRecipeLoading]     = useState(false);
  const [substituteLoading, setSubstituteLoading] = useState(false);
  const [showRecipes, setShowRecipes]         = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [showCuisinePicker, setShowCuisinePicker] = useState(false);
  const [percentRecipes, setPercentRecipes]   = useState<{[key:string]:Recipe[]}>({});
  const [showPercentView, setShowPercentView] = useState(false);
  
  // 사용자 preferences 로딩 (DB에서 식단·알레르기 정보 불러오기)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const token    = await AsyncStorage.getItem('idToken');
        if (!userJson || !token) return router.replace('/login');
        const user = JSON.parse(userJson);

        // 1. AsyncStorage에서 먼저 불러오기
        let diet = await AsyncStorage.getItem('diet');
        let alg  = await AsyncStorage.getItem('allergies');
        if (isMounted) {
          setDietary(diet ? JSON.parse(diet) : []);
          setAllergies(alg || '');
          setPrefsLoading(false); // 바로 UI 보여주기
        }

        // 2. 네트워크로 최신 데이터 갱신 (백그라운드)
        const res = await fetch(`${BACKEND_URL}/api/preferences/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          diet = data.diet;
          alg  = data.allergies;
          if (diet) await AsyncStorage.setItem('diet', diet);
          if (alg) await AsyncStorage.setItem('allergies', alg);
          if (isMounted) {
            setDietary(diet ? JSON.parse(diet) : []);
            setAllergies(alg || '');
          }
        }
      } catch (e) {
        if (isMounted) {
          setDietary([]);
          setAllergies('');
          setPrefsLoading(false);
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // 디버깅: ingredients 초기값만 로그
  useEffect(() => {
    console.log('Loaded ingredients from route:', searchIngredients);
  }, [searchIngredients]);

  useEffect(() => {
    // params 우선, 없으면 AsyncStorage에서 불러오기
    const loadIngredients = async () => {
      let ing = params.ingredients as string;
      if (!ing) {
        ing = await AsyncStorage.getItem('ingredients') ?? '';
      }
      setSearchIngredients(ing);
    };
    loadIngredients();
  }, [params.ingredients]);

  if (prefsLoading) {    
    return (
    <View style={styles.center}>        
      <ActivityIndicator size="large" />
      <Text>설정 불러오는 중…</Text>
    </View>
    );
  }

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

  async function fetchFilteredRecipes() {
    let ingredients = searchIngredients.trim();
    if (!ingredients) {
      ingredients = (await AsyncStorage.getItem('ingredients')) ?? '';
      if (!ingredients) {
        // Alert.alert("입력 오류", "검색할 재료를 입력해주세요."); // useFocusEffect에서 호출 시 Alert 방지
        return;
      }
      setSearchIngredients(ingredients);
    }

    setRecipeLoading(true);
    setShowRecipes(true);
    setShowPercentView(false); // 일반 레시피 검색 시 퍼센트 뷰 숨기기
    try {
      console.log("🌐 백엔드 URL:", BACKEND_URL);
      
      const requestBody = {
        ingredients: ingredients.split(',').map(i => i.trim()),
        allergies,                        // DB에서 불러온 CSV 문자열
        cuisine: selectedCuisine,
        dietary: dietary.length > 0
        ? dietary[0].apiValue
        : null
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
      Alert.alert("오류", `레시피를 가져오는데 실패했습니다. (${error.message})`);
    } finally {
      setRecipeLoading(false);
    }
  }
  
  async function fetchSubstitutes() {
    let ingredients = searchIngredients.trim();
    if (!ingredients) {
      ingredients = (await AsyncStorage.getItem('ingredients')) ?? '';
      if (!ingredients) {
        // Alert.alert("입력 오류", "재료를 입력해주세요."); // useFocusEffect에서 호출 시 Alert 방지
        return;
      }
      setSearchIngredients(ingredients);
    }

    setSubstituteLoading(true);
    setShowRecipes(false);
    setSubstitutes([]);
    try {
      const ingredient = ingredients.split(',')[0].trim();
      
      const response = await fetch(`${BACKEND_URL}/get_substitutes/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ingredients: [ingredient],
          allergies: allergies, // 알레르기 정보 포함
          cuisine: selectedCuisine, // 나라 정보 포함
          dietary: dietary.length > 0 ? dietary[0].apiValue : null // 식단 정보 포함
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("대체 재료 응답:", data);
      
      if (data.error) {
        Alert.alert("오류", data.error);
        return;
      }
      
      setSubstitutes(data.substitutes || []);
    } catch (error: any) {
      console.error("❌ 대체 재료 검색 오류:", error);
      Alert.alert("오류", `대체 재료를 가져오는데 실패했습니다. (${error.message})`);
    } finally {
      setSubstituteLoading(false);
    }
  }
  
  const handleRecipePress = (recipeId: number) => {
    router.push({
      pathname: `/recipe/${recipeId}` as any,
      params: { id: recipeId, ownedIngredients: searchIngredients }
    });
  };

  async function fetchPercentRecipes() {
    let ingredients = searchIngredients.trim();
    if (!ingredients) {
      ingredients = (await AsyncStorage.getItem('ingredients')) ?? '';
      if (!ingredients) {
        // Alert.alert("입력 오류", "검색할 재료를 입력해주세요."); // useFocusEffect에서 호출 시 Alert 방지
        return;
      }
      setSearchIngredients(ingredients);
    }

    setRecipeLoading(true);
    setShowRecipes(true);
    setShowPercentView(true);
    try {
      const requestBody = {
        ingredients: ingredients.split(',').map(i => i.trim()),
        allergies: allergies,
        cuisine: selectedCuisine,
        dietary: dietary.length > 0 ? dietary[0].apiValue : null
      };

      const response = await fetch(`${BACKEND_URL}/get_recipes_by_percent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        Alert.alert("오류", data.error);
        return;
      }
      setPercentRecipes(data);
    } catch (error: any) {
      console.error("❌ 퍼센트 기반 레시피 검색 오류:", error);
      Alert.alert("오류", `레시피를 가져오는데 실패했습니다. (${error.message})`);
    } finally {
      setRecipeLoading(false);
    }
  }

  return (
    <ScrollView>
      <Text style={styles.title}>🍽️ 이색 레시피 추천기</Text>

      {/* 선택된 재료 표시 */}
      {searchIngredients && (
        <View style={styles.ingredientsInfo}>
          <Text style={styles.ingredientsTitle}>🥘 선택한 재료</Text>
          <Text style={styles.ingredientsText}>
            {searchIngredients.split(',').map(ingredient => ingredient.trim()).join(', ')}
          </Text>
        </View>
      )}

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
          title="일반 레시피 찾기"
          onPress={fetchFilteredRecipes}
          color="#FF6B00"
          disabled={!searchIngredients.trim()}
        />
        <View style={{ height: 10 }} />
        <Button
          title="재료 매칭률로 찾기"
          onPress={fetchPercentRecipes}
          color="#FF8C00"
          disabled={!searchIngredients.trim()}
        />
        <View style={{ height: 10 }} />
        <Button
          title="대체 재료 찾기"
          onPress={fetchSubstitutes}
          color="#FF9F45"
          disabled={!searchIngredients.trim()}
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

      {!recipeLoading && showRecipes && !showPercentView && recipes.length > 0 && (
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
              <Text style={styles.ingredientsList}>
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

      {!recipeLoading && showRecipes && showPercentView && Object.keys(percentRecipes).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 재료 매칭률 기반 추천 레시피</Text>
          {Object.entries(percentRecipes).map(([percent, recipes]) => 
            recipes.length > 0 && (
              <View key={percent} style={styles.percentSection}>
                <Text style={styles.percentTitle}>{percent} 매칭</Text>
                {recipes.map((recipe, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.card, { borderLeftWidth: 4, borderLeftColor: getMatchColor(recipe.match_percentage) }]}
                    onPress={() => handleRecipePress(recipe.id)}
                  >
                    <View style={styles.recipeTitleContainer}>
                      <Text style={styles.recipeTitle}>{recipe.title}</Text>
                      <Text style={[styles.matchPercentage, { backgroundColor: getMatchColor(recipe.match_percentage, true) }]}>
                        {recipe.match_percentage}
                      </Text>
                    </View>
                    <View style={styles.recipeInfoContainer}>
                      <Text style={styles.recipeInfoText}>⏱️ 조리시간: {recipe.readyInMinutes}분</Text>
                      <Text style={styles.recipeInfoText}>👥 인분: {recipe.servings}인분</Text>
                    </View>
                    <Text style={styles.ingredientsTitle}>🥘 사용된 재료:</Text>
                    <Text style={styles.ingredientsList}>
                      {recipe.ingredients && recipe.ingredients.length > 0 
                        ? recipe.ingredients.join(', ')
                        : '재료 정보가 없습니다.'
                      }
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}
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

      {!recipeLoading && showRecipes && recipes.length === 0 && !Object.keys(percentRecipes).length && (
        <Text style={styles.noResults}>
          아직 레시피가 없어요. 다른 조건으로 검색해보세요!
        </Text>
      )}
    </ScrollView>
  );
}

const getMatchColor = (percentage: string | undefined, isLight: boolean = false) => {
  if (!percentage) return isLight ? '#E8F0FE' : '#4285F4';
  const value = parseInt(percentage);
  if (value >= 100) return isLight ? '#E6F4EA' : '#34A853';
  if (value >= 80) return isLight ? '#FCE8E6' : '#EA4335';
  if (value >= 50) return isLight ? '#FEF7E0' : '#FBBC04';
  return isLight ? '#E8F0FE' : '#4285F4';
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFD6A5',  // 배경색 변경
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    textAlign: 'center', 
    color: '#813D2C'  // 제목 색상 변경
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#5B2C20',  // 라벨 색상 변경
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#F29C50', 
    padding: 10, 
    borderRadius: 8, 
    backgroundColor: '#FFEFD5',  // 입력창 배경색 변경
    marginBottom: 20 
  },
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
  section: { 
    marginTop: 30 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 12,
    backgroundColor: '#F29C50',  // 섹션 제목 배경색 추가
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
    color: '#fff',
    alignSelf: 'center',
  },
  card: { 
    backgroundColor: '#FFEFD5',  // 카드 배경색 변경
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  recipeTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 8, 
    color: '#813D2C'  // 레시피 제목 색상 변경
  },
  instructions: { 
    marginTop: 8, 
    marginBottom: 8, 
    lineHeight: 20,
    color: '#5B2C20'  // 설명 텍스트 색상 변경
  },
  link: { color: '#1E90FF', marginTop: 8, textDecorationLine: 'underline' },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#5B2C20',
    fontSize: 16,
  },
  substituteCard: {
    backgroundColor: '#FFEFD5',  // 대체 재료 카드 배경색 변경
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
    color: '#5B2C20',  // 대체 재료 텍스트 색상 변경
    lineHeight: 24,
  },
  ingredientsInfo: {
    backgroundColor: '#FFEFD5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#813D2C',
    marginBottom: 4,
  },
  ingredientsText: {
    color: '#5B2C20',
    fontSize: 16,
  },
  allergyInfo: {
    backgroundColor: '#FFEFD5',  // 알레르기 정보 배경색 변경
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  allergyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#813D2C',  // 알레르기 제목 색상 변경
    marginBottom: 4,
  },
  allergyText: {
    color: '#5B2C20',  // 알레르기 텍스트 색상 변경
  },
  dietaryInfo: {
    backgroundColor: '#FFEFD5',  // 식단 정보 배경색 변경
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dietaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#813D2C',  // 식단 제목 색상 변경
    marginBottom: 4,
  },
  dietaryText: {
    color: '#5B2C20',  // 식단 텍스트 색상 변경
  },
  cuisineButton: {
    backgroundColor: '#FFEFD5',  // 나라별 요리 버튼 배경색 변경
    borderWidth: 1,
    borderColor: '#F29C50',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  cuisineButtonText: {
    fontSize: 16,
    color: '#5B2C20',  // 나라별 요리 버튼 텍스트 색상 변경
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFEFD5',  // 모달 배경색 변경
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
    color: '#813D2C',  // 모달 제목 색상 변경
  },
  cuisineItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F29C50',  // 구분선 색상 변경
  },
  selectedCuisineItem: {
    backgroundColor: '#FFD6A5',  // 선택된 항목 배경색 변경
  },
  cuisineItemText: {
    fontSize: 16,
    color: '#5B2C20',  // 항목 텍스트 색상 변경
  },
  selectedCuisineText: {
    color: '#813D2C',  // 선택된 항목 텍스트 색상 변경
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F2C078',  // 닫기 버튼 배경색 변경
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#5B2C20',  // 닫기 버튼 텍스트 색상 변경
    fontSize: 16,
    fontWeight: '500',
  },
  percentSection: {
    marginBottom: 20,
  },
  percentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#813D2C',  // 퍼센트 제목 색상 변경
    marginBottom: 10,
    backgroundColor: '#FFD6A5',  // 퍼센트 제목 배경색 변경
    padding: 8,
    borderRadius: 8,
  },
  recipeTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  recipeInfoText: {
    fontSize: 14,
    color: '#5B2C20',  // 레시피 정보 텍스트 색상 변경
  },
  matchPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#813D2C',  // 매칭률 텍스트 색상 변경
    backgroundColor: '#FFD6A5',  // 매칭률 배경색 변경
    padding: 4,
    borderRadius: 4,
  },
  ingredientsList: {
    color: '#5B2C20',
    lineHeight: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD6A5',
  },
});