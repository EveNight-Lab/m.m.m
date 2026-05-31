interface GaugeBarProps {
  gauge: number
  maxGauge: number
  gaugePercent: number
  cycleCount: number
}

/**
 * 계약 게임 게이지 바 컴포넌트
 * 마법력/계약력 게이지로 표현
 */
function GaugeBar({ gauge, maxGauge, gaugePercent, cycleCount }: GaugeBarProps) {
  // 바퀴 수에 비례해서 색상 계산 (0바퀴 = 청록색, 바퀴 수가 많을수록 빨간색)
  // 최대 20바퀴까지 고려하여 색상 변화 (20바퀴 이상이면 완전 빨간색)
  const getGaugeColor = () => {
    const maxCycles = 20 // 최대 바퀴 수 (이 이상이면 완전 빨간색)
    const cycleRatio = Math.min(1, cycleCount / maxCycles) // 0~1 사이의 비율
    
    // 바퀴 수가 0일 때: 청록색 (cyan)
    // 바퀴 수가 많아질수록: 청록색 → 보라색 → 빨간색
    
    if (cycleCount === 0) {
      // 초기: 청록색
      return {
        fromColor: 'rgb(6, 182, 212)', // cyan-500
        viaColor: 'rgb(139, 92, 246)', // violet-500
        toColor: 'rgb(6, 182, 212)', // cyan-500
        borderColor: 'rgba(6, 182, 212, 0.3)', // cyan-500/30
        iconColor: 'rgb(34, 211, 238)', // cyan-400
        shadowColor: 'rgba(6, 182, 212, 0.6)',
      }
    } else {
      // 바퀴 수에 따라 색상 보간
      // cyan (6, 182, 212) → violet (139, 92, 246) → red (239, 68, 68) → dark red (220, 38, 38)
      
      let fromR, fromG, fromB
      let viaR, viaG, viaB
      let toR, toG, toB
      
      if (cycleRatio < 0.4) {
        // 0~0.4 (0~8바퀴): cyan → violet
        const t = cycleRatio / 0.4 // 0~1
        fromR = Math.round(6 + (139 - 6) * t)
        fromG = Math.round(182 + (92 - 182) * t)
        fromB = Math.round(212 + (246 - 212) * t)
        viaR = Math.round(139 + (239 - 139) * t * 0.5) // 천천히 빨간색으로
        viaG = Math.round(92 + (68 - 92) * t * 0.5)
        viaB = Math.round(246 + (68 - 246) * t * 0.5)
        toR = fromR
        toG = fromG
        toB = fromB
      } else if (cycleRatio < 0.7) {
        // 0.4~0.7 (8~14바퀴): violet → red
        const t = (cycleRatio - 0.4) / 0.3 // 0~1
        fromR = Math.round(139 + (239 - 139) * t)
        fromG = Math.round(92 + (68 - 92) * t)
        fromB = Math.round(246 + (68 - 246) * t)
        viaR = Math.round(239 + (220 - 239) * t * 0.5)
        viaG = Math.round(68 + (38 - 68) * t * 0.5)
        viaB = Math.round(68 + (38 - 68) * t * 0.5)
        toR = fromR
        toG = fromG
        toB = fromB
      } else {
        // 0.7~1.0 (14~20바퀴): red → dark red
        const t = (cycleRatio - 0.7) / 0.3 // 0~1
        fromR = Math.round(239 + (220 - 239) * t)
        fromG = Math.round(68 + (38 - 68) * t)
        fromB = Math.round(68 + (38 - 68) * t)
        viaR = Math.round(220 + (153 - 220) * t) // 더 어두운 빨간색
        viaG = Math.round(38 + (27 - 38) * t)
        viaB = Math.round(38 + (27 - 38) * t)
        toR = Math.round(220 + (153 - 220) * t)
        toG = Math.round(38 + (27 - 38) * t)
        toB = Math.round(38 + (27 - 38) * t)
      }
      
      const fromColor = `rgb(${fromR}, ${fromG}, ${fromB})`
      const viaColor = `rgb(${viaR}, ${viaG}, ${viaB})`
      const toColor = `rgb(${toR}, ${toG}, ${toB})`
      
      // 아이콘과 점 색상도 보간 (cyan-400 → red-400 → dark red)
      // cyan-400: rgb(34, 211, 238), red-400: rgb(248, 113, 113), dark red: rgb(220, 38, 38)
      let iconR, iconG, iconB
      if (cycleRatio < 0.7) {
        // cyan → red
        const t = cycleRatio / 0.7
        iconR = Math.round(34 + (248 - 34) * t)
        iconG = Math.round(211 + (113 - 211) * t)
        iconB = Math.round(238 + (113 - 238) * t)
      } else {
        // red → dark red
        const t = (cycleRatio - 0.7) / 0.3
        iconR = Math.round(248 + (220 - 248) * t)
        iconG = Math.round(113 + (38 - 113) * t)
        iconB = Math.round(113 + (38 - 113) * t)
      }
      const iconColor = `rgb(${iconR}, ${iconG}, ${iconB})`
      
      return {
        fromColor,
        viaColor,
        toColor,
        borderColor: `rgba(${fromR}, ${fromG}, ${fromB}, 0.3)`,
        iconColor,
        shadowColor: `rgba(${fromR}, ${fromG}, ${fromB}, 0.6)`,
      }
    }
  }

  const colors = getGaugeColor()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg 
            className="w-5 h-5 transition-colors duration-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: colors.iconColor }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-white/90 font-bold text-sm md:text-base">계약 마법력</span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="font-black text-lg md:text-xl transition-colors duration-500"
            style={{ color: colors.iconColor }}
          >
            {Math.round(gaugePercent)}%
          </span>
          <div 
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${gaugePercent >= 100 ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: colors.iconColor }}
          />
        </div>
      </div>
      <div 
        className="relative h-8 md:h-10 bg-slate-900/80 rounded-full border-2 overflow-hidden transition-all duration-500 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]"
        style={{ borderColor: colors.borderColor }}
      >
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(125,211,252,0.1) 10px, rgba(125,211,252,0.1) 20px)',
        }} />
        
        {/* 게이지 바 */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
          style={{ 
            width: `${gaugePercent}%`,
            background: `linear-gradient(to right, ${colors.fromColor}, ${colors.viaColor}, ${colors.toColor})`,
            boxShadow: `0 0 20px ${colors.shadowColor}, inset 0 0 10px ${colors.shadowColor.replace('0.6', '0.4')}`,
          }}
        >
          {/* 빛나는 효과 */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent" />
        </div>
        
        {/* 게이지 값 표시 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs md:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {Math.round(gauge)} / {Math.round(maxGauge)}
          </span>
        </div>
        
        {/* 100% 달성 시 특수 효과 */}
        {gaugePercent >= 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 via-cyan-400/50 to-emerald-400/50 animate-pulse" />
        )}
      </div>
    </div>
  )
}

export default GaugeBar

