import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { verifyToken } from './middleware/auth.js';
import { 
  ACTIVE_SKILL_EFFECTS,
  STATUS_EFFECTS
} from './constants/skillPools.js';

// 환경 변수 로드
dotenv.config();

/**
 * 나만의 몬스터 생성기(나몬생) 백엔드 서버
 * - 기본 API 및 Health Check 엔드포인트 제공
 * - AI API 통합 (로컬 테스트용 - Google Gemini)
 */
const app = express();
// Cloud Run은 PORT 환경 변수를 자동으로 설정합니다
const PORT = process.env.PORT || 3001;

// 로깅 제어: 개발 환경에서만 상세 로그 출력
const isDevelopment = process.env.NODE_ENV !== 'production';
const shouldLog = (level) => {
  // 개발 환경이거나 DEBUG 환경 변수가 설정된 경우에만 로그 출력
  return isDevelopment || process.env.DEBUG === 'true';
};

// Firebase Admin SDK 초기화 함수
let firestore = null;
let storageBucket = null;

const initializeFirebase = async () => {
  try {
    // Cloud Run에서는 Application Default Credentials 사용
    // 로컬에서는 GOOGLE_APPLICATION_CREDENTIALS 환경 변수 또는 서비스 계정 키 파일 사용
    if (!admin.apps.length) {
      // 서비스 계정 키 파일 경로가 있으면 사용
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // ES 모듈에서는 JSON 파일을 직접 읽어야 함
        const fs = await import('fs');
        const path = await import('path');
        const serviceAccountPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        if (shouldLog('info')) {
          console.log('✅ Firebase Admin SDK가 서비스 계정 키로 초기화되었습니다.');
        }
      } else {
        // Cloud Run에서는 자동으로 Application Default Credentials 사용
        // 로컬에서도 gcloud auth application-default login 후 사용 가능
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          if (shouldLog('info')) {
            console.log('✅ Firebase Admin SDK가 Application Default Credentials로 초기화되었습니다.');
          }
        } catch (credError) {
          // Application Default Credentials가 없으면 프로젝트 ID만으로 초기화 시도
          const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCLOUD_PROJECT || 'my-monster-maker';
          admin.initializeApp({
            projectId,
          });
          if (shouldLog('info')) {
            console.log(`✅ Firebase Admin SDK가 프로젝트 ID(${projectId})로 초기화되었습니다.`);
            console.log('   Cloud Run에서는 자동으로 인증됩니다.');
          }
        }
      }
    }
    
    // Firestore 가져오기
    try {
      firestore = admin.firestore();
      if (shouldLog('info')) {
        console.log('✅ Firestore 클라이언트가 초기화되었습니다.');
      }
    } catch (e) {
      console.error('❌ Firestore 초기화 실패:', e.message);
    }
    
    // Cloud Storage 가져오기
    // Firebase Storage는 Google Cloud Storage(GCS)를 기반으로 합니다
    try {
      // 환경 변수로 지정된 버킷이 있으면 사용, 없으면 기본값 사용
      const bucketName = process.env.GCS_BUCKET_NAME || 'm_m_m_image';
      storageBucket = admin.storage().bucket(bucketName);
      if (shouldLog('info')) {
        console.log(`✅ Cloud Storage 클라이언트가 초기화되었습니다. (버킷: ${bucketName})`);
      }
    } catch (e) {
      console.error('❌ Cloud Storage 초기화 실패:', e.message);
      console.error('   스택:', e.stack);
      storageBucket = null;
    }
  } catch (e) {
    console.error('❌ Firebase Admin SDK 초기화 중 예상치 못한 오류:', e.message);
    console.error('   스택:', e.stack);
  }
};

  // Google Gemini 클라이언트 초기화 (API 키가 있을 때만)
  let genAI = null;
  let textModel = null;
  let imageModel = null;
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 텍스트 생성 모델: Gemini 2.5 Flash
    textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 이미지 생성 모델 제거됨
    imageModel = null;
  } else {
    if (shouldLog('warn')) {
      console.log('⚠️  GEMINI_API_KEY가 설정되지 않았습니다. AI 기능을 사용할 수 없습니다.');
    }
  }

// 미들웨어
// CORS 설정: Firebase Hosting 도메인 및 로컬 개발 허용
const allowedOrigins = [
  'http://localhost:5173', // Vite 개발 서버
  'http://localhost:3000', // 일반 개발 서버
  'https://my-monster-maker.web.app', // Firebase Hosting (기본 도메인)
  'https://my-monster-maker.firebaseapp.com', // Firebase Hosting (별칭)
  process.env.FRONTEND_URL, // 환경 변수로 설정된 프론트엔드 URL
].filter(Boolean); // undefined 제거

