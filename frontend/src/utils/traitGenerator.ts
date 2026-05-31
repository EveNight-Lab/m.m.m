import { STAT_KEYS, STAT_NAMES } from '../constants/stats'
import type { Trait, Stats } from '../types'

/**
 * 특성 풀 정의
 * 각 특성은 하나의 스텟에 특정 값을 증가시킵니다.
 */
const TRAIT_POOL: Array<{ stat: typeof STAT_KEYS[number]; statName: string; value: number }> = [
  { stat: 'hp', statName: '체력', value: 10 },
  { stat: 'diceCount', statName: '주사위', value: 1 },
  { stat: 'fixedDamage', statName: '고정피해', value: 2 },
  { stat: 'defense', statName: '방어력', value: 2 },
]

/**
 * 특성 생성
 * 풀에서 랜덤하게 하나를 선택
 * @returns 생성된 특성 객체
 */
export function generateTrait(): Trait {
  const traitDef = TRAIT_POOL[Math.floor(Math.random() * TRAIT_POOL.length)]
  
  return {
    name: `${traitDef.statName}+${traitDef.value}`, // 임시 이름 (AI가 생성할 예정)
    stat: traitDef.stat,
    statName: traitDef.statName,
    value: traitDef.value,
    description: `${traitDef.statName}+${traitDef.value}`,
  }
}

/**
 * 특성 3개 생성
 * 풀에서 중복 가능하게 3개를 선택
 */
export function generateTraits(): Trait[] {
  const selectedTraits: Trait[] = []
  
  // 중복 가능하게 3개 선택
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * TRAIT_POOL.length)
    const traitDef = TRAIT_POOL[randomIndex]
    
    selectedTraits.push({
      name: `${traitDef.statName}+${traitDef.value}`, // 임시 이름
      stat: traitDef.stat,
      statName: traitDef.statName,
      value: traitDef.value,
      description: `${traitDef.statName}+${traitDef.value}`,
    })
  }
  
  return selectedTraits
}

/**
 * 특성 1개를 스텟에 적용
 * 재화로 구매한 특성을 기존 캐릭터에 추가할 때 사용
 * @param currentStats - 현재 스텟
 * @param trait - 적용할 특성
 * @returns 특성 적용 후 스텟
 */
export function applyTraitToStats(currentStats: Stats, trait: Trait): Stats {
  const newStats = { ...currentStats }
  
  // 특성의 스텟에 값 추가
  newStats[trait.stat] = newStats[trait.stat] + trait.value
  
  return newStats
}

/**
 * 특성들을 스텟에 적용
 * 초기 캐릭터 생성 시 여러 특성을 한번에 적용할 때 사용
 * @param initialStats - 초기 스텟 (모두 C)
 * @param traits - 특성 배열
 * @returns 최종 스텟
 */
export function applyTraitsToStats(initialStats: Stats, traits: Trait[]): Stats {
  let finalStats = { ...initialStats }
  
  traits.forEach((trait) => {
    finalStats = applyTraitToStats(finalStats, trait)
  })
  
  return finalStats
}

