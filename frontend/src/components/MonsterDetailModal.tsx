import { useEffect, useRef, useState } from 'react'
import type { Character } from '../types'
import { getWorldViewName, getWorldViewColors } from '../constants/worldViews'
import { STAT_NAMES, STAT_KEYS } from '../constants/stats'
import type { WorldView } from '../constants/worldViews'
import DicePreview from './DicePreview'

interface MonsterDetailModalProps {
  character: Character | null
  isOpen: boolean
  onClose: () => void
  onContract?: (id: string) => void
  onDelete?: (id: string) => void
}

/**
 * 몬스터 상세 정보 모달 컴포넌트
 * 카드 클릭 시 표시되는 상세 정보 팝업
 */
function MonsterDetailModal({ character, isOpen, onClose, onContract, onDelete }: MonsterDetailModalProps) {
  const diceContainerRef = useRef<HTMLDivElement>(null)
  const [diceSize, setDiceSize] = useState(120)

  // 주사위 컨테이너 크기에 맞춰 주사위 크기 조정
  useEffect(() => {
    if (!isOpen || !diceContainerRef.current) return

    const updateDiceSize = () => {
      if (diceContainerRef.current) {
        const container = diceContainerRef.current
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight
        // 패딩과 제목 높이를 고려하여 주사위가 들어갈 공간 계산
        const titleHeight = 40 // 제목 + 여백
        const padding = 24 // 상하 패딩
        const availableHeight = containerHeight - titleHeight - padding
        const availableWidth = containerWidth - padding
        // 더 작은 쪽에 맞춰서 정사각형으로
        const size = Math.min(availableWidth, availableHeight)
        setDiceSize(Math.max(80, size)) // 최소 80px
      }
    }

    updateDiceSize()
    const resizeObserver = new ResizeObserver(updateDiceSize)
    resizeObserver.observe(diceContainerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isOpen])

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // 배경 클릭으로 닫기 방지 (모달 내부 클릭은 허용)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !character) return null

  const worldViewName = getWorldViewName(character.worldView)
  const worldViewKey = character.worldView as string
  const worldViewColors = getWorldViewColors(character.worldView as WorldView) ?? {
    primary: '#06b6d4',
    secondary: '#22d3ee',
    text: '#67e8f9',
    border: '#22d3ee',
    shadow: 'rgba(6, 182, 212, 0.4)',
  }

  // hex 색상을 rgba로 변환하는 유틸 함수
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // 삭제 핸들러
  const handleDelete = () => {
    if (!onDelete) return
    
    const confirmed = window.confirm(
      `정말 "${character.name}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    )
    
    if (confirmed) {
      onDelete(character.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pb-[calc(100px+env(safe-area-inset-bottom))] bg-black/90 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      {/* 프리미엄 모달 컨테이너 */}
      <div
        className="relative w-full max-w-5xl h-[calc(100vh-120px)] max-h-[calc(100vh-120px)] rounded-2xl md:rounded-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(135deg, 
            ${hexToRgba(worldViewColors.primary, 0.15)}, 
            ${hexToRgba(worldViewColors.secondary, 0.1)}, 
            ${hexToRgba(worldViewColors.primary, 0.15)})`,
          border: `2px solid ${hexToRgba(worldViewColors.border, 0.4)}`,
          boxShadow: `
            0 25px 80px rgba(0,0,0,0.9),
            0 0 0 1px ${hexToRgba(worldViewColors.border, 0.2)},
            inset 0 1px 0 rgba(255,255,255,0.1),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            0 0 60px ${hexToRgba(worldViewColors.shadow, 0.5)}
          `,
        }}
      >
        {/* 상단 장식 라인 */}
        <div 
          className="absolute top-0 left-0 right-0 h-[3px] z-10"
          style={{
            background: `linear-gradient(to right, 
              transparent, 
              ${hexToRgba(worldViewColors.primary, 0.8)}, 
              ${hexToRgba(worldViewColors.secondary, 0.8)}, 
              ${hexToRgba(worldViewColors.primary, 0.8)}, 
              transparent)`,
            boxShadow: `0 0 12px ${hexToRgba(worldViewColors.primary, 0.6)}`,
          }}
        />
        
        {/* 내부 컨텐츠 */}
        <div 
          className="relative bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 p-2 md:p-3 lg:p-4 flex-1 overflow-y-auto scrollbar-hide"
          style={{
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* 닫기 버튼 - 프리미엄 스타일 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/60 text-red-300 hover:text-red-200 transition-all duration-300 z-20 shadow-lg hover:scale-110 hover:shadow-xl"
            style={{
              boxShadow: '0 4px 16px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="space-y-1.5 md:space-y-2 h-full flex flex-col">
            {/* 프리미엄 헤더 섹션 */}
            <div className="space-y-1.5 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h2 
                    className="text-xl md:text-2xl lg:text-3xl font-black mb-0.5 tracking-tight"
                    style={{
                      background: `linear-gradient(135deg, ${worldViewColors.text}, ${worldViewColors.secondary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: `0 0 30px ${hexToRgba(worldViewColors.shadow, 0.5)}`,
                    }}
                  >
                    {character.name}
                  </h2>
                  {character.nickname && (
                    <p 
                      className="text-sm md:text-base lg:text-lg mb-1 italic font-semibold"
                      style={{
                        color: worldViewColors.text,
                        textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 12px ${hexToRgba(worldViewColors.shadow, 0.4)}`,
                      }}
                    >
                      "{character.nickname}"
                    </p>
                  )}
                </div>
              </div>
              
              {/* 태그 및 상태 배지 */}
              <div className="flex flex-wrap items-center gap-2">
                <div 
                  className="px-2.5 py-1 rounded-lg border-2 backdrop-blur-sm relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.primary, 0.3)}, ${hexToRgba(worldViewColors.primary, 0.15)})`,
                    borderColor: hexToRgba(worldViewColors.border, 0.5),
                    boxShadow: `0 2px 12px ${hexToRgba(worldViewColors.shadow, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }}
                >
                  <span className="text-xs md:text-sm font-black" style={{ color: worldViewColors.text }}>
                    {character.species}
                  </span>
                </div>
                
                <div 
                  className="px-2.5 py-1 rounded-lg border-2 backdrop-blur-sm relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.secondary, 0.3)}, ${hexToRgba(worldViewColors.secondary, 0.15)})`,
                    borderColor: hexToRgba(worldViewColors.border, 0.5),
                    boxShadow: `0 2px 12px ${hexToRgba(worldViewColors.shadow, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }}
                >
                  <span className="text-xs md:text-sm font-black" style={{ color: worldViewColors.text }}>
                    {worldViewName}
                  </span>
                </div>
                
                {!character.contracted && (
                  <div className="ml-auto px-2.5 py-1 rounded-lg border-2 backdrop-blur-sm bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-amber-400/60 shadow-lg">
                    <span className="text-xs md:text-sm font-black text-amber-200">🔒 미계약</span>
                  </div>
                )}
                {character.contracted && (
                  <div 
                    className="ml-auto px-2.5 py-1 rounded-lg border-2 backdrop-blur-sm relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${hexToRgba(worldViewColors.primary, 0.4)}, ${hexToRgba(worldViewColors.secondary, 0.3)})`,
                      borderColor: hexToRgba(worldViewColors.border, 0.6),
                      boxShadow: `0 2px 12px ${hexToRgba(worldViewColors.shadow, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}
                  >
                    <span className="text-xs md:text-sm font-black" style={{ color: worldViewColors.text }}>
                      ✨ 계약
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 첫 번째 줄: 이미지 + 스텟 좌우 배치 */}
            <div className="grid grid-cols-[2.5fr_1fr] gap-1.5 md:gap-3 items-stretch flex-shrink-0">
              {/* 좌측: 이미지 */}
              <div 
                className="w-full rounded-lg overflow-hidden border-2 relative"
                style={{
                  borderColor: hexToRgba(worldViewColors.border, 0.5),
                  background: `linear-gradient(135deg, 
                    ${hexToRgba(worldViewColors.primary, 0.1)}, 
                    ${hexToRgba(worldViewColors.secondary, 0.05)})`,
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.4),
                    inset 0 2px 8px rgba(0,0,0,0.3),
                    0 0 40px ${hexToRgba(worldViewColors.shadow, 0.3)}
                  `,
                }}
              >
                {/* 이미지 그라데이션 오버레이 */}
                <div 
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom, 
                      ${hexToRgba(worldViewColors.primary, 0.15)} 0%, 
                      transparent 30%, 
                      transparent 70%, 
                      ${hexToRgba(worldViewColors.secondary, 0.25)} 100%)`,
                  }}
                />
                
                {character.imageUrl ? (
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    draggable="false"
                    className={`w-full h-full object-contain transition-all duration-500 ${
                      !character.contracted ? 'blur-md brightness-50' : ''
                    }`}
                  />
                ) : character.imageData ? (
                  <img
                    src={`data:image/png;base64,${character.imageData}`}
                    alt={character.name}
                    draggable="false"
                    className={`w-full h-full object-contain transition-all duration-500 ${
                      !character.contracted ? 'blur-md brightness-50' : ''
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2 opacity-30">🎭</div>
                      <span className="text-white/30 text-xs font-medium">이미지 없음</span>
                    </div>
                  </div>
                )}
                
                {/* 미계약 오버레이 */}
                {!character.contracted && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] z-20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔒</div>
                      <div className="text-white/90 text-sm font-black uppercase tracking-wider">미계약</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 우측: 스텟 */}
              <div 
                className="rounded-lg p-1.5 md:p-2 border-2 relative flex flex-col min-w-[100px]"
                style={{
                  background: `linear-gradient(135deg, 
                    ${hexToRgba(worldViewColors.primary, 0.2)}, 
                    ${hexToRgba(worldViewColors.secondary, 0.15)}, 
                    ${hexToRgba(worldViewColors.primary, 0.2)})`,
                  borderColor: hexToRgba(worldViewColors.border, 0.4),
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.4),
                    inset 0 1px 0 rgba(255,255,255,0.1),
                    0 0 40px ${hexToRgba(worldViewColors.shadow, 0.3)}
                  `,
                }}
              >
                {/* 상단 글로우 라인 */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(to right, 
                      transparent, 
                      ${hexToRgba(worldViewColors.primary, 0.8)}, 
                      ${hexToRgba(worldViewColors.secondary, 0.8)}, 
                      ${hexToRgba(worldViewColors.primary, 0.8)}, 
                      transparent)`,
                    boxShadow: `0 0 12px ${hexToRgba(worldViewColors.primary, 0.5)}`,
                  }}
                />
                
                {/* 스텟 섹션 */}
                <div className="flex-shrink-0">
                  <h3 
                    className="text-xs md:text-sm font-black uppercase tracking-wider mb-1.5"
                    style={{
                      color: worldViewColors.text,
                      textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 12px ${hexToRgba(worldViewColors.shadow, 0.4)}`,
                    }}
                  >
                    스텟
                  </h3>
                  
                  <div className="flex flex-col gap-1 md:gap-1.5">
                    {STAT_KEYS.map((key, index) => (
                      <div
                        key={key}
                        className="rounded p-1.5 md:p-2 border-2 relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-105 group"
                        style={{
                          background: `linear-gradient(135deg, 
                            ${hexToRgba(worldViewColors.primary, 0.25)}, 
                            ${hexToRgba(worldViewColors.secondary, 0.15)})`,
                          borderColor: hexToRgba(worldViewColors.border, 0.4),
                          boxShadow: `
                            0 4px 16px rgba(0,0,0,0.3),
                            inset 0 1px 0 rgba(255,255,255,0.1)
                          `,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = hexToRgba(worldViewColors.border, 0.7)
                          e.currentTarget.style.boxShadow = `
                            0 6px 24px ${hexToRgba(worldViewColors.shadow, 0.5)},
                            inset 0 1px 0 rgba(255,255,255,0.2)
                          `
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = hexToRgba(worldViewColors.border, 0.4)
                          e.currentTarget.style.boxShadow = `
                            0 4px 16px rgba(0,0,0,0.3),
                            inset 0 1px 0 rgba(255,255,255,0.1)
                          `
                        }}
                      >
                        {/* 배지 내부 반짝임 */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                          style={{
                            background: `linear-gradient(135deg, transparent, rgba(255,255,255,0.3), transparent)`,
                          }}
                        />
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-0.5 md:gap-2">
                          <div 
                            className="text-xs md:text-sm font-bold relative z-10 leading-tight"
                            style={{ color: worldViewColors.text }}
                          >
                            {STAT_NAMES[index]}
                          </div>
                          <div 
                            className="text-sm md:text-base font-black relative z-10 leading-tight"
                            style={{
                              color: worldViewColors.text,
                              textShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 12px ${hexToRgba(worldViewColors.shadow, 0.4)}`,
                            }}
                          >
                            {character.stats[key]}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 두 번째 줄: 특수행동 + 주사위 좌우 배치 */}
            <div className="grid grid-cols-[1.5fr_1fr] gap-1.5 md:gap-3 items-stretch flex-shrink-0">
              {/* 좌측: 특수행동 */}
              <div 
                className="rounded-lg p-1.5 md:p-2 border-2 relative flex flex-col"
                style={{
                  background: `linear-gradient(135deg, 
                    ${hexToRgba(worldViewColors.primary, 0.2)}, 
                    ${hexToRgba(worldViewColors.secondary, 0.15)}, 
                    ${hexToRgba(worldViewColors.primary, 0.2)})`,
                  borderColor: hexToRgba(worldViewColors.border, 0.4),
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.4),
                    inset 0 1px 0 rgba(255,255,255,0.1),
                    0 0 40px ${hexToRgba(worldViewColors.shadow, 0.3)}
                  `,
                }}
              >
                {/* 상단 글로우 라인 */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(to right, 
                      transparent, 
                      ${hexToRgba(worldViewColors.primary, 0.8)}, 
                      ${hexToRgba(worldViewColors.secondary, 0.8)}, 
                      ${hexToRgba(worldViewColors.primary, 0.8)}, 
                      transparent)`,
                    boxShadow: `0 0 12px ${hexToRgba(worldViewColors.primary, 0.5)}`,
                  }}
                />
                
                <h3 
                  className="text-sm md:text-base font-black uppercase tracking-wider mb-2"
                  style={{
                    color: worldViewColors.text,
                    textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 12px ${hexToRgba(worldViewColors.shadow, 0.4)}`,
                  }}
                >
                  특수행동
                </h3>
                
                <div className="space-y-1.5">
                  <p 
                    className="text-base md:text-lg font-black leading-tight"
                    style={{
                      color: worldViewColors.text,
                      textShadow: `0 1px 4px rgba(0,0,0,0.8)`,
                    }}
                  >
                    {character.activeSkill.name}
                  </p>
                  <p 
                    className="text-sm md:text-base text-white/90 leading-tight"
                    style={{
                      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    }}
                  >
                    {character.activeSkill.effect}
                  </p>
                </div>
              </div>

              {/* 우측: 주사위 */}
              <div 
                ref={diceContainerRef}
                className="rounded-lg p-1.5 md:p-2 border-2 relative flex flex-col"
                style={{
                  background: `linear-gradient(135deg, 
                    ${hexToRgba(worldViewColors.primary, 0.2)}, 
                    ${hexToRgba(worldViewColors.secondary, 0.15)}, 
                    ${hexToRgba(worldViewColors.primary, 0.2)})`,
                  borderColor: hexToRgba(worldViewColors.border, 0.4),
                  boxShadow: `
                    0 8px 32px rgba(0,0,0,0.4),
                    inset 0 1px 0 rgba(255,255,255,0.1),
                    0 0 40px ${hexToRgba(worldViewColors.shadow, 0.3)}
                  `,
                }}
              >
                {/* 상단 글로우 라인 */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(to right, 
                      transparent, 
                      ${hexToRgba(worldViewColors.primary, 0.8)}, 
                      ${hexToRgba(worldViewColors.secondary, 0.8)}, 
                      ${hexToRgba(worldViewColors.primary, 0.8)}, 
                      transparent)`,
                    boxShadow: `0 0 12px ${hexToRgba(worldViewColors.primary, 0.5)}`,
                  }}
                />
                
                <h3 
                  className="text-sm md:text-base font-black uppercase tracking-wider mb-2 flex-shrink-0"
                  style={{
                    color: worldViewColors.text,
                    textShadow: `0 2px 8px rgba(0,0,0,0.8), 0 0 12px ${hexToRgba(worldViewColors.shadow, 0.4)}`,
                  }}
                >
                  주사위
                </h3>
                <div className="flex items-center justify-center flex-1 min-h-0 w-full">
                  <DicePreview worldView={character.worldView as WorldView} size={diceSize} interactive={true} />
                </div>
              </div>
            </div>


            {/* 액션 버튼들 - 한 줄에 좌우 배치 */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2 flex-shrink-0">
              {/* 계약 버튼 (미계약 몬스터만) */}
              {!character.contracted && onContract && (
                <button
                  type="button"
                  onClick={() => {
                    onContract(character.id)
                    onClose()
                  }}
                  className="w-full py-1 md:py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white text-[10px] md:text-xs font-black uppercase tracking-wider border-2 border-amber-400/80 relative overflow-hidden group/btn transition-all duration-300 active:scale-[0.97] hover:scale-[1.02]"
                  style={{
                    boxShadow: `
                      0 6px 24px rgba(217,119,6,0.6),
                      0 0 0 1px rgba(217,119,6,0.4),
                      inset 0 1px 0 rgba(255,255,255,0.2)
                    `,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `
                      0 8px 32px rgba(217,119,6,0.8),
                      0 0 0 1px rgba(217,119,6,0.6),
                      inset 0 1px 0 rgba(255,255,255,0.3)
                    `
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `
                      0 6px 24px rgba(217,119,6,0.6),
                      0 0 0 1px rgba(217,119,6,0.4),
                      inset 0 1px 0 rgba(255,255,255,0.2)
                    `
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-30 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent" />
                  <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">계약하기</span>
                </button>
              )}

              {/* 삭제 버튼 */}
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`w-full py-1 md:py-1.5 rounded-lg bg-gradient-to-r from-red-600/90 via-red-500/90 to-red-600/90 text-white text-[10px] md:text-xs font-black uppercase tracking-wider border-2 border-red-400/70 relative overflow-hidden group/btn transition-all duration-300 active:scale-[0.97] hover:scale-[1.02] ${
                    !character.contracted && onContract ? '' : 'col-span-2'
                  }`}
                  style={{
                    boxShadow: `
                      0 4px 20px rgba(220,38,38,0.5),
                      0 0 0 1px rgba(220,38,38,0.3),
                      inset 0 1px 0 rgba(255,255,255,0.2)
                    `,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `
                      0 6px 28px rgba(220,38,38,0.7),
                      0 0 0 1px rgba(220,38,38,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.3)
                    `
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `
                      0 4px 20px rgba(220,38,38,0.5),
                      0 0 0 1px rgba(220,38,38,0.3),
                      inset 0 1px 0 rgba(255,255,255,0.2)
                    `
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-30 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white to-transparent" />
                  <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">삭제하기</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonsterDetailModal

