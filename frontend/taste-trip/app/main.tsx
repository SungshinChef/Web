import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Main() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 제목 */}
      <Text style={styles.titleLine1}>무엇을</Text>
      <Text style={styles.titleLine2}>요리할까요?</Text>

      {/* 갈색 반원 배경 */}
      <View style={styles.backgroundShape} />

      {/* 냉장고 이미지 */}
      <Image
        source={require('../assets/main_logo.png')}
        style={styles.fridgeImage}
        resizeMode="contain"
      />

      {/* 입력 버튼 */}
      <TouchableOpacity onPress={() => router.push('/ingredient')}>
        <View style={styles.inputBox}>
          <Text style={styles.inputText}>재료를 입력해주세요.</Text>
        </View>
      </TouchableOpacity>

      {/* 하단 탭 */}
      <View style={styles.tabBar}>
        <View style={styles.tabBarTopBorder} />
        <TouchableOpacity onPress={() => console.log('추천')}>
          <Image
            source={require('../assets/recommend_logo.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('대체')}>
          <Image
            source={require('../assets/substitute_logo.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('내 정보')}>
          <Image
            source={require('../assets/user_info_logo.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD6A5',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  titleLine1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#813D2C',
    marginBottom: -8,
  },
  titleLine2: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#813D2C',
    marginBottom: 20,
  },
  backgroundShape: {
    position: 'absolute',
    top: 160,
    width: width * 1.5,
    height: 500,
    backgroundColor: '#F29C50',
    borderTopLeftRadius: 300,
    borderTopRightRadius: 300,
    alignSelf: 'center',
    zIndex: -1,
  },
  fridgeImage: {
    width: 200,
    height: 200,
    marginTop: 10,
    marginBottom: 20,
  },
  inputBox: {
    backgroundColor: '#FFEFD5',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 30,
  },
  inputText: {
    color: '#5B2C20',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#FFEFD5',
    borderTopWidth: 1,
    borderTopColor: '#B88655',
  },
  tabBarTopBorder: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#B88655',
  },
  icon: {
    width: 34,
    height: 34,
  },
});
