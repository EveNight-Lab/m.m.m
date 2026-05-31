/**
 * 하단 탭 네비게이션 바의 탭 설정
 * 각 탭의 경로, 라벨, 아이콘을 정의
 */

export interface TabConfig {
  path: string
  label: string
}

export const TAB_CONFIG: TabConfig[] = [
  { path: '/create', label: '창조' },
  { path: '/manage', label: '관리' },
  { path: '/battle', label: '전투' },
  { path: '/friends', label: '친구' },
  { path: '/settings', label: '설정' },
]

/**
 * 기본 라우트 경로
 */
export const DEFAULT_ROUTE = '/battle'

