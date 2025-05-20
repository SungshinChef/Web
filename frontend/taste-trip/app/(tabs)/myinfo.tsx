import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserInfo } from '../../api/user';
import { AuthContext } from '../../context/AuthContext';

type User = {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  avatar?: string;
};

export default function MyPageScreen() {
  const { userId } = useContext(AuthContext);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('userId:', userId);

  useEffect(() => {
    if (!userId) return;
    fetchUserInfo(userId)
      .then(data => {
        console.log('user info:', data);
        setUser(data);
        setLoading(false);
      })
      .catch(() => Alert.alert('사용자 정보를 불러오지 못했습니다.'));
  }, [userId]);

  if (loading) return <ActivityIndicator size="large" color="#FF6B00" />;
  if (!user) return <Text>사용자 정보가 없습니다.</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Image source={{ uri: user.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
        <Text style={styles.nickname}>{user.nickname || user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="settings-outline" size={20} color="#5B2C20" />
          <Text style={styles.menuText}>설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="log-out-outline" size={20} color="#FF6B00" />
          <Text style={[styles.menuText, { color: '#FF6B00' }]}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF6ED' },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
    width: 320,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD6A5',
  },
  nickname: { fontSize: 22, fontWeight: 'bold', color: '#813D2C', marginBottom: 6 },
  email: { fontSize: 16, color: '#5B2C20', marginBottom: 2 },
  menuSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 30,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuText: { color: '#5B2C20', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
}); 