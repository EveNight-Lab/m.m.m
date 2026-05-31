import { createInitialStats } from './statCalculator'
import { generateTraits, applyTraitsToStats } from './traitGenerator'
import { generateActiveSkill } from './skillGenerator'
import {
  generateRandomName,
  generateRandomSpecies,
  generateRandomBattleStyle,
  generateRandomAppearance,
  generateRandomWorldView,
} from './randomFieldGenerator'
import type { Character, UserInput } from '../types'

/**
 * 몬스터 캐릭터 생성
 * 
 * 입력하지 않은 항목은 자동으로 랜덤 생성됩니다.
 * 나중에 AI 생성으로 교체될 예정입니다.
 * 
 * @param userInput - 사용자 입력 데이터 (빈 값은 랜덤으로 채워짐)
 * @returns 생성된 캐릭터 객체
 */
export function generateCharacter(userInput: UserInput): Character {
  // 초기 스텟 생성 (모두 C)
  const initialStats = createInitialStats()
  
  // 특성 3개 생성
  const traits = generateTraits()
  
  // 특성을 스텟에 적용
  const finalStats = applyTraitsToStats(initialStats, traits)
  
  // 스킬 생성
  const activeSkill = generateActiveSkill()
  
  // 사용자 입력이 없으면 랜덤으로 생성
  // 나중에 AI 생성으로 교체: await generateRandomName(userInput.worldView)
  const name = userInput.name?.trim() || generateRandomName()
  const species = userInput.species?.trim() || generateRandomSpecies()
  const battleStyle = userInput.battleStyle?.trim() || generateRandomBattleStyle()
  const appearance = userInput.appearance?.trim() || generateRandomAppearance()
  const worldView = userInput.worldView?.trim() || generateRandomWorldView()
  
  // 캐릭터 객체 생성
  return {
    // 사용자 입력 정보 (빈 값은 랜덤으로 채워짐)
    name,
    species,
    battleStyle,
    appearance,
    worldView,
    
    // 게임 내부 정보
    stats: finalStats,
    traits,
    activeSkill,
    
    // 메타 정보
    createdAt: new Date().toISOString(),
    id: `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contracted: false, // 새로 생성된 몬스터는 미계약 상태
  }
}

