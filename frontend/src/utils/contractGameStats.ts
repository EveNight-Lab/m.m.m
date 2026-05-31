import type { Stats } from '../types'
import { DEFAULT_STATS } from '../constants/stats'

/**
 * 계약 게임 스텟 변환 유틸리티
 * 캐릭터의 스텟을 게임 변수로 변환합니다.
 */

/**
 * 스텟 값을 0-1 사이로 정규화
 * 기본값을 기준으로 정규화하며, 기본값일 때 0.5, 최대값(기본값*2)일 때 1.0
 */
function normalizeStat(value: number, baseValue: number, maxValue?: number): number {
  const max = maxValue || baseValue * 2
  if (max <= baseValue) {
    // 기본값과 최대값이 같거나 작으면 직접 비교
    return value >= baseValue ? 1 : value / baseValue
  }
  // 기본값 기준: 기본값 = 0.5, 최대값 = 1.0
  if (value <= baseValue) {
    return (value / baseValue) * 0.5
  }
  return 0.5 + ((value - baseValue) / (max - baseValue)) * 0.5
}

export interface ContractGameConfig {
  // 게이지 설정
  maxGauge: number // 최대 게이지 (체력 기반)
  initialGauge: number // 시작 게이지 (항상 50%)
  
  // 게이지 변화량
  successGain: number // 성공 시 증가량 (방어력에 비례)
  failureLoss: number // 실패 시 감소량 (고정데미지에 비례)
  
  // 타이밍 바 설정
  barSpeed: number // 바 이동 속도 (주사위 수에 반비례 - 주사위가 많을수록 빠름)
  barWidth: number // 바의 폭 (고정데미지에 비례 - 공격성이 높을수록 넓음)
  successZoneWidth: number // 성공 판정 구간 폭 (방어력에 비례 - 방어력이 높을수록 넓음)
  targetZones: number // 판정 구간 개수 (주사위 수에 비례)
}

/**
 * 스텟을 게임 설정으로 변환
 * 
 * 스텟 연결:
 * - 체력 (hp): 게이지 총량, 시작 게이지 비율
 * - 주사위 수 (diceCount): 바 속도, 판정 구간 개수
 * - 고정데미지 (fixedDamage): 실패 시 감소량, 바의 폭
 * - 방어력 (defense): 성공 시 증가량, 성공 구간 폭
 */
export function calculateGameConfig(stats: Stats): ContractGameConfig {
  const baseHP = DEFAULT_STATS.hp
  const baseDiceCount = DEFAULT_STATS.diceCount
  const baseFixedDamage = DEFAULT_STATS.fixedDamage
  const baseDefense = DEFAULT_STATS.defense

  // 스텟 정규화 (기본값 기준)
  const hpValue = normalizeStat(stats.hp, baseHP, baseHP * 2) // 50~100
  const diceCountValue = normalizeStat(stats.diceCount, baseDiceCount, baseDiceCount * 2) // 3~6
  // 고정데미지와 방어력은 0부터 시작하므로 다른 방식으로 정규화
  const fixedDamageValue = Math.min(1, stats.fixedDamage / 10) // 0~10을 0~1로
  const defenseValue = Math.min(1, stats.defense / 10) // 0~10을 0~1로

  // 1. 체력 (hp): 게이지 총량 결정
  // 기본값(50) = 100 게이지, 최대값(100) = 150 게이지
  const maxGauge = 80 + hpValue * 70 // 80~150

  // 시작 게이지는 항상 50%
  const initialGauge = maxGauge * 0.5

  // 2. 고정데미지 (fixedDamage): 실패 시 감소량, 바의 폭
  // 고정데미지가 높을수록 실패 시 더 큰 패널티, 바가 더 넓음 (공격성이 높음)
  const failureLoss = 3 + fixedDamageValue * 7 // 3~10
  const barWidth = 3 + fixedDamageValue * 7 // 3~10%

  // 3. 방어력 (defense): 성공 시 증가량, 성공 구간 폭
  // 방어력이 높을수록 성공 시 더 많은 보상, 성공 구간이 더 넓음
  const successGain = 5 + defenseValue * 5 // 5~10
  const successZoneWidth = 8 + defenseValue * 12 // 8~20%

  // 4. 주사위 수 (diceCount): 바 이동 속도, 판정 구간 개수
  // 주사위 수가 많을수록 바가 빠르게 이동, 판정 구간이 많음
  // barSpeed는 밀리초 단위이므로 작을수록 빠름
  const barSpeed = Math.max(500, Math.min(5000, 3000 - diceCountValue * 2000)) // 500~3000ms
  const targetZones = Math.max(1, Math.round(1 + diceCountValue * 3)) // 1~4개

  return {
    maxGauge,
    initialGauge,
    successGain,
    failureLoss,
    barSpeed,
    barWidth,
    successZoneWidth,
    targetZones,
  }
}

