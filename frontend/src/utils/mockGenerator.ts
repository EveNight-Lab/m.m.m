/**
 * 로컬 캐릭터 생성기 (오프라인/모크 모드용)
 * 백엔드 AI의 생성 동작을 규칙 기반으로 유사하게 시뮬레이션합니다.
 */

import type { Character, Trait, ActiveSkill } from '../types'
import { WorldView } from '../constants/worldViews'

const TRAIT_NAMES = {
  hp: ['질긴 생명력', '바위의 단단함', '불굴의 의지', '재생의 기운', '거인의 심장', '차원 장벽'],
  diceCount: ['신속한 반사신경', '바람의 장난', '운명적 행운', '가속 코어', '시간의 비틀림', '허상 잔영'],
  fixedDamage: ['매서운 일격', '플라즈마 파열', '치명적 침투', '원소의 분노', '단절의 일격', '죽음의 맹세'],
  defense: ['강철 외골격', '마력의 왜곡막', '철벽 태세', '수호의 은총', '반사 장갑', '대지의 단단한 껍질'],
}

const SKILL_NAMES = [
  '파열 광선', '플라즈마 오염', '중력 붕괴', '원소 왜곡', '심연의 포효',
  '바람의 일섬', '태엽 과부하', '나노 역장의 벽', '대지 강타', '별빛 파쇄격',
  '뇌신 소환', '강철 톱날 회전', '독극 가스 방사', '죽음의 손길', '암흑 쐐기'
]

const NICKNAMES = {
  steamhaven: ['톱니바퀴의 황제', '증기 광풍', '태엽 장치 명인', '녹슨 태양'],
  arcandria: ['원소 조율사', '룬 문자의 수호자', '대마법사', '아르칸의 비수'],
  neoncity: ['네온의 추적자', '사이퍼 펑크', '가상 현실 방랑자', '마이크로 나노의 손'],
  cosmos: ['은하의 수호신', '성간 여행자', '중력의 군주', '안드로메다의 사자'],
  cheonmugye: ['천하무쌍 검귀', '바람의 도승', '자양강장 웅혼', '도적의 제왕'],
  deathland: ['심연의 영혼 사냥꾼', '언데드 군주', '유골의 지배자', '차가운 묘비명']
}

const SPECIES_TEMPLATES = {
  steamhaven: ['오토마톤', '증기 골렘', '기계 도마뱀', '태엽 비행수'],
  arcandria: ['가고일', '그리핀', '대정령', '룬 가디언'],
  neoncity: ['사이버 오울', '나노 슬라임', '글리치 비스트', '홀로그램 헌터'],
  cosmos: ['에일리언 가디언', '성운 슬라임', '우주 거미', '플라즈마 드래곤'],
  cheonmugye: ['호랑이 산신', '구미호', '수선 도승', '흑선풍 도마뱀'],
  deathland: ['리치', '데스 나이트', '벤시 수호자', '골문 가고일']
}

const BATTLE_STYLE_TEMPLATES = [
  '고속 연타검술 및 교란', '중력파 압축 투척', '초진동 톱날 베기', 
  '마력 광선 연속 파괴', '독 안개 살포 및 은신', '철벽 방어를 통한 반사',
  '화염과 냉기를 교차하는 원소 타격', '은하 성간 물체 소환 공격'
]

const APPEARANCES = {
  steamhaven: '구리빛 태엽 장치와 관절에서 뿜어 나오는 스팀 증기, 날카로운 피스톤 톱날을 가진 기계 생명체',
  arcandria: '기묘한 푸른빛 룬 문자가 은은하게 회전하며 몸 주위를 보호하고 있는 신비로운 고대 마술사 형태',
  neoncity: '네온 핑크와 그린 라이트가 발광하는 가죽 코트를 입고 플라즈마 검을 장비한 사이보그 헌터',
  cosmos: '성간 은하수 형태의 투명한 외피 내부에 소우주가 소용돌이치는 듯한 우주적 안드로이드 기체',
  cheonmugye: '유려하게 펄럭이는 동양식 도포를 걸치고 손끝에서 매서운 바람의 검기를 내뿜는 무림 야수',
  deathland: '부서진 가시 갑옷 틈새로 검푸른 원혼의 불꽃이 타오르고 차가운 서리가 내리는 죽음의 수호자'
}

/**
 * 1차 캐릭터 생성 로컬 구현
 */
