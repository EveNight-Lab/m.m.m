/**
 * 랜덤 필드 생성 유틸리티
 * 
 * 현재는 랜덤 풀에서 선택하는 방식이지만,
 * 나중에 AI 생성으로 교체될 예정입니다.
 * 
 * AI 교체 시: 이 파일의 함수들을 AI API 호출로 교체하면 됩니다.
 */

import {
  RANDOM_NAMES,
  RANDOM_SPECIES,
  RANDOM_BATTLE_STYLES,
  RANDOM_APPEARANCES,
} from '../constants/randomPools'
import { getRandomWorldView } from '../constants/worldViews'

/**
 * 배열에서 랜덤 요소 선택
 */
function getRandomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * 랜덤 이름 생성
 * 나중에 AI로 교체: async function generateRandomName(context?: string): Promise<string>
 */
export function generateRandomName(): string {
  return getRandomItem(RANDOM_NAMES)
}

/**
 * 랜덤 종족 생성
 * 나중에 AI로 교체: async function generateRandomSpecies(worldView?: string): Promise<string>
 */
export function generateRandomSpecies(): string {
  return getRandomItem(RANDOM_SPECIES)
}

/**
 * 랜덤 전투 방식 생성
 * 나중에 AI로 교체: async function generateRandomBattleStyle(species?: string): Promise<string>
 */
export function generateRandomBattleStyle(): string {
  return getRandomItem(RANDOM_BATTLE_STYLES)
}

/**
 * 랜덤 외형 생성
 * 나중에 AI로 교체: async function generateRandomAppearance(species?: string, battleStyle?: string): Promise<string>
 */
export function generateRandomAppearance(): string {
  return getRandomItem(RANDOM_APPEARANCES)
}

/**
 * 랜덤 세계관 생성 (이미 worldViews.ts에 있음)
 * 나중에 AI로 교체: async function generateRandomWorldView(): Promise<string>
 */
export function generateRandomWorldView(): string {
  return getRandomWorldView()
}

