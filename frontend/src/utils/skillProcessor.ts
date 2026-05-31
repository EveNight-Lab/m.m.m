/**
 * 스킬 처리 유틸리티
 * 패시브/액티브 스킬 조건 체크 및 효과 적용
 */

import type { BattleCharacter, StatusEffect, BattleEvent } from '../types'
import type { StatKey } from '../types'
import { applySkillEffectParts } from './skillEffects'
import { getMaxHP, getMaxMana } from './battleEngine'

/**
 * 패시브 스킬 조건 체크
 */
export function checkPassiveCondition(
  skill: { condition: string; effect: string },
  self: BattleCharacter,
  enemy: BattleCharacter,
  battleTime: number
): boolean {
  const condition = skill.condition

  // 체력 관련 조건
  if (condition.includes('본인 체력이')) {
    const maxHP = getMaxHP(self.character)
    const percent = (self.currentHP / maxHP) * 100
    if (condition.includes('50% 이상') && percent >= 50) return true
    if (condition.includes('70% 이상') && percent >= 70) return true
    if (condition.includes('30% 이하') && percent <= 30) return true
    if (condition.includes('50% 이하') && percent <= 50) return true
  }

  if (condition.includes('상대 체력이')) {
    const maxHP = getMaxHP(enemy.character)
    const percent = (enemy.currentHP / maxHP) * 100
    if (condition.includes('50% 이상') && percent >= 50) return true
    if (condition.includes('70% 이상') && percent >= 70) return true
    if (condition.includes('30% 이하') && percent <= 30) return true
    if (condition.includes('50% 이하') && percent <= 50) return true
  }

  // 전투 시간 관련
  if (condition.includes('전투 시작후 20초 동안')) {
    if (battleTime <= 20) return true
  }
  if (condition.includes('전투 시작 20초 이후부터')) {
    if (battleTime > 20) return true
  }

  // 상태이상 관련
  if (condition.includes('본인이 상태이상일 때')) {
    if (self.statusEffects.length > 0) return true
  }
  if (condition.includes('상대가 상태이상일 때')) {
    if (enemy.statusEffects.length > 0) return true
  }

  // 광란 상태
  if (condition.includes('본인이 광란 상태일 때')) {
    if (self.isBerserk) return true
  }

  // 마나 관련
  if (condition.includes('본인 마나가 0일 때')) {
    if (self.currentMana === 0) return true
  }

  // 스텟 비교 조건
  // "본인 [스텟명]이 상대보다 높을 때" 또는 "낮을 때" 체크
  const statNames: { korean: string; key: StatKey }[] = [
    { korean: '체력', key: 'hp' },
    { korean: '주사위 수', key: 'diceCount' },
    { korean: '고정데미지', key: 'fixedDamage' },
    { korean: '방어력', key: 'defense' },
  ]

  for (const stat of statNames) {
    if (condition.includes(`본인 ${stat.korean}이 상대보다`)) {
      const selfStatValue = self.character.stats[stat.key]
      const enemyStatValue = enemy.character.stats[stat.key]

      if (condition.includes('높을 때') && selfStatValue > enemyStatValue) {
        return true
      }
      if (condition.includes('낮을 때') && selfStatValue < enemyStatValue) {
        return true
      }
    }
  }

  return false
}

/**
 * 액티브 스킬 사용 가능 여부 체크
 */
export function canUseActiveSkill(battleChar: BattleCharacter, skill: { manaCost: number }): boolean {
  return battleChar.currentMana >= skill.manaCost
}

/**
 * 스킬 효과 적용
 * 효과 문자열을 파싱하여 실제 게임 상태에 적용
 * 
 * 세부 구현은 skillEffects.ts로 분리하여 파일 크기 관리
 */
export function applySkillEffect(
  effect: string,
  self: BattleCharacter,
  enemy: BattleCharacter
): { self: BattleCharacter; enemy: BattleCharacter; events: BattleEvent[] } {
  return applySkillEffectParts(effect, self, enemy)
}

/**
 * 상태이상 효과 적용 (매 초마다)
 */
export function processStatusEffects(
  battleChar: BattleCharacter,
  isAttacker: boolean
): { battleChar: BattleCharacter; events: BattleEvent[] } {
  const newChar = { ...battleChar }
  const events: BattleEvent[] = []

  newChar.statusEffects = newChar.statusEffects
    .map((se) => {
      const elapsed = (Date.now() - se.appliedAt) / 1000 // 초 단위
      const remaining = se.duration - elapsed

      if (remaining <= 0) {
        return null // 제거
      }

      return { ...se, duration: remaining }
    })
    .filter((se): se is StatusEffect => se !== null)

  // 출혈: 초당 1의 피해
  const bleed = newChar.statusEffects.find((se) => se.type === '출혈')
  if (bleed && bleed.stacks) {
    const damage = bleed.stacks
    newChar.currentHP = Math.max(0, newChar.currentHP - damage)
    events.push({
      type: 'status',
      actor: isAttacker ? 'player' : 'enemy',
      message: `${newChar.character.name}이(가) 출혈로 ${damage}의 피해를 받았습니다!`,
      timestamp: Date.now(),
    })
  }

  // 중독: 초당 1의 피로도
  const poison = newChar.statusEffects.find((se) => se.type === '중독')
  if (poison && poison.stacks) {
    newChar.fatigue = Math.min(100, newChar.fatigue + poison.stacks)
    events.push({
      type: 'status',
      actor: isAttacker ? 'player' : 'enemy',
      message: `${newChar.character.name}이(가) 중독으로 피로도가 증가했습니다!`,
      timestamp: Date.now(),
    })
  }

  // 피로도 100 체크 (광란 상태)
  if (newChar.fatigue >= 100 && !newChar.isBerserk) {
    newChar.isBerserk = true
    events.push({
      type: 'status',
      actor: isAttacker ? 'player' : 'enemy',
      message: `${newChar.character.name}이(가) 광란 상태에 돌입했습니다!`,
      timestamp: Date.now(),
    })
  }

  return { battleChar: newChar, events }
}

