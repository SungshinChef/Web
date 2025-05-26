import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  userId: string | null;
  setUserId: (id: string | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  userId: null,
  setUserId: () => {},
});

export const AuthProviderWithInit = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          if (user?.id) {
            console.log('🔄 AuthProvider 초기 userId:', user.id);
            setUserId(user.id);
          }
        }
      } catch (err) {
        console.log('❗ userId 복원 실패:', err);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ userId, setUserId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
