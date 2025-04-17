import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RecipeSetupScreen() {
  const router = useRouter();

  const [dietOptions, setDietOptions] = useState({
    채식: false,
    '글루텐 프리': false,
  });

  const [allergyOptions, setAllergyOptions] = useState({
    계란: false,
    견과류: false,
    우유: false,
    갑각류: false,
    복숭아: false,
  });

  const [customAllergy, setCustomAllergy] = useState('');

  const handleAddAllergy = () => {
    if (customAllergy.trim() !== '') {
      setAllergyOptions((prev) => ({
        ...prev,
        [customAllergy.trim()]: false,
      }));
      setCustomAllergy('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 뒤로가기 */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>레시피 기본 설정</Text>

      {/* 식단 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>식단</Text>
        <View style={styles.box}>
          {Object.keys(dietOptions).map((key) => (
            <View key={key} style={styles.checkboxRow}>
              <Checkbox
                value={dietOptions[key]}
                onValueChange={() =>
                  setDietOptions((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }))
                }
              />
              <Text style={styles.label}>{key}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 알레르기 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>알레르기 유발 식품</Text>
        <View style={styles.box}>
          {Object.keys(allergyOptions).map((key) => (
            <View key={key} style={styles.checkboxRow}>
              <Checkbox
                value={allergyOptions[key]}
                onValueChange={() =>
                  setAllergyOptions((prev) => ({
                    ...prev,
                    [key]: !prev[key],
                  }))
                }
              />
              <Text style={styles.label}>{key}</Text>
            </View>
          ))}

          {/* 입력하여 추가하기 */}
          <View style={styles.addRow}>
            <TextInput
              placeholder="직접 입력"
              value={customAllergy}
              onChangeText={setCustomAllergy}
              style={styles.input}
            />
            <Pressable style={styles.addBtn} onPress={handleAddAllergy}>
              <Text style={styles.addBtnText}>입력하여 추가하기</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => router.replace('/main')} // 메인 냉장고 화면으로 이동
      >
        <Text style={styles.saveText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD6A5',
    flexGrow: 1,
    padding: 24,
    paddingBottom: 60,
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    color: '#813D2C',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    backgroundColor: '#F29C50',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 10,
  },
  box: {
    backgroundColor: '#FFEFD5',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
    color: '#5B2C20',
  },
  addRow: {
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  addBtn: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#5B2C20',
  },
  addBtnText: {
    color: '#5B2C20',
  },
  saveBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#F2C078',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveText: {
    color: '#5B2C20',
    fontWeight: 'bold',
  },
});
