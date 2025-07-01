# 🍳 Taste Trip

## 프로젝트 개요
- **Taste Trip**은 사용자의 식단 선호도(비건·채식·글루텐 프리·케토제닉), 알레르기 정보, 보유한 재료를 기반으로 이색적인 외국 음식 레시피를 추천하는 앱입니다.
- 재료 입력, 국가별 요리 필터(27개), 대체 재료 제안, 한글 번역, 실시간 선호도 동기화 기능을 제공합니다.

---

## 📁 폴더 구조
```
Web/
├─ backend/            # FastAPI 백엔드 서버
│   ├─ main.py         # API 로직(레시피 검색·인증·선호도·대체 재료)
│   ├─ Dockerfile      # Docker 이미지 설정
│   ├─ requirements.txt# Python 의존성
│   └─ API_GUIDE.md    # 엔드포인트 사용 가이드

├─ frontend/taste-trip/ # React Native(Expo) 모바일 앱
│   ├─ app/            # 화면 컴포넌트(로그인·설정·입력·추천·상세·마이페이지)
│   ├─ components/     # 재사용 UI 컴포넌트
│   ├─ context/        # 인증·필터 전역 상태 관리
│   ├─ api/            # 백엔드 호출 모듈
│   ├─ assets/         # 이미지·폰트 등 정적 자원
│   ├─ Dockerfile      # Docker 이미지 설정
│   └─ package.json    # npm 의존성·스크립트

└─ docker-compose.yml  # 백엔드·프론트엔드 통합 실행 설정
```

---

## ✨ 주요 기능
1. **스마트 레시피 검색**
   - 재료별 검색
   - 재료 매칭률 기반 추천
   - 국가별 필터
   - 대체 재료 제안

2. **개인화 추천**
   - 식단 선호(비건·채식·글루텐 프리·케토제닉) 관리
   - 알레르기 유발 재료 제외
   - 즐겨찾기 목록 및 실시간 동기화

---

## 🛠️ 기술 스택
| 분야        | 기술                                 |
|-----------|------------------------------------|
| Frontend  | React Native, Expo, TypeScript     |
| Backend   | Python, FastAPI |
| Deployment| Docker              |

---

## 📚 API 문서

### 백엔드 엔드포인트
- 백엔드의 상세 엔드포인트 및 사용 예시는 `backend/API_GUIDE.md`에서 확인 가능합니다.
  
### 외부 API 연동
| API               | 설명                                      | 엔드포인트 / Docs                                            | 인증 방식          |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------ | ----------------- |
| Spoonacular API   | 재료 기반 레시피 검색 및 세부 정보 제공   | https://spoonacular.com/food-api/docs                        | API Key 헤더      |
| DeepL API         | 레시피 설명 및 재료 이름 한글 번역        | https://www.deepl.com/docs-api                                | API Key 파라미터 |

---

