import React, { createContext, useContext } from 'react';

type AuthContextType = {
  userId: string | null;
  setUserId?: (id: string | null) => void;
  // 필요하다면 추가로 토큰, 이메일 등도 여기에 선언
};

export const AuthContext = createContext<AuthContextType>({ userId: null });

export const useAuth = () => useContext(AuthContext);