import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type DietaryItems = {
  [key: string]: {
    checked: boolean;
    apiValue: string;  // Spoonacular API에서 사용하는 값
  };
};

type AllergyItems = {
  [key: string]: boolean;
  계란: boolean;
  견과류: boolean;
  우유: boolean;
  갑각류: boolean;
  복숭아: boolean;
};

// 기본 알레르기 항목들
const DEFAULT_ALLERGIES = ['계란', '견과류', '우유', '갑각류', '복숭아'];

// 식단 옵션 정의
const DIETARY_OPTIONS = {
  '베지테리언': { apiValue: 'vegetarian' },
  '비건': { apiValue: 'vegan' },
  '글루텐프리': { apiValue: 'gluten free' },
  '저탄고지': { apiValue: 'ketogenic' },
} as const;

export default function TestScreen() {
  // 식단 정보와 알레르기 정보를 별도의 state로 분리
  const [dietaryItems, setDietaryItems] = useState<DietaryItems>({
    베지테리언: { checked: false, apiValue: 'vegetarian' },
    비건: { checked: false, apiValue: 'vegan' },
    글루텐프리: { checked: false, apiValue: 'gluten free' },
    저탄고지: { checked: false, apiValue: 'ketogenic' },
  });

  const [allergyItems, setAllergyItems] = useState<AllergyItems>({
    계란: false,
    견과류: false,
    우유: false,
    갑각류: false,
    복숭아: false,
  });

  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  const showAlert = (message: string) => {
    Alert.alert(
      "알림",
      message,
      [{ text: "확인", onPress: () => {} }]
    );
  };

  const handleToggleDietary = (item: keyof typeof DIETARY_OPTIONS) => {
    setDietaryItems(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        checked: !prev[item].checked,
      },
    }));
  };

  const handleToggleAllergy = (item: string) => {
    if (item in allergyItems) {
      setAllergyItems(prev => ({
        ...prev,
        [item]: !prev[item],
      }));
    } else {
      // 커스텀 알레르기 항목 처리
      setCustomAllergies(prev => {
        const isSelected = prev.includes(item);
        if (isSelected) {
          return prev.filter(allergy => allergy !== item);
        } else {
          return [...prev, item];
        }
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    // 선택된 식단 정보 가져오기 (한글명과 API 값 모두 포함)
    const selectedDietary = Object.entries(dietaryItems)
      .filter(([_, value]) => value.checked)
      .map(([key, value]) => ({
        name: key,
        apiValue: value.apiValue
      }));

    // 선택된 알레르기 정보 가져오기
    const selectedAllergies = [
      ...Object.entries(allergyItems)
        .filter(([_, value]) => value)
        .map(([key]) => key),
      ...customAllergies
    ];

    // main 화면으로 이동하면서 식단과 알레르기 정보 전달
    router.push({
      pathname: "/main",
      params: {
        dietary: JSON.stringify(selectedDietary),
        allergies: selectedAllergies.join(',')
      }
    });
  };

  const handleAddAllergy = () => {
    const trimmedAllergy = newAllergy.trim();
    
    if (trimmedAllergy === '') {
      showAlert('알레르기 항목을 입력해주세요.');
      return;
    }

    // 대소문자 구분 없이 중복 검사
    const normalizedAllergy = trimmedAllergy.toLowerCase();
    const isDuplicateDefault = DEFAULT_ALLERGIES.some(
      item => item.toLowerCase() === normalizedAllergy
    );
    const isDuplicateCustom = customAllergies.some(
      item => item.toLowerCase() === normalizedAllergy
    );

    if (isDuplicateDefault || isDuplicateCustom) {
      showAlert('이미 존재하는 알레르기 항목입니다.');
      setNewAllergy('');
      return;
    }

    setCustomAllergies(prev => [...prev, trimmedAllergy]);
    setNewAllergy('');
    setModalVisible(false);
  };

  const CheckBox = ({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 기본 설정</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* 식단 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>식단</Text>
          <View style={styles.sectionContent}>
            {Object.entries(DIETARY_OPTIONS).map(([key]) => (
              <CheckBox
                key={key}
                label={key}
                checked={dietaryItems[key].checked}
                onPress={() => handleToggleDietary(key as keyof typeof DIETARY_OPTIONS)}
              />
            ))}
          </View>
        </View>

        {/* 알레르기 유발 식품 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알레르기 유발 식품</Text>
          <View style={styles.sectionContent}>
            {/* 기본 알레르기 항목들 */}
            {DEFAULT_ALLERGIES.map((item) => (
              <CheckBox
                key={item}
                label={item}
                checked={allergyItems[item as keyof AllergyItems]}
                onPress={() => handleToggleAllergy(item)}
              />
            ))}
            
            {/* 사용자 정의 알레르기 항목들 */}
            {customAllergies.map((item) => (
              <View key={item} style={styles.customAllergyItem}>
                <CheckBox
                  label={item}
                  checked={customAllergies.includes(item)}
                  onPress={() => handleToggleAllergy(item)}
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setCustomAllergies(prev => prev.filter(allergy => allergy !== item));
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* 알레르기 추가 버튼 */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ 알레르기 추가</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      {/* 입력 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>알레르기 항목 추가</Text>
            <TextInput
              style={styles.input}
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="알레르기 항목을 입력하세요"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddAllergy}
              >
                <Text style={styles.modalButtonText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 알림 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertModalContainer}>
          <View style={styles.alertModalContent}>
            <Text style={styles.alertModalText}>{alertMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={styles.alertButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFD6A5',
    borderBottomWidth: 1,
    borderBottomColor: '#F29C50',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#813D2C',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#FFD6A5',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFEFD5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F29C50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#813D2C',
    backgroundColor: '#F29C50',
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
    overflow: 'hidden',
  },
  sectionContent: {
    gap: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#F29C50',
    backgroundColor: '#FFEFD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F29C50',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#5B2C20',
  },
  customAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    padding: 4,
  },
  addButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F2C078',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#5B2C20',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFD6A5',
    borderTopWidth: 1,
    borderTopColor: '#F29C50',
  },
  saveButton: {
    backgroundColor: '#F29C50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFEFD5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F29C50',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#813D2C',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFD6A5',
    borderWidth: 1,
    borderColor: '#F29C50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#5B2C20',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F29C50',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFD6A5',
    borderWidth: 1,
    borderColor: '#F29C50',
  },
  cancelButtonText: {
    color: '#5B2C20',
  },
  alertModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertModalContent: {
    backgroundColor: '#FFF1E6',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  alertModalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  alertButton: {
    backgroundColor: '#F2B28A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
  },
  alertButtonText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#F2B28A',
  },
});