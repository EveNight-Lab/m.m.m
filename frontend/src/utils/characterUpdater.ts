import { applyTraitToStats, generateTrait } from './traitGenerator'
import { generateActiveSkill } from './skillGenerator'
import type { Character, Trait, ActiveSkill } from '../types'

/**
 * 캐릭터에 특성 추가
 * 재화로 구매한 특성을 기존 캐릭터에 추가할 때 사용
 * @param character - 기존 캐릭터 객체
 * @param trait - 추가할 특성 (없으면 새로 생성)
 * @returns 특성이 추가된 캐릭터 객체
 */
export function addTraitToCharacter(character: Character, trait: Trait | null = null): Character {
  const newTrait = trait || generateTrait()
  const updatedStats = applyTraitToStats(character.stats, newTrait)
  
  return {
    ...character,
    stats: updatedStats,
    traits: [...character.traits, newTrait],
  }
}

/**
 * 캐릭터에 액티브 스킬 추가
 * 재화로 구매한 액티브 스킬을 기존 캐릭터에 추가할 때 사용
 * @param character - 기존 캐릭터 객체
 * @param activeSkill - 추가할 액티브 스킬 (없으면 새로 생성)
 * @returns 액티브 스킬이 추가된 캐릭터 객체
 */
export function addActiveSkillToCharacter(
  character: Character,
  activeSkill: ActiveSkill | null = null
): Character {
  const newActiveSkill = activeSkill || generateActiveSkill()
  
  return {
    ...character,
    activeSkills: [...(character.activeSkills || [character.activeSkill]), newActiveSkill],
  }
}


