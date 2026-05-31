import type { ContractGameState } from '../../types'

interface GameResultProps {
  gameState: ContractGameState
  characterName: string
  onRetry: () => void
}

/**
 * 게임 결과 표시 컴포넌트
 * 성공/실패 상태를 표시합니다.
 */
function GameResult({ gameState, characterName, onRetry }: GameResultProps) {
  if (gameState === 'success') {
    return (
      <div className="text-center space-y-4 p-6 bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 rounded-2xl border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
        <div className="text-7xl animate-bounce">✨</div>
        <div className="space-y-2">
          <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]">
            계약 완성!
          </p>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          <p className="text-sm md:text-base text-emerald-200/90 font-medium">
            {characterName}과의 계약이 성공적으로 완료되었습니다
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-emerald-300/70 italic">마법의 힘이 깃들었습니다</p>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>
    )
  }

  if (gameState === 'failed') {
    return (
      <div className="text-center space-y-4 p-6 bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-2xl border-2 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
        <div className="text-7xl">💫</div>
        <div className="space-y-2">
          <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            계약 실패
          </p>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-red-400 to-transparent" />
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onRetry}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-violet-600 to-cyan-600 text-white font-bold border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(125,211,252,0.5)] transition-all duration-200 active:scale-[0.97] hover:shadow-[0_0_40px_rgba(125,211,252,0.7)]"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GameResult

