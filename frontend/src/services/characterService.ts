/**
 * 캐릭터 생성 통합 서비스 레이어
 * 모크 생성(Mock Mode)과 실시간 Gemini 생성(Live Mode) 분기를 제어합니다.
 */

import type { Character } from '../types'
import { WorldView } from '../constants/worldViews'
import { generateMockCharacterFirst, generateMockCharacterSecond } from '../utils/mockGenerator'
import { generateGeminiCharacterFirst, generateGeminiCharacterSecond, getGeminiApiKey } from '../utils/geminiService'

/**
 * 모크 모드가 활성화되어 있는지 또는 API Key가 누락되었는지 확인
 */
export function checkIsMockMode(): boolean {
  const useMock = localStorage.getItem('mmm_use_mock')
  const apiKey = getGeminiApiKey()
  
  // 1. 강제 모크 지정을 명시적으로 한 경우
  if (useMock === 'true') {
    return true
  }
  
  // 2. 실시간 모드를 원했으나 API Key가 등록되지 않은 경우 (자동 폴백)
  if (useMock === 'false' && !apiKey) {
    console.warn('Live Mode가 선택되었지만 Gemini API Key가 저장되어 있지 않아 자동으로 Mock Mode로 실행합니다.')
    return true
  }

  // 3. 환경 변수 기본값 확인
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return true
  }

  // 4. API Key가 설정되어 있지 않으면 오프라인 모드로 실행
  return !apiKey
}

/**
 * 1차 캐릭터 속성/기술 생성
 */
export async function generateCharacterFirst(
  name: string,
  worldView: WorldView,
  classification: string,
  job: string,
  templateImageUrl: string | null
): Promise<Omit<Character, 'id'>> {
  const isMock = checkIsMockMode()
  
  console.log(`[characterService] 1차 캐릭터 생성 시작 (모드: ${isMock ? 'Mock Mode' : 'Live Mode'})`)
  
  if (isMock) {
    // 0.1초의 짧은 지연시간을 두어 자연스러운 처리 연출
    await new Promise(resolve => setTimeout(resolve, 300))
    return generateMockCharacterFirst(name, worldView, classification, job, templateImageUrl)
  } else {
    return generateGeminiCharacterFirst(name, worldView, classification, job, templateImageUrl)
  }
}

/**
 * 2차 캐릭터 세부 명칭 및 스탯 최종 완성
 */
export async function generateCharacterSecond(
  existingCharacter: Character | null,
  name: string,
  species: string,
  battleStyle: string,
  appearance: string,
  worldView: WorldView
): Promise<Omit<Character, 'id'>> {
  const isMock = checkIsMockMode()
  
  console.log(`[characterService] 2차 캐릭터 생성 시작 (모드: ${isMock ? 'Mock Mode' : 'Live Mode'})`)
  
  if (isMock) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateMockCharacterSecond(existingCharacter, name, species, battleStyle, appearance, worldView)
  } else {
    return generateGeminiCharacterSecond(existingCharacter, name, species, battleStyle, appearance, worldView)
  }
}
