/**
 * 버프 생성 유틸리티
 * 전반부/후반부 시작 시 랜덤 버프 선택지 생성
 * 부상 스택 개수에 비례해 선택지 증가
 */

import type { PassiveSkill } from '../types'
import {
  BUFF_PERSISTENT_CONDITIONS,
  BUFF_PERSISTENT_EFFECTS,
  BUFF_INSTANT_CONDITIONS,
  BUFF_INSTANT_EFFECTS,
} from '../constants/buffPools'

/**
 * 랜덤 버프 생성
 * 패시브 스킬과 동일한 구조이지만 일회성으로 적용
 */
export function generateRandomBuffs(count: number): PassiveSkill[] {
  const buffs: PassiveSkill[] = []

  for (let i = 0; i < count; i++) {
    // 지속 효과 또는 단발 효과 중 랜덤 선택
    const isPersistent = Math.random() > 0.5

    let condition: string
    let effect: string

    if (isPersistent) {
      // 지속 효과: 지속 조건 + 지속 효과
      const randomCondition =
        BUFF_PERSISTENT_CONDITIONS[
          Math.floor(Math.random() * BUFF_PERSISTENT_CONDITIONS.length)
        ]
      const randomEffect =
        BUFF_PERSISTENT_EFFECTS[
          Math.floor(Math.random() * BUFF_PERSISTENT_EFFECTS.length)
        ]

      condition = randomCondition
      effect = randomEffect
    } else {
      // 단발 효과: 단발 조건 + 단발 효과
      const randomCondition =
        BUFF_INSTANT_CONDITIONS[
          Math.floor(Math.random() * BUFF_INSTANT_CONDITIONS.length)
        ]
      const randomEffect =
        BUFF_INSTANT_EFFECTS[
          Math.floor(Math.random() * BUFF_INSTANT_EFFECTS.length)
        ]

      condition = randomCondition
      effect = randomEffect
    }

    buffs.push({
      name: `전투 버프 ${i + 1}`,
      condition,
      effect,
      description: `${condition} → ${effect}`,
    })
  }

  return buffs
}

/**
 * 부상 스택 개수에 따른 버프 선택지 개수 계산
 * 기본 2개 + 부상 스택당 1개 추가
 */
export function calculateBuffChoiceCount(injuryCount: number): number {
  return 2 + injuryCount
}

