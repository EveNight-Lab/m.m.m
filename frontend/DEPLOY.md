# Firebase Hosting 배포 가이드

프론트엔드를 Firebase Hosting에 배포하는 가이드입니다.

## 사전 준비

1. **Firebase CLI** (이미 설치됨, `npx`로 사용)

2. **Firebase 로그인**
   ```bash
   npm run firebase login
   # 또는
   npx firebase-tools login
   ```

3. **프로젝트 확인**
   - `.firebaserc` 파일에 프로젝트 ID가 `my-monster-maker`로 설정되어 있습니다.

## 환경 변수 설정

프로덕션 빌드용 환경 변수 파일 생성: `frontend/.env.production`

```env
# Firebase 설정 (프로젝트 ID: my-monster-maker)
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=my-monster-maker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-monster-maker
VITE_FIREBASE_STORAGE_BUCKET=my-monster-maker.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-here
VITE_FIREBASE_APP_ID=your-app-id-here

# 백엔드 API URL (Cloud Run)
VITE_API_BASE_URL=https://m-m-m-back-964890470998.asia-northeast3.run.app
```

Firebase 설정 정보는 [Firebase 콘솔](https://console.firebase.google.com/project/my-monster-maker/settings/general) > 프로젝트 설정 > 일반 > 웹 앱에서 확인 가능합니다.

## GitHub Actions를 통한 자동 배포

Firebase CLI의 GitHub workflow 자동 설정을 사용합니다.

### 1. Firebase CLI에서 GitHub 연동

Firebase 초기화 시 "Set up automatic builds and deploys with GitHub?" 질문에 **Yes** 선택

또는 나중에:
```bash
npm run firebase init hosting:github
```

### 2. GitHub 저장소 정보 입력

Firebase CLI가 물어보는 저장소 형식: `user/repository`

예: `dolveul/my-monster-maker`

### 3. 환경 변수 설정

Firebase CLI가 자동으로 GitHub Secrets에 `FIREBASE_SERVICE_ACCOUNT_MY_MONSTER_MAKER`를 추가합니다.

**참고**: 
- Firebase 설정과 API URL은 코드에 하드코딩되어 있습니다 (CORS로 보호되므로 보안 문제 없음)
- GitHub Secrets 설정 불필요

2. workflow 파일 수정 완료:
   - `frontend/.github/workflows/firebase-hosting-merge.yml`
   - `frontend/.github/workflows/firebase-hosting-pull-request.yml`
   
   이미 수정되어 있으므로 추가 작업 불필요합니다.

### 4. 자동 배포

`main` 브랜치에 푸시하면 자동으로 빌드 및 배포됩니다:

```bash
git add .
git commit -m "변경 사항"
git push origin main
```

### 4. 배포 확인

배포가 완료되면 다음 URL에서 확인할 수 있습니다:
- `https://my-monster-maker.web.app`
- `https://my-monster-maker.firebaseapp.com`

## 로컬에서 수동 배포

필요한 경우 로컬에서도 배포 가능:

```bash
cd frontend
npm run deploy
```

## 백엔드 CORS 설정

백엔드 Cloud Run 서비스에 Firebase Hosting 도메인을 허용해야 합니다.

Cloud Run 환경 변수에 추가:
```bash
gcloud run services update m-m-m-back \
  --region asia-northeast3 \
  --set-env-vars FRONTEND_URL=https://my-monster-maker.web.app
```

또는 Cloud Run 콘솔에서 환경 변수 추가:
- `FRONTEND_URL` = `https://my-monster-maker.web.app`

## 커스텀 도메인 설정 (선택사항)

1. Firebase 콘솔 > Hosting > 커스텀 도메인 추가
2. 도메인 소유권 확인
3. SSL 인증서 자동 생성 대기
4. 백엔드 CORS에 커스텀 도메인 추가

## 환경 변수 확인 방법

배포된 사이트에서 환경 변수가 제대로 주입되었는지 확인:

브라우저 개발자 도구 콘솔:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL)
```

## 문제 해결

### 환경 변수가 적용되지 않음
- `.env.production` 파일이 있는지 확인
- 빌드 전에 환경 변수를 설정했는지 확인
- `import.meta.env.VITE_` 접두사가 올바른지 확인

### CORS 오류
- 백엔드 Cloud Run 환경 변수에 `FRONTEND_URL`이 설정되었는지 확인
- Firebase Hosting 도메인이 백엔드 CORS에 허용되었는지 확인

### Firebase 로그인 실패
```bash
npm run firebase logout
npm run firebase login
```

## 참고 자료

- [Firebase Hosting 문서](https://firebase.google.com/docs/hosting)
- [Vite 환경 변수](https://vitejs.dev/guide/env-and-mode.html)

