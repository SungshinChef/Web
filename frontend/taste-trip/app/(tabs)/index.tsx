// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { Text, TextInput, Button, View, ScrollView, Linking, StyleSheet, Alert } from 'react-native';
import { ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(false);


  const BACKEND_URL = "http://172.30.1.16:8000";

  const fetchRecipes = async () => {
    setLoading(true); // 로딩 시작
    try {
      const response = await fetch(`${BACKEND_URL}/get_recipes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredients.split(',').map(i => i.trim()) }),
      });
      const data = await response.json();
      setRecipes(data);
    } catch (err) {
      Alert.alert("레시피 오류", "레시피를 가져오는 데 실패했어요.");
    } finally {
      setLoading(false); // 로딩 끝
    }
  };
  

  const fetchSubstitutes = async () => {
    setLoading(true);
    setSubstitutes([]); // ← 이전 결과 초기화 (중요)
    try {
      const ingredient = ingredients.split(',')[0].trim(); // 첫 번째 재료만 추출
      if (!ingredient) {
        Alert.alert("입력 오류", "재료를 입력해주세요.");
        setLoading(false);
        return;
      }
  
      const response = await fetch(`${BACKEND_URL}/get_substitutes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: [ingredient] }),
      });
  
      const data = await response.json();
      console.log("🔄 대체 재료 응답:", data); // ✅ 디버깅 로그
      setSubstitutes(data.substitutes || []);
    } catch (err) {
      console.error("❌ 대체 재료 오류:", err); // ✅ 에러 출력
      Alert.alert("대체 재료 오류", "대체 재료를 가져오는 데 실패했어요.");
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🍽️ 이색 레시피 추천기</Text>
  
      <TextInput
        style={styles.input}
        placeholder="예: 김치, 돼지고기"
        value={ingredients}
        onChangeText={setIngredients}
      />
      
      <Button title="레시피 찾기" onPress={fetchRecipes} />
      <View style={{ marginVertical: 10 }} />
      <Button title="대체 재료 찾기" onPress={fetchSubstitutes} color="#FF8C00" />
  
      {/* ✅ 로딩 표시 */}
      {loading && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={{ marginTop: 10, color: '#888' }}>결과를 찾고 있어요...</Text>
        </View>
      )}
  
      {/* ✅ 결과 표시 */}
      {!loading && recipes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 추천 레시피</Text>
          {recipes.map((recipe, idx) => (
            <View key={idx} style={styles.card}>
              <Text style={styles.recipeTitle}>{recipe.title_kr || recipe.title}</Text>
              <Text>✅ 사용된 재료: {recipe.usedIngredients.map(i => i.name).join(', ')}</Text>
              <Text>❌ 부족한 재료: {recipe.missedIngredients.map(i => i.name).join(', ')}</Text>
              <Text
                style={styles.link}
                onPress={() => Linking.openURL(`https://spoonacular.com/recipes/${recipe.id}`)}
              >
                👉 레시피 링크 열기
              </Text>
            </View>
          ))}
        </View>
      )}
  
        {!loading && substitutes && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 대체 재료</Text>
            {substitutes.length > 0 ? (
            substitutes.map((sub, i) => (
                <Text key={i} style={styles.substituteItem}>• {sub}</Text>
            ))
            ) : (
            <Text style={{ color: '#888' }}>대체 재료를 찾을 수 없어요.</Text>
            )}
        </View>
        )}
    </ScrollView>
  );
  
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#FFF8E7', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#FF6B00' },
  input: { borderWidth: 1, borderColor: '#aaa', padding: 10, borderRadius: 8, backgroundColor: '#fff', marginBottom: 20 },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  card: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 10 },
  recipeTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  link: { color: '#1E90FF', marginTop: 6 },
  substituteItem: { fontSize: 15, marginVertical: 4 },
});
