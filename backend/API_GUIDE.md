# API 문서

> 이 문서는 프론트엔드 개발을 위한 백엔드 API 사용 가이드입니다.
> 
> - **개발 서버**: `http://localhost:8000`
> - **프로덕션 서버**: `https://<your-production-backend-url>`

---

## 목차
1. [인증 (Authentication)](#1-인증-authentication)
2. [사용자 Preferences](#2-사용자-preferences)
3. [레시피 검색 API](#3-레시피-검색-api)
4. [레시피 상세 정보](#4-레시피-상세-정보)
5. [대체 재료 검색](#5-대체-재료-검색)
6. [실시간 WebSocket (Optional)](#6-실시간-websocket-optional)
7. [사용자 정보 조회](#7-사용자-정보-조회)

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
  - `400`: 잘못된 토큰
  - `500`: 서버/DB 에러

---

## 2. 사용자 Preferences
로그인한 사용자의 식단(`diet`) 및 알레르기(`allergies`) 설정을 저장 및 조회합니다. 모든 호출에는 **Authorization** 헤더에 `Bearer <idToken>`이 필요합니다.

### GET `/api/preferences/{user_id}`
- **용도**: 사용자 설정 조회  
- **Path Parameter**: `user_id` (구글 sub)  
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
- **용도**: 사용자 설정 저장 (최초 1회만 허용)  
- **Path Parameter**: `user_id` (구글 sub)  
- **Request**  
  - **헤더**: `Content-Type: application/json`, `Authorization`  
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

---

## 3. 레시피 검색 API
사용자 입력(식재료, 알레르기, 국가, 식단)을 기반으로 레시피를 검색합니다.  
**인증 불필요**

#### 공통 Request Model (`IngredientsRequest`)
```json
{
  "ingredients": ["김치", "돼지고기"],
  "allergies": "계란,우유",        // CSV (선택)
  "cuisine": "Korean",            // (선택)
  "dietary": "vegetarian"         // (선택)
}
```

### 3.1 POST `/get_recipes/`
- **용도**: 복합 조건(ingredients, allergies, cuisine, dietary) 기반 레시피 추천  
- **Request**: 위 IngredientsRequest 모델  
- **Response (200 OK)**: 레시피 배열  
  ```json
  [
    {
      "id": 12345,
      "title": "Spicy Kimchi Stew",
      "title_kr": "매운 김치찌개",
      "image": "...",
      "readyInMinutes": 30,
      "servings": 4,
      "ingredients": ["김치","돼지고기"],
      "instructions": "...",
      "spoonacular_url": "https://..."
    },
    ...
  ]
  ```
- **Error codes**
  - `502`: 외부 Spoonacular API 호출 실패

### 3.2 POST `/get_recipes_by_percent/`
- **용도**: 재료 포함 비율 기반 레시피 추천 및 카테고리 분류 (100%, 80%, 50%, 30%)  
- **Request**: 위 IngredientsRequest 모델  
- **Response (200 OK)**
  ```json
  {
    "100%": [ /* 매칭 100% 레시피 배열 */ ],
    "80%":  [ /* 매칭 80% */ ],
    "50%":  [ /* 매칭 50% */ ],
    "30%":  [ /* 매칭 30% */ ]
  }
  ```
- **Error codes**
  - `502`: 외부 API 호출 실패

---

## 4. 레시피 상세 정보
특정 레시피의 요약, 재료, 조리법 등을 조회합니다.

### GET `/get_recipe_detail/?id={recipeId}`
- **용도**: 레시피 상세 정보 조회  
- **Query Parameter**: `id` (정수)  
- **Response (200 OK)**
  ```json
  {
    "title": "김치찌개",
    "summary": "...summary...",
    "instructions": "...instructions...",
    "ingredients": ["김치","두부"],
    "image": "...",
    "readyInMinutes": 25,
    "servings": 2
  }
  ```
- **Error handling**: JSON에 `"error"` 필드가 포함될 수 있음

---

## 5. 대체 재료 검색
특정 재료의 대체품을 조회합니다.

### POST `/get_substitutes/`
- **용도**: 재료 대체품 추천  
- **Request**
  ```json
  { "ingredients": ["milk"] }
  ```
- **Response (200 OK)**
  ```json
  { "substitutes": ["아몬드 우유","두유",...] }
  ```
- **Error handling**: JSON에 `"error"` 필드 포함 가능

---

## 6. 실시간 WebSocket (Optional)
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

## 7. 사용자 정보 조회
프론트엔드에서 마이페이지 등에서 사용자 정보를 조회할 때 사용합니다.

### GET `/api/user/{user_id}`
- **용도**: 사용자 정보 조회
- **Path Parameter**: `user_id` (구글 sub)
- **Response (200 OK)**
  ```json
  {
    "id": "구글 sub",
    "email": "user@example.com",
    "name": "홍길동",
    "nickname": "홍길동",
    "avatar": "https://randomuser.me/api/portraits/men/32.jpg"
  }
  ```
- **Error codes**
  - `404`: 사용자가 존재하지 않음

---
