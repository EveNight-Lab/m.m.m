import { useEffect, useMemo } from 'react'
import type { Character } from '../types'
import { calculateGameConfig } from '../utils/contractGameStats'
import { useContractGame } from '../hooks/useContractGame'
import GaugeBar from './contractGame/GaugeBar'
import TimingBar from './contractGame/TimingBar'
import GameResult from './contractGame/GameResult'

interface ContractMiniGameProps {
  character: Character
  onSuccess: () => void
  onClose: () => void
}

/**
 * 계약 미니게임 컴포넌트
 * 타이밍 게임을 통해 몬스터와 계약합니다.
 */
function ContractMiniGame({ character, onSuccess, onClose }: ContractMiniGameProps) {
  // config를 메모이제이션하여 매번 새로 생성되지 않도록 함
  const config = useMemo(() => calculateGameConfig(character.stats), [character.stats])
  const {
    gameState,
    gauge,
    gaugePercent,
    barPosition,
    targetZones,
    cycleCount,
    handleClick,
    handleStart,
    resetGame,
  } = useContractGame(config, onSuccess)

  // ESC 키로 닫기 (게임 중이 아닐 때만)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState !== 'playing') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [gameState, onClose])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pb-[calc(100px+env(safe-area-inset-bottom))] bg-black/90 backdrop-blur-md">
      {/* 배경 마법진 효과 */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-violet-500/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(125,211,252,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-cyan-500/60 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(125,211,252,0.3),inset_0_0_40px_rgba(192,132,252,0.1)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 0 1px rgba(125,211,252,0.2)',
        }}
      >
        {/* 마법진 장식 - 모서리 */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-3xl" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-3xl" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-400/60 rounded-br-3xl" />
        
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-300 hover:text-red-200 transition-all duration-200 z-10 shadow-lg backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-6 md:space-y-8">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(125,211,252,0.5)]">
                계약 의식
              </h2>
              <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-cyan-500/50" />
              <p className="text-sm md:text-base text-cyan-200/90 font-semibold px-3">
                {character.name}
              </p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-violet-500/50 to-violet-500/50" />
            </div>
            <p className="text-xs text-white/50 italic">마법진의 리듬에 맞춰 계약을 완성하세요</p>
          </div>

          {/* 게이지 */}
          <GaugeBar gauge={gauge} maxGauge={config.maxGauge} gaugePercent={gaugePercent} cycleCount={cycleCount} />

          {/* 타이밍 바 (항상 표시) */}
          <TimingBar
            barPosition={barPosition}
            barWidth={config.barWidth}
            targetZones={targetZones}
            successZoneWidth={config.successZoneWidth}
          />

          {/* 시작 버튼 (대기 상태일 때) */}
          {gameState === 'waiting' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleStart}
                className="relative w-full py-5 rounded-xl bg-gradient-to-r from-cyan-600 via-violet-600 to-cyan-600 text-white text-lg md:text-xl font-black uppercase tracking-wider border-2 border-cyan-400/80 shadow-[0_0_40px_rgba(125,211,252,0.7),inset_0_0_20px_rgba(192,132,252,0.3)] transition-all duration-200 active:scale-[0.97] hover:shadow-[0_0_50px_rgba(125,211,252,0.9),inset_0_0_30px_rgba(192,132,252,0.4)] overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  의식 시작
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </button>
              <p className="text-xs text-center text-white/50 italic">
                마법진이 활성화되면 리듬에 맞춰 주문을 시전하세요
              </p>
            </div>
          )}

          {/* 판정 버튼 (게임 중일 때) */}
          {gameState === 'playing' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleClick}
                className="relative w-full py-5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white text-lg md:text-xl font-black uppercase tracking-wider border-2 border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.7),inset_0_0_20px_rgba(251,191,36,0.3)] transition-all duration-200 active:scale-[0.97] hover:shadow-[0_0_50px_rgba(251,191,36,0.9),inset_0_0_30px_rgba(251,191,36,0.4)] overflow-hidden group animate-pulse"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  주문 시전!
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </span>
              </button>

              {/* 안내 */}
              <p className="text-xs text-center text-white/60 italic">
                <span className="text-emerald-400 font-semibold">마법의 구간</span>에 포인터가 있을 때 주문을 시전하세요!
              </p>
            </div>
          )}

          {/* 게임 결과 */}
          <GameResult
            gameState={gameState}
            characterName={character.name}
            onRetry={resetGame}
          />
        </div>
      </div>
    </div>
  )
}

export default ContractMiniGame
