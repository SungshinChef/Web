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

          const detailRes = await fetch(`${BACKEND_URL}/get_multiple_recipe_details/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeIds),
          });

          const rawResponse = await detailRes.text();
          const detailedRecipes = JSON.parse(rawResponse);
          setFavorites(detailedRecipes);
        } catch (err) {
          console.error('❌ 즐겨찾기 불러오기 실패:', err);
        }
      };

      loadFavorites();
    }, [userId])
  );

  const goToRecipeDetail = (recipe: Recipe) => {
    if (recipe?.id === undefined) return;
    router.push({
      pathname: '/recipe/[id]',
      params: {
        id: recipe.id.toString(),
        ownedIngredients: '',
        routeFrom: 'favorites',
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.push('/main')}>
          <Ionicons name="chevron-back" size={30} color="#5B2C20" />
        </TouchableOpacity>
        <Text style={styles.header}>즐겨찾기</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        {favorites.length === 0 ? (
          <Text style={styles.noFavorites}>
            아직 레시피가 없습니다.{"\n"}마음에 드는 레시피를 저장해 보세요!
          </Text>
        ) : (
          favorites.map((recipe, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recipeRow}
              onPress={() => goToRecipeDetail(recipe)}
            >
              {/* ✅ 동그라미 번호 */}
              <View style={styles.circleNumber}>
                <Text style={styles.circleNumberText}>{index + 1}</Text>
              </View>

              {/* 레시피 카드 */}
              <View style={styles.recipeItem}>
                <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                <View style={styles.recipeText}>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  {recipe.title_kr && (
                    <Text style={styles.recipeTitleKr}>{recipe.title_kr}</Text>
                  )}
                </View>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B2C20',
    marginLeft: 12,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  noFavorites: {
    fontSize: 16,
    color: '#5B2C20',
    textAlign: 'center',
    marginTop: 80,
    lineHeight: 24,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  circleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 	'#5B2C20', 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  circleNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recipeItem: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFEFD5',
    borderRadius: 16,
    borderColor: '#B88655',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  recipeImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  recipeText: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B2C20',
  },
  recipeTitleKr: {
    fontSize: 14,
    color: '#5B2C20',
    marginTop: 4,
  },
});
