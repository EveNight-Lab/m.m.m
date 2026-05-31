import type { Stats } from '../types'
import { STAT_KEYS, STAT_NAMES, DEFAULT_STATS } from '../constants/stats'

interface StatRadarChartProps {
  stats: Stats
  size?: number
  iconOnly?: boolean // 슬롯창에서는 아이콘만, 상세창에서는 이름+아이콘
}

/**
 * 7각형 레이더 차트 컴포넌트
 * 스텟을 7각형 형태로 시각화합니다.
 */
function StatRadarChart({ stats, size = 200, iconOnly = false }: StatRadarChartProps) {
  // 라벨을 위한 여유 공간 추가 (size에 따라 조정)
  const svgSize = size * (size < 150 ? 1.4 : 1.3) // 작은 크기일 때 더 많은 여유 공간
  const center = svgSize / 2
  const radius = size * 0.4 // 차트 반지름 (원래 size 기준)
  const numStats = STAT_KEYS.length // 스텟 개수에 맞춤 (4개)
  const angleStep = (2 * Math.PI) / numStats
  const startAngle = -Math.PI / 2 // 위쪽(12시 방향)에서 시작
  
  // size에 따른 이모티콘 배경 원 크기 조정
  const iconRadius = size < 100 ? 12 : size < 150 ? 14 : 16
  const gradeTextSize = size < 100 ? 'text-[9px]' : size < 150 ? 'text-[10px]' : 'text-[11px]'

  // 스텟 값을 0-1 사이의 값으로 정규화
  // 각 스텟의 최대값을 기준으로 정규화 (기본값의 2배를 최대값으로 가정)
  const normalizeStatValue = (key: string, value: number): number => {
    const maxValues: Record<string, number> = {
      hp: DEFAULT_STATS.hp * 2, // 체력 최대값: 기본값의 2배
      diceCount: DEFAULT_STATS.diceCount * 2, // 주사위 수 최대값: 기본값의 2배
      fixedDamage: DEFAULT_STATS.fixedDamage + 20, // 고정데미지 최대값: 기본값 + 20
      defense: DEFAULT_STATS.defense + 20, // 방어력 최대값: 기본값 + 20
    }
    const maxValue = maxValues[key] || 100
    return Math.min(1, Math.max(0, value / maxValue))
  }

  // 각 스텟의 좌표 계산
  const getPoint = (index: number, value: number) => {
    const angle = startAngle + angleStep * index
    const distance = radius * value
    const x = center + distance * Math.cos(angle)
    const y = center + distance * Math.sin(angle)
    return { x, y }
  }

  // 레이더 차트의 폴리곤 경로 생성
  const getPolygonPath = () => {
    const points = STAT_KEYS.map((key, index) => {
      const value = normalizeStatValue(key, stats[key])
      const point = getPoint(index, value)
      return `${point.x},${point.y}`
    })
    return points.join(' ')
  }

  // 기본값 폴리곤 경로 생성 (비교용)
  const getBaseDefaultPolygonPath = () => {
    const defaultValue = 0.5 // 기본값을 0.5로 정규화
    const points = STAT_KEYS.map((_, index) => {
      const point = getPoint(index, defaultValue)
      return `${point.x},${point.y}`
    })
    return points.join(' ')
  }

  // 그리드 라인 경로 생성 (0%, 25%, 50%, 75%, 100%)
  const getGridPaths = () => {
    const levels = [0, 0.25, 0.5, 0.75, 1.0]
    return levels.map((level, levelIndex) => {
      const points = STAT_KEYS.map((_, index) => {
        const point = getPoint(index, level)
        return `${point.x},${point.y}`
      })
      return { path: points.join(' '), level: levelIndex * 25 }
    })
  }

  // 스텟 라벨 위치 계산 (이모티콘용 - 다각형 밖)
  const getLabelPosition = (index: number) => {
    const angle = startAngle + angleStep * index
    // size가 작을수록 라벨을 더 가까이 배치
    const labelRadiusMultiplier = size < 100 ? 1.1 : size < 150 ? 1.12 : 1.15
    const labelRadius = radius * labelRadiusMultiplier
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    return { x, y, angle: (angle * 180) / Math.PI }
  }

  // 등급 텍스트 위치 계산 (다각형 안쪽)
  const getGradePosition = (index: number) => {
    const angle = startAngle + angleStep * index
    // 다각형 안쪽에 배치 (반지름의 60-70% 정도)
    const gradeRadiusMultiplier = size < 100 ? 0.6 : size < 150 ? 0.65 : 0.7
    const gradeRadius = radius * gradeRadiusMultiplier
    const x = center + gradeRadius * Math.cos(angle)
    const y = center + gradeRadius * Math.sin(angle)
    return { x, y }
  }

  const gridPaths = getGridPaths()
  const polygonPath = getPolygonPath()
  const baseDefaultPolygonPath = getBaseDefaultPolygonPath()

  return (
    <div className="flex flex-col items-center">
      <svg width={svgSize} height={svgSize} className="overflow-visible" viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* 그리드 배경 (레벨별 원형 라인) */}
        {gridPaths.map((grid, index) => (
          <polygon
            key={grid.level}
            points={grid.path}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={index === 0 || index === gridPaths.length - 1 ? 1.5 : 1}
            className={index === gridPaths.length - 1 ? 'stroke-white/20' : ''}
          />
        ))}

        {/* 중심에서 각 꼭짓점으로 선 그리기 */}
        {STAT_KEYS.map((_, index) => {
          const point = getPoint(index, 1)
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          )
        })}

        {/* 기본값 폴리곤 (비교용, 배경) */}
        <polygon
          points={baseDefaultPolygonPath}
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />

        {/* 스텟 폴리곤 (채우기) - 기본값 위에 그려서 비교 가능 */}
        <polygon
          points={polygonPath}
          fill="rgba(125,211,252,0.2)"
          stroke="rgba(125,211,252,0.8)"
          strokeWidth="2"
          className="drop-shadow-[0_0_10px_rgba(125,211,252,0.5)]"
        />

        {/* 스텟 라벨 */}
        {STAT_KEYS.map((key, index) => {
          const { x, y } = getLabelPosition(index)
          const statName = STAT_NAMES[index]
          const statValue = stats[key]
          const normalizedValue = normalizeStatValue(key, statValue)
          
          // 값에 따른 색상 (0-1 사이의 값에 따라 그라데이션)
          const getValueColor = (value: number): string => {
            if (value >= 0.8) return '#a78bfa' // 높음 (보라)
            if (value >= 0.6) return '#f472b6' // 중상 (핑크)
            if (value >= 0.4) return '#22d3ee' // 중 (시안)
            if (value >= 0.2) return '#60a5fa' // 중하 (파랑)
            return '#34d399' // 낮음 (초록)
          }

          // 스텟별 이모티콘
          const statEmojis: Record<string, string> = {
            hp: '❤️', // 체력
            diceCount: '🎲', // 주사위 수
            fixedDamage: '⚔️', // 고정데미지
            defense: '🛡️', // 방어력
          }

          const emoji = statEmojis[key] || '❓'
          const valueColor = getValueColor(normalizedValue)

          return (
            <g key={key}>
              {iconOnly ? (
                <>
                  {/* 이모티콘만 표시 (슬롯창) - size에 따라 크기 조정 */}
                  <g transform={`translate(${x}, ${y})`}>
                    <circle cx="0" cy="0" r={iconRadius} fill={valueColor} opacity="0.2" />
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={size < 100 ? '16' : size < 150 ? '18' : '20'}
                    >
                      {emoji}
                    </text>
                  </g>
                  {/* 값 표시 - 다각형 안쪽 */}
                  {(() => {
                    const gradePos = getGradePosition(index)
                    return (
                      <text
                        x={gradePos.x}
                        y={gradePos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={`${size < 100 ? 'text-[11px]' : size < 150 ? 'text-[12px]' : 'text-[13px]'} font-black`}
                        fill={valueColor}
                        stroke="rgba(0,0,0,0.9)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        paintOrder="stroke fill"
                        style={{ 
                          textShadow: '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,1)',
                          filter: 'drop-shadow(0 0 3px ' + valueColor + ')'
                        }}
                      >
                        {statValue}
                      </text>
                    )
                  })()}
                </>
              ) : (
                <>
                  {/* 이모티콘 - size에 따라 크기 조정 */}
                  <g transform={`translate(${x}, ${y - (size < 200 ? 6 : 8)})`}>
                    <circle cx="0" cy="0" r={iconRadius - 2} fill={valueColor} opacity="0.2" />
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={size < 200 ? '14' : '16'}
                    >
                      {emoji}
                    </text>
                  </g>
                  {/* 스텟 이름 */}
                  <text
                    x={x}
                    y={y + (size < 200 ? 8 : 10)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`${size < 200 ? 'text-[10px]' : 'text-xs'} fill-white/80 font-medium`}
                  >
                    {statName}
                  </text>
                  {/* 값 표시 - 다각형 안쪽 */}
                  {(() => {
                    const gradePos = getGradePosition(index)
                    return (
                      <text
                        x={gradePos.x}
                        y={gradePos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={`${size < 200 ? 'text-[11px]' : 'text-[12px]'} font-black`}
                        fill={valueColor}
                        stroke="rgba(0,0,0,0.9)"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        paintOrder="stroke fill"
                        style={{ 
                          textShadow: '0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1), 0 0 2px rgba(0,0,0,1)',
                          filter: 'drop-shadow(0 0 3px ' + valueColor + ')'
                        }}
                      >
                        {statValue}
                      </text>
                    )
                  })()}
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default StatRadarChart

