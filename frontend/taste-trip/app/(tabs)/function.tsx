// ✅ function.tsx 최종 완성본 (✨ 일반/매칭률 카드 UI 리팩토링 완료)
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  StyleSheet, Modal, FlatList, ActivityIndicator,
  Dimensions, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../components/BottomTabBar';

const { width } = Dimensions.get('window');

interface Recipe {
  id: number;
  title: string;
  ingredients: string[];
  readyInMinutes: number;
  servings: number;
  match_percentage?: string;
}

export default function FunctionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initIngredients = (params.ingredients as string) ?? '';

  const [ingredients, setIngredients] = useState(initIngredients);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [matchRecipes, setMatchRecipes] = useState<{ [key: string]: Recipe[] }>({});
  const [showMatch, setShowMatch] = useState(false);

  const BACKEND_URL = Platform.select({
    ios: 'http://192.168.45.169:8000',
    android: 'http://192.168.45.169:8000',
    default: 'http://192.168.45.169:8000'
  });

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
    { label: '베트남 요리', value: 'Vietnamese' }

  ];

  const fetchRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('입력 오류', '재료를 입력해주세요.');
      return;
    }
    setLoading(true);
    setShowMatch(false);
    try {
      const res = await fetch(`${BACKEND_URL}/get_recipes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients.split(',').map(i => i.trim()),
          allergies: '',
          cuisine: selectedCuisine,
          dietary: null
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipes(data);
    } catch (e: any) {
      Alert.alert('에러', e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('입력 오류', '재료를 입력해주세요.');
      return;
    }
    setLoading(true);
    setShowMatch(true);
    try {
      const res = await fetch(`${BACKEND_URL}/get_recipes_by_percent/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients.split(',').map(i => i.trim()),
          allergies: '',
          cuisine: selectedCuisine,
          dietary: null
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMatchRecipes(data);
    } catch (e: any) {
      Alert.alert('에러', e.message);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (percent: string) => {
    const val = parseInt(percent);
    if (val === 100) return '#34A853';
    if (val >= 80) return '#FBBC05';
    if (val >= 50) return '#F39C12';
    return '#EA4335';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#5B2C20" />
        </TouchableOpacity>

        <Text style={styles.title}>🍽️ 레시피 추천기</Text>
        <Text style={styles.label}>재료: <Text style={styles.orange}>{ingredients}</Text></Text>
        <Text style={styles.label}>나라: <Text style={styles.orange}>{selectedCuisine || '선택 안함'}</Text></Text>

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
                onPress={() => router.push(`/recipe/${r.id}`)}
              >
                <Text style={styles.recipeTitle}>{r.title}</Text>
                <View style={styles.recipeInfoContainer}>
                  <Text style={styles.recipeInfoText}>⏱ 조리시간: {r.readyInMinutes}분</Text>
                  <Text style={styles.recipeInfoText}>👥 인분: {r.servings}인분</Text>
                </View>
                <Text style={styles.ingredientsTitle}>🍊 사용된 재료:</Text>
                <Text style={styles.ingredientsList}>{r.ingredients?.join(', ') || '재료 정보 없음'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && showMatch && Object.entries(matchRecipes).map(([percent, items]) => (
          Array.isArray(items) && items.length > 0 && (
            <View key={percent} style={styles.section}>
              <Text style={styles.sectionTitle}>{percent} 매칭</Text>
              {items.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.card, { borderLeftWidth: 5, borderLeftColor: getColor(percent) }]}
                  onPress={() => router.push(`/recipe/${r.id}`)}
                >
                  <Text style={styles.recipeTitle}>{r.title}</Text>
                  <View style={styles.recipeInfoContainer}>
                    <Text style={styles.recipeInfoText}>⏱ 조리시간: {r.readyInMinutes}분</Text>
                    <Text style={styles.recipeInfoText}>👥 인분: {r.servings}인분</Text>
                  </View>
                  <Text style={styles.ingredientsTitle}>🍊 사용된 재료:</Text>
                  <Text style={styles.ingredientsList}>{r.ingredients?.join(', ') || '재료 정보 없음'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )
        ))}
      </ScrollView>
      <BottomTabBar />

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>나라 선택</Text>
            <FlatList
              data={cuisineList}
              keyExtractor={item => item.value}
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
  orange: { color: '#DC4F06', fontWeight: '600' },
  button: {
    backgroundColor: '#FFEFD5', borderWidth: 1, borderColor: '#5B2C20',
    borderRadius: 10, paddingVertical: 10, marginBottom: 16, alignItems: 'center'
  },
  buttonText: { color: '#5B2C20', fontWeight: '500' },
  recommendBtn: {
    backgroundColor: '#5B2C20', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginBottom: 10
  },
  matchBtn: {
    backgroundColor: '#F57C00', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', marginBottom: 20
  },
  recommendText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#FFEFD5', borderRadius: 12, padding: 16,
    marginBottom: 16
  },
  recipeTitle: { fontSize: 18, fontWeight: 'bold', color: '#5B2C20' },
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
  recipeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 6,
  },
  recipeInfoText: {
    color: '#5B2C20',
    fontSize: 14,
  },
  ingredientsTitle: {
    marginTop: 8,
    fontWeight: '600',
    color: '#813D2C',
  },
  ingredientsList: {
    marginTop: 4,
    color: '#5B2C20',
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#FFEFD5', padding: 20, borderRadius: 12, width: '80%', maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#5B2C20', marginBottom: 12, textAlign: 'center'
  },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontSize: 16, color: '#5B2C20' },
  modalClose: {
    marginTop: 12, backgroundColor: '#DC4F06', borderRadius: 8,
    alignItems: 'center', paddingVertical: 10
  },
  modalCloseText: { color: '#fff', fontWeight: '600' },
});
