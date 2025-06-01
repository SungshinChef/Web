import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

interface Recipe {
  id: number;
  title: string;
  title_kr?: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  instructions?: string;
  ingredients: string[];
  match_percentage?: string;
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id, ownedIngredients: ownedIngredientsParam } = useLocalSearchParams();
  const { userId } = useAuth();

  // --- 디버깅 로그 추가 (1) ---
  console.log('🔍 RecipeDetailScreen - received params:', { id, ownedIngredientsParam });
  // ------------------------

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 대체 재료 관련 상태 추가 ---
  const [selectedIngredientIndex, setSelectedIngredientIndex] = useState<number | null>(null);
  const [substitutes, setSubstitutes] = useState<string[] | null>(null);
  const [substituteLoading, setSubstituteLoading] = useState(false);
  // -----------------------------

  // --- 사용자가 가지고 있는 재료 목록 (파라미터에서 가져옴) ---
  // 파라미터는 문자열이므로 배열로 파싱 (콤마로 구분 가정)
  const ownedIngredients = useMemo(() => {
      // --- 디버깅 로그 추가 (2) ---
      console.log('🔍 ownedIngredientsParam in useMemo:', ownedIngredientsParam);
      // ------------------------
      if (typeof ownedIngredientsParam === 'string' && ownedIngredientsParam.length > 0) {
          let parsed = ownedIngredientsParam.split(',').map(item => item.trim().toLowerCase()).filter(item => item.length > 0);

          // --- 동의어 처리 추가 ---
          const synonyms = new Set(parsed); // Set을 사용하여 중복 제거


          const finalOwnedIngredients = Array.from(synonyms); // Set을 다시 배열로 변환

          // --- 디버깅 로그 추가 (3) ---
          console.log('🔍 Final ownedIngredients with synonyms:', finalOwnedIngredients);
          // ------------------------

          return finalOwnedIngredients;
      }
      // --- 디버깅 로그 추가 (4) ---
      console.log('🔍 ownedIngredientsParam is not a valid string, returning empty array.');
      // ------------------------
      return [];
  }, [ownedIngredientsParam]);
  // --------------------------------------------------

  // --- 재정렬된 재료 목록 상태 (선택 사항, 직접 map에서 정렬해도 됨) ---
  // const [sortedIngredients, setSortedIngredients] = useState<string[]>([]);
  // ----------------------------------------------------------

  // --- 번역된 재료 목록 및 ownedIngredients 상태 추가 ---
  const [translatedRecipeIngredients, setTranslatedRecipeIngredients] = useState<string[]>([]);
  const [translatedOwnedIngredients, setTranslatedOwnedIngredients] = useState<string[]>([]);
  // --------------------------------------------------

  // --- 재정렬된 재료 목록 계산 (useMemo 사용) ---
  const sortedIngredients = useMemo(() => {
    // 레시피 데이터나 재료 목록이 없으면 빈 배열 반환
    if (!recipe || !Array.isArray(recipe.ingredients)) {
        return [];
    }

    const ingredientsList = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

    // 정렬 로직 제거: 단순히 원본 재료 목록 반환
    return ingredientsList;

  }, [recipe?.ingredients, translatedRecipeIngredients, translatedOwnedIngredients]); // 의존성 배열은 그대로 유지
  // -------------------------------------------

  // BACKEND_URL 설정
  const BACKEND_URL = __DEV__
  ? Platform.select({
      ios: 'http://127.0.0.1:8000', // 실제 백엔드 IP로 변경
      android: 'http://127.0.0.1:8000', // 실제 백엔드 IP로 변경
      default: 'http://127.0.0.1:8000' // 실제 백엔드 IP로 변경
    })
  : 'https://your-production-backend-url.com'; // 실제 프로덕션 URL로 변경 필요

  useEffect(() => {
    fetchRecipeDetails();
  }, [id]);

  // --- 재료 번역 및 정렬 함수 ---
  const translateAndSortIngredients = async (ingredientsList: string[], ownedIngs: string[]) => {
    try {
        const translateIngredients = async (ingredientsToTranslate: string[]) => {
            if (ingredientsToTranslate.length === 0) return [];
            console.log('번역 요청:', `${BACKEND_URL}/translate_ingredients_list/`);
            const response = await fetch(`${BACKEND_URL}/translate_ingredients_list/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ ingredients: ingredientsToTranslate }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('받은 번역 데이터:', data);
            return data.translations.map((item: any) => item.translated);
        };

        // 레시피 재료와 ownedIngredients를 병렬로 번역
        const [translatedRecipeIngs, translatedOwnedIngs] = await Promise.all([
            translateIngredients(ingredientsList), // 레시피 재료 번역
            translateIngredients(ownedIngs)  // ownedIngredients 번역
        ]);

        setTranslatedRecipeIngredients(translatedRecipeIngs);
        setTranslatedOwnedIngredients(translatedOwnedIngs);

        console.log('🔍 Translated Recipe Ingredients:', translatedRecipeIngs);
        console.log('🔍 Translated Owned Ingredients:', translatedOwnedIngs);

    } catch (translationError) {
        console.error('재료 번역 실패:', translationError);
        // 번역 실패 시 빈 배열로 설정하거나 한국어 원본 사용 등 대체 로직 필요
        // 여기서는 실패 시 원본 한국어 재료를 사용하도록 처리 (옵션)
        setTranslatedRecipeIngredients(ingredientsList);
        setTranslatedOwnedIngredients(ownedIngs);
    }
  };

  const fetchRecipeDetails = async () => {
    try {
      console.log('레시피 상세 정보 요청:', `${BACKEND_URL}/get_recipe_detail/?id=${id}`);

      const response = await fetch(`${BACKEND_URL}/get_recipe_detail/?id=${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('받은 레시피 데이터:', data);

      // 데이터 형식 확인 및 변환
      const processedData = {
        ...data,
        readyInMinutes: data.readyInMinutes || data.ready_in_minutes || 0,
        servings: data.servings || data.serving || 0,
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        instructions: data.instructions || data.steps || '',
      };

      console.log('가공된 레시피 데이터:', processedData);
      // --- 디버깅 로그 추가 (5) ---
      console.log('🔍 Recipe ingredients before sort:', processedData.ingredients);
      console.log('🔍 Owned ingredients for sort/style:', ownedIngredients); // ownedIngredients 배열 확인
      // ------------------------

      // --- 재료 및 ownedIngredients 영어 번역 및 상태 업데이트 호출 ---
      // 레시피 재료와 파라미터로 받은 ownedIngredients를 translateAndSortIngredients 함수에 전달
      await translateAndSortIngredients(processedData.ingredients, ownedIngredients); // ownedIngredients useMemo의 결과 사용
      // ------------------------------------------------------

      // --- 디버깅 로그 추가 (6) --- // useMemo의 반환값 확인
      // console.log('🔍 Recipe ingredients after sort:', sortedIngredients); // 이제 sortedIngredients는 useMemo에서 계산됨
      // ------------------------

      // setRecipe(processedData);
      setRecipe({
          ...processedData,
          // ingredients는 useMemo에서 처리되므로 여기서는 fetch된 그대로 set
          ingredients: processedData.ingredients // useMemo가 이 배열을 사용하여 정렬
      });

      // setSortedIngredients(sorted); // sortedIngredients 상태를 사용하는 경우

    } catch (error) {
      console.error('레시피 상세 정보 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- 대체 재료 가져오는 함수 추가 ---
  const fetchSubstitute = async (ingredient: string, index: number) => {
    // 이미 선택된 재료를 다시 클릭하면 닫기
    if (selectedIngredientIndex === index) {
      setSelectedIngredientIndex(null);
      setSubstitutes(null);
      return;
    }

    setSelectedIngredientIndex(index); // 클릭된 재료 인덱스 설정
    setSubstitutes(null); // 이전 대체재 목록 초기화
    setSubstituteLoading(true); // 로딩 시작

    try {
      console.log('대체 재료 요청:', `${BACKEND_URL}/get_substitutes/`);
      const response = await fetch(`${BACKEND_URL}/get_substitutes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ingredients: [ingredient] }), // 재료명을 리스트로 담아 POST 요청
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('받은 대체 재료 데이터:', data);

      if (data.error) {
        console.error("❌ 대체 재료 오류:", data.error);
        setSubstitutes([`대체 재료 정보를 가져올 수 없습니다: ${data.error}`]); // 에러 메시지
      } else {
        // data.substitutes가 비어있으면 이 메시지를 사용
        setSubstitutes(data.substitutes && data.substitutes.length > 0 ? data.substitutes : ["대체 재료가 없습니다."]); // 메시지 수정 및 조건 강화
      }

    } catch (error: any) {
      console.error('대체 재료 로딩 실패:', error);
      setSubstitutes([`대체 재료 로딩 실패: ${error.message}`]); // 로딩 실패 메시지
    } finally {
      setSubstituteLoading(false); // 로딩 종료
    }
  };
  // ---------------------------------

  // HTML 태그가 포함된 instructions를 단계별로 추출
  const getInstructionSteps = (instructions: string) => {
    // <li>...</li>만 추출
    const liMatches = instructions.match(/<li>(.*?)<\/li>/g);
    if (liMatches) {
      return liMatches.map(li => li.replace(/<\/?li>/g, '').trim());
    }
    // <li>가 없으면 기존 방식(줄바꿈/마침표 등)으로 분리
    return instructions
      .split(/\n|(?:\.\s)/)
      .map(step => step.trim())
      .filter(step => step.length > 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>레시피를 불러오는 중...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>레시피를 찾을 수 없습니다.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={28} color="#5B2C20" />
      </TouchableOpacity>

      {/* 레시피 이미지 */}
      {recipe.image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* 레시피 제목 */}
      <Text style={styles.title}>{recipe.title}</Text>
      {recipe.title_kr && (
        <Text style={styles.koreanTitle}>{recipe.title_kr}</Text>
      )}

      {/* 기본 정보 */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>⏱️ 조리시간</Text>
          <Text style={styles.infoValue}>{recipe.readyInMinutes}분</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>👥 인분</Text>
          <Text style={styles.infoValue}>{recipe.servings}인분</Text>
        </View>
      </View>

      {/* 재료 목록 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🥘 필요한 재료</Text>
        {/* 레시피 재료 목록 표시 (sortedIngredients 사용) */}
        {sortedIngredients.map((ingredient, index) => {
            // --- 디버깅 로그 추가 (7) ---
            // 번역된 영어 재료 이름을 사용하여 ownedIngredients (영어)와 비교
            // sortedIngredients는 이미 정렬된 상태이지만, isOwned 여부를 다시 계산해야 함
            // 이 부분은 sortedIngredients 계산 로직과 중복될 수 있으므로 개선 필요
            // 여기서는 간단히 번역된 ownedIngredients와 비교하는 로직 유지
            const translatedIngredient = translatedRecipeIngredients[index] || ingredient.trim().toLowerCase(); // 번역 실패 시 한국어 사용

            console.log(`🔍 Comparing "${translatedIngredient}" (translatedRecipeIngredient) with owned ingredients:`, translatedOwnedIngredients);

            const isOwned = translatedOwnedIngredients.some(ownedIng => {
                const ownedIngTrimmedLower = ownedIng.trim().toLowerCase();
                const translatedIngredientLower = translatedIngredient.toLowerCase(); // 혹시 translatedIngredient 자체에 대문자가 있을 수 있으니 한번 더 소문자 변환

                const includesResult = translatedIngredientLower.includes(ownedIngTrimmedLower);
                console.log(`  -> Checking if "${translatedIngredientLower}" includes "${ownedIngTrimmedLower}": ${includesResult}`);
                return includesResult;
            });

            console.log(`🔍 Checking ingredient "${ingredient}" (Translated: "${translatedIngredient}") against ownedIngredients (Translated):`, translatedOwnedIngredients, `Result: ${isOwned}`);
            // ------------------------
            return (
              <View key={index}>
                {/* 각 재료를 클릭 가능하게 */}
                <TouchableOpacity onPress={() => fetchSubstitute(ingredient, index)}>
                  <Text style={[
                    styles.ingredient,
                    // 가지고 있는 재료이면 파란색 스타일 적용
                    isOwned && styles.ownedIngredientText // isOwned 변수 사용
                  ]}>• {ingredient}</Text> {/* 사용자에게는 한국어 원본 표시 */}
                </TouchableOpacity>

                {/* 선택된 재료의 대체 재료 표시 */}
                {selectedIngredientIndex === index && (
                  <View style={styles.substituteBox}>
                    {substituteLoading ? (
                      <ActivityIndicator size="small" color="#5B2C20" />
                    ) : substitutes && substitutes.length > 0 ? ( // substitutes가 있고 비어있지 않으면
                      substitutes[0] === "대체 재료가 없습니다." || substitutes[0].startsWith("대체 재료 정보를 가져올 수 없습니다:") || substitutes[0].startsWith("대체 재료 로딩 실패:") ? (
                        // 대체 재료가 없다는 메시지거나 에러 메시지인 경우 (리스트의 첫 번째 요소로 판단)
                        <Text style={styles.substituteText}>{substitutes[0]}</Text> // - 없이 메시지만 표시
                      ) : (
                        // 실제 대체 재료 목록인 경우
                        substitutes.map((sub, subIndex) => (
                          <Text key={subIndex} style={styles.substituteText}>- {sub}</Text> // -와 함께 각 항목 표시
                        ))
                      )
                    ) : null}
                  </View>
                )}
              </View>
            );
        })}
      </View>

      {/* 조리 방법 */}
      {recipe.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👩‍🍳 만드는 법</Text>
          {getInstructionSteps(recipe.instructions).map((step, idx) => (
            <Text key={idx} style={styles.instructions}>
              {`${idx + 1}. ${step}`}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD6A5',
  },
  loadingText: {
    marginTop: 10,
    color: '#5B2C20',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD6A5',
    padding: 20,
  },
  errorText: {
    color: '#5B2C20',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  backButtonText: {
    color: '#5B2C20',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#813D2C',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  koreanTitle: {
    fontSize: 18,
    color: '#5B2C20',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFEFD5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#B88655',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#813D2C',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B2C20',
  },
  section: {
    backgroundColor: '#FFEFD5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#B88655',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#813D2C',
    marginBottom: 12,
  },
  ingredient: {
    fontSize: 16,
    color: '#5B2C20',
    marginBottom: 8, // 아래 여백을 조금 줄여 대체재 박스와 가깝게
    lineHeight: 24,
    paddingLeft: 16, // 들여쓰기 추가
  },
  // --- 대체 재료 박스 스타일 추가 ---
  substituteBox: {
    backgroundColor: '#E0E0E0', // 회색 배경
    borderRadius: 8,
    padding: 10,
    marginTop: -4, // 재료 텍스트와의 간격 조정
    marginBottom: 10, // 다음 재료와의 간격
    marginLeft: 16, // 재료 목록 들여쓰기 맞춤
  },
  substituteText: {
    fontSize: 14,
    color: '#333', // 어두운 텍스트 색상
    lineHeight: 20,
  },
  // -------------------------------
  instructions: {
    fontSize: 16,
    color: '#5B2C20',
    lineHeight: 30,
    marginBottom: 10,
    paddingLeft: 20, // 들여쓰기 추가
  },
  // --- 가지고 있는 재료 스타일 추가 ---
  ownedIngredientText: {
    color: '#007bff', // 파란색으로 표시 (원하는 색상으로 변경 가능)
    fontWeight: 'bold', // 강조하고 싶다면 추가 
  },
  // ------------------------------
}); 