import type { Character } from '../types'
import { getWorldViewName, getWorldViewColors, WORLD_VIEW_COLORS } from '../constants/worldViews'
import { STAT_NAMES, STAT_KEYS } from '../constants/stats'
import type { WorldView } from '../constants/worldViews'

interface MonsterCardProps {
  character: Character
  onContract?: (id: string) => void // 계약 버튼 클릭 핸들러 (미계약 몬스터용)
  onBattle?: (id: string) => void // 전투하기 버튼 클릭 핸들러 (계약한 몬스터용)
  onSecondCreate?: (id: string) => void // 2차 생성 버튼 클릭 핸들러 (계약한 몬스터용)
  onClick?: () => void // 카드 클릭 핸들러
}

/**
 * hex 색상을 rgba로 변환하는 유틸 함수
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 몬스터 카드 컴포넌트
 * 슬롯에 표시되는 작은 카드 (스테이터스 다각형 포함)
 */
function MonsterCard({ character, onContract, onBattle, onSecondCreate, onClick }: MonsterCardProps) {
  const worldViewName = getWorldViewName(character.worldView as WorldView)
  
  // worldView를 문자열로 사용하여 색상 가져오기
  // 안전장치: 직접 WORLD_VIEW_COLORS에서 가져오되, 없으면 기본값 사용
  const worldViewKey = character.worldView as string
  const worldViewColors = WORLD_VIEW_COLORS[worldViewKey] ?? {
    primary: '#06b6d4',
    border: '#22d3ee',
    text: '#67e8f9',
    shadow: 'rgba(6, 182, 212, 0.4)',
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleContractClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onContract) {
      onContract(character.id)
    }
  }

  const handleBattleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onBattle) {
      onBattle(character.id)
    }
  }

  const handleSecondCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSecondCreate) {
      onSecondCreate(character.id)
    }
  }

  return (
    <div
      className="flex flex-col w-[216px] md:w-[216px] lg:w-[240px] xl:w-[312px] 2xl:w-[360px] shrink-0"
    >
      {/* 프리미엄 TCG 카드 프레임 */}
      <div
        className="relative rounded-3xl p-[3px] cursor-pointer transition-all duration-500 hover:scale-[1.03] active:scale-[0.98] group/card"
        onClick={handleCardClick}
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.primary, 0.3)}, ${hexToRgba(worldViewColors.secondary, 0.2)}, ${hexToRgba(worldViewColors.primary, 0.3)})`,
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.4),
            0 0 0 1px ${hexToRgba(worldViewColors.border, 0.3)},
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.2)
          `,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `
            0 12px 48px ${hexToRgba(worldViewColors.shadow, 0.6)},
            0 0 0 1px ${hexToRgba(worldViewColors.border, 0.6)},
            inset 0 1px 0 rgba(255,255,255,0.2),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(0,0,0,0.4),
            0 0 0 1px ${hexToRgba(worldViewColors.border, 0.3)},
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.2)
          `
        }}
      >
        {/* 내부 카드 */}
        <div 
          className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-[20px] p-2 md:p-2.5 xl:p-3 flex flex-col border border-white/10 overflow-hidden h-full backdrop-blur-sm"
        >
          {/* 반짝이는 배경 효과 */}
          <div 
            className="absolute inset-0 opacity-30 group-hover/card:opacity-50 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${hexToRgba(worldViewColors.primary, 0.15)}, transparent 50%),
                           radial-gradient(circle at 70% 80%, ${hexToRgba(worldViewColors.secondary, 0.15)}, transparent 50%)`,
            }}
          />
          
          {/* 상단 장식 라인 - 더 세련되게 */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: `linear-gradient(to right, 
                transparent, 
                ${hexToRgba(worldViewColors.primary, 0.8)}, 
                ${hexToRgba(worldViewColors.secondary, 0.8)}, 
                ${hexToRgba(worldViewColors.primary, 0.8)}, 
                transparent)`,
              boxShadow: `0 0 8px ${hexToRgba(worldViewColors.primary, 0.5)}`,
            }}
          />
          
          {/* 하단 장식 라인 */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[2px] z-10"
            style={{
              background: `linear-gradient(to right, 
                transparent, 
                ${hexToRgba(worldViewColors.primary, 0.6)}, 
                ${hexToRgba(worldViewColors.secondary, 0.6)}, 
                ${hexToRgba(worldViewColors.primary, 0.6)}, 
                transparent)`,
            }}
          />
          
          {/* 카드 본체 (이미지) - 포켓몬 카드 비율 63:88 */}
          <div 
            className="w-full aspect-[63/88] rounded-xl overflow-hidden border border-white/20 bg-gradient-to-br from-slate-800 to-slate-900 relative shadow-inner"
            style={{
              boxShadow: `inset 0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px ${hexToRgba(worldViewColors.border, 0.2)}`,
            }}
          >
            {/* 이미지 그라데이션 오버레이 */}
            <div 
              className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 group-hover/card:opacity-0"
              style={{
                background: `linear-gradient(to bottom, 
                  ${hexToRgba(worldViewColors.primary, 0.1)} 0%, 
                  transparent 30%, 
                  transparent 70%, 
                  ${hexToRgba(worldViewColors.secondary, 0.2)} 100%)`,
              }}
            />
            
            {character.imageUrl ? (
              <img
                src={character.imageUrl}
                alt={character.name}
                draggable="false"
                className={`w-full h-full object-cover transition-all duration-500 group-hover/card:scale-110 group-hover/card:brightness-110 ${
                  !character.contracted ? 'blur-md brightness-50' : ''
                }`}
              />
            ) : character.imageData ? (
              <img
                src={`data:image/png;base64,${character.imageData}`}
                alt={character.name}
                draggable="false"
                className={`w-full h-full object-cover transition-all duration-500 group-hover/card:scale-110 group-hover/card:brightness-110 ${
                  !character.contracted ? 'blur-md brightness-50' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-30">🎭</div>
                  <span className="text-white/30 text-xs font-medium">이미지 없음</span>
                </div>
              </div>
            )}
            
            {/* 미계약 오버레이 */}
            {!character.contracted && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <div className="text-white/90 text-xs font-bold uppercase tracking-wider">미계약</div>
                </div>
              </div>
            )}
            
            {/* 상단 오버레이 - 이름, 별명, 상태 배지 */}
            <div 
              className="absolute top-0 left-0 right-0 z-30 p-2 md:p-2.5 xl:p-3 transition-opacity duration-300 group-hover/card:opacity-0"
              style={{
                background: `linear-gradient(to bottom, 
                  rgba(0,0,0,0.85) 0%, 
                  rgba(0,0,0,0.7) 50%, 
                  transparent 100%)`,
                backdropFilter: 'blur(4px)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-black text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-white mb-0.5 line-clamp-1 leading-tight"
                    style={{
                      textShadow: `0 2px 8px rgba(0,0,0,0.9), 0 0 12px ${hexToRgba(worldViewColors.primary, 0.3)}`,
                    }}
                  >
                    {character.name}
                  </h3>
                  {character.nickname && (
                    <p 
                      className="text-[8px] md:text-[9px] xl:text-[10px] 2xl:text-xs italic line-clamp-1"
                      style={{
                        color: worldViewColors.text,
                        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                      }}
                    >
                      "{character.nickname}"
                    </p>
                  )}
                </div>
                {/* 세계관 배지 - 프리미엄 스타일 */}
                <div className="shrink-0">
                  <div 
                    className="px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border-2 backdrop-blur-md relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.primary, 0.9)}, ${hexToRgba(worldViewColors.secondary, 0.8)})`,
                      borderColor: hexToRgba(worldViewColors.border, 0.8),
                      color: worldViewColors.text,
                      boxShadow: `0 2px 12px ${hexToRgba(worldViewColors.shadow, 0.6)}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}
                  >
                    {/* 배지 내부 반짝임 */}
                    <div 
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: `linear-gradient(135deg, transparent, rgba(255,255,255,0.2), transparent)`,
                      }}
                    />
                    <div className="relative text-[8px] md:text-[9px] xl:text-[10px] font-black line-clamp-1 tracking-tight">
                      {worldViewName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 오버레이 - 스킬 정보 + 스텟 */}
            <div className="absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 group-hover/card:opacity-0">
              {/* 스텟 바 - 프리미엄 카드 게임 스타일 */}
              <div 
                className="px-1.5 md:px-2 py-1 border-t relative"
                style={{ 
                  borderTopColor: hexToRgba(worldViewColors.border, 0.5),
                  background: `linear-gradient(to top, 
                    ${hexToRgba(worldViewColors.primary, 0.25)}, 
                    ${hexToRgba(worldViewColors.primary, 0.1)}, 
                    transparent)`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* 스텟 바 상단 글로우 */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{
                    background: `linear-gradient(to right, transparent, ${hexToRgba(worldViewColors.primary, 0.6)}, transparent)`,
                  }}
                />
                
                <div className="flex items-center justify-center gap-1 md:gap-1.5 flex-wrap">
                  {/* 체력 배지 */}
                  <div 
                    className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 rounded-md border backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.primary, 0.3)}, ${hexToRgba(worldViewColors.primary, 0.15)})`,
                      borderColor: hexToRgba(worldViewColors.border, 0.4),
                      boxShadow: `0 1px 4px ${hexToRgba(worldViewColors.shadow, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}
                  >
                    <div className="flex items-center gap-0">
                      {Array.from({ length: Math.min(Math.floor(character.stats.hp / 10), 5) }, (_, i) => (
                        <span key={i} className="text-[10px] md:text-xs leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">❤️</span>
                      ))}
                      {character.stats.hp % 10 >= 5 && Math.floor(character.stats.hp / 10) < 5 && (
                        <span className="text-[10px] md:text-xs opacity-50 leading-none">🤍</span>
                      )}
                    </div>
                  </div>

                  {/* 주사위 + 고정데미지 배지 */}
                  <div 
                    className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 rounded-md border backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.secondary, 0.3)}, ${hexToRgba(worldViewColors.secondary, 0.15)})`,
                      borderColor: hexToRgba(worldViewColors.border, 0.4),
                      boxShadow: `0 1px 4px ${hexToRgba(worldViewColors.shadow, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}
                  >
                    <div className="flex items-center gap-0">
                      {Array.from({ length: Math.min(character.stats.diceCount, 5) }, (_, i) => (
                        <span key={i} className="text-[10px] md:text-xs leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🎲</span>
                      ))}
                      {character.stats.fixedDamage > 0 && (
                        <span 
                          className="text-[8px] md:text-[9px] font-black leading-none ml-0.5 px-0.5 py-0 rounded"
                          style={{ 
                            color: worldViewColors.text,
                            background: hexToRgba(worldViewColors.primary, 0.2),
                            textShadow: `0 1px 2px rgba(0,0,0,0.5)`,
                          }}
                        >
                          +{character.stats.fixedDamage}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 방어력 배지 - 0이 아닐 때만 표시 */}
                  {character.stats.defense > 0 && (
                    <div 
                      className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 rounded-md border backdrop-blur-sm relative overflow-hidden transition-all duration-300 hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.primary, 0.3)}, ${hexToRgba(worldViewColors.primary, 0.15)})`,
                        borderColor: hexToRgba(worldViewColors.border, 0.4),
                        boxShadow: `0 1px 4px ${hexToRgba(worldViewColors.shadow, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                      }}
                    >
                      <span className="text-[10px] md:text-xs leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">🛡️</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 특수행동 영역 - 프리미엄 스타일 */}
              <div 
                className="px-2.5 md:px-3 xl:px-3.5 py-2 md:py-2.5 border-t relative"
                style={{ 
                  borderTopColor: hexToRgba(worldViewColors.border, 0.3),
                  background: `linear-gradient(to top, 
                    rgba(0,0,0,0.95) 0%, 
                    rgba(0,0,0,0.9) 50%, 
                    rgba(0,0,0,0.85) 100%)`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* 스킬 영역 상단 글로우 */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{
                    background: `linear-gradient(to right, transparent, ${hexToRgba(worldViewColors.secondary, 0.4)}, transparent)`,
                  }}
                />
                
                <div className="flex flex-col gap-1">
                  <div 
                    className="text-[9px] md:text-[10px] xl:text-xs font-black leading-tight uppercase tracking-wider"
                    style={{ 
                      color: worldViewColors.text,
                      textShadow: `0 1px 4px rgba(0,0,0,0.8), 0 0 8px ${hexToRgba(worldViewColors.shadow, 0.4)}`,
                    }}
                  >
                    {character.activeSkill.name}
                  </div>
                  <div 
                    className="text-[8px] md:text-[9px] xl:text-[10px] text-white/90 font-medium leading-snug line-clamp-2"
                    style={{
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    }}
                  >
                    {character.activeSkill.effect}
                  </div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 오버레이 - hover 시 표시 */}
            <div className="absolute inset-0 z-40 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none group-hover/card:pointer-events-auto">
              <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                style={{
                  background: `linear-gradient(to bottom, 
                    rgba(0,0,0,0.6) 0%, 
                    rgba(0,0,0,0.8) 50%, 
                    rgba(0,0,0,0.6) 100%)`,
                }}
              />
              <div className="relative z-10 flex flex-col gap-2 px-4 w-full">
                {/* 계약하기 버튼 */}
                {!character.contracted && onContract && (
                  <button
                    type="button"
                    onClick={handleContractClick}
                    className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 border-2 border-amber-400/80 text-white text-xs md:text-sm font-black uppercase tracking-wider relative overflow-hidden group/btn transition-all duration-300 active:scale-[0.97] hover:scale-[1.02]"
                    style={{
                      boxShadow: `
                        0 4px 16px rgba(217,119,6,0.5),
                        0 0 0 1px rgba(217,119,6,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2)
                      `,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `
                        0 6px 24px rgba(217,119,6,0.7),
                        0 0 0 1px rgba(217,119,6,0.5),
                        inset 0 1px 0 rgba(255,255,255,0.3)
                      `
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `
                        0 4px 16px rgba(217,119,6,0.5),
                        0 0 0 1px rgba(217,119,6,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2)
                      `
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-30 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent" />
                    <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">계약하기</span>
                  </button>
                )}
                
                {/* 전투하기 버튼 */}
                {character.contracted && onBattle && (
                  <button
                    type="button"
                    onClick={handleBattleClick}
                    className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 border-2 border-cyan-400/80 text-white text-xs md:text-sm font-black uppercase tracking-wider relative overflow-hidden group/btn transition-all duration-300 active:scale-[0.97] hover:scale-[1.02]"
                    style={{
                      boxShadow: `
                        0 4px 16px rgba(6,182,212,0.5),
                        0 0 0 1px rgba(139,92,246,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2)
                      `,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `
                        0 6px 24px rgba(6,182,212,0.7),
                        0 0 0 1px rgba(139,92,246,0.5),
                        inset 0 1px 0 rgba(255,255,255,0.3)
                      `
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `
                        0 4px 16px rgba(6,182,212,0.5),
                        0 0 0 1px rgba(139,92,246,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2)
                      `
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-30 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent" />
                    <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">전투하기</span>
                  </button>
                )}
                
                {/* 2차 생성 버튼 */}
                {character.contracted && onSecondCreate && (
                  <button
                    type="button"
                    onClick={handleSecondCreateClick}
                    className="w-full py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 border-2 border-purple-400/80 text-white text-xs md:text-sm font-black uppercase tracking-wider relative overflow-hidden group/btn transition-all duration-300 active:scale-[0.97] hover:scale-[1.02]"
                    style={{
                      boxShadow: `
                        0 4px 16px rgba(168,85,247,0.5),
                        0 0 0 1px rgba(236,72,153,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2)
                      `,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `
                        0 6px 24px rgba(168,85,247,0.7),
                        0 0 0 1px rgba(236,72,153,0.5),
                        inset 0 1px 0 rgba(255,255,255,0.3)
                      `
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `
                        0 4px 16px rgba(168,85,247,0.5),
                        0 0 0 1px rgba(236,72,153,0.3),
                        inset 0 1px 0 rgba(255,255,255,0.2)
                      `
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-30 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent" />
                    <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">2차 생성</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default MonsterCard

