// frontend/taste-trip/app/(tabs)/function.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../components/BottomTabBar';
import { useRecipeFilter } from '../../context/RecipeFilterContext';
import { Recipe, DietaryOption } from '../../types';

const { width } = Dimensions.get('window');

export default function FunctionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { 
    ingredients: contextIngredients,
    setIngredients: setContextIngredients, 
    country,
    setCountry,
    recipes, 
    setRecipes, 
    matchRecipes, 
    setMatchRecipes 
  } = useRecipeFilter();

  const [dietary, setDietary] = useState<DietaryOption[]>([]);
  const [allergies, setAllergies] = useState<string>('');
  const [prefsLoading, setPrefsLoading] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [showMatch, setShowMatch] = useState<boolean>(false);

  const [showPicker, setShowPicker] = useState<boolean>(false);

  const BACKEND_URL = __DEV__
    ? Platform.select({
        ios: 'http://127.0.0.1:8000',
        android: 'http://127.0.0.1:8000',
        default: 'http://127.0.0.1:8000',
      })
    : 'https://your-production-backend-url.com';

  const cuisineList = [
    { label: '선택 안함', value: '' },
    { label: '아프리카', value: 'African' },
    { label: '미국', value: 'American' },
    { label: '영국', value: 'British' },
    { label: '케이준', value: 'Cajun' },
    { label: '카리브해', value: 'Caribbean' },
    { label: '중국', value: 'Chinese' },
    { label: '동유럽', value: 'Eastern European' },
    { label: '유럽', value: 'European' },
    { label: '프랑스', value: 'French' },
    { label: '독일', value: 'German' },
    { label: '그리스', value: 'Greek' },
    { label: '인도', value: 'Indian' },
    { label: '아일랜드', value: 'Irish' },
    { label: '이탈리아', value: 'Italian' },
    { label: '일본', value: 'Japanese' },
    { label: '유대', value: 'Jewish' },
    { label: '한국', value: 'Korean' },
    { label: '라틴 아메리카', value: 'Latin American' },
    { label: '지중해', value: 'Mediterranean' },
    { label: '멕시코', value: 'Mexican' },
    { label: '중동', value: 'Middle Eastern' },
    { label: '북유럽', value: 'Nordic' },
    { label: '남부 미국', value: 'Southern' },
    { label: '스페인', value: 'Spanish' },
    { label: '태국', value: 'Thai' },
    { label: '베트남', value: 'Vietnamese' },
  ];

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('idToken');

        if (!userJson || !token) {
          router.replace('/login');
          return;
        }
        const user = JSON.parse(userJson);

        const storedDietJson = await AsyncStorage.getItem('diet');
        const storedAllergies = await AsyncStorage.getItem('allergies');

        if (isMounted) {
          if (storedDietJson) {
            try {
              const parsedDiet = JSON.parse(storedDietJson);
              if (Array.isArray(parsedDiet)) {
                setDietary(parsedDiet);
              } else {
                console.warn('Stored dietary data is not an array:', parsedDiet);
                setDietary([]);
              }
            } catch (e) {
              console.error('Failed to parse stored dietary data:', e);
              setDietary([]);
            }
          } else {
            setDietary([]);
          }

          setAllergies(storedAllergies || '');
          setPrefsLoading(false);

          if (params.ingredients && typeof params.ingredients === 'string') {
              setContextIngredients(params.ingredients.split(',').map((i: string) => i.trim()));
          }
        }

        const res = await fetch(`${BACKEND_URL}/api/preferences/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          console.log("API 응답 전체 데이터:", data);
          console.log("API 응답 식단 데이터 (data.diet):", data.diet);
          const latestDiet = data.diet;
        
          // ❷ data.diet가 문자열일 경우 파싱 시도
          let parsedDiet: DietaryOption[] = [];
          if (data.diet) {
            try {
              // 백엔드에서 diet를 그대로 string으로 보내면 JSON.parse 필요
              parsedDiet =
                typeof data.diet === 'string'
                  ? JSON.parse(data.diet)
                  : data.diet;
            } catch (e) {
              console.warn('Failed to parse diet from API:', e);
              parsedDiet = [];
            }
          }
        
          if (Array.isArray(parsedDiet)) {
            setDietary(parsedDiet);
            await AsyncStorage.setItem('diet', JSON.stringify(parsedDiet));
          } else {
            console.warn('Parsed diet is not an array:', parsedDiet);
            setDietary([]);
            await AsyncStorage.setItem('diet', JSON.stringify([]));
          }
        
          // ❸ data.allergies는 문자열(콤마로 구분된 텍스트) 형태로 보낸다 가정
          const latestAlgs = data.allergies;
          if (latestAlgs !== undefined && latestAlgs !== null) {
            setAllergies(latestAlgs || '');
            await AsyncStorage.setItem('allergies', latestAlgs || '');
          } else {
            console.warn('Latest allergies data from API is missing or undefined');
            setAllergies('');
            await AsyncStorage.setItem('allergies', '');
          }
        } else {
          console.warn('Failed to fetch latest preferences from server', res.status);
        }
        
      } catch (e) {
        console.error("Failed to load user prefs from storage/server:", e);
        if (isMounted) {
          setDietary([]);
          setAllergies('');
          setPrefsLoading(false);
           await AsyncStorage.setItem('diet', JSON.stringify([]));
           await AsyncStorage.setItem('allergies', '');
        }
      }
    })();

    return () => { isMounted = false; };
  }, [params.ingredients, setContextIngredients, router, BACKEND_URL]);

  const fetchRecipes = async () => {
    if (contextIngredients.length === 0) {
      Alert.alert('입력 오류', '재료를 입력해주세요.');
      return;
    }
    setLoading(true);
    setShowMatch(false);

    setRecipes([]);
    setMatchRecipes([]);

    try {
      const requestBody = {
        ingredients: contextIngredients,
        allergies,
        cuisine: country,
        dietary:
            dietary.length > 0
              ? dietary.map((d) => d.apiValue).join(',')
              : null,
      };

      const res = await fetch(`${BACKEND_URL}/get_recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setRecipes(data);

    } catch (e: any) {
      Alert.alert('에러', e.message);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchRecipes = async () => {
    if (contextIngredients.length === 0) {
      Alert.alert('입력 오류', '재료를 입력해주세요.');
      return;
    }
    setLoading(true);
    setShowMatch(true);

    setRecipes([]);
    setMatchRecipes([]);

    try {
      const requestBody = {
        ingredients: contextIngredients,
        allergies,
        cuisine: country,
        dietary:
            dietary.length > 0
              ? dietary.map((d) => d.apiValue).join(',')
              : null,
      };

      const res = await fetch(`${BACKEND_URL}/get_recipes_by_percent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log("🐶 fetchMatchRecipes 응답 data:", data);
      if (data.error) throw new Error(data.error);

      setMatchRecipes(data);

    } catch (e: any) {
      Alert.alert('에러', e.message);
      setMatchRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (percent: string) => {
    const val = parseInt(percent);
    if (val >= 100) return '#34A853';
    if (val >= 80) return '#FBBC05';
    if (val >= 50) return '#F39C12';
    return '#EA4335';
  };

  if (prefsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text>설정 불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.push('/ingredient')}>
          <Ionicons name="chevron-back" size={28} color="#5B2C20" />
        </TouchableOpacity>

        <Text style={styles.title}>🍽️ 레시피 추천기</Text>

        {contextIngredients.length > 0 ? (
          <Text style={styles.label}>
            재료: <Text style={styles.highlight}>{contextIngredients.join(', ')}</Text>
          </Text>
        ) : null}
        {dietary.length > 0 ? (
          <Text style={styles.label}>
            식단: <Text style={styles.highlight}>{dietary.map((d) => d.name).join(', ')}</Text>
          </Text>
        ) : null}
        {allergies ? (
          <Text style={styles.label}>
            알레르기: <Text style={styles.highlight}>{allergies}</Text>
          </Text>
        ) : null}
        {country ? (
          <Text style={styles.label}>
            나라: <Text style={styles.highlight}>
              {cuisineList.find(item => item.value === country)?.label || country}
            </Text>
          </Text>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={() => setShowPicker(true)}>
          <Text style={styles.buttonText}>나라 선택</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.recommendBtn} onPress={fetchRecipes}>
          <Text style={styles.recommendText}>일반 레시피 찾기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.matchBtn} onPress={fetchMatchRecipes}>
          <Text style={styles.recommendText}>매칭률 기반 추천</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#DC4F06" style={{ marginTop: 20 }} />}

        {!loading && !showMatch && recipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 추천 레시피</Text>
            {recipes.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/recipe/[id]',
                    params: {
                      id: r.id.toString(),
                      ownedIngredients: contextIngredients,
                      routeFrom: 'function',
                    },
                  })
                }
              >
                <Text style={styles.recipeTitle}>{r.title_kr || r.title}</Text>
                <View style={styles.recipeInfoContainer}>
                  <Text style={styles.recipeInfoText}>⏱ 조리시간: {r.readyInMinutes}분</Text>
                  <Text style={styles.recipeInfoText}>👥 인분: {r.servings}인분</Text>
                </View>
                <Text style={styles.ingredientsTitle}>🍊 사용된 재료:</Text>
                <Text style={styles.ingredientsList}>
                  {r.ingredients?.join(', ') || '재료 정보 없음'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && showMatch &&
          Object.entries(matchRecipes).map(
            ([percent, items]) =>
              Array.isArray(items) &&
              items.length > 0 && (
                <View key={percent} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {percent === "<30%" ? "30% 미만 매칭" : `${percent} 매칭`}
                  </Text>
                  {items.map((r, i) => {
                    const numericPart = percent.replace(/[^0-9]/g, "");
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.card,
                          {
                            borderLeftWidth: 5,
                            borderLeftColor: getColor(numericPart),
                          },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: '/recipe/[id]',
                            params: {
                              id: r.id.toString(),
                              ownedIngredients: contextIngredients,
                              routeFrom: 'function',
                            },
                          })
                        }
                      >
                        <Text style={styles.recipeTitle}>{r.title_kr || r.title}</Text>
                        <View style={styles.recipeInfoContainer}>
                          <Text style={styles.recipeInfoText}>
                            ⏱ 조리시간: {r.readyInMinutes}분
                          </Text>
                          <Text style={styles.recipeInfoText}>
                            👥 인분: {r.servings}인분
                          </Text>
                        </View>
                        <Text style={styles.ingredientsTitle}>🍊 사용된 재료:</Text>
                        <Text style={styles.ingredientsList}>
                          {r.ingredients?.join(", ") || "재료 정보 없음"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ),
          )
        }

        {!loading && !showMatch && recipes.length === 0 && (
          <Text style={styles.noResults}>아직 레시피가 없어요. 다른 조건으로 검색해보세요!</Text>
        )}
      </ScrollView>

      <BottomTabBar />

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>나라 선택</Text>
            <FlatList
              data={cuisineList}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setCountry(item.value);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFD6A5' },
  content: { padding: width * 0.06, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#5B2C20', marginBottom: 16 },
  label: { fontSize: 16, color: '#5B2C20', marginBottom: 8 },
  highlight: { color: '#DC4F06', fontWeight: '600' },
  button: {
    backgroundColor: '#FFEFD5',
    borderWidth: 1,
    borderColor: '#5B2C20',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#5B2C20', fontWeight: '500' },
  recommendBtn: {
    backgroundColor: '#5B2C20',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  matchBtn: {
    backgroundColor: '#F57C00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  recommendText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#FFEFD5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recipeTitle: { fontSize: 18, fontWeight: 'bold', color: '#5B2C20' },
  recipeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 6,
  },
  recipeInfoText: { color: '#5B2C20', fontSize: 14 },
  ingredientsTitle: { marginTop: 8, fontWeight: '600', color: '#813D2C' },
  ingredientsList: { marginTop: 4, color: '#5B2C20', fontSize: 14, lineHeight: 20 },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#813D2C',
    backgroundColor: '#F29C50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'center',
    borderRadius: 30,
    marginBottom: 16,
  },
  noResults: { textAlign: 'center', marginTop: 20, color: '#5B2C20', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFEFD5',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B2C20',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontSize: 16, color: '#5B2C20' },
  modalClose: {
    marginTop: 12,
    backgroundColor: '#DC4F06',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCloseText: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFD6A5' },
});

