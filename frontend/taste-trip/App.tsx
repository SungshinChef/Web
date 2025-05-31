import React, { useState } from 'react';
import { AuthContext } from './context/AuthContext';

// user 타입 명시 (실제 로그인 응답 구조에 맞게 수정)
type User = {
  id: string;
  email?: string;
  name?: string;
};

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);

  // 로그인 성공 시 이 함수를 자식 컴포넌트에 props로 넘기거나,
  // context에서 setUserId를 직접 사용하게 하세요.
  const handleLoginSuccess = (user: User) => {
    setUserId(user.id);
  };

  return (
    <AuthContext.Provider value={{ userId, setUserId }}>
      {/* 네비게이션/라우트 구조, handleLoginSuccess를 로그인 컴포넌트에 props로 전달 */}
    </AuthContext.Provider>
  );
}
