import { DEFAULT_STATS } from '../constants/stats'
import type { Stats } from '../types'

/**
 * 스텟에 값을 더하거나 빼기
 * @param currentValue - 현재 값
 * @param change - 변경값 (양수면 상승, 음수면 하락)
 * @returns 새로운 값
 */
export function adjustStat(currentValue: number, change: number): number {
  return Math.max(0, currentValue + change)
}

/**
 * 초기 스텟 생성
 */
export function createInitialStats(): Stats {
  return { ...DEFAULT_STATS }
}

