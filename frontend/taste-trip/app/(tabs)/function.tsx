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

const { width } = Dimensions.get('window');

interface Recipe {
  id: number;
  title: string;
  title_kr?: string;
  ingredients: string[];
  readyInMinutes: number;
  servings: number;
  match_percentage?: string;
}

interface DietaryOption {
  name: string;
  apiValue: string;
}

export default function FunctionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 초기 재료는 params에서, 없으면 AsyncStorage에서
  const initParamIngredients = (params.ingredients as string) ?? '';
  const [ingredients, setIngredients] = useState<string>(initParamIngredients);

  // 사용자 식단/알레르기 정보
  const [dietary, setDietary] = useState<DietaryOption[]>([]);
  const [allergies, setAllergies] = useState<string>('');
  const [prefsLoading, setPrefsLoading] = useState<boolean>(true);

  // 레시피 상태
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [matchRecipes, setMatchRecipes] = useState<{ [key: string]: Recipe[] }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showMatch, setShowMatch] = useState<boolean>(false);

  // 나라 선택 상태
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [showPicker, setShowPicker] = useState<boolean>(false);

  // 백엔드 URL (개발 모드 / 프로덕션 모드)
  const BACKEND_URL = __DEV__
    ? Platform.select({
        ios: 'http://127.0.0.1:8000',
        android: 'http://127.0.0.1:8000',
        default: 'http://127.0.0.1:8000',
      })
    : 'https://your-production-backend-url.com';

  // 나라 목록
  const cuisineList = [
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
    { label: '베트남 요리', value: 'Vietnamese' },
  ];

  // ========== 1) 사용자 정보 (식단/알레르기) 로딩 ==========
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // 1) AsyncStorage에서 user, diet, allergies, ingredients 불러오기
        const userJson = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('idToken');

        // 로그인 정보 없으면 로그인 화면으로 리다이렉트
        if (!userJson || !token) {
          router.replace('/login');
          return;
        }
        const user = JSON.parse(userJson);

        // 로컬 저장된 식단/알레르기 먼저 세팅
        const storedDiet = await AsyncStorage.getItem('diet');
        const storedAllergies = await AsyncStorage.getItem('allergies');

        if (isMounted) {
          setDietary(storedDiet ? JSON.parse(storedDiet) : []);
          setAllergies(storedAllergies || '');
          setPrefsLoading(false);
        }

        // 2) 백그라운드로 서버에서 최신 preferences 받아오기
        const res = await fetch(`${BACKEND_URL}/api/preferences/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const latestDiet = data.diet;
          const latestAlgs = data.allergies;

          // AsyncStorage에 갱신
          if (latestDiet) await AsyncStorage.setItem('diet', latestDiet);
          if (latestAlgs) await AsyncStorage.setItem('allergies', latestAlgs);

          if (isMounted) {
            setDietary(latestDiet ? JSON.parse(latestDiet) : []);
            setAllergies(latestAlgs || '');
          }
        }
      } catch (e) {
        // 에러 발생 시 기본값으로 세팅
        if (isMounted) {
          setDietary([]);
          setAllergies('');
          setPrefsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // ========== 2) params.ingredients 또는 AsyncStorage에서 재료 세팅 ==========
  useEffect(() => {
    // params.ingredients 우선 사용, 없으면 AsyncStorage에서 가져오기
    const loadIngredients = async () => {
      let ing = (params.ingredients as string) ?? '';
      if (!ing) {
        ing = (await AsyncStorage.getItem('ingredients')) ?? '';
      }
      setIngredients(ing);
    };
    loadIngredients();
  }, [params.ingredients]);

  // ========== 3) 일반 레시피 검색 ==========
  const fetchRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('입력 오류', '재료를 입력해주세요.');
      return;
    }
    setLoading(true);
    setShowMatch(false);

    try {
      const requestBody = {
        ingredients: ingredients.split(',').map((i) => i.trim()),
        allergies,
        cuisine: selectedCuisine,
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
    } finally {
      setLoading(false);
    }
  };

  // ========== 4) 매칭률 기반 레시피 검색 ==========
  const fetchMatchRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('입력 오류', '재료를 입력해주세요.');
      return;
    }
    setLoading(true);
    setShowMatch(true);

    try {
      const requestBody = {
        ingredients: ingredients.split(',').map((i) => i.trim()),
        allergies,
        cuisine: selectedCuisine,
        dietary: dietary.length > 0 ? dietary[0].apiValue : null,
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
    } finally {
      setLoading(false);
    }
  };

  // ========== 5) 퍼센트 색상 결정 함수 ==========
  const getColor = (percent: string) => {
    const val = parseInt(percent);
    if (val >= 100) return '#34A853';
    if (val >= 80) return '#FBBC05';
    if (val >= 50) return '#F39C12';
    return '#EA4335';
  };

  // 로딩 중이면 간단히 로딩 스피너만 보여줌
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
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#5B2C20" />
        </TouchableOpacity>

        {/* 타이틀 */}
        <Text style={styles.title}>🍽️ 레시피 추천기</Text>

        {/* 선택된 재료 / 식단 / 알레르기 정보 영역 */}
        {ingredients ? (
          <Text style={styles.label}>
            재료: <Text style={styles.highlight}>{ingredients}</Text>
          </Text>
        ) : null}
        {selectedCuisine ? (
          <Text style={styles.label}>
            나라: <Text style={styles.highlight}>{selectedCuisine}</Text>
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

        {/* 나라 선택 버튼 */}
        <TouchableOpacity style={styles.button} onPress={() => setShowPicker(true)}>
          <Text style={styles.buttonText}>나라 선택</Text>
        </TouchableOpacity>

        {/* 레시피 조회 버튼 */}
        <TouchableOpacity style={styles.recommendBtn} onPress={fetchRecipes}>
          <Text style={styles.recommendText}>일반 레시피 찾기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.matchBtn} onPress={fetchMatchRecipes}>
          <Text style={styles.recommendText}>매칭률 기반 추천</Text>
        </TouchableOpacity>

        {/* 로딩 스피너 */}
        {loading && <ActivityIndicator size="large" color="#DC4F06" style={{ marginTop: 20 }} />}

        {/* 일반 레시피 카드 리스트 */}
        {!loading && !showMatch && recipes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 추천 레시피</Text>
            {recipes.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={styles.card}
                onPress={() => router.push(`/recipe/${r.id}`)}
              >
                <Text style={styles.recipeTitle}>{r.title}</Text>
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

        {/* 매칭률 기반 레시피 카드 리스트 */}
        {!loading && showMatch &&
          Object.entries(matchRecipes).map(
            ([percent, items]) =>
              Array.isArray(items) &&
              items.length > 0 && (
                <View key={percent} style={styles.section}>
                  {/* percent가 "<30%"일 때는 “30% 미만 매칭”으로 표시 */}
                  <Text style={styles.sectionTitle}>
                    {percent === "<30%" ? "30% 미만 매칭" : `${percent} 매칭`}
                  </Text>
                  {items.map((r, i) => {
                    // getColor 함수에 전달할 숫자만 추출 (예: "80%" → "80", "<30%" → "30")
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
                        onPress={() => router.push(`/recipe/${r.id}`)}
                      >
                        <Text style={styles.recipeTitle}>{r.title}</Text>
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


        {/* 결과가 없는 경우 */}
        {!loading && !showMatch && recipes.length === 0 && (
          <Text style={styles.noResults}>아직 레시피가 없어요. 다른 조건으로 검색해보세요!</Text>
        )}
      </ScrollView>

      {/* 하단 탭 바 */}
      <BottomTabBar />

      {/* 나라 선택 모달 */}
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
                    setSelectedCuisine(item.value);
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

