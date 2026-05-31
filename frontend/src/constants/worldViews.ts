/**
 * 세계관 목록
 * 롤(리그 오브 레전드) 스타일의 세계관: "세계관 이름 (키워드, 키워드, 키워드)"
 * 
 * 각 세계관은 고유한 테마와 키워드를 가진 특색 있는 세계입니다.
 */
export const WORLD_VIEWS = [
  '스팀하이븐 (스팀펑크, 기계, 증기)',
  '아르칸드리아 (마법, 중세, 판타지)',
  '네온 시티 (SF, 미래, 사이버펑크)',
  '코스모스 (우주, 별, 신비)',
  '천무계 (동양 판타지, 무술, 정령)',
  '데스랜드 (암흑, 언데드, 고딕)',
] as const

export type WorldView = typeof WORLD_VIEWS[number]

/**
 * 세계관 이름만 추출 (키워드 제외)
 * 예: "기계 도시 (스팀펑크, 기계, 마법)" → "기계 도시"
 */
export function getWorldViewName(worldView: WorldView): string {
  return worldView.split(' (')[0]
}

/**
 * 세계관 키워드만 추출
 * 예: "기계 도시 (스팀펑크, 기계, 마법)" → ["스팀펑크", "기계", "마법"]
 */
export function getWorldViewKeywords(worldView: WorldView): string[] {
  const match = worldView.match(/\(([^)]+)\)/)
  if (!match) return []
  return match[1].split(',').map((kw) => kw.trim())
}

/**
 * 랜덤 세계관 선택
 * 사용자가 선택하지 않았을 때 사용
 */
export function getRandomWorldView(): WorldView {
  return WORLD_VIEWS[Math.floor(Math.random() * WORLD_VIEWS.length)]
}

/**
 * 세계관별 색상 팔레트
 */
export interface WorldViewColors {
  name: string // 세계관 이름
  primary: string // 메인 색상
  secondary: string // 보조 색상
  text: string // 텍스트 색상
  border: string // 테두리 색상
  bgFrom: string // 배경 그라데이션 시작
  bgTo: string // 배경 그라데이션 끝
  shadow: string // 그림자 색상
  indicator: string // 선택 인디케이터 색상
}

/**
 * 세계관별 색상 팔레트 매핑
 */
