import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const getIconStyle = (route: string) => {
    return [
      styles.icon,
      pathname === route ? { tintColor: '#DC4F06' } : { tintColor: '#5B2C20' }
    ];
  };

  return (
    <View style={[styles.tabBar, { elevation: 5 }]}>
      <View style={styles.tabBorder} />
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleNavigation('/main')}
      >
        <Image 
          source={require('../assets/recommend_logo.png')} 
          style={getIconStyle('/main')} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleNavigation('/substitute')}
      >
        <Image 
          source={require('../assets/substitute_logo.png')} 
          style={getIconStyle('/substitute')} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.tabButton} 
        onPress={() => handleNavigation('/myinfo')}
      >
        <Image 
          source={require('../assets/user_info_logo.png')} 
          style={getIconStyle('/myinfo')} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFEFD5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    borderTopWidth: 1,
    borderTopColor: '#B88655',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBorder: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#5B2C20',
  },
  icon: {
    width: 28,
    height: 28,
  },
}); 