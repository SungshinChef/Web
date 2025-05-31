## 🛠️ 환경 설정

### 1. `.env` 파일 생성

루트 디렉토리(`backend/`)에 `.env` 파일을 생성하고 아래 내용을 추가
```env
SPOONACULAR_API_KEY = "스푸너큘러_API_키"
DEEPL_API_KEY= "DeepL_API_키"
```

## ▶️ 서버 실행 방법

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
