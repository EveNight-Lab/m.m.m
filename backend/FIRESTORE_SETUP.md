# Firestore 설정 가이드

Cloud Run 백엔드에서 Firestore를 사용하기 위한 설정 가이드입니다.

## 1. Firestore API 활성화

```bash
# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# Firestore API 활성화
gcloud services enable firestore.googleapis.com
```

## 2. Firestore 데이터베이스 생성

### 방법 1: gcloud CLI 사용 (권장)

```bash
# Native 모드로 데이터베이스 생성 (asia-northeast3 지역)
gcloud firestore databases create --region=asia-northeast3 --database=default
```

### 방법 2: 콘솔 사용

1. [Firestore 콘솔](https://console.cloud.google.com/firestore) 접속
2. "데이터베이스 만들기" 클릭
3. 모드 선택:
   - **Native 모드** (권장): Firestore 전용 기능 사용
   - Datastore 모드: 기존 Datastore와 호환
4. 지역 선택: **asia-northeast3** (서울) - Cloud Run과 같은 지역 권장
5. 데이터베이스 ID: `default` (또는 원하는 이름)
6. "만들기" 클릭

## 3. Cloud Run 서비스 계정 권한 설정

Cloud Run의 기본 서비스 계정에 Firestore 접근 권한을 부여합니다.

```bash
# 프로젝트 번호 확인
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')

# Cloud Run 기본 서비스 계정 이메일
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Firestore 권한 부여 (Datastore User 역할)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"
```

### 필요한 역할 설명

- `roles/datastore.user`: Firestore 데이터 읽기/쓰기 권한
- `roles/datastore.owner`: Firestore 전체 관리 권한 (필요한 경우)

## 4. 환경 변수 확인

Cloud Run에서는 다음 환경 변수가 자동으로 설정됩니다:
- `GCLOUD_PROJECT`: 프로젝트 ID
- `GOOGLE_CLOUD_PROJECT`: 프로젝트 ID (동일)

별도로 설정할 필요가 없습니다.

## 5. 테스트

배포 후 Health Check 엔드포인트로 Firestore 연결 상태 확인:

```bash
curl https://YOUR_SERVICE_URL/api/health
```

응답 예시:
```json
{
  "app": "namonsaeng-backend",
  "status": "ok",
  "firestoreEnabled": true,
  ...
}
```

## 6. 보안 규칙 설정 (선택사항)

프로덕션 환경에서는 Firestore 보안 규칙을 설정하는 것을 권장합니다:

1. [Firestore 콘솔](https://console.cloud.google.com/firestore/databases) 접속
2. "규칙" 탭 선택
3. 필요한 보안 규칙 작성

예시 (모든 읽기/쓰기 허용 - 개발용):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

서버에서만 접근하는 경우 (인증 없이):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /characters/{document} {
      allow read, write: if true; // 서버에서만 접근하는 경우
    }
  }
}
```

## 문제 해결

### Firestore 초기화 실패

- 프로젝트 ID 확인:
  ```bash
  gcloud config get-value project
  ```

- API 활성화 확인:
  ```bash
  gcloud services list --enabled | grep firestore
  ```

- 서비스 계정 권한 확인:
  ```bash
  PROJECT_ID=$(gcloud config get-value project)
  PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  
  gcloud projects get-iam-policy ${PROJECT_ID} \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT}"
  ```

### 데이터베이스가 생성되지 않음

- 데이터베이스 목록 확인:
  ```bash
  gcloud firestore databases list
  ```

- 지역 확인: Cloud Run과 같은 지역(asia-northeast3)인지 확인

## 참고 자료

- [Firestore 문서](https://cloud.google.com/firestore/docs)
- [Firestore IAM 권한](https://cloud.google.com/firestore/docs/security/iam)
- [Cloud Run 서비스 계정](https://cloud.google.com/run/docs/securing/service-identity)

