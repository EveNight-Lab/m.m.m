# AI Battle Game Backend

백엔드 서버입니다.

## 설치

```bash
npm install
```

## Firebase Admin SDK 설정

Cloud Run에서는 자동으로 서비스 계정을 사용하므로 별도 설정이 필요 없습니다.

로컬 개발 시에는 다음 중 하나를 선택:

### 방법 1: Application Default Credentials (권장)

```bash
# gcloud CLI로 로그인
gcloud auth application-default login
```

### 방법 2: 서비스 계정 키 파일

1. [Firebase 콘솔](https://console.firebase.google.com/project/my-monster-maker/settings/serviceaccounts/adminsdk)에서 서비스 계정 키 다운로드
2. 키 파일을 `backend/` 디렉토리에 저장 (예: `serviceAccountKey.json`)
3. `.env` 파일에 추가:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   ```

**중요**: 서비스 계정 키 파일은 Git에 커밋하지 마세요!

## 환경 변수 설정

로컬 테스트용 AI 기능을 사용하려면 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# backend/.env 파일 생성

# Google Gemini API 키
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image  # 이미지 생성 모델명 (선택사항, 기본값: gemini-2.5-flash-image)

# 서버 포트
PORT=3001

# Google Cloud 프로젝트 ID (Firestore 및 Cloud Storage 사용 시 필요)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
# 또는 GCLOUD_PROJECT 사용 가능

# Cloud Storage 버킷 이름 (이미지 저장 시 필요)
GCS_BUCKET_NAME=your-bucket-name
```

### Cloud Run 배포 시 환경 변수

Cloud Run에 배포할 때는 다음 환경 변수를 설정하세요:

```bash
gcloud run services update namonsaeng-backend \
  --region asia-northeast3 \
  --set-env-vars \
    GEMINI_API_KEY=your-api-key,\
    GEMINI_IMAGE_MODEL=gemini-2.5-flash-image,\
    GCS_BUCKET_NAME=your-bucket-name
```

**참고:** 
- Cloud Run에서는 `GOOGLE_CLOUD_PROJECT_ID`와 `GCLOUD_PROJECT`가 자동으로 설정됩니다.
- Firestore와 Cloud Storage는 Cloud Run의 기본 서비스 계정을 사용합니다 (별도 인증 불필요).

## Firestore 및 Cloud Storage 설정

### Firestore

1. [Firestore 콘솔](https://console.cloud.google.com/firestore)에서 데이터베이스 생성
2. Native 모드 또는 Datastore 모드 선택
3. 지역 선택 (권장: asia-northeast3)

### Cloud Storage

1. [Cloud Storage 콘솔](https://console.cloud.google.com/storage)에서 버킷 생성
2. 버킷 이름을 `GCS_BUCKET_NAME` 환경 변수에 설정
3. 공개 읽기 권한 설정 (이미지 URL 접근용):
   ```bash
   gsutil iam ch allUsers:objectViewer gs://your-bucket-name
   ```

Gemini API 키는 [Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급받을 수 있습니다.

## 실행

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

## API 엔드포인트

### Health Check
```
GET /api/health
```

### 캐릭터 생성
```
POST /api/ai/generate-character
Content-Type: application/json

{
  "name": "캐릭터 이름 (선택)",
  "species": "종족 (선택)",
  "battleStyle": "전투 방식 (선택)",
  "appearance": "외형 (선택)",
  "worldView": "세계관 (선택)"
}
```

응답:
- `character.imageUrl`: Cloud Storage에 저장된 경우 URL
- `character.imageData`: Cloud Storage를 사용하지 않는 경우 base64 데이터
- `character.id`: Firestore에 저장된 경우 문서 ID
