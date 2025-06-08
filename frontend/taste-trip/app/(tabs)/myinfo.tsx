import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserInfo } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type User = {
  id: string;
  email: string;
  name: string;
  nickname?: string;
};

export default function MyPageScreen() {
  const { userId, setUserId } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchUserInfo(userId)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => Alert.alert('사용자 정보를 불러오지 못했습니다.'));
  }, [userId]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setUserId(null);
    router.replace('/login');
  };

  const goToSettings = () => {
    router.push({ pathname: '/select', params: { mode: 'edit' } });
  };

  if (loading) return <ActivityIndicator size="large" color="#FF6B00" />;
  if (!user) return <Text>사용자 정보가 없습니다.</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.profileImage}
          resizeMode="contain"
        />
        <Text style={styles.nickname}>{user.nickname || user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity style={styles.menuItem} onPress={goToSettings}>
          <Ionicons name="settings-outline" size={20} color="#5B2C20" />
          <Text style={styles.menuText}>알레르기 / 식단 수정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={[styles.menuText, styles.logoutText]}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>오늘도 맛있는 세계속으로, TasteTrip과 함께 🍽️</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFEFD5',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  profileImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
    opacity: 0.15,
  },
  nickname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B2C20',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#5B2C20',
  },
  body: {
    padding: 24,
    gap: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  menuItem: {
    backgroundColor: '#FFEFD5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 220,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B2C20',
  },
  logoutItem: {
    backgroundColor: '#DC4F06',
  },
  logoutText: {
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  footerText: {
    textAlign: 'center',
    color: '#5B2C20',
    fontSize: 14,
    opacity: 0.6,
  },
});
