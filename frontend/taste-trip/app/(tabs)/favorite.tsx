import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../lib/constants';


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

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const router = useRouter();
  const { userId } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          if (!userId) return;

          // 1. Supabase에서 즐겨찾기된 recipe_id만 가져오기
          const { data: favoriteRows, error } = await supabase
            .from('favorites')
            .select('recipe_id')
            .eq('user_id', userId);

          if (error) throw error;
          const recipeIds = favoriteRows.map((row) => row.recipe_id);

          if (recipeIds.length === 0) {
            setFavorites([]);
            return;
          }

          // 2. 백엔드에 recipeIds를 POST로 보내고 상세 정보 받아오기
          const detailRes = await fetch(`${BACKEND_URL}/get_multiple_recipe_details/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipeIds),
          });

          const rawResponse = await detailRes.text();
          console.log('📦 백엔드 응답 원본 (string):', rawResponse);
          const detailedRecipes = JSON.parse(rawResponse);

          //const detailedRecipes = await detailRes.json();
          setFavorites(detailedRecipes);
        } catch (err) {
          console.error('❌ 즐겨찾기 불러오기 실패:', err);
        }
      };

      loadFavorites();
    }, [userId])
  );

  const goToRecipeDetail = (recipe: Recipe) => {
    if (recipe?.id === undefined || recipe.id === null) {
      console.error('❌ recipe.id is undefined:', recipe);
      return;
    }

    router.push({
      pathname: '/recipe/[id]',
      params: {
        id: recipe.id.toString(),
        ownedIngredients: '',
        routeFrom: 'favorites'
      },
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push('/main')} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color="#5B2C20" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}> 즐겨찾기</Text>
        {favorites.length === 0 ? (
          <Text style={styles.noFavorites}>아직 즐겨찾기한 레시피가 없습니다.</Text>
        ) : (
          favorites.map((recipe, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recipeItem}
              onPress={() => goToRecipeDetail(recipe)}
            >
              <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
              <View style={styles.recipeText}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                {recipe.title_kr && (
                  <Text style={styles.recipeTitleKr}>{recipe.title_kr}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 100,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B2C20',
    marginBottom: 20,
    marginTop: 10,
    marginLeft: 40, // ✅ 제목 오른쪽으로 이동시켜 겹침 방지

  },
  noFavorites: {
    fontSize: 16,
    color: '#5B2C20',
    textAlign: 'center',
    marginTop: 40,
  },
  recipeItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFEFD5',
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#B88655',
    borderWidth: 1,
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeText: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#813D2C',
  },
  recipeTitleKr: {
    fontSize: 14,
    color: '#5B2C20',
    marginTop: 4,
  },
});
