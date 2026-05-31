/**
 * 몬스터 분류 및 직업 선택지
 */

export const MONSTER_CLASSIFICATIONS = [
  '인간',
  '인간형(비인간)',
  '수인',
  '악마',
  '야수',
  '정령',
  '기계(인공체)',
  '괴수',
] as const

export const MONSTER_JOBS = [
  '탱커',
  '근접 딜러',
  '원거리 딜러',
  '서포터',
  '힐러',
  '만능형',
] as const

export type MonsterClassification = typeof MONSTER_CLASSIFICATIONS[number]
export type MonsterJob = typeof MONSTER_JOBS[number]

