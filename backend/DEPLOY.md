# Cloud Run 배포 가이드

## 사전 준비

1. **Google Cloud 프로젝트 생성**
   ```bash
   gcloud projects create YOUR_PROJECT_ID
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **필수 API 활성화**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable storage-api.googleapis.com
   ```

3. **Firestore 데이터베이스 생성**
   ```bash
   # Firestore 데이터베이스 생성 (Native 모드 권장)
   gcloud firestore databases create --region=asia-northeast3
   ```
   
   또는 [Firestore 콘솔](https://console.cloud.google.com/firestore)에서:
   - "데이터베이스 만들기" 클릭
   - 모드 선택: **Native 모드** (권장) 또는 Datastore 모드
   - 지역 선택: **asia-northeast3** (서울)
   - 데이터베이스 ID: 기본값 또는 원하는 이름

4. **Cloud Run 서비스 계정 권한 설정**
   
   Cloud Run의 기본 서비스 계정에 Firestore 및 Cloud Storage 권한 부여:
   ```bash
   # 프로젝트 번호 확인
   PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
   
   # Cloud Run 기본 서비스 계정 이메일
   SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
   
   # Firestore 권한 부여
   gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
     --member="serviceAccount:${SERVICE_ACCOUNT}" \
     --role="roles/datastore.user"
   
   # Cloud Storage 권한 부여 (이미지 저장용)
   gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
     --member="serviceAccount:${SERVICE_ACCOUNT}" \
     --role="roles/storage.objectAdmin"
   ```

5. **환경 변수 설정**
   Cloud Run 콘솔에서 또는 배포 시 환경 변수를 설정해야 합니다:
   - `GEMINI_API_KEY`: Google Gemini API 키
   - `GEMINI_IMAGE_MODEL`: 이미지 생성 모델 (선택사항, 기본값: gemini-2.5-flash-image)
   - `GCS_BUCKET_NAME`: Cloud Storage 버킷 이름 (이미지 저장 시 필요)
   - `PORT`: Cloud Run이 자동으로 설정 (8080)
   - `GOOGLE_CLOUD_PROJECT_ID` 또는 `GCLOUD_PROJECT`: Cloud Run에서 자동으로 설정됨

## 배포 방법

### 방법 1: gcloud CLI 사용 (권장)

```bash
# 1. Docker 이미지 빌드
docker build -t gcr.io/YOUR_PROJECT_ID/namonsaeng-backend .

# 2. 이미지 푸시
docker push gcr.io/YOUR_PROJECT_ID/namonsaeng-backend

# 3. Cloud Run에 배포
gcloud run deploy namonsaeng-backend \
  --image gcr.io/YOUR_PROJECT_ID/namonsaeng-backend \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-api-key-here
```

### 방법 2: Cloud Build 사용

```bash
# Cloud Build로 빌드 및 배포
gcloud builds submit --config=cloudbuild.yaml .
```

### 방법 3: Cloud Run 직접 배포

```bash
# 소스 코드에서 직접 배포 (Dockerfile 자동 사용)
gcloud run deploy namonsaeng-backend \
  --source . \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your-api-key-here
```

## 환경 변수 설정

배포 후 Cloud Run 콘솔에서 환경 변수를 설정하거나, 배포 명령에 추가:

```bash
gcloud run services update namonsaeng-backend \
  --region asia-northeast3 \
  --set-env-vars GEMINI_API_KEY=your-api-key-here,GEMINI_IMAGE_MODEL=gemini-2.5-flash-image,GCS_BUCKET_NAME=your-bucket-name
```

## CORS 설정

프로덕션 환경에서는 Firebase Hosting 도메인이 자동으로 허용됩니다.

### 환경 변수 설정

Cloud Run 환경 변수에 프론트엔드 URL 추가:

```bash
gcloud run services update m-m-m-back \
  --region asia-northeast3 \
  --set-env-vars FRONTEND_URL=https://my-monster-maker.web.app
```

백엔드 코드는 다음을 자동으로 허용:
- `FRONTEND_URL` 환경 변수에 설정된 URL
- `.web.app` 또는 `.firebaseapp.com` 도메인 패턴
- 개발 환경에서는 모든 origin

## 확인

배포 후 서비스 URL을 확인:

```bash
gcloud run services describe namonsaeng-backend --region asia-northeast3 --format 'value(status.url)'
```

Health check:
```bash
curl https://YOUR_SERVICE_URL/api/health
```

## 프로덕션 환경 설정

### 현재 배포 상태
- **백엔드 URL**: `https://m-m-m-back-964890470998.asia-northeast3.run.app`
- **프로젝트 ID**: `my-monster-maker`

### 환경 변수 업데이트

프론트엔드가 Firebase Hosting에 배포되면 CORS를 위해 다음 환경 변수 추가:

```bash
gcloud run services update m-m-m-back \
  --region asia-northeast3 \
  --set-env-vars FRONTEND_URL=https://my-monster-maker.web.app
```

### Firebase Admin SDK
- Cloud Run에서는 자동으로 서비스 계정 사용 (별도 설정 불필요)
- 서비스 계정: `firebase-adminsdk-fbsvc@my-monster-maker.iam.gserviceaccount.com`

## 참고사항

- Cloud Run은 자동으로 `PORT` 환경 변수를 설정합니다 (기본값: 8080)
- 최소 인스턴스 수를 0으로 설정하면 트래픽이 없을 때 비용이 발생하지 않습니다
- 메모리와 CPU 할당량은 필요에 따라 조정하세요
- 타임아웃 설정: AI 이미지 생성은 시간이 걸릴 수 있으므로 타임아웃을 충분히 설정하세요 (기본값: 300초)

