# Node.js 20 LTS 사용
FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 애플리케이션 코드 복사
COPY . .

# Cloud Run은 PORT 환경 변수를 자동으로 설정합니다
# server.js에서 이미 process.env.PORT를 사용하고 있음

# 포트 노출 (Cloud Run이 자동으로 설정하지만 명시적으로 표시)
EXPOSE 8080

# 애플리케이션 실행
CMD ["node", "server.js"]

