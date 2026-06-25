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

export const FALLBACK_TEMPLATES: TemplateImage[] = [
  // 1. 스팀하이븐 (스팀펑크)
  {
    id: 'tpl_steam_1',
    imageUrl: '/templates/template-1766687630980-스팀하이븐-인간-탱커-dhzhc.png',
    tags: ['스팀펑크', '인간', '탱커'],
    characterName: '스팀가드 대원',
    characterSpecies: '인간',
    characterWorldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
  },
  {
    id: 'tpl_steam_2',
    imageUrl: '/templates/template-1766687653094-스팀하이븐-인간-원거리 딜러-p8ky.png',
    tags: ['스팀펑크', '인간', '원거리 딜러'],
    characterName: '스팀 레인저',
    characterSpecies: '인간',
    characterWorldView: '스팀하이븐 (스팀펑크, 기계, 증기)',
  },

  // 2. 아르칸드리아 (판타지)
  {
    id: 'tpl_arc_1',
    imageUrl: '/templates/template-1766689374749-아르칸드리아-인간-원거리 딜러-a72ivc.png',
    tags: ['마법', '인간', '원거리 딜러'],
    characterName: '아르카디아 궁수',
    characterSpecies: '인간',
    characterWorldView: '아르칸드리아 (마법, 중세, 판타지)',
  },
  {
    id: 'tpl_arc_2',
    imageUrl: '/templates/template-1766689424728-아르칸드리아-수인-근접 딜러-em6i6l.png',
    tags: ['마법', '수인', '근접 딜러'],
    characterName: '수인 검투사',
    characterSpecies: '수인',
    characterWorldView: '아르칸드리아 (마법, 중세, 판타지)',
  },

  // 3. 네온 시티 (사이버펑크)
  {
    id: 'tpl_neon_1',
    imageUrl: '/templates/template-1766689563521-네온 시티-인간-원거리 딜러-le30up.png',
    tags: ['SF', '인간', '원거리 딜러'],
    characterName: '네온 샷 해커',
    characterSpecies: '인간',
    characterWorldView: '네온 시티 (SF, 미래, 사이버펑크)',
  },
  {
    id: 'tpl_neon_2',
    imageUrl: '/templates/template-1766689609983-네온 시티-수인-근접 딜러-2w6ccm.png',
    tags: ['SF', '수인', '근접 딜러'],
    characterName: '사이버 와일드',
    characterSpecies: '수인',
    characterWorldView: '네온 시티 (SF, 미래, 사이버펑크)',
  },

  // 4. 코스모스 (우주)
  {
    id: 'tpl_cos_1',
    imageUrl: '/templates/template-1766689748122-코스모스-인간-원거리 딜러-61bhg8.png',
    tags: ['우주', '인간', '원거리 딜러'],
    characterName: '성간 탐사자',
    characterSpecies: '인간',
    characterWorldView: '코스모스 (우주, 별, 신비)',
  },
  {
    id: 'tpl_cos_2',
    imageUrl: '/templates/template-1766691259740-코스모스-수인-원거리 딜러-i5rixa.png',
    tags: ['우주', '수인', '원거리 딜러'],
    characterName: '코스믹 키드',
    characterSpecies: '수인',
    characterWorldView: '코스모스 (우주, 별, 신비)',
  },

  // 5. 천무계 (동양 판타지)
  {
    id: 'tpl_cheon_1',
    imageUrl: '/templates/template-1766689938397-천무계-인간-탱커-t7i0ms.png',
    tags: ['동양 판타지', '인간', '탱커'],
    characterName: '천무 가디언',
    characterSpecies: '인간',
    characterWorldView: '천무계 (동양 판타지, 무술, 정령)',
  },
  {
    id: 'tpl_cheon_2',
    imageUrl: '/templates/template-1766691470119-천무계-악마-근접 딜러-gx031j.png',
    tags: ['동양 판타지', '악마', '근접 딜러'],
    characterName: '귀살 귀인',
    characterSpecies: '악마',
    characterWorldView: '천무계 (동양 판타지, 무술, 정령)',
  },

  // 6. 데스랜드 (암흑)
  {
    id: 'tpl_death_1',
    imageUrl: '/templates/template-1766690125939-데스랜드-인간-원거리 딜러-sp8ofc.png',
    tags: ['암흑', '인간', '원거리 딜러'],
    characterName: '어둠의 저격수',
    characterSpecies: '인간',
    characterWorldView: '데스랜드 (암흑, 언데드, 고딕)',
  },
  {
    id: 'tpl_death_2',
    imageUrl: '/templates/template-1766690468791-데스랜드-수인-근접 딜러-46p6e.png',
    tags: ['암흑', '수인', '근접 딜러'],
    characterName: '데스 팬서',
    characterSpecies: '수인',
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
