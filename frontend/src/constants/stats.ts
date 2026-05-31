import type { StatKey } from '../types'

/**
 * 스텟 관련 상수 정의
 */

/**
 * 스텟 이름 목록
 */
export const STAT_NAMES: readonly string[] = [
  '체력',
  '주사위 수',
  '고정데미지',
  '방어력',
] as const

/**
 * 스텟 영문 키 (API/저장용)
 */
export const STAT_KEYS: readonly StatKey[] = [
  'hp',
  'diceCount',
  'fixedDamage',
  'defense',
] as const

/**
 * 기본 스텟 값
 */
export const DEFAULT_STATS = {
  hp: 50,
  diceCount: 3,
  fixedDamage: 0,
  defense: 0,
}

