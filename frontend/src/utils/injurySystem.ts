/**
 * 부상 시스템 유틸리티
 * 전투 패배 시 부상 스택 추가, 6시간 후 자동 제거
 */

const INJURY_STORAGE_KEY = 'battle-injuries'
const INJURY_DURATION_MS = 6 * 60 * 60 * 1000 // 6시간 (밀리초)

export interface Injury {
  id: string
  timestamp: number // 부상 발생 시간
  expiresAt: number // 만료 시간 (timestamp + 6시간)
}

/**
 * 부상 목록 불러오기
 */
export function getInjuries(): Injury[] {
  try {
    const stored = localStorage.getItem(INJURY_STORAGE_KEY)
    if (!stored) return []

    const injuries: Injury[] = JSON.parse(stored)
    const now = Date.now()

    // 만료된 부상 제거
    const activeInjuries = injuries.filter((injury) => injury.expiresAt > now)

    // 만료된 것이 있으면 저장
    if (activeInjuries.length !== injuries.length) {
      saveInjuries(activeInjuries)
    }

    return activeInjuries
  } catch {
    return []
  }
}

/**
 * 부상 목록 저장
 */
function saveInjuries(injuries: Injury[]): void {
  try {
    localStorage.setItem(INJURY_STORAGE_KEY, JSON.stringify(injuries))
  } catch (error) {
    console.error('부상 저장 실패:', error)
  }
}

/**
 * 부상 추가 (전투 패배 시)
 */
export function addInjury(): void {
  const injuries = getInjuries()
  const now = Date.now()

  const newInjury: Injury = {
    id: `injury-${now}-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: now,
    expiresAt: now + INJURY_DURATION_MS,
  }

  injuries.push(newInjury)
  saveInjuries(injuries)
}

/**
 * 현재 부상 스택 개수
 */
export function getInjuryCount(): number {
  return getInjuries().length
}

/**
 * 부상 만료까지 남은 시간 (초)
 */
export function getInjuryTimeRemaining(injury: Injury): number {
  const remaining = injury.expiresAt - Date.now()
  return Math.max(0, Math.floor(remaining / 1000))
}

/**
 * 모든 부상 제거 (테스트/디버그용)
 */
export function clearAllInjuries(): void {
  localStorage.removeItem(INJURY_STORAGE_KEY)
}

