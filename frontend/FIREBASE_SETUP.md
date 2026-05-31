# Firebase 설정 가이드

프론트엔드에서 Firebase Authentication과 Firestore를 사용하기 위한 설정 가이드입니다.

## 1. Firebase 프로젝트 설정

1. [Firebase 콘솔](https://console.firebase.google.com/) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. 웹 앱 추가 (웹 아이콘 클릭)

## 2. Firebase 설정 정보 가져오기

프로젝트 설정 > 일반 탭에서 웹 앱 설정 정보 확인:
- API 키
- 인증 도메인
- 프로젝트 ID
- 스토리지 버킷
- 메시징 발신자 ID
- 앱 ID

## 3. 환경 변수 설정

프론트엔드 루트 디렉토리(`frontend/`)에 `.env.local` 파일 생성:

```env
# Firebase 설정 (프로젝트 ID: my-monster-maker)
# Firebase 콘솔 > 프로젝트 설정 > 일반 > 웹 앱에서 확인 가능
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=my-monster-maker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-monster-maker
VITE_FIREBASE_STORAGE_BUCKET=my-monster-maker.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
VITE_FIREBASE_APP_ID=your-app-id-here

# 백엔드 API URL
VITE_API_BASE_URL=https://m-m-m-back-964890470998.asia-northeast3.run.app
```

**중요**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`는 Firebase 콘솔에서 확인해야 합니다:
1. [Firebase 콘솔](https://console.firebase.google.com/project/my-monster-maker/settings/general) 접속
2. 프로젝트 설정 > 일반 탭
3. "내 앱" 섹션에서 웹 앱 추가 (없는 경우) 또는 기존 웹 앱 선택
4. SDK 설정 및 구성에서 설정 정보 확인

## 4. Firebase Authentication 설정

1. Firebase 콘솔 > Authentication > 시작하기
2. Sign-in method 탭에서 "이메일/비밀번호" 활성화
3. 이메일/비밀번호 제공업체 활성화

## 5. Firestore 보안 규칙 설정

Firebase 콘솔 > Firestore Database > 규칙 탭에서 다음 규칙 설정:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자별 캐릭터 데이터
    match /characters/{characterId} {
      // 본인의 데이터만 읽고 쓸 수 있음
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      // 새로 생성할 때는 본인의 userId로만 생성 가능
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 6. 개발 서버 재시작

환경 변수를 변경한 후 개발 서버 재시작:

```bash
cd frontend
npm run dev
```

## 참고사항

- `.env.local` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
- 프로덕션 빌드 시에도 환경 변수가 포함되므로 주의하세요
- Firebase 프로젝트 ID는 백엔드 Cloud Run과 동일한 Google Cloud 프로젝트를 사용하는 것을 권장합니다

