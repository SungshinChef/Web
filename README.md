# 🍳 Taste Trip

## 프로젝트 개요
- **Taste Trip**은 사용자의 식단 선호도(비건·채식·글루텐 프리·케토제닉), 알레르기 정보와 재료를 기반으로 이색적인 외국 음식 레시피를 추천합니다.
- 재료 입력, 국가별 요리 필터(27개), 대체 재료 제안, 한글 번역, 실시간 선호도 동기화 기능을 제공합니다.

## 폴더 구조
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

## ✨ 주요 기능
- **스마트 레시피 검색**
  - 재료별 검색, 재료 매칭률 기반 검색, 국가별 필터, 대체 재료 제안
- **개인화 추천**
  - 식단 선호 및 알레르기 관리, 즐겨찾기·실시간 동기화

## 🛠 기술 스택
- **Frontend:** React Native(Expo), TypeScript, Docker
- **Backend:** FastAPI, Python, Docker
- **Deployment:** Docker Compose

## 📚 API
### 외부 API 연동
| API               | 설명                                      | 엔드포인트 / Docs                                            | 인증 방식          |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------ | ----------------- |
| Spoonacular API   | 재료 기반 레시피 검색 및 세부 정보 제공   | https://spoonacular.com/food-api/docs                        | API Key 헤더      |
| DeepL API         | 레시피 설명 및 재료 이름 한글 번역        | https://www.deepl.com/docs-api                                | API Key 파라미터 |

### API 문서
- 백엔드의 상세 엔드포인트 및 사용 예시는 `backend/API_GUIDE.md`에서 확인 가능합니다.

## 👥 팀원 소개
| 프로필 | 이름·역할         | GitHub                               |
| :----: | ---------------- | ------------------------------------ |
| <img src="https://github.com/mintgyumin.png?size=100" width="60"/> | **이규민**<br>기획·백엔드·프론트엔드 | [@mintgyumin](https://github.com/mintgyumin) |
| <img src="https://github.com/zangzoo.png?size=100" width="60"/> | **장지우**<br>기획·백엔드·프론트엔드 개발 및 Docker 기반 인프라 구축 | [@zangzoo](https://github.com/zangzoo) |
| <img src="https://github.com/amycms.png?size=100" width="60"/> | **조민서**<br>기획·백엔드·프론트엔드 | [@amycms](https://github.com/amycms) |

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
   ```

   **⚠️ 중요**: `.env` 파일은 민감한 정보를 포함하므로, Git 저장소에 커밋되지 않도록 `.gitignore` 파일을 확인하세요.
3. Docker Compose 실행
   ```bash
   docker-compose up --build
   ```

   **프론트엔드(Expo) 접속 방법:** 터미널에 표시된 URL(`http://localhost:8081` 또는 `http://localhost:19000`)로 접속하거나 Expo Go 앱을 통해 QR 코드를 스캔하여 모바일 기기에서 접속할 수 있습니다. (모바일 기기에서 접속 시, 백엔드 URL이 `localhost`가 아닌 현재 PC의 로컬 IP 주소로 설정되어 있는지 확인해주세요.)

## 📱 스크린샷
- 추후 추가 예정

## 📝 라이선스
- MIT 라이선스
