/**
 * Gemini API 서비스 (브라우저 직접 호출용 라이브 모드)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Character, Trait, ActiveSkill } from '../types'
import { WorldView } from '../constants/worldViews'

const ACTIVE_SKILL_EFFECTS = [
  '체력+5',
  '다음턴에 특수 주사위 생성',
  '적 최대 체력 6감소',
  '다음턴 상대 주사위 숫자-1',
  '상대 방어-1',
  '상대 고정 피해-1',
  '고정 피해+1',
]

// API 키 가져오기
export function getGeminiApiKey(): string | null {
  return localStorage.getItem('mmm_gemini_api_key')
}

// API 키 저장
export function saveGeminiApiKey(key: string): void {
  localStorage.setItem('mmm_gemini_api_key', key)
}

// API 키 삭제
export function clearGeminiApiKey(): void {
  localStorage.removeItem('mmm_gemini_api_key')
}

// Gemini 클라이언트 초기화
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API Key가 설정되지 않았습니다. 설정 페이지에서 API Key를 입력해주세요.')
  }
  return new GoogleGenerativeAI(apiKey)
}

// JSON 문자열 파싱 헬퍼
function cleanAndParseJson<T>(text: string): T {
  let cleanText = text.trim()
  
  // 마크다운 코드 블록 제거 (```json ... ``` 또는 ``` ... ```)
  if (cleanText.startsWith('```')) {
    const lines = cleanText.split('\n')
    // 첫째 줄과 마지막 줄 제거
    if (lines[0].startsWith('```')) {
      lines.shift()
    }
    if (lines[lines.length - 1].startsWith('```')) {
      lines.pop()
    }
    cleanText = lines.join('\n').trim()
  }
  
  // 가끔 나오는 JSON 중괄호 바깥 영역의 잡다한 설명 제거
  const firstBrace = cleanText.indexOf('{')
  const lastBrace = cleanText.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1)
  }

  return JSON.parse(cleanText) as T
}

/**
 * 1차 캐릭터 생성 (Live Mode)
 */
export async function generateGeminiCharacterFirst(
  name: string,
  worldView: WorldView,
  classification: string,
  job: string,
  templateImageUrl: string | null
): Promise<Omit<Character, 'id'>> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  const characterInfo = {
    name: name.trim(),
    species: classification,
    battleStyle: `${job} 스타일`,
    appearance: `${classification} ${job}의 외형`,
    worldView
  }

  // 1. 특성 3개 생성 프롬프트
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
}`

  const traitsResponse = await model.generateContent(traitsPrompt)
  let generatedTraits: Trait[] = []
  try {
    const parsed = cleanAndParseJson<{ traits: Trait[] }>(traitsResponse.response.text())
    generatedTraits = parsed.traits
  } catch (e) {
    console.error('Gemini 특성 파싱 실패, 기본값으로 대체:', e)
    generatedTraits = [
      { name: '기본 생명력', stat: 'hp', statName: '체력', value: 10, description: '체력+10' },
      { name: '기본 주사위', stat: 'diceCount', statName: '주사위', value: 1, description: '주사위+1' },
      { name: '수호 방패', stat: 'defense', statName: '방어력', value: 2, description: '방어력+2' },
    ]
  }

  // 2. 액티브 스킬 생성 프롬프트
  const activeSkillEffectsList = ACTIVE_SKILL_EFFECTS.map((effect, index) => `${index + 1}. ${effect}`).join('\n')
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
}`

  const activeSkillResponse = await model.generateContent(activeSkillPrompt)
  let generatedActiveSkill: ActiveSkill
  try {
    const parsed = cleanAndParseJson<{ activeSkill: ActiveSkill }>(activeSkillResponse.response.text())
    generatedActiveSkill = parsed.activeSkill
    // 검증
    if (!ACTIVE_SKILL_EFFECTS.includes(generatedActiveSkill.effect)) {
      generatedActiveSkill.effect = ACTIVE_SKILL_EFFECTS[0]
      generatedActiveSkill.description = `마나 1 소모: ${generatedActiveSkill.effect}`
    }
  } catch (e) {
    console.error('Gemini 액티브 스킬 파싱 실패, 기본값으로 대체:', e)
    generatedActiveSkill = {
      name: '원소 폭발',
      manaCost: 1,
      effect: '체력+5',
      description: '마나 1 소모: 체력+5'
    }
  }

  // 스탯 계산
  const DEFAULT_STATS = { hp: 50, diceCount: 3, fixedDamage: 0, defense: 0 }
  const finalStats = {
    hp: DEFAULT_STATS.hp + generatedTraits.filter(t => t.stat === 'hp').reduce((sum, t) => sum + t.value, 0),
    diceCount: DEFAULT_STATS.diceCount + generatedTraits.filter(t => t.stat === 'diceCount').reduce((sum, t) => sum + t.value, 0),
    fixedDamage: DEFAULT_STATS.fixedDamage + generatedTraits.filter(t => t.stat === 'fixedDamage').reduce((sum, t) => sum + t.value, 0),
    defense: DEFAULT_STATS.defense + generatedTraits.filter(t => t.stat === 'defense').reduce((sum, t) => sum + t.value, 0),
  }

  return {
    name: characterInfo.name,
    species: characterInfo.species,
    battleStyle: characterInfo.battleStyle,
    appearance: characterInfo.appearance,
    worldView: characterInfo.worldView,
    stats: finalStats,
    traits: generatedTraits,
    activeSkill: generatedActiveSkill,
    createdAt: new Date().toISOString(),
    contracted: false,
    imageUrl: templateImageUrl
  }
}

