# Taste-Trip 프론트엔드 전체 코드 흐름 및 개발 가이드

이 문서는 Taste-Trip 프론트엔드(React Native, Expo, expo-router 기반)의 실제 코드 구조와 동작 흐름, 개발자가 꼭 알아야 할 포인트를 정리한 문서입니다.

---

## 1. 프로젝트 구조 (주요 파일/폴더)

```
frontend/taste-trip/
  App.tsx                // Context Provider, 앱 진입점
  app/
    _layout.tsx          // expo-router Stack/Tabs 레이아웃
    index.tsx            // Splash(로딩) 화면
    login.tsx            // 구글 로그인 화면
    select.tsx           // 식단/알레르기 설정
    main.tsx             // 메인(냉장고) 화면
    ingredient.tsx       // 재료 입력 화면
    (tabs)/
      index.tsx          // 홈 탭
      explore.tsx        // 예시/가이드 탭
      function.tsx       // 레시피 추천 탭
      myinfo.tsx         // 마이페이지(프로필) 탭
    recipe/
      [id].tsx           // 레시피 상세 화면
  api/
    user.ts              // 사용자 정보 API 함수
  context/
    AuthContext.tsx      // 인증 Context (userId, setUserId)
  components/            // UI 컴포넌트
  constants/             // 색상 등 상수
  hooks/                 // 커스텀 훅
  screens/               // SplashScreen 등
```

---

## 2. 전체 동작 흐름

### 1) 앱 시작 및 Context 준비
- App.tsx에서 userId, setUserId를 Context로 관리
- 앱 전체를 `<AuthContext.Provider value={{ userId, setUserId }}>`로 감쌈

### 2) 라우팅/네비게이션 구조
- expo-router의 파일 기반 라우팅 사용
- Splash(index.tsx) → Login → Select(설정) → Main → Ingredient → Function(추천) → Recipe(상세) 등으로 이동
- 하단 탭: Home, Explore, Function(추천), MyInfo(마이페이지)

### 3) 로그인 (login.tsx)
- 구글 OAuth 인증 → idToken 획득 → 백엔드 `/api/auth/google`로 POST
- 성공 시 user 정보/토큰을 AsyncStorage에 저장, setUserId로 Context에 저장
- 설정(select) 화면으로 이동

### 4) 설정(식단/알레르기) (select.tsx)
- 식단/알레르기 선택 후 저장 → 백엔드 `/api/preferences/{userId}`로 POST
- 저장 성공 시 메인(main) 화면으로 이동

### 5) 메인/재료 입력/추천/상세
- main.tsx: "재료 입력" 버튼 → ingredient.tsx로 이동
- ingredient.tsx: 재료 입력 후 "추천 받기" → (tabs)/function.tsx로 이동(파라미터 전달)
- (tabs)/function.tsx: 추천/대체재/매칭률별 레시피 조회, 결과 표시
- recipe/[id].tsx: 레시피 상세 정보 표시

### 6) 마이페이지 (myinfo.tsx)
- Context에서 userId 받아와 fetchUserInfo로 사용자 정보 요청
- user 정보 표시(이름, 이메일, 아바타 등)

---

## 3. 주요 파일별 역할 및 수정 포인트

- **App.tsx**: Context Provider, userId 관리, 네비게이션 구조와 연동
- **context/AuthContext.tsx**: 인증 정보 Context로 관리
- **app/login.tsx**: 구글 로그인, AsyncStorage/Context 저장, 라우팅
- **app/select.tsx**: 식단/알레르기 설정, 저장/네트워크 처리
- **app/main.tsx, ingredient.tsx, (tabs)/function.tsx**: 재료 입력, 추천, 결과 표시
- **api/user.ts**: 사용자 정보 API 호출 함수
- **app/(tabs)/myinfo.tsx**: 마이페이지, 사용자 정보 표시

---

## 4. 개발/유지보수 시 주의사항 (실무 팁)

- userId는 DB의 id 컬럼과 동일
- 모바일 환경에서 API 주소는 실제 PC의 IP로 맞추기 (localhost X)
- AsyncStorage, Context, 네트워크 예외처리 필수
- expo-router의 파일 기반 라우팅 구조 숙지
- 사용자 정보/구조 변경 시 백엔드와 동시 수정 필요
- 코드/컴포넌트 재사용성을 고려해 구조 설계

---

## 5. 예시 코드 스니펫 (실제 사용 예시)

### 로그인 성공 시
```tsx
if (data.user && data.user.id) {
  if (setUserId) setUserId(data.user.id); // context에 저장
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  await AsyncStorage.setItem('idToken', idToken);
  // ...
}
```

### 마이페이지에서 사용자 정보 요청
```tsx
const { userId } = useContext(AuthContext);
useEffect(() => {
  if (!userId) return;
  fetchUserInfo(userId)
    .then(data => setUser(data))
    .catch(() => Alert.alert('사용자 정보를 불러오지 못했습니다.'));
}, [userId]);
```

---

## 6. 추가 개발자가 꼭 알아야 할 것
- expo-router의 파일 기반 라우팅 구조
- Context, AsyncStorage, API 연동 구조
- 로그인/회원가입/설정/추천/마이페이지의 데이터 흐름
- 네트워크 환경(로컬/모바일)별 API 주소
- 에러 처리, 예외 상황 대응

---

이 문서를 참고하여 유지보수 및 추가 개발을 진행하면 됩니다.
