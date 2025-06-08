# API 문서

> 이 문서는 프론트엔드 개발을 위한 백엔드 API 사용 가이드입니다.
>
> - **개발 서버**: `http://localhost:8000` (Docker 사용 시)
> - **프로덕션 서버**: `https://<your-production-backend-url>` (배포 후 실제 URL)

---

## 목차
1. [인증 (Authentication)](#1-인증-authentication)
2. [사용자 Preferences](#2-사용자-preferences)
3. [레시피 검색 API](#3-레시피-검색-api)
4. [레시피 상세 정보](#4-레시피-상세-정보)
5. [대체 재료 검색](#5-대체-재료-검색)
6. [즐겨찾기 관리](#6-즐겨찾기-관리)
7. [실시간 WebSocket](#7-실시간-websocket)
8. [사용자 정보 조회](#8-사용자-정보-조회)
9. [다중 레시피 상세 정보 조회](#9-다중-레시피-상세-정보-조회)
10. [재료 리스트 번역](#10-재료-리스트-번역)

---

## 1. 인증 (Authentication)
Google 로그인을 통해 받은 ID 토큰을 이 엔드포인트로 전송하여 사용자 정보를 생성/조회합니다.

### POST `/api/auth/google`
- **용도**: Google OAuth ID 토큰 검증 후 사용자 등록 및 Supabase 동기화
- **Request**
  - **헤더**: `Content-Type: application/json`
  - **Body**:
    ```json
    {
      "token": "<Google ID Token>"
    }
    ```
- **Response (200 OK)**
  ```json
  {
    "message": "회원가입 성공",      // "이미 등록된 사용자" 일 수도 있음
    "user": {
      "id": "구글 sub",
      "email": "user@example.com",
      "name": "홍길동"
    },
    "result": "success"
  }
  ```
- **Error codes**
  - `500`: 서버/DB 에러 (예: 잘못된 토큰)

---

## 2. 사용자 Preferences
로그인한 사용자의 식단(`diet`) 및 알레르기(`allergies`) 설정을 저장 및 조회합니다. 모든 호출에는 **Authorization** 헤더에 `Bearer <idToken>`이 필요합니다.

### GET `/api/preferences/{user_id}`
- **용도**: 특정 사용자의 식단 및 알레르기 설정 조회
- **Path Parameter**: `user_id` (Google Sub ID)
- **Response (200 OK)**
  ```json
  {
    "diet": "[{\"name\":\"비건\",\"apiValue\":\"vegan\"}]",  // JSON 문자열
    "allergies": "계란,우유"                                   // CSV 문자열
  }
  ```
- **Error codes**
  - `404`: 설정이 존재하지 않음

### POST `/api/preferences/{user_id}`
- **용도**: 새로운 사용자 설정 저장 (최초 1회만 허용)
- **Path Parameter**: `user_id` (Google Sub ID)
- **Request**
  - **헤더**: `Content-Type: application/json`, `Authorization: Bearer <idToken>`
  - **Body**:
    ```json
    {
      "diet": "[{\"name\":\"비건\",\"apiValue\":\"vegan\"}]",
      "allergies": "갑각류,복숭아"
    }
    ```
- **Response (200 OK)**
  ```json
  { "message": "Preferences saved" }
  ```
- **Error codes**
  - `400`: 이미 설정된 경우

### PUT `/api/preferences/{user_id}`
- **용도**: 기존 사용자 설정 업데이트
- **Path Parameter**: `user_id` (Google Sub ID)
- **Request**
  - **헤더**: `Content-Type: application/json`, `Authorization: Bearer <idToken>`
  - **Body**:
    ```json
    {
      "diet": "[{\"name\":\"비건\",\"apiValue\":\"vegan\"}]", // 변경할 필드만 포함 가능
      "allergies": "갑각류,복숭아,땅콩"
    }
    ```
- **Response (200 OK)**
  ```json
  { "message": "Preferences updated" }
  ```
- **Error codes**
  - `404`: 설정이 존재하지 않음

---

## 3. 레시피 검색 API
사용자 입력(식재료, 알레르기, 국가, 식단)을 기반으로 레시피를 검색합니다. **인증 불필요**

#### 공통 Request Model (`IngredientsRequest`)
```json
{
  "ingredients": ["김치", "돼지고기"], // 필수
  "allergies": "계란,우유",        // (선택) CSV 형식
  "cuisine": "Korean",            // (선택) 예: "Korean", "Italian"
  "dietary": "vegetarian"         // (선택) 예: "vegetarian", "vegan" 등 (콤마로 여러 개 가능)
}
```

### 3.1 POST `/get_recipes/`
- **용도**: 복합 조건(ingredients, allergies, cuisine, dietary) 기반 레시피 추천. Spoonacular API의 `complexSearch`를 활용.
- **Request**: 위 `IngredientsRequest` 모델
- **Response (200 OK)**: 번역된 레시피 정보가 포함된 레시피 배열
  ```json
  [
    {
      "id": 12345,
      "title": "Spicy Kimchi Stew",
      "title_kr": "매운 김치찌개",
      "image": "...",
      "readyInMinutes": 30,
      "servings": 4,
      "ingredients": ["김치","돼지고기"], // 번역된 재료
      "instructions": "...",
      "spoonacular_url": "https://..."
    },
    // ...
  ]
  ```
- **Error codes**
  - `400`: 유효하지 않은 요청 (예: 재료 미입력)
  - `502`: 외부 Spoonacular API 호출 실패

### 3.2 POST `/get_recipes_by_percent/`
- **용도**: 재료 포함 비율 기반 레시피 추천 및 카테고리 분류 (100%, 80%, 50%, 30% 매칭). Spoonacular API의 `findByIngredients`를 활용.
- **Request**: 위 `IngredientsRequest` 모델
- **Response (200 OK)**: 매칭 비율별로 분류된 레시피 객체
  ```json
  {
    "100%": [ /* 매칭 100% 레시피 배열 */ ],
    "80%":  [ /* 매칭 80% */ ],
    "50%":  [ /* 매칭 50% */ ],
    "30%":  [ /* 매칭 30% */ ],
    "<30%": [ /* 매칭 30% 미만 */ ]
  }
  ```
- **Error codes**
  - `400`: 유효하지 않은 요청 (예: 재료 미입력)
  - `502`: 외부 API 호출 실패

---

## 4. 레시피 상세 정보
특정 레시피의 요약, 재료, 조리법 등을 조회합니다.

### GET `/get_recipe_detail/?id={recipeId}`
- **용도**: 레시피 상세 정보 조회
- **Query Parameter**: `id` (정수, 필수)
- **Response (200 OK)**
  ```json
  {
    "title": "Kimchi Jjigae",
    "title_kr": "김치찌개",
    "summary": "...",           // 한국어 번역 요약
    "instructions": "...",      // 한국어 번역 조리법
    "ingredients": ["김치","두부"], // 한국어 번역 재료 목록
    "image": "...",
    "readyInMinutes": 25,
    "servings": 2
  }
  ```
- **Error handling**: 응답 JSON에 `"error"` 필드가 포함될 수 있음 (예: `{"error": "Failed to fetch recipe info"}`)

---

## 5. 대체 재료 검색
특정 재료의 대체품을 조회합니다.

### POST `/get_substitutes/`
- **용도**: 특정 재료에 대한 대체품 추천
- **Request**
  - **헤더**: `Content-Type: application/json`
  - **Body**:
    ```json
    { "ingredients": ["우유"] } // 단일 재료명 (리스트 안에)
    ```
- **Response (200 OK)**
  ```json
  { "substitutes": ["아몬드 우유","두유",...] } // 한국어 번역된 대체 재료 목록
  ```
- **Error handling**: 응답 JSON에 `"error"` 필드 포함 가능 (예: `{"error": "No ingredient provided"}` 또는 Spoonacular API 에러)

---

## 6. 즐겨찾기 관리
사용자별 즐겨찾기 레시피를 추가하고 조회합니다.

### POST `/api/favorites`
- **용도**: 사용자 즐겨찾기에 레시피 추가
- **Request**
  - **헤더**: `Content-Type: application/json`
  - **Body**:
    ```json
    {
      "user_id": "구글 sub",
      "recipe_id": 12345,
      "recipe_title": "Spicy Kimchi Stew",
      "recipe_image": "https://..."
    }
    ```
- **Response (200 OK)**
  ```json
  { "message": "즐겨찾기 추가 완료" }
  ```

### GET `/api/favorites/{user_id}`
- **용도**: 특정 사용자의 즐겨찾기 레시피 목록 조회
- **Path Parameter**: `user_id` (Google Sub ID)
- **Response (200 OK)**
  ```json
  [
    {
      "id": 1, // 즐겨찾기 테이블의 고유 ID
      "user_id": "구글 sub",
      "recipe_id": 12345,
      "recipe_title": "Spicy Kimchi Stew",
      "recipe_image": "https://...",
      "created_at": "2023-10-27T10:00:00.000Z"
    },
    // ...
  ]
  ```

---

## 7. 실시간 WebSocket (Optional)
사용자 테이블(`users`)의 DB 변경 이벤트를 실시간으로 스트리밍합니다.

### WebSocket URL
```
ws://localhost:8000/ws/users
```

### 메시지 포맷
```json
{
  "event": "INSERT" | "UPDATE" | "DELETE",
  "new": { /* 변경 후 레코드 */ },
  "old": { /* 변경 전 레코드 */ }
}
```

---

## 8. 사용자 정보 조회
프론트엔드에서 마이페이지 등에서 사용자 정보를 조회할 때 사용합니다.

### GET `/api/user/{user_id}`
- **용도**: 특정 사용자 정보 조회
- **Path Parameter**: `user_id` (Google Sub ID)
- **Response (200 OK)**
  ```json
  {
    "id": "구글 sub",
    "email": "user@example.com",
    "name": "홍길동",
    "nickname": "홍길동", // 현재는 name과 동일하게 반환
    "avatar": "https://randomuser.me/api/portraits/men/32.jpg" // 예시 이미지 URL
  }
  ```
- **Error codes**
  - `404`: 사용자가 존재하지 않음

---

## 9. 다중 레시피 상세 정보 조회
여러 레시피 ID에 대한 상세 정보를 한 번에 조회합니다. 주로 즐겨찾기 목록처럼 여러 레시피를 한 번에 표시할 때 사용됩니다.

### POST `/get_multiple_recipe_details/`
- **용도**: 여러 레시피 ID에 대한 상세 정보 목록 조회
- **Request**
  - **헤더**: `Content-Type: application/json`
  - **Body**:
    ```json
    [12345, 67890, 11223] // 조회할 레시피 ID들의 배열
    ```
- **Response (200 OK)**: 각 레시피의 상세 정보 객체 배열
  ```json
  [
    {
      "id": 12345,
      "title": "Kimchi Jjigae",
      "title_kr": "김치찌개",
      "summary": "...",
      "instructions": "...",
      "ingredients": ["김치", "두부"],
      "image": "...",
      "readyInMinutes": 25,
      "servings": 2
    },
    // ... 다른 레시피 상세 정보
  ]
  ```

---

## 10. 재료 리스트 번역
주어진 재료 리스트를 영어로 번역하여 반환합니다. 내부적으로 DeepL API를 사용합니다.

### POST `/translate_ingredients_list/`
- **용도**: 한국어 재료명 리스트를 영어로 번역
- **Request**
  - **헤더**: `Content-Type: application/json`
  - **Body**:
    ```json
    {
      "ingredients": ["김치", "두부", "돼지고기"] // 번역할 재료 리스트
    }
    ```
- **Response (200 OK)**: 원본 재료와 번역된 재료를 포함하는 객체 배열
  ```json
  {
    "translations": [
      { "original": "김치", "translated": "Kimchi" },
      { "original": "두부", "translated": "Tofu" },
      { "original": "돼지고기", "translated": "Pork" }
    ]
  }
  ```

---