app.use(cors({
  origin: (origin, callback) => {
    // origin이 없으면 (같은 도메인에서 요청) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 origin 목록에 있으면 허용
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Firebase Hosting 도메인 패턴 체크 (모든 .web.app, .firebaseapp.com 도메인 허용)
    if (origin.includes('.web.app') || origin.includes('.firebaseapp.com')) {
      return callback(null, true);
    }
    
    // 개발 환경에서는 모든 origin 허용
    if (isDevelopment) {
      return callback(null, true);
    }
    
    callback(new Error('CORS 정책에 의해 차단되었습니다.'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: '나만의 몬스터 생성기(나몬생) Backend API' });
});

// 사용 가능한 모델 목록 확인 엔드포인트
app.get('/api/ai/models', async (req, res) => {
  if (!genAI) {
    return res.status(503).json({
      error: 'AI 서비스가 설정되지 않았습니다.',
      message: 'GEMINI_API_KEY 환경 변수를 설정해주세요.',
    });
  }

  try {
    // Google Generative AI SDK는 직접 모델 목록을 가져오는 메서드가 없을 수 있음
    // 대신 각 모델을 시도해보고 사용 가능한지 확인
    const testModels = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-image',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ];

    const availableModels = [];
    for (const modelName of testModels) {
      try {
        const testModel = genAI.getGenerativeModel({ model: modelName });
        // 간단한 테스트 요청으로 모델 사용 가능 여부 확인
        await testModel.generateContent('test');
        availableModels.push({ name: modelName, available: true });
      } catch (e) {
        availableModels.push({ 
          name: modelName, 
          available: false, 
          error: e.message 
        });
      }
    }

    res.json({
      availableModels,
      note: '이미지 생성은 Gemini API를 통해 직접 지원되지 않을 수 있습니다. Imagen API나 Vertex AI를 사용해야 할 수 있습니다.',
    });
  } catch (error) {
    res.status(500).json({
      error: '모델 목록 확인 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

// Health Check 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({
    app: 'namonsaeng-backend',
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiEnabled: !!textModel,
    aiProvider: 'Google Gemini',
    textModel: 'gemini-2.5-flash',
    imageModelAvailable: false,
    firestoreEnabled: !!firestore,
    storageEnabled: !!storageBucket,
    storageBucket: storageBucket?.name || process.env.GCS_BUCKET_NAME || '(기본 버킷)',
  });
});

// AI 채팅 엔드포인트 (로컬 테스트용)
app.post('/api/ai/chat', async (req, res) => {
  if (!textModel) {
    return res.status(503).json({
      error: 'AI 서비스가 설정되지 않았습니다.',
      message: 'GEMINI_API_KEY 환경 변수를 설정해주세요.',
    });
  }

  try {
    const { message, systemPrompt } = req.body;

    if (!message) {
      return res.status(400).json({
        error: '메시지가 필요합니다.',
      });
    }

    // Gemini API는 system instruction과 user message를 함께 전달
    const prompt = systemPrompt 
      ? `${systemPrompt}\n\n${message}`
      : message;

    const result = await textModel.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text() || '응답을 생성할 수 없습니다.';

    res.json({
      response: aiResponse,
      model: 'gemini-2.5-flash',
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });
  } catch (error) {
    console.error('AI API 오류:', error);
    res.status(500).json({
      error: 'AI 요청 처리 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

// 1차 캐릭터 생성 엔드포인트 (이미지 템플릿 사용) - 인증 필수
app.post('/api/ai/generate-character-first', verifyToken, async (req, res) => {
  if (!textModel) {
    return res.status(503).json({
      error: 'AI 서비스가 설정되지 않았습니다.',
      message: 'GEMINI_API_KEY 환경 변수를 설정해주세요.',
    });
  }

  try {
    const { name, worldView, classification, job, templateId, templateImageUrl } = req.body;

    // 디버깅: 받은 데이터 로그
    if (shouldLog('info')) {
      console.log('📥 [1차 생성] 받은 데이터:', {
        name: name ? `${name.substring(0, 20)}...` : '없음',
        worldView: worldView || '없음',
        classification: classification || '없음',
        job: job || '없음',
        hasTemplateId: !!templateId,
        hasTemplateImageUrl: !!templateImageUrl,
      });
    }

    // 빈 문자열도 체크
    if (!name || name.trim() === '' || !worldView || worldView.trim() === '' || !classification || classification.trim() === '' || !job || job.trim() === '') {
      return res.status(400).json({
        error: '필수 필드가 누락되었습니다.',
        message: 'name, worldView, classification, job이 필요합니다.',
        received: {
          hasName: !!name,
          hasWorldView: !!worldView,
          hasClassification: !!classification,
          hasJob: !!job,
        },
      });
    }

    // 이미지 템플릿에서 정보 가져오기
    let templateData = null;
    if (templateId && firestore) {
      try {
        const templateDoc = await firestore.collection('images').doc(templateId).get();
        if (templateDoc.exists) {
          templateData = templateDoc.data();
        }
      } catch (e) {
        console.error('템플릿 데이터 로드 오류:', e.message);
      }
    }

    // 캐릭터 정보 구성
    const characterInfo = {
      name: name.trim(),
      species: classification, // 분류를 종족으로 사용
      battleStyle: `${job} 스타일`, // 직업을 전투 방식으로 사용
      appearance: `${classification} ${job}의 외형`, // 기본 외형
      worldView: worldView || '미정',
    };

    // 특성, 특수행동 생성 (AI 사용 - gemini-2.5-flash)
    const DEFAULT_STATS = {
      hp: 50,
      diceCount: 3,
      fixedDamage: 0,
      defense: 0,
    };

    // 1. 특성 3개 생성 (AI)
    const traitPool = [
      { stat: 'hp', statName: '체력', value: 10 },
      { stat: 'diceCount', statName: '주사위', value: 1 },
      { stat: 'fixedDamage', statName: '고정피해', value: 2 },
      { stat: 'defense', statName: '방어력', value: 2 },
    ];
    
    const traitsPrompt = `다음 몬스터 정보를 바탕으로 **어울리는 특성 3개**를 생성해주세요.

몬스터 정보:
- 이름: ${characterInfo.name}
- 종족: ${characterInfo.species}
- 전투 방식: ${characterInfo.battleStyle}
- 외형: ${characterInfo.appearance}
- 세계관: ${characterInfo.worldView}

**필수 규칙 (절대 위반 금지):**

1. **특성 풀 (반드시 이 풀에서만 선택):**
   - 체력+10 (stat: "hp", statName: "체력", value: 10)
   - 주사위+1 (stat: "diceCount", statName: "주사위", value: 1)
   - 고정피해+2 (stat: "fixedDamage", statName: "고정피해", value: 2)
   - 방어력+2 (stat: "defense", statName: "방어력", value: 2)

2. **선택 규칙:**
   - 위 풀에서 정확히 3개를 선택해야 합니다
   - **중복 선택이 가능합니다** (같은 특성을 여러 번 선택할 수 있음)
   - 풀에 없는 특성을 생성하면 안 됩니다
   - **몬스터의 특징과 어울리는 특성을 선택하세요**

3. **description 필드 형식:**
   - "{statName}+{value}" 형식으로 작성
   - 예: "체력+10", "주사위+1", "고정피해+2", "방어력+2"

4. **특성 이름:**
   - 몬스터의 특징과 선택한 특성을 반영하여 창의적으로 지어주세요
   - 예: "강인한 체력", "다중 주사위", "날카로운 공격", "철벽 방어" 등

**JSON 형식 (다른 설명 없이 JSON만 응답):**
{
  "traits": [
    {
      "name": "특성 이름",
      "stat": "hp",
      "statName": "체력",
      "value": 10,
      "description": "체력+10"
    },
    {
      "name": "특성 이름",
      "stat": "diceCount",
      "statName": "주사위",
      "value": 1,
      "description": "주사위+1"
    },
    {
      "name": "특성 이름",
      "stat": "fixedDamage",
      "statName": "고정피해",
      "value": 2,
      "description": "고정피해+2"
    }
  ]
}`;

    const traitsResult = await textModel.generateContent(traitsPrompt);
    const traitsResponse = traitsResult.response.text();
    let traitsData;
    try {
      // JSON 추출 (마크다운 코드 블록 제거)
      const jsonMatch = traitsResponse.match(/\{[\s\S]*\}/);
      traitsData = JSON.parse(jsonMatch ? jsonMatch[0] : traitsResponse);
      
      // 특성 데이터 검증 및 정규화
      if (traitsData.traits && Array.isArray(traitsData.traits)) {
        const validTraits = [
          { stat: 'hp', statName: '체력', value: 10 },
          { stat: 'diceCount', statName: '주사위', value: 1 },
          { stat: 'fixedDamage', statName: '고정피해', value: 2 },
          { stat: 'defense', statName: '방어력', value: 2 },
        ];
        
        traitsData.traits = traitsData.traits.map((trait, index) => {
          // 필수 필드 확인
          if (!trait.stat || !trait.statName || trait.value === undefined) {
            if (shouldLog('warn')) {
              console.warn(`⚠️ 특성 ${index + 1}에 필수 필드가 없습니다. 기본값으로 대체합니다.`, trait);
            }
            // 기본값으로 대체
            const defaultTrait = validTraits[index % validTraits.length];
            trait.stat = defaultTrait.stat;
            trait.statName = defaultTrait.statName;
            trait.value = defaultTrait.value;
          }
          
          // 풀에 있는지 검증
          const isValidTrait = validTraits.some(
            (vt) => vt.stat === trait.stat && vt.value === trait.value
          );
          
          if (!isValidTrait) {
            if (shouldLog('warn')) {
              console.warn(`⚠️ 특성 "${trait.name}"가 풀에 없습니다. 기본값으로 대체합니다.`, trait);
            }
            // 기본값으로 대체
            const defaultTrait = validTraits[index % validTraits.length];
            trait.stat = defaultTrait.stat;
            trait.statName = defaultTrait.statName;
            trait.value = defaultTrait.value;
          }
          
          // description 재생성
          trait.description = `${trait.statName}+${trait.value}`;
          
          return trait;
        });
        
        // 3개가 안 되면 랜덤하게 추가 (중복 가능)
        while (traitsData.traits.length < 3) {
          const randomTrait = validTraits[Math.floor(Math.random() * validTraits.length)];
          traitsData.traits.push({
            name: `${randomTrait.statName}+${randomTrait.value}`,
            stat: randomTrait.stat,
            statName: randomTrait.statName,
            value: randomTrait.value,
            description: `${randomTrait.statName}+${randomTrait.value}`,
          });
        }
        
        // 3개 초과면 앞의 3개만 유지
        if (traitsData.traits.length > 3) {
          traitsData.traits = traitsData.traits.slice(0, 3);
        }
      }
    } catch (e) {
      console.error('특성 파싱 오류:', e);
      // 파싱 실패 시 기본값 사용
      traitsData = {
        traits: [
          { name: '기본 체력', stat: 'hp', statName: '체력', value: 10, description: '체력+10' },
          { name: '기본 주사위', stat: 'diceCount', statName: '주사위', value: 1, description: '주사위+1' },
          { name: '기본 방어', stat: 'defense', statName: '방어력', value: 2, description: '방어력+2' },
        ],
      };
    }

    // 2. 특수행동 생성 (AI)
    const activeSkillEffectsList = ACTIVE_SKILL_EFFECTS.map((effect, index) => `${index + 1}. ${effect}`).join('\n');
    const activeSkillPrompt = `다음 몬스터 정보를 바탕으로 **어울리는 특수행동 1개**를 생성해주세요.

몬스터 정보:
- 이름: ${characterInfo.name}
- 종족: ${characterInfo.species}
- 전투 방식: ${characterInfo.battleStyle}
- 외형: ${characterInfo.appearance}
- 세계관: ${characterInfo.worldView}

**필수 규칙 (절대 위반 금지):**
1. **effect 필드는 반드시 아래 "효과 풀"에서 정확히 하나를 선택해야 합니다**
   - 효과 풀에 나열된 텍스트를 정확히 그대로 복사해서 사용하세요
   - 효과 풀에 없는 텍스트를 사용하면 안 됩니다
   - 약간의 변형이나 수정도 허용되지 않습니다
   - 예: "체력+5" (O) / "체력을 5 증가" (X) / "체력 5 증가" (X)

2. **manaCost는 1로 고정합니다**

3. **description 형식:**
   - "마나 1 소모: {effect 필드의 내용}"
   - 예: "마나 1 소모: 체력+5"

**효과 풀 (아래 목록에서 정확히 하나 선택):**
${activeSkillEffectsList}

**JSON 형식 (다른 설명 없이 JSON만 응답):**
{
  "activeSkill": {
    "name": "스킬 이름",
    "manaCost": 1,
    "effect": "체력+5",
    "description": "마나 1 소모: 체력+5"
  }
}`;

    const activeSkillResult = await textModel.generateContent(activeSkillPrompt);
    const activeSkillResponse = activeSkillResult.response.text();
    let activeSkillData;
    try {
      const jsonMatch = activeSkillResponse.match(/\{[\s\S]*\}/);
      activeSkillData = JSON.parse(jsonMatch ? jsonMatch[0] : activeSkillResponse);
      
      // 효과가 풀에 있는지 검증
      if (activeSkillData.activeSkill && activeSkillData.activeSkill.effect) {
        const effect = activeSkillData.activeSkill.effect;
        if (!ACTIVE_SKILL_EFFECTS.includes(effect)) {
          // 풀에 없으면 첫 번째 효과로 대체
          if (shouldLog('warn')) {
            console.warn(`⚠️ 액티브 스킬 효과 "${effect}"가 풀에 없습니다. 첫 번째 효과로 대체합니다.`);
          }
          activeSkillData.activeSkill.effect = ACTIVE_SKILL_EFFECTS[0];
          activeSkillData.activeSkill.manaCost = 1; // manaCost는 항상 1
          activeSkillData.activeSkill.description = `마나 1 소모: ${activeSkillData.activeSkill.effect}`;
        } else {
          // 효과가 풀에 있으면 manaCost와 description을 정확히 설정
          activeSkillData.activeSkill.manaCost = 1;
          activeSkillData.activeSkill.description = `마나 1 소모: ${effect}`;
        }
      }
    } catch (e) {
      console.error('액티브 스킬 파싱 오류:', e);
      // 파싱 실패 시 기본값 사용
      activeSkillData = {
        activeSkill: {
          name: `${job}의 기술`,
          manaCost: 1,
          effect: ACTIVE_SKILL_EFFECTS[0] || '체력+5',
          description: `마나 1 소모: ${ACTIVE_SKILL_EFFECTS[0] || '체력+5'}`,
        },
      };
    }

    // 최종 스텟 계산 (특성 적용)
    const finalStats = {
      hp: DEFAULT_STATS.hp + (traitsData.traits.filter(t => t.stat === 'hp').reduce((sum, t) => sum + t.value, 0)),
      diceCount: DEFAULT_STATS.diceCount + (traitsData.traits.filter(t => t.stat === 'diceCount').reduce((sum, t) => sum + t.value, 0)),
      fixedDamage: DEFAULT_STATS.fixedDamage + (traitsData.traits.filter(t => t.stat === 'fixedDamage').reduce((sum, t) => sum + t.value, 0)),
      defense: DEFAULT_STATS.defense + (traitsData.traits.filter(t => t.stat === 'defense').reduce((sum, t) => sum + t.value, 0)),
    };

    // Firestore에 저장
    const userId = req.user?.uid;
    let characterId = null;

    if (firestore && userId) {
      try {
        const characterDoc = {
          userId: userId,
          name: characterInfo.name,
          nickname: null,
          species: characterInfo.species,
          battleStyle: characterInfo.battleStyle,
          appearance: characterInfo.appearance,
          worldView: characterInfo.worldView,
          stats: finalStats,
          traits: traitsData.traits,
          activeSkill: activeSkillData.activeSkill,
          contracted: false,
          imageUrl: templateImageUrl || null, // 이미지는 선택사항
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await firestore.collection('characters').add(characterDoc);
        characterId = docRef.id;

        if (shouldLog('info')) {
          console.log(`✅ 1차 생성 캐릭터가 Firestore에 저장되었습니다. ID: ${characterId}`);
        }
      } catch (e) {
        console.error('❌ Firestore 저장 오류:', e.message);
        return res.status(500).json({
          error: '캐릭터 저장 중 오류가 발생했습니다.',
          message: e.message,
        });
      }
    } else if (!userId) {
      return res.status(401).json({
        error: '인증이 필요합니다.',
        message: '로그인이 필요합니다.',
      });
    }

    res.json({
      character: {
        id: characterId,
        name: characterInfo.name,
        species: characterInfo.species,
        battleStyle: characterInfo.battleStyle,
        appearance: characterInfo.appearance,
        worldView: characterInfo.worldView,
        stats: finalStats,
        traits: traitsData.traits,
        activeSkill: activeSkillData.activeSkill,
        imageUrl: templateImageUrl || null,
      },
    });
  } catch (error) {
    console.error('1차 캐릭터 생성 오류:', error);
    res.status(500).json({
      error: '캐릭터 생성 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

// 캐릭터 생성 엔드포인트 (AI 사용) - 인증 필수 (2차 생성용)
app.post('/api/ai/generate-character', verifyToken, async (req, res) => {
  if (!textModel || !imageModel) {
    return res.status(503).json({
      error: 'AI 서비스가 설정되지 않았습니다.',
      message: 'GEMINI_API_KEY 환경 변수를 설정해주세요.',
    });
  }

  try {
    const { characterId: inputCharacterId, name, species, battleStyle, appearance, worldView } = req.body;

    // 2차 생성인 경우 기존 캐릭터 정보 가져오기
    let existingCharacter = null;
    if (inputCharacterId && firestore) {
      try {
        const userId = req.user?.uid;
        const charDoc = await firestore.collection('characters').doc(inputCharacterId).get();
        if (charDoc.exists) {
          const charData = charDoc.data();
          // 본인의 캐릭터인지 확인
          if (charData.userId === userId && charData.contracted === true) {
            existingCharacter = { id: charDoc.id, ...charData };
          } else {
            return res.status(403).json({
              error: '권한이 없습니다.',
              message: '계약된 본인의 캐릭터만 2차 생성할 수 있습니다.',
            });
          }
        } else {
          return res.status(404).json({
            error: '캐릭터를 찾을 수 없습니다.',
            message: '존재하지 않는 캐릭터입니다.',
          });
        }
      } catch (e) {
        console.error('기존 캐릭터 로드 오류:', e.message);
        return res.status(500).json({
          error: '캐릭터 로드 중 오류가 발생했습니다.',
          message: e.message,
        });
      }
    }

    // 캐릭터 정보 요약 (2차 생성인 경우 기존 정보와 병합)
    const characterInfo = {
      name: name || existingCharacter?.name || '미정',
      species: species || existingCharacter?.species || '', // 종족이 없으면 빈 문자열 (나중에 AI가 생성)
      battleStyle: battleStyle || existingCharacter?.battleStyle || '미정',
      appearance: appearance || existingCharacter?.appearance || '미정',
      worldView: worldView || existingCharacter?.worldView || '미정',
    };

    // 0. 종족이 없으면 AI가 생성
    if (!species || species.trim() === '') {
      const speciesPrompt = `다음 몬스터 정보를 바탕으로 적절한 종족을 생성해주세요.
- 종족은 1-2단어로 구성된 짧고 간결한 이름이어야 합니다.
- 최대 8자 이내로 작성해주세요.
- 종족만 응답해주세요 (다른 설명 없이).

이름: ${characterInfo.name !== '미정' ? characterInfo.name : '(미정)'}
전투 방식: ${characterInfo.battleStyle}
외형: ${characterInfo.appearance}
세계관: ${characterInfo.worldView}`;
      
      const speciesResult = await textModel.generateContent(speciesPrompt);
      characterInfo.species = speciesResult.response.text().trim();
      
      // 종족이 너무 길면 자르기 (최대 8자)
      if (characterInfo.species.length > 8) {
        characterInfo.species = characterInfo.species.substring(0, 8).trim();
      }
      
      if (shouldLog('info')) {
        console.log(`✅ 종족이 AI에 의해 생성되었습니다: ${characterInfo.species}`);
      }
    }

    // 1. 특성 처리 (2차 생성인 경우 기존 특성의 stat/value 유지, name만 재생성)
    let traitsData;
    
    if (existingCharacter && existingCharacter.traits && Array.isArray(existingCharacter.traits) && existingCharacter.traits.length > 0) {
      // 2차 생성: 기존 특성의 stat과 value는 유지하고 name만 재생성
      const existingTraits = existingCharacter.traits;
      
      // 기존 특성들의 stat과 value 정보를 문자열로 정리
      const traitsInfo = existingTraits.map((trait, index) => 
        `${index + 1}. ${trait.statName}+${trait.value} (stat: "${trait.stat}", value: ${trait.value})`
      ).join('\n');
      
      const traitsNamePrompt = `다음 몬스터 정보와 기존 특성들을 바탕으로 **각 특성에 어울리는 새로운 이름**을 생성해주세요.

몬스터 정보:
- 이름: ${characterInfo.name}
- 종족: ${characterInfo.species}
- 전투 방식: ${characterInfo.battleStyle}
- 외형: ${characterInfo.appearance}
- 세계관: ${characterInfo.worldView}

기존 특성들 (stat과 value는 변경하지 않고 이름만 새로 생성):
${traitsInfo}

**필수 규칙:**
1. 기존 특성의 stat과 value는 절대 변경하면 안 됩니다.
2. 각 특성에 대해 몬스터의 특징과 어울리는 새로운 이름만 생성해주세요.
3. 특성 이름은 1-3단어로 구성되어야 합니다.
4. 예: "강인한 체력", "다중 주사위", "날카로운 공격", "철벽 방어" 등

**JSON 형식 (다른 설명 없이 JSON만 응답):**
{
  "traits": [
    {
      "name": "새로운 특성 이름",
      "stat": "hp",
      "statName": "체력",
      "value": 10,
      "description": "체력+10"
    },
    {
      "name": "새로운 특성 이름",
      "stat": "diceCount",
      "statName": "주사위",
      "value": 1,
      "description": "주사위+1"
    },
    {
      "name": "새로운 특성 이름",
      "stat": "fixedDamage",
      "statName": "고정피해",
      "value": 2,
      "description": "고정피해+2"
    }
  ]
}`;

      const traitsResult = await textModel.generateContent(traitsNamePrompt);
      const traitsResponse = traitsResult.response.text();
      try {
        const jsonMatch = traitsResponse.match(/\{[\s\S]*\}/);
        const generatedTraits = JSON.parse(jsonMatch ? jsonMatch[0] : traitsResponse);
        
        // 기존 특성의 stat과 value를 유지하면서 새로운 name만 적용
        traitsData = {
          traits: existingTraits.map((existingTrait, index) => {
            const generatedTrait = generatedTraits.traits && generatedTraits.traits[index] 
              ? generatedTraits.traits[index] 
              : null;
            
            return {
              name: generatedTrait && generatedTrait.name ? generatedTrait.name : existingTrait.name,
              stat: existingTrait.stat, // 기존 값 유지
              statName: existingTrait.statName, // 기존 값 유지
              value: existingTrait.value, // 기존 값 유지
              description: existingTrait.description, // 기존 값 유지
            };
          }),
        };
      } catch (e) {
        console.error('특성 이름 재생성 파싱 오류:', e);
        // 파싱 실패 시 기존 특성 그대로 사용
        traitsData = { traits: existingTraits };
      }
    } else {
      // 1차 생성 또는 기존 특성이 없는 경우: 새로 생성
      const traitPool = [
        { stat: 'hp', statName: '체력', value: 10 },
        { stat: 'diceCount', statName: '주사위', value: 1 },
        { stat: 'fixedDamage', statName: '고정피해', value: 2 },
        { stat: 'defense', statName: '방어력', value: 2 },
      ];
      
      const traitsPrompt = `다음 몬스터 정보를 바탕으로 **어울리는 특성 3개**를 생성해주세요.

몬스터 정보:
- 이름: ${characterInfo.name}
- 종족: ${characterInfo.species}
- 전투 방식: ${characterInfo.battleStyle}
- 외형: ${characterInfo.appearance}
- 세계관: ${characterInfo.worldView}

**필수 규칙 (절대 위반 금지):**

1. **특성 풀 (반드시 이 풀에서만 선택):**
   - 체력+10 (stat: "hp", statName: "체력", value: 10)
   - 주사위+1 (stat: "diceCount", statName: "주사위", value: 1)
   - 고정피해+2 (stat: "fixedDamage", statName: "고정피해", value: 2)
   - 방어력+2 (stat: "defense", statName: "방어력", value: 2)

2. **선택 규칙:**
   - 위 풀에서 정확히 3개를 선택해야 합니다
   - **중복 선택이 가능합니다** (같은 특성을 여러 번 선택할 수 있음)
   - 풀에 없는 특성을 생성하면 안 됩니다
   - **몬스터의 특징과 어울리는 특성을 선택하세요**

3. **description 필드 형식:**
   - "{statName}+{value}" 형식으로 작성
   - 예: "체력+10", "주사위+1", "고정피해+2", "방어력+2"

4. **특성 이름:**
   - 몬스터의 특징과 선택한 특성을 반영하여 창의적으로 지어주세요
   - 예: "강인한 체력", "다중 주사위", "날카로운 공격", "철벽 방어" 등

**JSON 형식 (다른 설명 없이 JSON만 응답):**
{
  "traits": [
    {
      "name": "특성 이름",
      "stat": "hp",
      "statName": "체력",
      "value": 10,
      "description": "체력+10"
    },
    {
      "name": "특성 이름",
      "stat": "diceCount",
      "statName": "주사위",
      "value": 1,
      "description": "주사위+1"
    },
    {
      "name": "특성 이름",
      "stat": "fixedDamage",
      "statName": "고정피해",
      "value": 2,
      "description": "고정피해+2"
    }
  ]
}`;

      const traitsResult = await textModel.generateContent(traitsPrompt);
      const traitsResponse = traitsResult.response.text();
      try {
        const jsonMatch = traitsResponse.match(/\{[\s\S]*\}/);
        traitsData = JSON.parse(jsonMatch ? jsonMatch[0] : traitsResponse);
        
        // 특성 데이터 검증 및 정규화
        if (traitsData.traits && Array.isArray(traitsData.traits)) {
          const validTraits = [
            { stat: 'hp', statName: '체력', value: 10 },
            { stat: 'diceCount', statName: '주사위', value: 1 },
            { stat: 'fixedDamage', statName: '고정피해', value: 2 },
            { stat: 'defense', statName: '방어력', value: 2 },
          ];
          
          traitsData.traits = traitsData.traits.map((trait, index) => {
            // 필수 필드 확인
            if (!trait.stat || !trait.statName || trait.value === undefined) {
              if (shouldLog('warn')) {
                console.warn(`⚠️ 특성 ${index + 1}에 필수 필드가 없습니다. 기본값으로 대체합니다.`, trait);
              }
              const defaultTrait = validTraits[index % validTraits.length];
              trait.stat = defaultTrait.stat;
              trait.statName = defaultTrait.statName;
              trait.value = defaultTrait.value;
            }
            
            // 풀에 있는지 검증
            const isValidTrait = validTraits.some(
              (vt) => vt.stat === trait.stat && vt.value === trait.value
            );
            
            if (!isValidTrait) {
              if (shouldLog('warn')) {
                console.warn(`⚠️ 특성 "${trait.name}"가 풀에 없습니다. 기본값으로 대체합니다.`, trait);
              }
              const defaultTrait = validTraits[index % validTraits.length];
              trait.stat = defaultTrait.stat;
              trait.statName = defaultTrait.statName;
              trait.value = defaultTrait.value;
            }
            
            trait.description = `${trait.statName}+${trait.value}`;
            return trait;
          });
          
          while (traitsData.traits.length < 3) {
            const randomTrait = validTraits[Math.floor(Math.random() * validTraits.length)];
            traitsData.traits.push({
              name: `${randomTrait.statName}+${randomTrait.value}`,
              stat: randomTrait.stat,
              statName: randomTrait.statName,
              value: randomTrait.value,
              description: `${randomTrait.statName}+${randomTrait.value}`,
            });
          }
          
          if (traitsData.traits.length > 3) {
            traitsData.traits = traitsData.traits.slice(0, 3);
          }
        }
      } catch (e) {
        console.error('특성 파싱 오류:', e);
        return res.status(500).json({ error: '특성 생성 파싱 오류', details: traitsResponse });
      }
    }

    // 2. 특수행동 처리 (2차 생성인 경우 기존 effect 유지, name만 재생성)
    let activeSkillData;
    
    if (existingCharacter && existingCharacter.activeSkill && existingCharacter.activeSkill.effect) {
      // 2차 생성: 기존 스킬의 effect는 유지하고 name만 재생성
      const existingEffect = existingCharacter.activeSkill.effect;
      
      const activeSkillNamePrompt = `다음 몬스터 정보와 기존 스킬 효과를 바탕으로 **어울리는 새로운 스킬 이름**을 생성해주세요.

몬스터 정보:
- 이름: ${characterInfo.name}
- 종족: ${characterInfo.species}
- 전투 방식: ${characterInfo.battleStyle}
- 외형: ${characterInfo.appearance}
- 세계관: ${characterInfo.worldView}

기존 스킬 효과: ${existingEffect}
(효과는 변경하지 않고 이름만 새로 생성)

**필수 규칙:**
1. 기존 스킬의 효과(effect)는 절대 변경하면 안 됩니다.
2. 몬스터의 특징과 기존 효과에 어울리는 새로운 스킬 이름을 생성해주세요.
3. 스킬 이름은 1-3단어로 구성되어야 합니다.
4. 예: "치유의 손길", "마나 폭발", "방어 강화" 등

**JSON 형식 (다른 설명 없이 JSON만 응답):**
{
  "activeSkill": {
    "name": "새로운 스킬 이름",
    "manaCost": 1,
    "effect": "${existingEffect}",
    "description": "마나 1 소모: ${existingEffect}"
  }
}`;

      const activeSkillResult = await textModel.generateContent(activeSkillNamePrompt);
      const activeSkillResponse = activeSkillResult.response.text();
      try {
        const jsonMatch = activeSkillResponse.match(/\{[\s\S]*\}/);
        const generatedSkill = JSON.parse(jsonMatch ? jsonMatch[0] : activeSkillResponse);
        
        // 기존 effect를 유지하면서 새로운 name만 적용
        activeSkillData = {
          activeSkill: {
            name: generatedSkill.activeSkill && generatedSkill.activeSkill.name 
              ? generatedSkill.activeSkill.name 
              : existingCharacter.activeSkill.name,
            manaCost: 1, // 항상 1
            effect: existingEffect, // 기존 값 유지
            description: `마나 1 소모: ${existingEffect}`, // 기존 effect로 재생성
          },
        };
      } catch (e) {
        console.error('스킬 이름 재생성 파싱 오류:', e);
        // 파싱 실패 시 기존 스킬 그대로 사용
        activeSkillData = {
          activeSkill: {
            name: existingCharacter.activeSkill.name,
            manaCost: 1,
            effect: existingEffect,
            description: existingCharacter.activeSkill.description || `마나 1 소모: ${existingEffect}`,
          },
        };
      }
    } else {
      // 1차 생성 또는 기존 스킬이 없는 경우: 새로 생성
      const activeSkillEffectsList = ACTIVE_SKILL_EFFECTS.map((effect, index) => `${index + 1}. ${effect}`).join('\n');
      const activeSkillPrompt = `다음 몬스터 정보를 바탕으로 **어울리는 특수행동 1개**를 생성해주세요.

몬스터 정보:
- 이름: ${characterInfo.name}
- 종족: ${characterInfo.species}
- 전투 방식: ${characterInfo.battleStyle}
- 외형: ${characterInfo.appearance}
- 세계관: ${characterInfo.worldView}

**필수 규칙 (절대 위반 금지):**
1. **effect 필드는 반드시 아래 "효과 풀"에서 정확히 하나를 선택해야 합니다**
   - 효과 풀에 나열된 텍스트를 정확히 그대로 복사해서 사용하세요
   - 효과 풀에 없는 텍스트를 사용하면 안 됩니다
   - 약간의 변형이나 수정도 허용되지 않습니다
   - 예: "체력+5" (O) / "체력을 5 증가" (X) / "체력 5 증가" (X)

2. **manaCost는 1로 고정합니다**

3. **description 형식:**
   - "마나 1 소모: {effect 필드의 내용}"
   - 예: "마나 1 소모: 체력+5"

**효과 풀 (아래 목록에서 정확히 하나 선택):**
${activeSkillEffectsList}

**JSON 형식 (다른 설명 없이 JSON만 응답):**
{
  "activeSkill": {
    "name": "스킬 이름",
    "manaCost": 1,
    "effect": "체력+5",
    "description": "마나 1 소모: 체력+5"
  }
}`;

      const activeSkillResult = await textModel.generateContent(activeSkillPrompt);
      const activeSkillResponse = activeSkillResult.response.text();
      try {
        const jsonMatch = activeSkillResponse.match(/\{[\s\S]*\}/);
        activeSkillData = JSON.parse(jsonMatch ? jsonMatch[0] : activeSkillResponse);
        
        // 효과가 풀에 있는지 검증
        if (activeSkillData.activeSkill && activeSkillData.activeSkill.effect) {
          const effect = activeSkillData.activeSkill.effect;
          if (!ACTIVE_SKILL_EFFECTS.includes(effect)) {
            if (shouldLog('warn')) {
              console.warn(`⚠️ 액티브 스킬 효과 "${effect}"가 풀에 없습니다. 첫 번째 효과로 대체합니다.`);
            }
            activeSkillData.activeSkill.effect = ACTIVE_SKILL_EFFECTS[0];
            activeSkillData.activeSkill.manaCost = 1;
            activeSkillData.activeSkill.description = `마나 1 소모: ${activeSkillData.activeSkill.effect}`;
          } else {
            activeSkillData.activeSkill.manaCost = 1;
            activeSkillData.activeSkill.description = `마나 1 소모: ${effect}`;
          }
        }
      } catch (e) {
        console.error('액티브 스킬 파싱 오류:', e);
        return res.status(500).json({ error: '액티브 스킬 생성 파싱 오류', details: activeSkillResponse });
      }
    }

    // 3. 이미지 생성 제거됨
    let imageData = null;
    
    if (false) {
      // 세계관 키워드 추출 (예: "스팀하이븐 (스팀펑크, 기계, 마법)" → ["스팀펑크", "기계", "마법"])
      const worldViewKeywords = [];
      const worldViewName = characterInfo.worldView.split(' (')[0];
      const keywordMatch = characterInfo.worldView.match(/\(([^)]+)\)/);
      if (keywordMatch) {
        worldViewKeywords.push(...keywordMatch[1].split(',').map(kw => kw.trim()));
      }
      
      // TRPG 피규어 스타일 이미지 프롬프트 생성
      const imagePrompt = `A professional 3D tabletop miniature figure photograph, NOT an illustration or digital art. 

CHARACTER:
${characterInfo.name}, a ${characterInfo.species} with ${characterInfo.appearance}, wielding ${characterInfo.battleStyle}, as a professional 3D painted tabletop miniature figure on a detailed base.
The character's pose must be HIGHLY DYNAMIC: mid-action pose, weapon raised, casting spell, leaping, charging, or combat stance. Character should appear in motion with extended limbs and twisted body. Avoid static standing poses.

CHARACTER DETAILS:
Character design reflects ${worldViewKeywords.length > 0 ? worldViewKeywords.join(', ') : worldViewName} world view aesthetics.
Character has vibrant painted colors, detailed textures, and distinct ${worldViewKeywords.length > 0 ? worldViewKeywords.join(' ') : worldViewName} themed visual elements.

BACKGROUND:
Minimal ${worldViewKeywords.length > 0 ? worldViewKeywords.join(' ') : worldViewName} themed miniature terrain, HEAVILY BLURRED, occupying only 5-15% of image area. NO plain gray or empty space.

PHOTOGRAPHY:
Professional tabletop miniature photography with shallow depth of field. Character in sharp focus, background heavily blurred. Dramatic lighting with strong contrast.

COMPOSITION:
Character occupies 75-85% of image height, EXTREMELY LARGE and DOMINANT. Full body portrait (head to toe) with NATURAL PROPORTIONS - head proportional to body, NOT oversized. Centered position. High contrast with background.

CRITICAL: Physical 3D miniatures only, NOT illustrations or digital art. Natural proportions - avoid chibi or oversized head.`;
      
      imageGenerationStatus.attempted = true;
      
      try {
        if (shouldLog('debug')) {
          console.log('🖼️ 이미지 생성 시작...');
          console.log('   프롬프트:', imagePrompt.substring(0, 100) + '...');
        }
        
        // 공식 문서에 따르면 v1beta API를 사용해야 함
        // SDK 대신 REST API를 직접 호출
        const apiKey = process.env.GEMINI_API_KEY;
        const modelName = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
        
        if (shouldLog('debug')) {
          console.log('   API URL:', apiUrl);
          console.log('   REST API 직접 호출 시도...');
        }
        
        // 이미지 생성 설정 (크기, 비율 등)
        // 카드 레이아웃에 맞게 4:5 비율 사용 (상단 이미지 + 하단 스텟 영역)
        const requestBody = {
          contents: [{
            parts: [
              { text: imagePrompt }
            ]
          }],
          generationConfig: {
            imageConfig: {
              aspectRatio: "4:5" // 896x1152 해상도, 세로형 카드에 적합
            }
          }
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API 호출 실패:');
          console.error('   상태 코드:', response.status);
          console.error('   응답 본문:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();
        if (shouldLog('debug')) {
          console.log('   API 호출 성공!');
          console.log('📦 이미지 API 응답 구조:', JSON.stringify(responseData, null, 2).substring(0, 500));
        }
        
        // 공식 문서에 따르면 응답의 data 필드에 base64 이미지가 있음
        // candidates[0].content.parts[0].inlineData.data 또는 candidates[0].content.parts[0].data
        const candidates = responseData.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts && parts.length > 0) {
            // parts 배열을 순회하면서 이미지 데이터 찾기
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              
              // inlineData.data가 있으면 바로 사용
              if (part.inlineData?.data) {
                imageData = part.inlineData.data;
                console.log(`✅ 이미지 데이터 추출 성공 (parts[${i}].inlineData.data)`);
                break;
              } else if (part.data) {
                imageData = part.data;
                console.log(`✅ 이미지 데이터 추출 성공 (parts[${i}].data)`);
                break;
              } else if (part.text) {
                // base64가 텍스트로 반환되는 경우
                const textData = part.text;
                // base64 데이터인지 확인 (일반적으로 매우 긴 문자열)
                if (textData.length > 100 && /^[A-Za-z0-9+/=]+$/.test(textData)) {
                  imageData = textData;
                  console.log(`✅ 이미지 데이터 추출 성공 (parts[${i}].text, base64로 확인됨)`);
                  break;
                } else {
                  console.log(`ℹ️ parts[${i}].text는 설명 텍스트입니다 (길이: ${textData.length})`);
                  // 설명 텍스트는 무시하고 계속 찾기
                }
              }
            }
            
            // 모든 parts를 확인했는데도 이미지 데이터를 찾지 못한 경우
            if (!imageData) {
              console.log('⚠️ 이미지 데이터를 찾을 수 없음. parts 구조:');
              parts.forEach((part, index) => {
                console.log(`   parts[${index}]:`, Object.keys(part));
              });
              imageGenerationStatus.responseStructure = parts.map((part, index) => ({
                index,
                keys: Object.keys(part)
              }));
            }
          }
        }
        
        if (imageData) {
          // base64 이미지 데이터는 일반적으로 최소 수백 자 이상
          if (imageData.length < 100) {
            console.log('⚠️ 이미지 데이터가 너무 짧습니다. 실제 이미지 데이터가 아닐 수 있습니다.');
            console.log('   데이터 길이:', imageData.length);
            console.log('   데이터 샘플:', imageData.substring(0, 100));
            imageGenerationStatus.success = false;
            imageGenerationStatus.error = `이미지 데이터가 너무 짧습니다 (${imageData.length}자). 실제 이미지가 아닐 수 있습니다.`;
            imageData = null;
          } else {
            imageGenerationStatus.success = true;
            console.log('✅ 이미지 생성 성공! 데이터 길이:', imageData.length);
            console.log('   데이터 시작 부분:', imageData.substring(0, 50) + '...');
          }
        } else {
          console.log('❌ 이미지 데이터가 null입니다.');
        }
      } catch (e) {
        imageGenerationStatus.error = e.message;
        console.error('❌ 이미지 생성 오류:', e.message);
        
        // 모델이 존재하지 않는 경우
        if (e.message.includes('not found') || e.message.includes('404') || e.message.includes('is not found')) {
          imageGenerationStatus.note = '모델을 찾을 수 없거나 API 키 권한 문제일 수 있습니다.';
          console.log('💡 가능한 원인:');
          console.log('   1. API 키가 이미지 생성 모델에 대한 권한이 없을 수 있습니다.');
          console.log('   2. 모델명이 정확한지 확인해주세요: gemini-3-pro-image-preview');
          console.log('   3. Google AI Studio에서 API 키 권한을 확인해주세요.');
          console.log('   4. 새로운 API 키로 시도해보세요.');
          console.log('   5. 현재는 이미지 없이 캐릭터 생성이 계속 진행됩니다.');
        } else if (e.message.includes('403') || e.message.includes('Forbidden')) {
          imageGenerationStatus.note = 'API 키 권한이 없거나 모델 접근이 제한되었습니다.';
          console.log('💡 API 키 권한 문제일 수 있습니다.');
        } else {
          console.error('   오류 상세:', e.stack);
        }
        // 이미지 생성 실패해도 계속 진행
      }
    } else {
      imageGenerationStatus.note = '이미지 모델이 초기화되지 않았습니다.';
      console.log('⚠️ 이미지 모델이 없어 이미지 생성을 건너뜁니다.');
    }

    // 5. 이름과 별명 생성
    let finalName = characterInfo.name;
    let finalNickname = null;
    
    if (!name || name === '미정') {
      // 이름 생성
      const namePrompt = `다음 몬스터 정보를 바탕으로 적절한 본명을 생성해주세요. 
- 본명은 2-3단어로 구성된 짧고 간결한 이름이어야 합니다.
- 최대 12자 이내로 작성해주세요.
- 이름만 응답해주세요 (다른 설명 없이).

종족: ${characterInfo.species}
전투 방식: ${characterInfo.battleStyle}
외형: ${characterInfo.appearance}
세계관: ${characterInfo.worldView}`;
      
      const nameResult = await textModel.generateContent(namePrompt);
      finalName = nameResult.response.text().trim();
      
      // 이름이 너무 길면 자르기 (최대 12자)
      if (finalName.length > 12) {
        finalName = finalName.substring(0, 12).trim();
      }
    }
    
    // 별명은 이름이 지정되었든 생성되었든 항상 생성
    const nicknamePrompt = `다음 몬스터 정보를 바탕으로 적절한 별명을 생성해주세요.
- 별명은 본명과 다른 느낌의 1-3단어로 구성된 이름이어야 합니다.
- 최대 10자 이내로 작성해주세요.
- 별명만 응답해주세요 (다른 설명 없이).

본명: ${finalName}
종족: ${characterInfo.species}
전투 방식: ${characterInfo.battleStyle}
외형: ${characterInfo.appearance}
세계관: ${characterInfo.worldView}`;
    
    const nicknameResult = await textModel.generateContent(nicknamePrompt);
    finalNickname = nicknameResult.response.text().trim();
    
    // 별명이 너무 길면 자르기 (최대 10자)
    if (finalNickname.length > 10) {
      finalNickname = finalNickname.substring(0, 10).trim();
    }

    // 5. 스텟 계산 (기본 스텟 + 특성 효과)
    const DEFAULT_STATS = {
      hp: 50,
      diceCount: 3,
      fixedDamage: 0,
      defense: 0,
    };
    
    let finalStats = { ...DEFAULT_STATS };
    
    // 특성 효과를 스텟에 적용
    if (traitsData.traits && Array.isArray(traitsData.traits)) {
      traitsData.traits.forEach((trait) => {
        if (trait.stat && trait.value !== undefined) {
          finalStats[trait.stat] = (finalStats[trait.stat] || 0) + trait.value;
        }
      });
    }

    // 6. 이미지를 Cloud Storage에 저장 (이미지가 있고 storageBucket이 설정된 경우)
    let imageUrl = null;
    let imageId = null;
    
    if (!imageData) {
      if (shouldLog('warn')) {
        console.log('⚠️ 이미지 데이터가 없어 Cloud Storage 저장을 건너뜁니다.');
      }
    } else if (!storageBucket) {
      if (shouldLog('warn')) {
        console.log('⚠️ Cloud Storage 버킷이 초기화되지 않았습니다. GCS_BUCKET_NAME 환경 변수를 확인하세요.');
        console.log(`   현재 설정된 버킷 이름: ${process.env.GCS_BUCKET_NAME || '없음'}`);
      }
    } else {
      try {
        imageId = `character-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const fileName = `characters/${imageId}.png`;
        const file = storageBucket.file(fileName);
        
        if (shouldLog('info')) {
          console.log(`📤 Cloud Storage 업로드 시작: ${fileName} (버킷: ${storageBucket.name})`);
        }
        
        // base64 데이터를 Buffer로 변환
        // base64 문자열에서 공백, 줄바꿈, 데이터 URL 접두사 제거
        let cleanBase64 = imageData.trim();
        // data:image/png;base64, 접두사 제거
        if (cleanBase64.startsWith('data:')) {
          const base64Index = cleanBase64.indexOf(',');
          if (base64Index !== -1) {
            cleanBase64 = cleanBase64.substring(base64Index + 1);
          }
        }
        // 공백과 줄바꿈 제거
        cleanBase64 = cleanBase64.replace(/\s/g, '');
        
        const imageBuffer = Buffer.from(cleanBase64, 'base64');
        
        // 디버깅: 버퍼 크기 확인
        if (shouldLog('info')) {
          console.log(`📦 이미지 버퍼 생성 완료. 크기: ${imageBuffer.length} bytes`);
          console.log(`   원본 base64 길이: ${imageData.length}, 정리된 base64 길이: ${cleanBase64.length}`);
        }
        
        // Cloud Storage에 업로드
        // 주의: 버킷이 "균일 버킷 수준 액세스(Uniform bucket-level access)"로 설정되어 있으면
        // public 옵션을 사용할 수 없습니다. 버킷 레벨에서 액세스 권한을 관리해야 합니다.
        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              characterName: finalName,
              uploadedAt: new Date().toISOString(),
            },
          },
          // public 옵션 제거: 균일 버킷 수준 액세스 사용 시 객체 레벨 ACL 불가
          // 버킷 자체를 공개로 설정하거나 서명된 URL을 사용해야 합니다
        });
        
        // 공개 URL 생성
        imageUrl = `https://storage.googleapis.com/${storageBucket.name}/${fileName}`;
        
        if (shouldLog('info')) {
          console.log(`✅ 이미지가 Cloud Storage에 저장되었습니다: ${imageUrl}`);
        }
      } catch (e) {
        console.error('❌ 이미지 저장 오류:', e.message);
        console.error('   스택:', e.stack);
        // 이미지 저장 실패해도 계속 진행
      }
    }

    // 6-1. 이미지 태그 생성 (이미지가 저장된 후, 이름 생성 이후)
    let imageTags = [];
    if (imageUrl && textModel && finalName) {
      try {
        const tagPrompt = `다음 몬스터 캐릭터의 이미지를 설명하는 태그를 5-8개 생성해주세요.
태그는 쉼표로 구분된 단어나 짧은 구문이어야 합니다.
각 태그는 1-3단어로 구성되어야 합니다.
다음 정보를 바탕으로 이미지의 특징을 잘 나타내는 태그를 생성해주세요.

캐릭터 정보:
- 이름: ${finalName}
- 종족: ${characterInfo.species}
- 전투 방식: ${characterInfo.battleStyle}
- 외형: ${characterInfo.appearance}
- 세계관: ${characterInfo.worldView}

**응답 형식:**
태그만 쉼표로 구분하여 나열해주세요. 다른 설명 없이 태그만 응답해주세요.
예: "판타지, 드래곤, 전사, 갑옷, 검, 용맹, 화염, 전투"

태그:`;

        const tagResult = await textModel.generateContent(tagPrompt);
        const tagResponse = tagResult.response.text().trim();
        
        // 태그 파싱 (쉼표로 구분)
        imageTags = tagResponse
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)
          .slice(0, 8); // 최대 8개
        
        if (shouldLog('info')) {
          console.log(`✅ 이미지 태그 생성 완료: ${imageTags.join(', ')}`);
        }
      } catch (e) {
        console.error('❌ 태그 생성 오류:', e.message);
        // 태그 생성 실패해도 계속 진행
      }
    }

    // 6-1. 이미지와 태그를 별도 컬렉션에 저장 (이미지가 있는 경우)
    // 캐릭터 삭제 시에도 이미지와 태그는 유지되도록 별도 저장
    let imageDocId = null;
    if (imageUrl && firestore && imageTags.length > 0 && imageId) {
      try {
        const imageDoc = {
          imageUrl: imageUrl,
          imageId: imageId,
          tags: imageTags, // 태그 배열
          characterName: finalName,
          characterSpecies: characterInfo.species,
          characterWorldView: characterInfo.worldView || '미정',
          isTemplate: false, // 유저 생성 이미지는 템플릿이 아님
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        const imageDocRef = await firestore.collection('images').add(imageDoc);
        imageDocId = imageDocRef.id;
        
        if (shouldLog('info')) {
          console.log(`✅ 이미지와 태그가 Firestore에 저장되었습니다. ImageDocId: ${imageDocId}`);
        }
      } catch (e) {
        console.error('❌ 이미지/태그 저장 오류:', e.message);
        // 이미지/태그 저장 실패해도 계속 진행
      }
    }

    // 8. 캐릭터 데이터를 Firestore에 저장 (firestore이 설정된 경우)
    // 인증된 사용자의 userId 사용
    const userId = req.user?.uid;
    let characterId = existingCharacter?.id || null;
    
    if (firestore && userId) {
      try {
        const characterDoc = {
          userId: userId, // 인증된 사용자의 ID 저장
          name: finalName,
          nickname: finalNickname || null,
          species: characterInfo.species,
          battleStyle: characterInfo.battleStyle || '미정',
          appearance: characterInfo.appearance || '미정',
          worldView: characterInfo.worldView || '미정',
          stats: finalStats,
          traits: traitsData.traits,
          activeSkill: activeSkillData.activeSkill,
          contracted: existingCharacter?.contracted || false, // 2차 생성인 경우 기존 계약 상태 유지
          imageUrl: imageUrl || existingCharacter?.imageUrl || null, // Cloud Storage URL (이미지가 있으면 항상 Cloud Storage에 저장)
          // imageData는 Firestore 필드 크기 제한(약 1MB) 때문에 저장하지 않음
          // 이미지가 Cloud Storage에 저장되므로 imageUrl만으로 접근 가능
          imageDocId: imageDocId || existingCharacter?.imageDocId || null, // images 컬렉션 문서 ID (참조용, 선택적)
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // 2차 생성인 경우 업데이트, 아니면 새로 생성
        if (existingCharacter) {
          await firestore.collection('characters').doc(characterId).update(characterDoc);
          if (shouldLog('info')) {
            console.log(`✅ 캐릭터가 Firestore에 업데이트되었습니다. ID: ${characterId}, UserId: ${userId}`);
          }
        } else {
          characterDoc.createdAt = admin.firestore.FieldValue.serverTimestamp();
          const docRef = await firestore.collection('characters').add(characterDoc);
          characterId = docRef.id;
          if (shouldLog('info')) {
            console.log(`✅ 캐릭터가 Firestore에 저장되었습니다. ID: ${characterId}, UserId: ${userId}`);
          }
        }
      } catch (e) {
        console.error('❌ Firestore 저장 오류:', e.message);
        // Firestore 저장 실패 시 에러 반환
        return res.status(500).json({
          error: '캐릭터 저장 중 오류가 발생했습니다.',
          message: e.message,
        });
      }
    } else if (!userId) {
      return res.status(401).json({
        error: '인증이 필요합니다.',
        message: '로그인이 필요합니다.',
      });
    }

    // 8. 최종 캐릭터 데이터 반환
    res.json({
      character: {
        id: characterId, // Firestore 문서 ID
        name: finalName,
        nickname: finalNickname || undefined,
        species: characterInfo.species || '미정',
        battleStyle: characterInfo.battleStyle || '미정',
        appearance: characterInfo.appearance || '미정',
        worldView: characterInfo.worldView || '미정',
        stats: finalStats, // 기본 스텟 + 특성 효과가 적용된 최종 스텟
        traits: traitsData.traits,
        activeSkill: activeSkillData.activeSkill,
        imageUrl: imageUrl, // Cloud Storage URL (있는 경우)
        imageData: imageUrl ? null : imageData, // URL이 없으면 base64 데이터 반환
      },
    });
  } catch (error) {
    console.error('캐릭터 생성 오류:', error);
    res.status(500).json({
      error: '캐릭터 생성 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

// 이미지 템플릿 필터링 엔드포인트 (1차 생성용)
app.get('/api/images/templates', verifyToken, async (req, res) => {
  if (!firestore) {
    return res.status(503).json({
      error: 'Firestore가 초기화되지 않았습니다.',
    });
  }

  try {
    const { worldView, classification, job } = req.query;

    // 모든 템플릿 이미지 가져오기 (필터링은 나중에 점수 기반으로)
    const snapshot = await firestore.collection('images')
      .where('isTemplate', '==', true)
      .get();
    
    let templates = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const templateTags = data.tags || [];
      const templateWorldView = data.characterWorldView || '';
      
      // 점수 계산 (우선순위 기반)
      let score = 0;
      
      // worldView 일치: +100점
      if (worldView && templateWorldView === worldView) {
        score += 100;
      }
      
      // classification 일치: +50점
      if (classification && templateTags.includes(classification)) {
        score += 50;
      }
      
      // job 일치: +50점
      if (job && templateTags.includes(job)) {
        score += 50;
      }
      
      // 최소 하나의 조건은 일치해야 함
      // worldView가 있으면 worldView는 반드시 일치해야 함
      // classification이나 job이 있으면 최소 하나는 일치해야 함
      const hasWorldViewMatch = !worldView || templateWorldView === worldView;
      const hasClassificationMatch = !classification || templateTags.includes(classification);
      const hasJobMatch = !job || templateTags.includes(job);
      
      // 필터링 조건:
      // 1. worldView가 있으면 반드시 일치해야 함
      // 2. classification이나 job이 있으면 최소 하나는 일치해야 함
      const shouldInclude = hasWorldViewMatch && (
        (!classification && !job) || // 둘 다 없으면 포함
        (hasClassificationMatch || hasJobMatch) // 하나라도 일치하면 포함
      );
      
      if (shouldInclude && score > 0) {
        templates.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          tags: templateTags,
          characterName: data.characterName || '',
          characterSpecies: data.characterSpecies || '',
          characterWorldView: templateWorldView,
          score: score, // 점수 포함
        });
      }
    });

    // 점수 순으로 정렬 (높은 점수 우선)
    templates.sort((a, b) => b.score - a.score);
    
    // 동일 점수 내에서는 랜덤하게 섞기
    const scoreGroups = {};
    templates.forEach(template => {
      if (!scoreGroups[template.score]) {
        scoreGroups[template.score] = [];
      }
      scoreGroups[template.score].push(template);
    });
    
    templates = [];
    Object.keys(scoreGroups).sort((a, b) => Number(b) - Number(a)).forEach(score => {
      const group = scoreGroups[score];
      // 동일 점수 그룹 내에서 랜덤하게 섞기
      group.sort(() => Math.random() - 0.5);
      templates.push(...group);
    });

    // 최대 3개 반환 (프론트엔드에서 3개만 사용)
    templates = templates.slice(0, 3);

    res.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('이미지 템플릿 필터링 오류:', error);
    res.status(500).json({
      error: '이미지 템플릿 필터링 중 오류가 발생했습니다.',
      message: error.message,
    });
  }
});

// 이미지 생성 기능 제거됨
app.post('/api/images/generate-templates-all', verifyToken, async (req, res) => {
  return res.status(410).json({ error: '이미지 생성 기능이 제거되었습니다.' });
});

app.post('/api/images/balance-templates', verifyToken, async (req, res) => {
  return res.status(410).json({ error: '이미지 생성 기능이 제거되었습니다.' });
});

app.post('/api/images/generate-templates', verifyToken, async (req, res) => {
  return res.status(410).json({ error: '이미지 생성 기능이 제거되었습니다.' });
});

app.post('/api/ai/generate-image', async (req, res) => {
  return res.status(410).json({ error: '이미지 생성 기능이 제거되었습니다.' });
});

app.post('/api/images/delete-templates', verifyToken, async (req, res) => {
  return res.status(410).json({ error: '이미지 생성 기능이 제거되었습니다.' });
});

// 서버 시작 함수
const startServer = async () => {
  try {
    // Firebase 초기화
    await initializeFirebase();
    
    // 서버 시작
    // Cloud Run에서는 0.0.0.0에 바인딩해야 합니다
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`나몬생 백엔드 서버가 ${HOST}:${PORT}에서 실행 중입니다.`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();