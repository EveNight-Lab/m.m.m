/**
 * 전투 효과 컴포넌트
 * 명중/회피/스킬 사용 등의 순수 시각 효과 (텍스트 없음)
 */

interface BattleEffectProps {
  type: 'hit' | 'miss' | 'skill' | 'critical'
}

export default function BattleEffect({ type }: BattleEffectProps) {
  const effectConfig = {
    hit: {
      bg: 'bg-red-500/40',
      glow: 'shadow-[0_0_40px_rgba(239,68,68,0.8)]',
      animation: 'animate-ping',
      icon: '💥',
    },
    miss: {
      bg: 'bg-blue-500/40',
      glow: 'shadow-[0_0_40px_rgba(59,130,246,0.8)]',
      animation: 'animate-bounce',
      icon: '💨',
    },
    skill: {
      bg: 'bg-purple-500/40',
      glow: 'shadow-[0_0_40px_rgba(168,85,247,0.8)]',
      animation: 'animate-pulse',
      icon: '✨',
    },
    critical: {
      bg: 'bg-yellow-500/40',
      glow: 'shadow-[0_0_60px_rgba(234,179,8,1)]',
      animation: 'animate-ping',
      icon: '⚡',
    },
  }

  const config = effectConfig[type]

  return (
    <div
      className={`absolute inset-0 ${config.bg} ${config.glow} ${config.animation} pointer-events-none z-30 flex items-center justify-center`}
      style={{
        animation: type === 'hit' || type === 'critical' ? 'hitFlash 0.5s ease-out' : undefined,
      }}
    >
      <div className="text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
        {config.icon}
      </div>
    </div>
  )
}

