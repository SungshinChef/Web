import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  // BACKEND_URL 설정
  const BACKEND_URL = __DEV__ 
    ? Platform.select({
        ios: 'http://localhost:8000',
        android: 'http://10.0.2.2:8000',
        default: 'http://localhost:8000'
      })
    : 'https://your-production-backend-url.com';

  useEffect(() => {
    fetchRecipeDetails();
  }, [id]);

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
      setRecipe(processedData);
    } catch (error) {
      console.error('레시피 상세 정보 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
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
        {recipe.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
        ))}
      </View>

      {/* 조리 방법 */}
      {recipe.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👩‍🍳 조리 방법</Text>
          <Text style={styles.instructions}>{recipe.instructions}</Text>
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
    marginBottom: 8,
    lineHeight: 24,
  },
  instructions: {
    fontSize: 16,
    color: '#5B2C20',
    lineHeight: 24,
  },
}); 