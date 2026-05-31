/**
 * 전투 관련 상수
 */

// 등급 시스템 제거됨 - 이제 숫자 기반

// 전투 결과
export type BattleResult = 'win' | 'lose' | 'draw'

// 전투 액션 타입
export type BattleAction = 'attack' | 'defend' | 'skill' | 'wait'


// 전투 이벤트 타입은 types/index.ts에 정의되어 있음
// 중복 방지를 위해 여기서는 제거