## 👥 팀원 소개
| 프로필 | 이름·역할         | GitHub                               |
| :----: | ---------------- | ------------------------------------ |
| <img src="https://github.com/mintgyumin.png?size=100" width="60"/> | **이규민**<br>기획 · 백엔드·프론트엔드 개발 | [@mintgyumin](https://github.com/mintgyumin) |
| <img src="https://github.com/zangzoo.png?size=100" width="60"/> | **장지우**<br>기획 · 백엔드·프론트엔드 개발 및 Docker 기반 인프라 구축 | [@zangzoo](https://github.com/zangzoo) |
| <img src="https://github.com/amycms.png?size=100" width="60"/> | **조민서**<br>기획 · 백엔드·프론트엔드 개발| [@amycms](https://github.com/amycms) |

---

## 🚀 시작하기
1. 레포지토리 클론
   ```bash
   git clone https://github.com/SungshinChef/Web
   cd Web
   ```
   
2. 환경 변수 설정
   - 프로젝트 루트 디렉토리(`Web/` 내 `docker-compose.yml` 파일이 있는 곳)에 `.env` 파일을 생성해야 합니다.
   - `.env.example` 파일을 복사하여 `.env` 파일을 만들고, 필수 환경 변수들을 채워 넣으세요.

   ```bash
   cp .env.example .env
   # .env 파일에 Spoonacular, DeepL API 키 및 DB 정보 입력
   ```

   **⚠️ 중요**: `.env` 파일은 민감한 정보를 포함하므로, Git 저장소에 커밋되지 않도록 `.gitignore` 파일을 확인하세요.
   
4. Docker Compose 실행
   ```bash
   docker-compose up --build
   ```

   **프론트엔드(Expo) 접속 방법:** 터미널에 표시된 URL(`http://localhost:8081` 또는 `http://localhost:19000`)로 접속하거나, Expo Go 앱을 통해 QR 코드 스캔

## 📱 스크린샷

### 1. Splash & Authentication
| <img src="https://github.com/user-attachments/assets/50505cd2-6865-43c8-89f0-3e5018cb71f0" alt="01_splash" height="400" /> | <img src="https://github.com/user-attachments/assets/dc8a6268-9490-4e3b-99f2-6112b5fcc1d8" alt="02_login" height="400" /> |
|:-:|:-:|
| **Splash Screen**<br/>앱 로고를 보여주는 첫 화면 | **Login with Google**<br/>구글 OAuth 로그인 화면 |

### 2. Onboarding & Preferences
| <img src="https://github.com/user-attachments/assets/328742cf-cdf3-4d02-ad6b-33416ecf5cb7" alt="03_welcome" height="400" /> | <img src="https://github.com/user-attachments/assets/dbed00b3-7793-4751-a010-015f12486ae2" alt="04_preferences" height="400" /> |
|:-:|:-:|
| **레시피 기본 설정**<br/>식단·알레르기 선택 화면 | **무엇을 요리할까요?**<br/>재료 입력 안내 |

### 3. 재료 입력 & 나라 선택
| <img src="https://github.com/user-attachments/assets/a564f2f8-4beb-4327-949b-4cb56e10178d" alt="05_ingredient_input" height="400" /> | <img src="https://github.com/user-attachments/assets/3d0db0dc-cd25-48d7-ab30-8289b657cd76" alt="06_empty_state" height="400" /> | <img src="https://github.com/user-attachments/assets/c6599afa-c8ac-4e98-a3a6-794232352c9b" alt="07_country_selection" height="400" /> |
|:-:|:-:|:-:|
| **재료 입력하기**<br/>타입하거나 쉼표로 재료 추가 | **추천 초기 화면**<br/>추천받기 전 상태 | **나라 선택하기**<br/>총 27개국 중 원하는 나라 선택 |  |

### 4. 레시피 검색 결과
| <img src="https://github.com/user-attachments/assets/0dc40598-fefb-4aeb-9389-c99989531e92" alt="11_general_results" height="400" /> | <img src="https://github.com/user-attachments/assets/d260f826-ee06-49f2-b146-47909231738c" alt="12_match_results" height="400" /> |
|:-:|:-:|
| **일반 레시피 추천**<br/>검색된 레시피 리스트 | **매칭률 기반 추천**<br/>100%, 80%, … 30% 미만 카테고리 |

### 5. 레시피 상세 & 즐겨찾기 토글
| <img src="https://github.com/user-attachments/assets/7cd6e57f-661a-4f61-a6a5-18feae68a6c5" alt="15_detail_star_on" height="400" /> | <img src="https://github.com/user-attachments/assets/9a6f974a-3051-4ffe-a8a9-e3f018c22811" alt="16_detail_star_off" height="400" /> |
|:-:|:-:|
| **즐겨찾기 ON**<br/>별표 클릭 시 채워진 상태 | **즐겨찾기 OFF**<br/>별표 클릭 해제 시 비워진 상태 |

### 6. 레시피 상세 스크롤
| <img src="https://github.com/user-attachments/assets/d76a6054-b2a3-4c83-8e12-a3f057c0ce8f" alt="17_detail_scroll_ingredients" height="400" /> | <img src="https://github.com/user-attachments/assets/b69038b5-68a4-40a8-a62e-5c18fdd2ba89" alt="18_detail_scroll_steps" height="400" /> |
|:-:|:-:|
| **필요한 재료**<br/>스크롤로 보는 재료 목록과 대체재 제공 | **만드는 법**<br/>스크롤로 보는 단계별 조리법 |

### 7. 즐겨찾기 & 마이페이지
| <img src="https://github.com/user-attachments/assets/df35ac71-16e2-4541-923d-37c0ff0d13e9" alt="13_profile" height="400" /> | <img src="https://github.com/user-attachments/assets/82fab1ab-7758-4627-948c-358d6aab8133" alt="14_favorites" height="400" /> |
|:-:|:-:|
| **마이페이지**<br/>로그인한 사용자 정보, 식단·알레르기 수정, 로그아웃 | **즐겨찾기 리스트**<br/>찜한 레시피 모아보기 |


## 📝 라이선스
- MIT 라이선스
