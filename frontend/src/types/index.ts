/**
 * 공통 타입 정의
 */

import type { WorldView } from '../constants/worldViews'

export type StatKey = 'hp' | 'diceCount' | 'fixedDamage' | 'defense'

export interface Stats {
  hp: number // 체력
  diceCount: number // 주사위 수
  fixedDamage: number // 고정데미지
  defense: number // 방어력
}

export interface Trait {
  name: string // 특성 이름
  stat: StatKey // 적용할 스텟
  statName: string // 스텟 이름
  value: number // 증가량
  description: string // 예: "체력+10"
}

export interface ActiveSkill {
  name: string
  manaCost: number
  effect: string
  description: string
}

export interface PassiveSkill {
  name: string
  condition: string
  effect: string
  description: string
}

export interface Character {
  id: string
  name: string // 본명
  nickname?: string // 별명 (선택 사항)
  species: string
  battleStyle: string
  appearance: string
  worldView: WorldView
  stats: Stats
  traits: Trait[]
  activeSkill: ActiveSkill
  activeSkills?: ActiveSkill[] // 재화로 추가 구매한 액티브 스킬들
  passiveSkills?: PassiveSkill[] // 버프 시스템용 (전투 중 일회성 패시브 스킬)
  createdAt: string
  contracted: boolean // 계약 상태 (false: 미계약, true: 계약)
  imageUrl?: string | null // Cloud Storage 이미지 URL (우선 사용)
  imageData?: string | null // AI 생성 이미지 데이터 (base64 등, imageUrl이 없을 때만 사용)
}

export interface UserInput {
  name: string
  species: string
  battleStyle: string
  appearance: string
  worldView?: string // 선택 사항, 없으면 시스템이 자동 지정
}

/**
 * 계약 게임 상태
 */
export type ContractGameState = 'waiting' | 'playing' | 'success' | 'failed'

/**
 * 전투 관련 타입
 */
export interface BattleCharacter {
  character: Character
  currentHP: number
  currentMana: number
  fatigue: number // 피로도 (0~100)
  isBerserk: boolean // 광란 상태
  statusEffects: StatusEffect[] // 상태이상 목록
  buffs: Buff[] // 버프 목록
  nextTurnEffects?: {
    specialDice?: number // 특수 주사위 값 (모든 면이 이 값)
    diceCountModifier?: number // 주사위 수 수정자
  }
}

export interface StatusEffect {
  type: '출혈' | '중독' | '둔화' | '실명' | '취약'
  duration: number // 남은 시간 (초)
  stacks?: number // 중첩 수 (출혈, 중독만)
  appliedAt: number // 적용된 시간 (타임스탬프)
}

export interface Buff {
  id: string
  name: string
  description: string
  statChanges?: {
    stat: StatKey
    change: number // 수치 변경
  }[]
}

export interface BattleState {
  state: 'fighting' | 'attacking' | 'finished' // 전투 상태
  player: BattleCharacter
  enemy: BattleCharacter
  turn: number // 턴 수
  battleTime: number // 전투 경과 시간 (초)
  events: BattleEvent[]
  autoMode: boolean // 자동전투 모드
}

export interface BattleEvent {
  type: 'attack' | 'skill' | 'status' | 'damage'
  actor: 'player' | 'enemy'
  message: string
  timestamp: number
  data?: any // 추가 데이터
}

