# 프론트엔드 환경 변수 설정

## 백엔드 API URL 설정

프론트엔드에서 백엔드 API를 호출하기 위한 환경 변수 설정 가이드입니다.

### 1. 환경 변수 파일 생성

프론트엔드 루트 디렉토리(`frontend/`)에 `.env` 또는 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

**Cloud Run 백엔드 사용 시 (권장):**
```env
# 백엔드 API URL (Cloud Run)
VITE_API_BASE_URL=https://m-m-m-back-964890470998.asia-northeast3.run.app
```

**로컬 백엔드 사용 시:**
```env
# 백엔드 API URL (로컬 개발)
VITE_API_BASE_URL=http://localhost:3001
```

참고: `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

### 2. Cloud Run 사용 시

백엔드가 Cloud Run에 배포되어 있는 경우, `.env` 파일의 `VITE_API_BASE_URL`을 Cloud Run 서비스 URL로 변경하세요:

```env
VITE_API_BASE_URL=https://m-m-m-back-964890470998.asia-northeast3.run.app
```

**현재 백엔드 URL**: `https://m-m-m-back-964890470998.asia-northeast3.run.app`

Cloud Run 서비스 URL 확인 방법:
```bash
gcloud run services describe m-m-m-back --region asia-northeast3 --format 'value(status.url)'
```

### 3. 환경 변수 적용

환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 중지 후 재시작
npm run dev
```

### 4. 참고사항

- Vite는 `VITE_` 접두사가 붙은 환경 변수만 클라이언트에 노출합니다
- 환경 변수는 빌드 타임에 주입되므로, 변경 후 반드시 재시작이 필요합니다
- 프로덕션 빌드 시에도 환경 변수가 포함됩니다

