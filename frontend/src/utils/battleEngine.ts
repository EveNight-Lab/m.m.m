/**
 * 전투 엔진 유틸리티
 * 전투 판정 및 로직 처리
 */

import type { Character } from '../types'

/**
 * 전투 엔진의 핵심 로직
 * - 턴제 전투: 공격측과 방어측이 번갈아가며 주사위를 굴림
 * - 주사위 굴리기: 주사위 수만큼 굴리고 합계 계산
 * - 데미지 계산: 주사위 합 + 고정피해 - 방어력
 * - 특수 주사위 면(6): 특수 행동 실행
 */

/**
 * 주사위 굴리기 (주사위 수만큼)
 * @param diceCount 굴릴 주사위 수
 * @returns 각 주사위의 결과 배열과 합계, 특수 면(6) 개수
 */
export function rollDice(diceCount: number): {
  results: number[]
  total: number
  specialCount: number // 특수 면(6)이 나온 개수
} {
  const results: number[] = []
  let total = 0
  let specialCount = 0
  
  for (let i = 0; i < diceCount; i++) {
    const roll = Math.floor(Math.random() * 6) + 1 // d6 주사위 (1-6)
    results.push(roll)
    total += roll
    if (roll === 6) {
      specialCount++ // 특수 면(6) 개수 카운트
    }
  }
  
  return { results, total, specialCount }
}

/**
 * 데미지 계산
 * 주사위 합 (특수 값 제외) + 고정피해 - 방어력
 * @param diceResults 주사위 결과 배열
 * @param fixedDamage 고정피해
 * @param defense 방어력
 * @param multiplier 주사위 합 배율 (트리플 등, 기본값 1)
 * @returns 최종 데미지 (최소 1)
 */
export function calculateDamage(diceResults: number[], fixedDamage: number, defense: number, multiplier: number = 1): number {
  // 특수 값(-1)이 아닌 주사위들의 합 (0도 포함)
  const normalDiceTotal = diceResults.filter(r => r !== -1).reduce((sum, r) => sum + r, 0)
  const totalDamage = (normalDiceTotal * multiplier) + fixedDamage
  const finalDamage = totalDamage - defense
  return Math.max(1, finalDamage) // 최소 데미지 1
}


/**
 * 캐릭터의 최대 체력 계산
 */
export function getMaxHP(character: Character): number {
  return character.stats.hp
}

/**
 * 캐릭터의 최대 마나 계산 (주사위 수로 대체)
 */
export function getMaxMana(character: Character): number {
  return character.stats.diceCount * 2 // 주사위 수 * 2를 마나로 사용
}

/**
 * 콤보 타입
 */
export type ComboType = 'triple' | 'straight' | 'allzero' | null

/**
 * 콤보 체크 결과
 */
export interface ComboCheckResult {
  comboType: ComboType
  comboName: string
  matchedValues?: number[] // 매칭된 값들 (트리플의 경우 같은 숫자, 스트레이트의 경우 연속 숫자)
}

/**
 * 콤보 체크 함수
 * @param diceResults 주사위 결과 배열
 * @returns 콤보 체크 결과
 */
export function checkCombo(diceResults: number[]): ComboCheckResult {
  // 특수 값(-1) 제외한 실제 주사위 값들
  const normalDice = diceResults.filter(r => r !== -1)
  
  if (normalDice.length < 3) {
    return { comboType: null, comboName: '' }
  }

  // 올제로 체크: 0이 3개 이상
  const zeroCount = normalDice.filter(r => r === 0).length
  if (zeroCount >= 3) {
    return {
      comboType: 'allzero',
      comboName: '올제로',
      matchedValues: [0, 0, 0],
    }
  }

  // 트리플 체크: 같은 숫자가 3개 이상
  const valueCounts = new Map<number, number>()
  normalDice.forEach(value => {
    if (value > 0) { // 0은 제외
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1)
    }
  })
  
  for (const [value, count] of valueCounts.entries()) {
    if (count >= 3) {
      return {
        comboType: 'triple',
        comboName: '트리플',
        matchedValues: [value, value, value],
      }
    }
  }

  // 스트레이트 체크: 연속된 3개 숫자 (특수 값 -1은 이미 normalDice에서 제외됨)
  // 0도 제외하고 1-6 사이의 값만 체크
  const positiveValues = normalDice.filter(v => v > 0)
  if (positiveValues.length >= 3) {
    const sortedValues = [...positiveValues].sort((a, b) => a - b)
    const uniqueValues = [...new Set(sortedValues)] // 중복 제거하여 연속성 체크
    
    // 연속된 3개 찾기 (예: [1,2,3], [2,3,4], [3,4,5], [4,5,6])
    // uniqueValues가 [2,3,4,5]인 경우 [2,3,4]와 [3,4,5] 모두 체크
    for (let i = 0; i <= uniqueValues.length - 3; i++) {
      const first = uniqueValues[i]
      const second = uniqueValues[i + 1]
      const third = uniqueValues[i + 2]
      
      // 연속된 숫자인지 확인
      if (second === first + 1 && third === second + 1) {
        return {
          comboType: 'straight',
          comboName: '스트레이트',
          matchedValues: [first, second, third],
        }
      }
    }
  }

  return { comboType: null, comboName: '' }
}

