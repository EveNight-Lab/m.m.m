import type { ActiveSkill } from '../types'

/**
 * 스킬 관련 유틸리티
 * 재화로 구매하거나 요청 시 생성할 때 사용
 * 현재는 테스트용 랜덤 생성 (나중에 AI 생성으로 변경 예정)
 */

/**
 * 액티브 스킬 이름 목록 (임시)
 */
const ACTIVE_SKILL_NAMES: readonly string[] = [
  '파이어볼',
  '아이스 스피어',
  '번개 강타',
  '암흑의 화살',
  '치유의 빛',
  '방어막 생성',
  '속도 증가',
  '강력한 일격',
] as const

/**
 * 패시브 스킬 조건 목록 (임시)
 */
const PASSIVE_CONDITIONS: readonly string[] = [
  '체력이 50% 이하일 때',
  '마나가 30% 이하일 때',
  '공격을 받을 때',
  '공격할 때',
  '턴 시작 시',
  '턴 종료 시',
] as const

/**
 * 패시브 스킬 효과 목록 (임시)
 */
const PASSIVE_EFFECTS: readonly string[] = [
  '공격력 20% 증가',
  '방어력 30% 증가',
  '체력 10% 회복',
  '마나 15% 회복',
  '속도 25% 증가',
  '치명타 확률 15% 증가',
] as const

/**
 * 액티브 스킬 생성
 * 재화로 구매하거나 요청 시 생성할 때 사용
 * 마나 소모량과 효과를 가짐
 * @returns 생성된 액티브 스킬 객체
 */
export function generateActiveSkill(): ActiveSkill {
  const name = ACTIVE_SKILL_NAMES[Math.floor(Math.random() * ACTIVE_SKILL_NAMES.length)]
  const manaCost = Math.floor(Math.random() * 30) + 10 // 10~40
  const effect = PASSIVE_EFFECTS[Math.floor(Math.random() * PASSIVE_EFFECTS.length)]
  
  return {
    name,
    manaCost,
    effect,
    description: `마나 ${manaCost} 소모: ${effect}`,
  }
}