export function generateMockCharacterFirst(
  name: string,
  worldView: WorldView,
  classification: string,
  job: string,
  templateImageUrl: string | null
): Omit<Character, 'id'> {
  // 특성 풀에서 무작위 3개 선택 (중복 허용)
  const traitPoolKeys: Array<'hp' | 'diceCount' | 'fixedDamage' | 'defense'> = ['hp', 'diceCount', 'fixedDamage', 'defense']
  const traits: Trait[] = []
  
  for (let i = 0; i < 3; i++) {
    const stat = traitPoolKeys[Math.floor(Math.random() * traitPoolKeys.length)]
    let value = 2
    let statName = '방어력'
    
    if (stat === 'hp') {
      value = 10
      statName = '체력'
    } else if (stat === 'diceCount') {
      value = 1
      statName = '주사위'
    } else if (stat === 'fixedDamage') {
      value = 2
      statName = '고정피해'
    }
    
    const names = TRAIT_NAMES[stat]
    const traitName = names[Math.floor(Math.random() * names.length)]
    
    traits.push({
      name: traitName,
      stat,
      statName,
      value,
      description: `${statName}+${value}`
    })
  }

  // 액티브 스킬 선택
  const activeSkillEffects = [
    '체력+5',
    '다음턴에 특수 주사위 생성',
    '적 최대 체력 6감소',
    '다음턴 상대 주사위 숫자-1',
    '상대 방어-1',
    '상대 고정 피해-1',
    '고정 피해+1',
  ]
  const effect = activeSkillEffects[Math.floor(Math.random() * activeSkillEffects.length)]
  const skillName = SKILL_NAMES[Math.floor(Math.random() * SKILL_NAMES.length)]
  
  const activeSkill: ActiveSkill = {
    name: skillName,
    manaCost: 1,
    effect,
    description: `마나 1 소모: ${effect}`
  }

  // 기본 스탯에서 특성 가산치 적용
  const DEFAULT_STATS = { hp: 50, diceCount: 3, fixedDamage: 0, defense: 0 }
  const finalStats = {
    hp: DEFAULT_STATS.hp + traits.filter(t => t.stat === 'hp').reduce((sum, t) => sum + t.value, 0),
    diceCount: DEFAULT_STATS.diceCount + traits.filter(t => t.stat === 'diceCount').reduce((sum, t) => sum + t.value, 0),
    fixedDamage: DEFAULT_STATS.fixedDamage + traits.filter(t => t.stat === 'fixedDamage').reduce((sum, t) => sum + t.value, 0),
    defense: DEFAULT_STATS.defense + traits.filter(t => t.stat === 'defense').reduce((sum, t) => sum + t.value, 0),
  }

  return {
    name: name.trim(),
    species: classification,
    battleStyle: `${job} 스타일`,
    appearance: `${classification} ${job}의 외형`,
    worldView,
    stats: finalStats,
    traits,
    activeSkill,
    createdAt: new Date().toISOString(),
    contracted: false,
    imageUrl: templateImageUrl
  }
}

/**
 * 2차 캐릭터 생성 및 수정용 로컬 구현
 */
export function generateMockCharacterSecond(
  existingCharacter: Character | null,
  name: string,
  species: string,
  battleStyle: string,
  appearance: string,
  worldView: WorldView
): Omit<Character, 'id'> {
  const finalWorldView = worldView || existingCharacter?.worldView || 'arcandria'
  const finalName = name || existingCharacter?.name || '미정'
  
  // 0. 종족이 없으면 자동 생성
  let finalSpecies = species
  if (!finalSpecies || finalSpecies.trim() === '') {
    const templates = SPECIES_TEMPLATES[finalWorldView] || SPECIES_TEMPLATES.arcandria
    finalSpecies = templates[Math.floor(Math.random() * templates.length)]
  }

  // 1. 기존 특성의 스탯가치는 그대로 두되, 이름만 몬스터 특징에 맞추어 재생성
  let finalTraits: Trait[] = []
  if (existingCharacter && existingCharacter.traits && existingCharacter.traits.length > 0) {
    finalTraits = existingCharacter.traits.map(t => {
      const names = TRAIT_NAMES[t.stat]
      const newName = names[Math.floor(Math.random() * names.length)]
      return {
        ...t,
        name: newName
      }
    })
  } else {
    // 기존 특성이 없었을 경우 임의 3개 생성
    const tempFirst = generateMockCharacterFirst(finalName, finalWorldView, finalSpecies, '전사', null)
    finalTraits = tempFirst.traits
  }

  // 2. 액티브 스킬
  let finalActiveSkill: ActiveSkill
  if (existingCharacter && existingCharacter.activeSkill) {
    // 기존 스킬 활용하되 이름 변경
    const skillName = SKILL_NAMES[Math.floor(Math.random() * SKILL_NAMES.length)]
    finalActiveSkill = {
      ...existingCharacter.activeSkill,
      name: skillName
    }
  } else {
    const skillName = SKILL_NAMES[Math.floor(Math.random() * SKILL_NAMES.length)]
    finalActiveSkill = {
      name: skillName,
      manaCost: 1,
      effect: '체력+5',
      description: '마나 1 소모: 체력+5'
    }
  }

  // 3. 외형 및 전투 스타일이 비어있으면 채우기
  const finalBattleStyle = battleStyle || existingCharacter?.battleStyle || BATTLE_STYLE_TEMPLATES[Math.floor(Math.random() * BATTLE_STYLE_TEMPLATES.length)]
  const finalAppearance = appearance || existingCharacter?.appearance || APPEARANCES[finalWorldView] || APPEARANCES.arcandria

  // 4. 별명 생성
  const nicks = NICKNAMES[finalWorldView] || NICKNAMES.arcandria
  const finalNickname = nicks[Math.floor(Math.random() * nicks.length)]

  // 스탯 계산
  const DEFAULT_STATS = { hp: 50, diceCount: 3, fixedDamage: 0, defense: 0 }
  const finalStats = {
    hp: DEFAULT_STATS.hp + finalTraits.filter(t => t.stat === 'hp').reduce((sum, t) => sum + t.value, 0),
    diceCount: DEFAULT_STATS.diceCount + finalTraits.filter(t => t.stat === 'diceCount').reduce((sum, t) => sum + t.value, 0),
    fixedDamage: DEFAULT_STATS.fixedDamage + finalTraits.filter(t => t.stat === 'fixedDamage').reduce((sum, t) => sum + t.value, 0),
    defense: DEFAULT_STATS.defense + finalTraits.filter(t => t.stat === 'defense').reduce((sum, t) => sum + t.value, 0),
  }

  return {
    name: finalName,
    nickname: finalNickname,
    species: finalSpecies,
    battleStyle: finalBattleStyle,
    appearance: finalAppearance,
    worldView: finalWorldView,
    stats: finalStats,
    traits: finalTraits,
    activeSkill: finalActiveSkill,
    createdAt: existingCharacter?.createdAt || new Date().toISOString(),
    contracted: existingCharacter?.contracted || false,
    imageUrl: existingCharacter?.imageUrl || null
  }
}