/**
 * 2차 캐릭터 생성 (Live Mode)
 */
export async function generateGeminiCharacterSecond(
  existingCharacter: Character | null,
  name: string,
  species: string,
  battleStyle: string,
  appearance: string,
  worldView: WorldView
): Promise<Omit<Character, 'id'>> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  const finalWorldView = worldView || existingCharacter?.worldView || 'arcandria'
  const finalName = name || existingCharacter?.name || '미정'
  
  // 0. 종족이 없으면 Gemini로 생성
  let finalSpecies = species
  if (!finalSpecies || finalSpecies.trim() === '') {
    const speciesPrompt = `다음 몬스터 정보를 바탕으로 적절한 종족을 생성해주세요.
- 종족은 1-2단어로 구성된 짧고 간결한 이름이어야 합니다.
- 최대 8자 이내로 작성해주세요.
- 종족만 응답해주세요 (다른 설명 없이).

이름: ${finalName}
전투 방식: ${battleStyle || existingCharacter?.battleStyle || '미정'}
외형: ${appearance || existingCharacter?.appearance || '미정'}
세계관: ${finalWorldView}`

    const speciesResult = await model.generateContent(speciesPrompt)
    finalSpecies = speciesResult.response.text().trim()
    if (finalSpecies.length > 8) {
      finalSpecies = finalSpecies.substring(0, 8).trim()
    }
  }

  const finalBattleStyle = battleStyle || existingCharacter?.battleStyle || '미정'
  const finalAppearance = appearance || existingCharacter?.appearance || '미정'

  // 1. 특성 이름 재생성 (기본 스탯/효과는 보존하고 이름만 바꿈)
  let generatedTraits: Trait[] = []
  if (existingCharacter && existingCharacter.traits && existingCharacter.traits.length > 0) {
    const traitsInfo = existingCharacter.traits.map((trait, index) => 
      `${index + 1}. ${trait.statName}+${trait.value} (stat: "${trait.stat}", value: ${trait.value})`
    ).join('\n')

    const traitsNamePrompt = `다음 몬스터 정보와 기존 특성들을 바탕으로 **각 특성에 어울리는 새로운 이름**을 생성해주세요.

몬스터 정보:
- 이름: ${finalName}
- 종족: ${finalSpecies}
- 전투 방식: ${finalBattleStyle}
- 외형: ${finalAppearance}
- 세계관: ${finalWorldView}

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
    ...
  ]
}`

    const traitsResult = await model.generateContent(traitsNamePrompt)
    try {
      const parsed = cleanAndParseJson<{ traits: Trait[] }>(traitsResult.response.text())
      generatedTraits = existingCharacter.traits.map((existingTrait, index) => {
        const genTrait = parsed.traits && parsed.traits[index] ? parsed.traits[index] : null
        return {
          name: genTrait && genTrait.name ? genTrait.name : existingTrait.name,
          stat: existingTrait.stat,
          statName: existingTrait.statName,
          value: existingTrait.value,
          description: existingTrait.description
        }
      })
    } catch (e) {
      console.error('Gemini 특성 이름 재생성 실패, 기존 특성 유지:', e)
      generatedTraits = existingCharacter.traits
    }
  } else {
    // 기존 특성이 없으면 1차 생성 로직으로 생성
    const tempFirst = await generateGeminiCharacterFirst(finalName, finalWorldView, finalSpecies, finalBattleStyle, null)
    generatedTraits = tempFirst.traits
  }

  // 2. 스킬 이름 재생성
  let finalActiveSkill: ActiveSkill
  if (existingCharacter && existingCharacter.activeSkill) {
    const skillNamePrompt = `다음 몬스터 정보와 기존 특수행동을 바탕으로 **어울리는 새로운 스킬 이름**을 1개 생성해주세요.
- 스킬 이름은 1-3단어로 구성된 무협/판타지/사이버네틱 스타일이어야 합니다.
- 스킬 이름만 한 줄로 응답해주세요 (다른 설명 없이).

몬스터 정보:
- 이름: ${finalName}
- 종족: ${finalSpecies}
- 전투 방식: ${finalBattleStyle}
- 외형: ${finalAppearance}
- 세계관: ${finalWorldView}
기존 스킬 정보:
- 효과: ${existingCharacter.activeSkill.effect}`

    const skillResult = await model.generateContent(skillNamePrompt)
    const newSkillName = skillResult.response.text().trim()
    finalActiveSkill = {
      ...existingCharacter.activeSkill,
      name: newSkillName || existingCharacter.activeSkill.name
    }
  } else {
    finalActiveSkill = {
      name: '수호 에너지 폭발',
      manaCost: 1,
      effect: '체력+5',
      description: '마나 1 소모: 체력+5'
    }
  }

  // 3. 몬스터 별명 생성
  const nicknamePrompt = `다음 몬스터 정보를 바탕으로 **어울리는 기묘하고 위엄있는 한글 별명(nickname)**을 1개 생성해주세요.
- 별명은 "심연의 수호자", "네온의 검귀"와 같은 수식어 형태여야 합니다.
- 설명 없이 별명만 한 줄로 응답해주세요 (최대 12자 이내).

몬스터 정보:
- 이름: ${finalName}
- 종족: ${finalSpecies}
- 전투 방식: ${finalBattleStyle}
- 외형: ${finalAppearance}
- 세계관: ${finalWorldView}`

  const nicknameResult = await model.generateContent(nicknamePrompt)
  const finalNickname = nicknameResult.response.text().trim().replace(/['"“”]/g, '')

  // 최종 스탯 계산
  const DEFAULT_STATS = { hp: 50, diceCount: 3, fixedDamage: 0, defense: 0 }
  const finalStats = {
    hp: DEFAULT_STATS.hp + generatedTraits.filter(t => t.stat === 'hp').reduce((sum, t) => sum + t.value, 0),
    diceCount: DEFAULT_STATS.diceCount + generatedTraits.filter(t => t.stat === 'diceCount').reduce((sum, t) => sum + t.value, 0),
    fixedDamage: DEFAULT_STATS.fixedDamage + generatedTraits.filter(t => t.stat === 'fixedDamage').reduce((sum, t) => sum + t.value, 0),
    defense: DEFAULT_STATS.defense + generatedTraits.filter(t => t.stat === 'defense').reduce((sum, t) => sum + t.value, 0),
  }

  return {
    name: finalName,
    nickname: finalNickname,
    species: finalSpecies,
    battleStyle: finalBattleStyle,
    appearance: finalAppearance,
    worldView: finalWorldView,
    stats: finalStats,
    traits: generatedTraits,
    activeSkill: finalActiveSkill,
    createdAt: existingCharacter?.createdAt || new Date().toISOString(),
    contracted: existingCharacter?.contracted || false,
    imageUrl: existingCharacter?.imageUrl || null
  }
}
