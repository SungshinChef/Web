# Taste Trip API 문서

## 기본 정보
- 기본 URL: `http://172.30.1.25:8000`
- 모든 요청/응답은 JSON 형식입니다.
- 한글 입력이 가능하며, 자동으로 영어로 번역되어 처리됩니다.

## 엔드포인트

### 1. 레시피 검색
```http
POST /get_recipes/
```

레시피를 검색하고 추천 받습니다.

#### 요청 본문
```json
{
  "ingredients": ["김치", "돼지고기"],  // 필수: 검색할 재료 목록
  "allergies": "계란,우유",            // 선택: 제외할 알레르기 재료 (쉼표로 구분)
  "cuisine": "Korean",                // 선택: 나라별 요리 (예: Korean, Italian, ...)
  "dietary": "vegetarian"            // 선택: 식단 제한 (예: vegetarian, vegan, ...)
}
```

#### 응답
```json
[
  {
    "id": 123456,
    "title": "김치볶음밥",  // 한글로 번역된 제목
    "title_kr": "김치볶음밥",
    "image": "이미지URL",
    "readyInMinutes": 30,
    "servings": 4,
    "ingredients": ["김치 2컵", "돼지고기 200g", ...],  // 한글로 번역된 재료 목록
    "instructions": "조리 방법...",  // 한글로 번역된 조리 방법
    "sourceUrl": "원본 레시피 URL"
  },
  // ... 최대 5개의 레시피
]
```

### 2. 레시피 상세 정보
```http
GET /get_recipe_detail/?id={recipe_id}
```

특정 레시피의 상세 정보를 조회합니다.

#### 매개변수
- `id`: 레시피 ID (필수)

#### 응답
```json
{
  "title": "김치볶음밥",          // 한글로 번역된 제목
  "summary": "레시피 요약...",    // 한글로 번역된 요약
  "instructions": "조리 방법...", // 한글로 번역된 조리 방법
  "ingredients": [              // 한글로 번역된 재료 목록
    "김치 2컵",
    "돼지고기 200g",
    "...기타 재료들"
  ],
  "image": "이미지URL"
}
```

### 3. 대체 재료 검색
```http
POST /get_substitutes/
```

특정 재료의 대체 가능한 재료들을 검색합니다.

#### 요청 본문
```json
{
  "ingredients": ["달걀"],  // 첫 번째 재료만 사용됨
  "allergies": "",        // 선택적 필드이나 API 형식 통일을 위해 포함
  "cuisine": null,        // 선택적 필드이나 API 형식 통일을 위해 포함
  "dietary": null         // 선택적 필드이나 API 형식 통일을 위해 포함
}
```

#### 응답
```json
{
  "substitutes": [
    "두부",
    "바나나",
    "...기타 대체 재료들"  // 한글로 번역된 대체 재료 목록
  ]
}
```

## 에러 응답
모든 엔드포인트는 에러 발생 시 다음과 같은 형식으로 응답합니다:
```json
{
  "error": "에러 메시지"
}
```

## 나라별 요리 옵션
사용 가능한 `cuisine` 값:
- African (아프리카)
- American (미국)
- British (영국)
- Cajun (케이준)
- Caribbean (카리브해)
- Chinese (중국)
- Eastern European (동유럽)
- European (유럽)
- French (프랑스)
- German (독일)
- Greek (그리스)
- Indian (인도)
- Irish (아일랜드)
- Italian (이탈리아)
- Japanese (일본)
- Jewish (유대)
- Korean (한국)
- Latin American (라틴 아메리카)
- Mediterranean (지중해)
- Mexican (멕시코)
- Middle Eastern (중동)
- Nordic (북유럽)
- Southern (남부 미국)
- Spanish (스페인)
- Thai (태국)
- Vietnamese (베트남)

## 식단 제한 옵션
사용 가능한 `dietary` 값:
- vegetarian (채식주의)
- vegan (비건)
- gluten free (글루텐 프리)
- ketogenic (케토제닉) 