/**
 * 스킬 효과 적용 유틸리티
 * 스킬 효과 문자열을 파싱하여 실제 게임 상태에 적용
 * 
 * skillProcessor.ts에서 분리하여 파일 크기 관리 및 책임 분리
 */

import type { BattleCharacter, BattleEvent } from '../types'
import { getMaxHP, getMaxMana } from './battleEngine'

/**
 * 체력 회복 효과 적용
 */
function applyHPRecovery(
  effect: string,
  battleChar: BattleCharacter,
  events: BattleEvent[]
): BattleCharacter {
  const newChar = { ...battleChar }
  const maxHP = getMaxHP(battleChar.character)

  if (effect.includes('완전 회복')) {
    newChar.currentHP = maxHP
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${battleChar.character.name}의 체력이 완전히 회복되었습니다!`,
      timestamp: Date.now(),
    })
  } else if (effect.includes('대량 회복')) {
    newChar.currentHP = Math.min(maxHP, newChar.currentHP + Math.floor(maxHP * 0.5))
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${battleChar.character.name}의 체력이 대량 회복되었습니다!`,
      timestamp: Date.now(),
    })
  } else if (effect.includes('회복')) {
    newChar.currentHP = Math.min(maxHP, newChar.currentHP + Math.floor(maxHP * 0.2))
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${battleChar.character.name}의 체력이 회복되었습니다!`,
      timestamp: Date.now(),
    })
  }

  return newChar
}

/**
 * 피로도 효과 적용
 */
function applyFatigueEffect(
  effect: string,
  self: BattleCharacter,
  enemy: BattleCharacter,
  events: BattleEvent[]
): { self: BattleCharacter; enemy: BattleCharacter } {
  const newSelf = { ...self }
  const newEnemy = { ...enemy }

  if (effect.includes('본인 피로도')) {
    if (effect.includes('완전 감소')) {
      newSelf.fatigue = 0
    } else if (effect.includes('대량 감소')) {
      newSelf.fatigue = Math.max(0, newSelf.fatigue - 30)
    } else if (effect.includes('감소')) {
      newSelf.fatigue = Math.max(0, newSelf.fatigue - 10)
    }
  }

  if (effect.includes('적 피로도')) {
    if (effect.includes('최대 증가')) {
      newEnemy.fatigue = 100
    } else if (effect.includes('대량 증가')) {
      newEnemy.fatigue = Math.min(100, newEnemy.fatigue + 30)
    } else if (effect.includes('증가')) {
      newEnemy.fatigue = Math.min(100, newEnemy.fatigue + 10)
    }
  }

  return { self: newSelf, enemy: newEnemy }
}

/**
 * 상태이상 부여 효과 적용
 */
function applyStatusEffect(
  effect: string,
  enemy: BattleCharacter,
  events: BattleEvent[]
): BattleCharacter {
  const newEnemy = { ...enemy }

  if (effect.includes('적에게 출혈 부여')) {
    const existingBleed = newEnemy.statusEffects.find((se) => se.type === '출혈')
    if (existingBleed) {
      existingBleed.stacks = (existingBleed.stacks || 1) + 1
      existingBleed.duration = 10 // 쿨타임 초기화
    } else {
      newEnemy.statusEffects.push({
        type: '출혈',
        duration: 10,
        stacks: 1,
        appliedAt: Date.now(),
      })
    }
    events.push({
      type: 'status',
      actor: 'player',
      message: `${enemy.character.name}에게 출혈이 부여되었습니다!`,
      timestamp: Date.now(),
    })
  }

  if (effect.includes('적에게 중독 부여')) {
    const existingPoison = newEnemy.statusEffects.find((se) => se.type === '중독')
    if (existingPoison) {
      existingPoison.stacks = (existingPoison.stacks || 1) + 1
      existingPoison.duration = 10
    } else {
      newEnemy.statusEffects.push({
        type: '중독',
        duration: 10,
        stacks: 1,
        appliedAt: Date.now(),
      })
    }
    events.push({
      type: 'status',
      actor: 'player',
      message: `${enemy.character.name}에게 중독이 부여되었습니다!`,
      timestamp: Date.now(),
    })
  }

  if (effect.includes('적에게 둔화 부여')) {
    const hasSlow = newEnemy.statusEffects.some((se) => se.type === '둔화')
    if (!hasSlow) {
      newEnemy.statusEffects.push({
        type: '둔화',
        duration: 5,
        appliedAt: Date.now(),
      })
      events.push({
        type: 'status',
        actor: 'player',
        message: `${enemy.character.name}에게 둔화가 부여되었습니다!`,
        timestamp: Date.now(),
      })
    }
  }

  if (effect.includes('적에게 실명 부여')) {
    const hasBlind = newEnemy.statusEffects.some((se) => se.type === '실명')
    if (!hasBlind) {
      newEnemy.statusEffects.push({
        type: '실명',
        duration: 1, // 다음 공격까지
        appliedAt: Date.now(),
      })
      events.push({
        type: 'status',
        actor: 'player',
        message: `${enemy.character.name}에게 실명이 부여되었습니다!`,
        timestamp: Date.now(),
      })
    }
  }

  if (effect.includes('적에게 취약 부여')) {
    const hasVulnerable = newEnemy.statusEffects.some((se) => se.type === '취약')
    if (!hasVulnerable) {
      newEnemy.statusEffects.push({
        type: '취약',
        duration: 1, // 다음 피격까지
        appliedAt: Date.now(),
      })
      events.push({
        type: 'status',
        actor: 'player',
        message: `${enemy.character.name}에게 취약이 부여되었습니다!`,
        timestamp: Date.now(),
      })
    }
  }

  return newEnemy
}

/**
 * 데미지 효과 적용
 */
function applyDamageEffect(
  effect: string,
  enemy: BattleCharacter,
  events: BattleEvent[]
): BattleCharacter {
  const newEnemy = { ...enemy }

  if (effect.includes('적에게 즉시')) {
    const maxHP = getMaxHP(enemy.character)
    let damage = 0
    if (effect.includes('치명적 피해')) {
      damage = Math.floor(maxHP * 0.3)
    } else if (effect.includes('대량 피해')) {
      damage = Math.floor(maxHP * 0.15)
    } else if (effect.includes('피해')) {
      damage = Math.floor(maxHP * 0.1)
    }
    newEnemy.currentHP = Math.max(0, newEnemy.currentHP - damage)
    events.push({
      type: 'damage',
      actor: 'player',
      message: `${enemy.character.name}에게 ${damage}의 피해를 입혔습니다!`,
      timestamp: Date.now(),
    })
  }

  return newEnemy
}

/**
 * 마나 회복 효과 적용
 */
function applyManaRecovery(
  effect: string,
  battleChar: BattleCharacter
): BattleCharacter {
  const newChar = { ...battleChar }

  if (effect.includes('본인 마나')) {
    const maxMana = getMaxMana(battleChar.character)
    if (effect.includes('완전 회복')) {
      newChar.currentMana = maxMana
    } else if (effect.includes('대량 회복')) {
      newChar.currentMana = Math.min(maxMana, newChar.currentMana + Math.floor(maxMana * 0.5))
    } else if (effect.includes('회복')) {
      newChar.currentMana = Math.min(maxMana, newChar.currentMana + Math.floor(maxMana * 0.2))
    }
  }

  return newChar
}

/**
 * 스킬 효과 적용 (통합 함수)
 * skillProcessor.ts의 applySkillEffect에서 사용
 */
export function applySkillEffectParts(
  effect: string,
  self: BattleCharacter,
  enemy: BattleCharacter
): { self: BattleCharacter; enemy: BattleCharacter; events: BattleEvent[] } {
  const events: BattleEvent[] = []
  let newSelf = { ...self }
  let newEnemy = { ...enemy }

  // 체력 회복 (기존)
  if (effect.includes('본인 체력') && !effect.includes('체력+')) {
    newSelf = applyHPRecovery(effect, newSelf, events)
  }

  // 체력+5
  if (effect === '체력+5') {
    const maxHP = getMaxHP(newSelf.character)
    newSelf.currentHP = Math.min(maxHP, newSelf.currentHP + 5)
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${newSelf.character.name}의 체력이 5 회복되었습니다!`,
      timestamp: Date.now(),
    })
  }

  // 고정 피해+1
  if (effect === '고정 피해+1') {
    newSelf.character.stats.fixedDamage += 1
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${newSelf.character.name}의 고정 피해가 1 증가했습니다!`,
      timestamp: Date.now(),
    })
  }

  // 적 최대 체력 6감소
  if (effect === '적 최대 체력 6감소') {
    newEnemy.character.stats.hp = Math.max(1, newEnemy.character.stats.hp - 6)
    const maxHP = getMaxHP(newEnemy.character)
    if (newEnemy.currentHP > maxHP) {
      newEnemy.currentHP = maxHP
    }
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${newEnemy.character.name}의 최대 체력이 6 감소했습니다!`,
      timestamp: Date.now(),
    })
  }

  // 상대 방어-1
  if (effect === '상대 방어-1') {
    newEnemy.character.stats.defense = Math.max(0, newEnemy.character.stats.defense - 1)
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${newEnemy.character.name}의 방어력이 1 감소했습니다!`,
      timestamp: Date.now(),
    })
  }

  // 상대 고정 피해-1
  if (effect === '상대 고정 피해-1') {
    newEnemy.character.stats.fixedDamage = Math.max(0, newEnemy.character.stats.fixedDamage - 1)
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${newEnemy.character.name}의 고정 피해가 1 감소했습니다!`,
      timestamp: Date.now(),
    })
  }

  // 다음턴에 특수 주사위 생성
  if (effect === '다음턴에 특수 주사위 생성') {
    // 특수 주사위 값: 공격자의 고정 피해 값 사용 (최소 1, 최대 6)
    const specialDiceValue = Math.max(1, Math.min(6, newSelf.character.stats.fixedDamage))
    
    if (!newSelf.nextTurnEffects) {
      newSelf.nextTurnEffects = {}
    }
    newSelf.nextTurnEffects.specialDice = specialDiceValue
    
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${newSelf.character.name}이(가) 다음턴에 특수 주사위(${specialDiceValue})를 생성합니다!`,
      timestamp: Date.now(),
    })
  }

  // 다음턴 상대 주사위 숫자-1
  if (effect === '다음턴 상대 주사위 숫자-1') {
    if (!newEnemy.nextTurnEffects) {
      newEnemy.nextTurnEffects = {}
    }
    newEnemy.nextTurnEffects.diceCountModifier = (newEnemy.nextTurnEffects.diceCountModifier || 0) - 1
    
    events.push({
      type: 'skill',
      actor: 'player',
      message: `${newEnemy.character.name}의 다음턴 주사위 숫자가 1 감소합니다!`,
      timestamp: Date.now(),
    })
  }

  // 피로도 효과
  if (effect.includes('피로도')) {
    const fatigueResult = applyFatigueEffect(effect, newSelf, newEnemy, events)
    newSelf = fatigueResult.self
    newEnemy = fatigueResult.enemy
  }

  // 상태이상 부여
  if (effect.includes('부여')) {
    newEnemy = applyStatusEffect(effect, newEnemy, events)
  }

  // 데미지
  if (effect.includes('적에게 즉시')) {
    newEnemy = applyDamageEffect(effect, newEnemy, events)
  }

  // 마나 회복
  if (effect.includes('본인 마나')) {
    newSelf = applyManaRecovery(effect, newSelf)
  }

  return { self: newSelf, enemy: newEnemy, events }
}

