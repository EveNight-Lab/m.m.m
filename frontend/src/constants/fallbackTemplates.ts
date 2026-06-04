/**
 * 오프라인/포트폴리오 모드용 대체 이미지 템플릿
 * 외부 네트워크 호출 없이 아름다운 몬스터 그래픽을 제공하기 위해 SVG Data URL 형태로 구성합니다.
 */

export interface TemplateImage {
  id: string
  imageUrl: string
  tags: string[]
  characterName: string
  characterSpecies: string
  characterWorldView: string
}

// SVG 생성 헬퍼
function createSvgTemplate(themeColor: string, accentColor: string, bgFrom: string, bgTo: string, detailsPath: string, text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgFrom}" />
        <stop offset="100%" stop-color="${bgTo}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${bgFrom}" stop-opacity="0"/>
      </radialGradient>
      <filter id="neonGlow">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- 배경 -->
    <rect width="400" height="500" rx="16" fill="url(#bgGrad)"/>
    <rect width="380" height="480" x="10" y="10" rx="12" fill="none" stroke="${themeColor}" stroke-opacity="0.3" stroke-width="2"/>
    
    <!-- 중앙 오라 광원 -->
    <circle cx="200" cy="220" r="130" fill="url(#glow)"/>
    
    <!-- 테마별 상징물 패스 -->
    <g filter="url(#neonGlow)">
      ${detailsPath}
    </g>
    
    <!-- 장식용 코너 프레임 -->
    <path d="M 30,50 L 30,30 L 50,30" fill="none" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>
    <path d="M 370,50 L 370,30 L 350,30" fill="none" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>
    <path d="M 30,450 L 30,470 L 50,470" fill="none" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>
    <path d="M 370,450 L 370,470 L 350,470" fill="none" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>
    
    <!-- 하단 텍스트 라벨 -->
    <rect x="80" y="400" width="240" height="40" rx="20" fill="#000" fill-opacity="0.6" stroke="${themeColor}" stroke-width="1.5"/>
    <text x="200" y="426" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle" letter-spacing="1">
      ${text}
    </text>
  </svg>`
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const FALLBACK_TEMPLATES: TemplateImage[] = [
  // 1. 스팀하이븐 (스팀펑크)
  {
    id: 'tpl_steam_1',
    imageUrl: createSvgTemplate(
      '#d97706', '#fbbf24', '#2d1808', '#1c0f05',
      `<g stroke="#fbbf24" stroke-width="4" fill="none" stroke-linejoin="round">
        <!-- 메인 톱니바퀴 -->
        <circle cx="200" cy="220" r="60" stroke-dasharray="15 8"/>
        <circle cx="200" cy="220" r="45"/>
        <circle cx="200" cy="220" r="15"/>
        <!-- 보조 톱니바퀴 -->
        <circle cx="270" cy="160" r="30" stroke-dasharray="10 5"/>
        <circle cx="130" cy="280" r="40" stroke-dasharray="12 6"/>
        <!-- 피스톤 실린더 연결선 -->
        <path d="M 130,280 L 270,160 M 200,220 L 200,80" stroke-width="2" stroke-dasharray="4 4"/>
      </g>`,
      'STEAMPUNK CORE'
    ),
    tags: ['스팀펑크', '기계', '증기', '태엽', '골렘'],
    characterName: '증기동력 코어',
    characterSpecies: '기계수',
    characterWorldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
  },
  {
    id: 'tpl_steam_2',
    imageUrl: createSvgTemplate(
      '#d97706', '#fbbf24', '#2d1808', '#1c0f05',
      `<g stroke="#fbbf24" stroke-width="4" fill="none" stroke-linejoin="round">
        <!-- 골렘 투구 형상 -->
        <rect x="140" y="150" width="120" height="120" rx="10"/>
        <line x1="140" y1="210" x2="260" y2="210" stroke-width="6"/>
        <!-- 빛나는 안광 단일 슬릿 -->
        <ellipse cx="200" cy="190" rx="35" ry="8" fill="#fbbf24"/>
        <!-- 배기 파이프들 -->
        <path d="M 150,150 L 130,100 L 110,110 M 250,150 L 270,100 L 290,110"/>
      </g>`,
      'IRON GOLEM'
    ),
    tags: ['스팀펑크', '기계', '증기', '골렘', '오토마톤'],
    characterName: '강철 오토마톤',
    characterSpecies: '가디언',
    characterWorldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
  },

  // 2. 아르칸드리아 (판타지)
  {
    id: 'tpl_arc_1',
    imageUrl: createSvgTemplate(
      '#10b981', '#6ee7b7', '#022c22', '#011c15',
      `<g stroke="#6ee7b7" stroke-width="3" fill="none">
        <!-- 연성진 진형 -->
        <circle cx="200" cy="220" r="75"/>
        <circle cx="200" cy="220" r="60"/>
        <!-- 내부 오각형 별성진 -->
        <path d="M 200,145 L 255,255 L 140,190 L 260,190 L 145,255 Z"/>
        <!-- 마법 룬 기호 기하학 라인 -->
        <circle cx="200" cy="220" r="10" fill="#6ee7b7"/>
        <path d="M 200,80 L 200,360 M 60,220 L 340,220" stroke-width="1"/>
      </g>`,
      'ARCANE MATRIX'
    ),
    tags: ['마법', '중세', '판타지', '엘프', '드래곤'],
    characterName: '아르칸 마법핵',
    characterSpecies: '정령',
    characterWorldView: '아르칸드리아 (마법, 중세, 판타지)',
  },
  {
    id: 'tpl_arc_2',
    imageUrl: createSvgTemplate(
      '#10b981', '#6ee7b7', '#022c22', '#011c15',
      `<g stroke="#6ee7b7" stroke-width="4" fill="none" stroke-linejoin="round">
        <!-- 드래곤 형상의 날개선 & 뿔 실루엣 구조화 -->
        <path d="M 200,130 L 170,180 L 230,180 Z"/>
        <path d="M 120,200 C 150,220 200,180 200,280 C 200,180 250,220 280,200" stroke-width="3"/>
        <path d="M 160,280 L 200,340 L 240,280" stroke-width="3"/>
        <!-- 빛나는 포커스 서클 -->
        <circle cx="200" cy="180" r="6" fill="#6ee7b7"/>
      </g>`,
      'EMERALD WYRM'
    ),
    tags: ['마법', '중세', '판타지', '드래곤', '야수'],
    characterName: '에메랄드 와이번',
    characterSpecies: '용족',
    characterWorldView: '아르칸드리아 (마법, 중세, 판타지)',
  },

  // 3. 네온 시티 (사이버펑크)
  {
    id: 'tpl_neon_1',
    imageUrl: createSvgTemplate(
      '#06b6d4', '#67e8f9', '#022d3c', '#011822',
      `<g stroke="#67e8f9" stroke-width="3" fill="none" stroke-linejoin="round">
        <!-- 사이버 헬멧 홀로그램 바이저 -->
        <path d="M 120,240 L 150,150 L 250,150 L 280,240 L 230,270 L 170,270 Z"/>
        <!-- 바이저 가로 스캔 라인 -->
        <path d="M 130,210 L 270,210" stroke="#ff007f" stroke-width="5" opacity="0.8"/>
        <!-- 헤드폰/안테나 데이터 모듈 -->
        <rect x="100" y="170" width="20" height="50" rx="5" fill="#67e8f9"/>
        <rect x="280" y="170" width="20" height="50" rx="5" fill="#67e8f9"/>
        <!-- 회로 기하학 라인 -->
        <path d="M 170,270 L 150,330 L 110,330 M 230,270 L 250,330 L 290,330" stroke-width="1.5"/>
      </g>`,
      'NETRUNNER PROT'
    ),
    tags: ['SF', '미래', '사이버펑크', '해커', '안드로이드'],
    characterName: '넷러너 바이저',
    characterSpecies: '사이보그',
    characterWorldView: '네온 시티 (SF, 미래, 사이버펑크)',
  },
  {
    id: 'tpl_neon_2',
    imageUrl: createSvgTemplate(
      '#06b6d4', '#67e8f9', '#022d3c', '#011822',
      `<g stroke="#67e8f9" stroke-width="4" fill="none" stroke-linejoin="round">
        <!-- 사이버 카타나 칼날 교차 실루엣 -->
        <path d="M 110,310 L 290,130" stroke="#67e8f9" stroke-width="6"/>
        <path d="M 100,140 L 280,320 M 90,130 L 130,170" stroke="#ff007f" stroke-width="3" opacity="0.9"/>
        <circle cx="200" cy="220" r="30" stroke="#67e8f9" stroke-width="2" stroke-dasharray="8 4"/>
      </g>`,
      'NEON BLADE'
    ),
    tags: ['SF', '미래', '사이버펑크', '닌자', '로봇'],
    characterName: '사이버 사이카타나',
    characterSpecies: '기계수',
    characterWorldView: '네온 시티 (SF, 미래, 사이버펑크)',
  },

  // 4. 코스모스 (우주)
  {
    id: 'tpl_cos_1',
    imageUrl: createSvgTemplate(
      '#6366f1', '#a5b4fc', '#0f0f35', '#080820',
      `<g stroke="#a5b4fc" stroke-width="2.5" fill="none">
        <!-- 성운/은하 은색 링 궤도 -->
        <ellipse cx="200" cy="220" rx="110" ry="30" transform="rotate(-25 200 220)"/>
        <ellipse cx="200" cy="220" rx="90" ry="15" transform="rotate(35 200 220)"/>
        <!-- 중심 은하 핵 크리스탈 성좌 -->
        <circle cx="200" cy="220" r="28" fill="#a5b4fc"/>
        <polygon points="200,160 215,205 260,220 215,235 200,280 185,235 140,220 185,205" fill="none" stroke="#a5b4fc" stroke-width="3"/>
        <!-- 주변 별빛 무늬들 -->
        <circle cx="120" cy="140" r="3" fill="#fff"/>
        <circle cx="280" cy="300" r="4" fill="#fff"/>
        <circle cx="310" cy="130" r="2" fill="#fff"/>
      </g>`,
      'GALACTIC CORE'
    ),
    tags: ['우주', '별', '신비', '천사', '외계'],
    characterName: '은하 중심핵',
    characterSpecies: '아스트랄',
    characterWorldView: '코스모스 (우주, 별, 신비)',
  },

  // 5. 천무계 (동양 판타지)
  {
    id: 'tpl_cheon_1',
    imageUrl: createSvgTemplate(
      '#ec4899', '#f9a8d4', '#3d0a21', '#260413',
      `<g stroke="#f9a8d4" stroke-width="3.5" fill="none" stroke-linejoin="round">
        <!-- 신화 신수 구미호 붉은 부적/정령 링 태극형태 조합 -->
        <circle cx="200" cy="220" r="60"/>
        <path d="M 200,160 C 240,160 240,280 200,280 C 160,280 160,160 200,160 Z" stroke-width="2"/>
        <circle cx="200" cy="190" r="8" fill="#f9a8d4"/>
        <circle cx="200" cy="250" r="8" stroke-width="2"/>
        <!-- 수호 불꽃 패스 -->
        <path d="M 140,170 C 120,200 130,250 200,280 C 270,250 280,200 260,170" stroke-width="2"/>
      </g>`,
      'SACRED YIN-YANG'
    ),
    tags: ['동양 판타지', '무술', '정령', '신수', '도사'],
    characterName: '수호 음양령',
    characterSpecies: '정령수',
    characterWorldView: '천무계 (동양 판타지, 무술, 정령)',
  },

  // 6. 데스랜드 (암흑)
  {
    id: 'tpl_death_1',
    imageUrl: createSvgTemplate(
      '#78716c', '#d6d3d1', '#1f1e1d', '#141312',
      `<g stroke="#d6d3d1" stroke-width="3" fill="none" stroke-linejoin="round">
        <!-- 다크 크리스탈 / 데스 해골 기하학적 형태화 -->
        <polygon points="200,120 260,200 200,320 140,200"/>
        <polygon points="200,150 240,200 200,290 160,200" stroke-dasharray="6 3"/>
        <path d="M 140,200 L 260,200" stroke-width="1.5"/>
        <!-- 영혼의 파편 -->
        <circle cx="200" cy="200" r="10" fill="#d6d3d1"/>
      </g>`,
      'SOUL SHARD'
    ),
    tags: ['암흑', '언데드', '고딕', '해골', '사신'],
    characterName: '검은 영혼석',
    characterSpecies: '망령',
    characterWorldView: '데스랜드 (암흑, 언데드, 고딕)',
  },
]

/**
 * 특정 세계관에 매칭되는 대체 템플릿 목록 가져오기
 */
export function getFallbackTemplatesByWorldView(worldView: string): TemplateImage[] {
  // 정확한 일치 또는 세계관 이름을 포함하는 템플릿 필터링
  const worldviewName = worldView.split(' (')[0].trim()
  
  const filtered = FALLBACK_TEMPLATES.filter(tpl => {
    const tplWorldviewName = tpl.characterWorldView.split(' (')[0].trim()
    return tplWorldviewName === worldviewName
  })

  // 만약 필터링된 결과가 없으면 전체 템플릿 반환
  return filtered.length > 0 ? filtered : FALLBACK_TEMPLATES
}
