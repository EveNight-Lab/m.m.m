# Firebase 빠른 설정 가이드

프로젝트 정보:
- **프로젝트 ID**: my-monster-maker
- **프로젝트 번호**: 964890470998

## 1. Firebase 콘솔에서 설정 정보 확인

1. [Firebase 콘솔](https://console.firebase.google.com/project/my-monster-maker/settings/general) 접속
2. **프로젝트 설정** (톱니바퀴 아이콘) > **일반** 탭
3. **"내 앱"** 섹션에서:
   - 웹 앱이 없으면 **"</> 웹 앱에 Firebase 추가"** 클릭하여 추가
   - 웹 앱이 있으면 해당 앱의 **SDK 설정 및 구성** 확인

4. 다음 정보를 복사합니다:
   - `apiKey`: `VITE_FIREBASE_API_KEY`
   - `messagingSenderId`: `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId`: `VITE_FIREBASE_APP_ID`

## 2. .env.local 파일 생성

`frontend/.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# Firebase 설정
VITE_FIREBASE_API_KEY=여기에_복사한_apiKey_붙여넣기
VITE_FIREBASE_AUTH_DOMAIN=my-monster-maker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-monster-maker
VITE_FIREBASE_STORAGE_BUCKET=my-monster-maker.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=여기에_복사한_messagingSenderId_붙여넣기
VITE_FIREBASE_APP_ID=여기에_복사한_appId_붙여넣기

# 백엔드 API URL
VITE_API_BASE_URL=https://m-m-m-back-964890470998.asia-northeast3.run.app
```

## 3. Firebase Authentication 활성화

1. Firebase 콘솔 > **Authentication** > **시작하기**
2. **Sign-in method** 탭
3. **이메일/비밀번호** 제공업체 클릭
4. **사용 설정** 토글 활성화
5. **저장** 클릭

## 4. Firestore 데이터베이스 생성

1. Firebase 콘솔 > **Firestore Database** > **데이터베이스 만들기**
2. **Native 모드** 선택
3. **위치 선택**: `asia-northeast3` (서울) - Cloud Run과 같은 지역
4. **사용 설정** 클릭

## 5. Firestore 보안 규칙 설정

Firebase 콘솔 > Firestore Database > **규칙** 탭:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필 컬렉션
    match /userProfiles/{userId} {
      // 읽기: 본인의 프로필만 읽을 수 있음
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // 생성: 인증된 사용자가 자신의 uid로만 생성 가능
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // 수정: 본인의 프로필만 수정 가능
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // 삭제: 본인의 프로필만 삭제 가능
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // 캐릭터 컬렉션
    match /characters/{characterId} {
      // 읽기: 본인의 데이터만 읽을 수 있음
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // 생성: 인증된 사용자가 자신의 userId로만 생성 가능
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      
      // 수정: 본인의 데이터만 수정 가능
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // 삭제: 본인의 데이터만 삭제 가능
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 이미지 컬렉션 (데이터 분석용, 캐릭터 삭제 시에도 유지)
    match /images/{imageId} {
      // 읽기: 인증된 사용자는 모두 읽을 수 있음 (데이터 분석용)
      allow read: if request.auth != null;
      
      // 생성: 백엔드에서만 생성 (Admin SDK 사용)
      allow create: if false;
      
      // 수정: 백엔드에서만 수정 (Admin SDK 사용)
      allow update: if false;
      
      // 삭제: 백엔드에서만 삭제 (Admin SDK 사용)
      allow delete: if false;
    }
  }
}
```

**게시** 클릭

## 6. 개발 서버 재시작

```bash
cd frontend
npm run dev
```

## 7. Firestore 인덱스 생성 (필수)

캐릭터 목록을 가져올 때 `userId`와 `createdAt` 필드를 함께 사용하므로 복합 인덱스가 필요합니다.

**방법 1: 자동 생성 (권장)**
1. 앱에서 Manage 페이지 접속 시 브라우저 콘솔에 인덱스 생성 링크가 표시됩니다
2. 해당 링크를 클릭하면 자동으로 인덱스가 생성됩니다

**방법 2: 수동 생성**
1. [Firebase 콘솔](https://console.firebase.google.com/project/my-monster-maker/firestore/indexes) 접속
2. Firestore Database → 인덱스 탭
3. "인덱스 만들기" 클릭
4. 다음 설정 입력:
   - 컬렉션 ID: `characters`
   - 필드 추가:
     - `userId` (오름차순)
     - `createdAt` (내림차순)
   - 쿼리 범위: 컬렉션
5. "만들기" 클릭
6. 인덱스 생성 완료까지 몇 분 소요 (상태가 "사용 가능"으로 변경될 때까지 대기)

## 확인

1. 브라우저에서 앱 접속
2. 로그인 페이지가 표시되는지 확인
3. 회원가입 테스트
4. 로그인 후 Manage 페이지에서 캐릭터 생성 테스트

