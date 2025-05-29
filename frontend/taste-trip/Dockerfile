FROM node:18

# 앱 디렉터리 생성
WORKDIR /app

# 종속성 복사 및 설치
COPY frontend/taste-trip/package.json frontend/taste-trip/package-lock.json ./
RUN npm install

# .env 파일 복사
COPY frontend/taste-trip/.env .env

# 나머지 코드 복사
COPY frontend/taste-trip .

# Expo 시작 (웹 + LAN 가능)
CMD ["npx", "expo", "start", "--web", "--host", "lan"]