export const WORLD_VIEW_COLORS: Record<string, WorldViewColors> = {
  '스팀하이븐 (스팀펑크, 기계, 증기)': {
    name: '스팀하이븐',
    primary: '#d97706', // amber-600 (구리색)
    secondary: '#f59e0b', // amber-500 (금색)
    text: '#fbbf24', // amber-400 (밝은 금색)
    border: '#f59e0b', // amber-500
    bgFrom: 'rgba(120, 53, 15, 0.5)', // amber-900 with opacity
    bgTo: 'rgba(146, 64, 14, 0.5)', // amber-800 with opacity
    shadow: 'rgba(217, 119, 6, 0.4)', // amber-600
    indicator: '#fbbf24', // amber-400
  },
  '아르칸드리아 (마법, 중세, 판타지)': {
    name: '아르칸드리아',
    primary: '#10b981', // emerald-500 (기존 천무계 색상)
    secondary: '#34d399', // emerald-400
    text: '#6ee7b7', // emerald-300 (밝은 초록)
    border: '#10b981', // emerald-500
    bgFrom: 'rgba(6, 78, 59, 0.5)', // emerald-900 with opacity
    bgTo: 'rgba(6, 95, 70, 0.5)', // emerald-800 with opacity
    shadow: 'rgba(16, 185, 129, 0.4)', // emerald-500
    indicator: '#6ee7b7', // emerald-300
  },
  '네온 시티 (SF, 미래, 사이버펑크)': {
    name: '네온 시티',
    primary: '#06b6d4', // cyan-500 (형광 하늘색)
    secondary: '#22d3ee', // cyan-400 (밝은 형광 하늘색)
    text: '#67e8f9', // cyan-300 (형광 느낌 강한 하늘색)
    border: '#22d3ee', // cyan-400
    bgFrom: 'rgba(8, 51, 68, 0.5)', // cyan-900 with opacity
    bgTo: 'rgba(14, 116, 144, 0.5)', // cyan-700 with opacity
    shadow: 'rgba(6, 182, 212, 0.6)', // cyan-500 (더 밝은 그림자)
    indicator: '#67e8f9', // cyan-300 (형광 느낌)
  },
  '코스모스 (우주, 별, 신비)': {
    name: '코스모스',
    primary: '#6366f1', // indigo-500 (우주 느낌의 보라 파랑)
    secondary: '#818cf8', // indigo-400
    text: '#a5b4fc', // indigo-300 (밝은 보라 파랑, 별빛 느낌)
    border: '#818cf8', // indigo-400
    bgFrom: 'rgba(30, 27, 75, 0.5)', // indigo-900 with opacity
    bgTo: 'rgba(55, 48, 163, 0.5)', // indigo-700 with opacity
    shadow: 'rgba(99, 102, 241, 0.5)', // indigo-500
    indicator: '#a5b4fc', // indigo-300
  },
  '천무계 (동양 판타지, 무술, 정령)': {
    name: '천무계',
    primary: '#ec4899', // pink-500 (기존 네온 시티 색상)
    secondary: '#f472b6', // pink-400
    text: '#f9a8d4', // pink-300 (밝은 핑크)
    border: '#ec4899', // pink-500
    bgFrom: 'rgba(131, 24, 67, 0.5)', // pink-900 with opacity
    bgTo: 'rgba(159, 18, 57, 0.5)', // pink-800 with opacity
    shadow: 'rgba(236, 72, 153, 0.5)', // pink-500
    indicator: '#f9a8d4', // pink-300
  },
  '데스랜드 (암흑, 언데드, 고딕)': {
    name: '데스랜드',
    primary: '#78716c', // stone-600 (갈색 회색)
    secondary: '#a8a29e', // stone-400
    text: '#d6d3d1', // stone-300 (밝은 회색)
    border: '#78716c', // stone-600
    bgFrom: 'rgba(41, 37, 36, 0.5)', // stone-800 with opacity
    bgTo: 'rgba(68, 64, 60, 0.5)', // stone-700 with opacity
    shadow: 'rgba(120, 113, 108, 0.4)', // stone-600
    indicator: '#d6d3d1', // stone-300
  },
  // 구 형식 호환성 (이전에 저장된 데이터)
  '스팀하이븐 (스팀펑크, 기계, 마법)': {
    name: '스팀하이븐',
    primary: '#d97706', // amber-600 (구리색)
    secondary: '#f59e0b', // amber-500 (금색)
    text: '#fbbf24', // amber-400 (밝은 금색)
    border: '#f59e0b', // amber-500
    bgFrom: 'rgba(120, 53, 15, 0.5)', // amber-900 with opacity
    bgTo: 'rgba(146, 64, 14, 0.5)', // amber-800 with opacity
    shadow: 'rgba(217, 119, 6, 0.4)', // amber-600
    indicator: '#fbbf24', // amber-400
  },
  '그림자 왕국 (암흑, 언데드, 고딕)': {
    name: '데스랜드',
    primary: '#78716c', // stone-600 (갈색 회색) - 데스랜드 색상
    secondary: '#a8a29e', // stone-400
    text: '#d6d3d1', // stone-300 (밝은 회색)
    border: '#78716c', // stone-600
    bgFrom: 'rgba(41, 37, 36, 0.5)', // stone-800 with opacity
    bgTo: 'rgba(68, 64, 60, 0.5)', // stone-700 with opacity
    shadow: 'rgba(120, 113, 108, 0.4)', // stone-600
    indicator: '#d6d3d1', // stone-300
  },
}

/**
 * 세계관별 색상 팔레트 가져오기
 */
export function getWorldViewColors(worldView: WorldView): WorldViewColors | undefined {
  return WORLD_VIEW_COLORS[worldView]
}

