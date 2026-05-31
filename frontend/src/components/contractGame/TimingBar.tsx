import { memo } from 'react'

interface TimingBarProps {
  barPosition: number // 0~100%
  barWidth: number // 판정 범위 (사용하지 않지만 props 유지)
  targetZones: number[]
  successZoneWidth: number // 성공 구간 폭 (사용하지 않지만 props 유지)
}

/**
 * 원형 타이밍 게임 바 컴포넌트
 * 원을 따라 시계방향으로 도는 포인터와 성공 구간을 표시합니다.
 */
const TimingBar = memo(function TimingBar({ barPosition, barWidth: _barWidth, targetZones, successZoneWidth: _successZoneWidth }: TimingBarProps) {
  const size = 240 // 원의 크기
  const center = size / 2
  const radius = 90 // 원의 반지름
  const strokeWidth = 8 // 트랙 두께

  // barPosition (0~100%)을 각도(0~360도)로 변환
  // 0% = 0도 (12시), 25% = 90도 (3시), 50% = 180도 (6시), 75% = 270도 (9시)
  const pointerAngle = (barPosition / 100) * 360

  // 원형 트랙의 호(arc) 경로 생성 함수 (부채꼴이 아닌 호만)
  const getArcPath = (startPercent: number, endPercent: number) => {
    const startAngle = (startPercent / 100) * 360 - 90 // -90도로 시작 (12시 방향)
    const endAngle = (endPercent / 100) * 360 - 90
    
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const x1 = center + radius * Math.cos(startAngleRad)
    const y1 = center + radius * Math.sin(startAngleRad)
    const x2 = center + radius * Math.cos(endAngleRad)
    const y2 = center + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
    
    // 원형 트랙의 호만 그리기 (중심으로 연결하지 않음)
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
  }

  // 포인터 위치 계산 (메모이제이션으로 최적화)
  const pointerAngleRad = (pointerAngle * Math.PI) / 180 - Math.PI / 2 // -90도로 시작
  const pointerX = center + radius * Math.cos(pointerAngleRad)
  const pointerY = center + radius * Math.sin(pointerAngleRad)

  return (
    <div className="flex items-center justify-center py-4 relative">
      {/* 외부 마법진 효과 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[280px] h-[280px] border-2 border-cyan-500/20 rounded-full" />
        <div className="absolute w-[260px] h-[260px] border border-violet-500/20 rounded-full" />
      </div>
      
      <svg width={size} height={size} className="relative z-10" style={{ willChange: 'contents' }}>
        {/* 배경 원형 트랙 - 마법진 느낌 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(125, 211, 252, 0.15)"
          strokeWidth={strokeWidth}
          strokeDasharray="4 4"
        />
        
        {/* 내부 마법진 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth}
          fill="none"
          stroke="rgba(192, 132, 252, 0.1)"
          strokeWidth={1}
        />

        {/* 성공 구간 (마법의 구간 - 원형 트랙의 호 형태) */}
        {targetZones.map((_, index) => {
          if (index % 2 === 0) {
            const zoneStart = targetZones[index]
            const zoneEnd = targetZones[index + 1]
            return (
              <g key={index}>
                {/* 배경 빛나는 호 */}
                <path
                  d={getArcPath(zoneStart, zoneEnd)}
                  fill="none"
                  stroke="url(#magicZoneStrokeGradient)"
                  strokeWidth={strokeWidth + 4}
                  strokeLinecap="round"
                  strokeOpacity={0.4}
                  style={{
                    filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.8))',
                  }}
                />
                {/* 메인 성공 구간 호 */}
                <path
                  d={getArcPath(zoneStart, zoneEnd)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={strokeWidth + 2}
                  strokeLinecap="round"
                  strokeOpacity={0.8}
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.9))',
                  }}
                />
                {/* 내부 빛나는 호 */}
                <path
                  d={getArcPath(zoneStart, zoneEnd)}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth={strokeWidth - 2}
                  strokeLinecap="round"
                  strokeOpacity={1}
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(52, 211, 153, 1))',
                  }}
                />
              </g>
            )
          }
          return null
        })}

        {/* 포인터 (시계방향으로 이동) - 선 없이 빛나는 원만 */}
        <g style={{ willChange: 'transform' }}>
          {/* 외부 빛나는 원 */}
          <circle
            cx={pointerX}
            cy={pointerY}
            r={14}
            fill="url(#pointerOuterGradient)"
            fillOpacity={0.3}
            style={{
              filter: 'drop-shadow(0 0 16px rgba(125, 211, 252, 0.8))',
            }}
          />
          {/* 중간 빛나는 원 */}
          <circle
            cx={pointerX}
            cy={pointerY}
            r={10}
            fill="url(#pointerGradient)"
            fillOpacity={0.6}
            style={{
              filter: 'drop-shadow(0 0 12px rgba(125, 211, 252, 0.9))',
            }}
          />
          {/* 메인 포인터 원 */}
          <circle
            cx={pointerX}
            cy={pointerY}
            r={8}
            fill="url(#pointerGradient)"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(125, 211, 252, 1))',
            }}
          />
          {/* 내부 빛나는 점 */}
          <circle
            cx={pointerX}
            cy={pointerY}
            r={4}
            fill="#ffffff"
            fillOpacity={0.9}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 1))',
            }}
          />
        </g>

        {/* 그라데이션 정의 */}
        <defs>
          <linearGradient id="pointerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          <radialGradient id="pointerOuterGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="magicZoneStrokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
})

export default TimingBar

