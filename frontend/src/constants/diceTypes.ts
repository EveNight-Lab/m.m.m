/**
 * 주사위 타입 정의
 * 모든 주사위는 6면체이지만, 각 면에 적힌 숫자 구성과 색상이 다릅니다.
 */

import type { WorldView } from './worldViews'

/**
 * 주사위 종류 (모두 6면체)
 */
export type DiceType = 'steam' | 'arcane' | 'neon' | 'cosmos' | 'martial' | 'death'

/**
 * 주사위 설정
 */
export interface DiceConfig {
  type: DiceType
  name: string // 주사위 이름
  description: string // 설명
  values: number[] // 각 면에 적힌 숫자 (6개, 순서는 중요하지 않음)
  theme: {
    baseColor: string // 기본 색상
    dotColor: string // 점 색상
    edgeColor: string // 가장자리 색상
    glowColor: string // 발광 색상
  }
}

/**
 * 주사위 타입별 설정
 */
export const DICE_CONFIGS: Record<DiceType, DiceConfig> = {
  steam: {
    type: 'steam',
    name: '스팀 주사위',
    description: '기계와 증기의 힘. 0, 3, 3, 3, 6, 특수의 값을 가집니다.',
    values: [0, 3, 3, 3, 6, -1], // 스팀하이븐: -1은 특수 값
    theme: {
      baseColor: '#d97706', // amber-600 (구리색)
      dotColor: '#fbbf24', // amber-400 (밝은 금색)
      edgeColor: '#f59e0b', // amber-500 (금색)
      glowColor: '#fcd34d', // amber-300 (발광)
    },
  },
  arcane: {
    type: 'arcane',
    name: '마법 주사위',
    description: '마법의 힘. 1, 2, 3, 4, 5, 특수의 값을 가집니다.',
    values: [1, 2, 3, 4, 5, -1], // 아르칸드리아: -1은 특수 값
    theme: {
      baseColor: '#10b981', // emerald-500 (마법적 초록)
      dotColor: '#6ee7b7', // emerald-300 (밝은 초록)
      edgeColor: '#34d399', // emerald-400
      glowColor: '#a7f3d0', // emerald-200 (발광)
    },
  },
  neon: {
    type: 'neon',
    name: '네온 주사위',
    description: '미래의 힘. 0, 1, 4, 4, 6, 특수의 값을 가집니다.',
    values: [0, 1, 4, 4, 6, -1], // 네온 시티: -1은 특수 값
    theme: {
      baseColor: '#06b6d4', // cyan-500 (형광 하늘색)
      dotColor: '#67e8f9', // cyan-300 (형광 느낌)
      edgeColor: '#22d3ee', // cyan-400
      glowColor: '#a5f3fc', // cyan-200 (발광)
    },
  },
  cosmos: {
    type: 'cosmos',
    name: '우주 주사위',
    description: '우주의 힘. 0, 0, 4, 5, 6, 특수의 값을 가집니다.',
    values: [0, 0, 4, 5, 6, -1], // 코스모스: -1은 특수 값
    theme: {
      baseColor: '#6366f1', // indigo-500 (우주 느낌의 보라 파랑)
      dotColor: '#a5b4fc', // indigo-300 (별빛 느낌)
      edgeColor: '#818cf8', // indigo-400
      glowColor: '#c7d2fe', // indigo-200 (발광)
    },
  },
  martial: {
    type: 'martial',
    name: '무술 주사위',
    description: '무술의 힘. 2, 2, 3, 4, 4, 특수의 값을 가집니다.',
    values: [2, 2, 3, 4, 4, -1], // 천무계: -1은 특수 값
    theme: {
      baseColor: '#ec4899', // pink-500
      dotColor: '#f9a8d4', // pink-300 (밝은 핑크)
      edgeColor: '#f472b6', // pink-400
      glowColor: '#fbcfe8', // pink-200 (발광)
    },
  },
  death: {
    type: 'death',
    name: '죽음 주사위',
    description: '죽음의 힘. 0, 0, 3, 6, 6, 특수의 값을 가집니다.',
    values: [0, 0, 3, 6, 6, -1], // 데스랜드: -1은 특수 값
    theme: {
      baseColor: '#78716c', // stone-600 (갈색 회색)
      dotColor: '#d6d3d1', // stone-300 (밝은 회색)
      edgeColor: '#a8a29e', // stone-400
      glowColor: '#e7e5e4', // stone-200 (발광)
    },
  },
}

/**
 * 세계관별 주사위 매핑
 */
export const WORLD_VIEW_DICE_MAP: Record<WorldView, DiceType> = {
  '스팀하이븐 (스팀펑크, 기계, 증기)': 'steam',
  '아르칸드리아 (마법, 중세, 판타지)': 'arcane',
  '네온 시티 (SF, 미래, 사이버펑크)': 'neon',
  '코스모스 (우주, 별, 신비)': 'cosmos',
  '천무계 (동양 판타지, 무술, 정령)': 'martial',
  '데스랜드 (암흑, 언데드, 고딕)': 'death',
}

/**
 * 세계관에 따른 주사위 타입 가져오기
 */
export function getDiceTypeForWorldView(worldView: WorldView): DiceType {
  return WORLD_VIEW_DICE_MAP[worldView] || 'arcane' // 기본값은 arcane
}

/**
 * 주사위 타입에 따른 설정 가져오기
 */
export function getDiceConfig(diceType: DiceType): DiceConfig {
  return DICE_CONFIGS[diceType]
}

/**
 * 주사위 타입 목록
 */
export const DICE_TYPES: DiceType[] = ['steam', 'arcane', 'neon', 'cosmos', 'martial', 'death']

