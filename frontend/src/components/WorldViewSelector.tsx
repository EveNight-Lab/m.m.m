import { WORLD_VIEWS, getWorldViewName, getWorldViewKeywords, getWorldViewColors } from '../constants/worldViews'
import type { WorldView } from '../constants/worldViews'
import { getDiceTypeForWorldView, getDiceConfig } from '../constants/diceTypes'

/**
 * 주사위 면 정보를 텍스트로 표시하는 컴포넌트
 * 전투 중 주사위 표시와 동일한 스타일 사용
 */
function DiceFacesDisplay({ worldView, colors }: { worldView: WorldView; colors: ReturnType<typeof getWorldViewColors> }) {
  const diceType = getDiceTypeForWorldView(worldView)
  const diceConfig = getDiceConfig(diceType)
  
  // 주사위 값들을 정렬하여 표시 (특수 값은 마지막에)
  const sortedValues = [...diceConfig.values].sort((a, b) => {
    if (a === -1) return 1 // 특수 값은 마지막
    if (b === -1) return -1
    return a - b
  })
  
  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-1 justify-center items-center">
        {sortedValues.map((value, idx) => (
          <div
            key={idx}
            className="w-6 h-6 bg-white/90 rounded border-2 flex items-center justify-center text-xs font-black shadow-md"
            style={{
              borderColor: colors.border,
              color: colors.primary,
            }}
          >
            {value === -1 ? '✨' : value}
          </div>
        ))}
      </div>
    </div>
  )
}

interface WorldViewSelectorProps {
  value: string
  onChange: (worldView: WorldView) => void
}

/**
 * 세계관 선택 컴포넌트
 * 6개의 세계관을 버튼 형태로 표시하여 선택할 수 있게 합니다.
 */
function WorldViewSelector({ value, onChange }: WorldViewSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/80">
        세계관
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {WORLD_VIEWS.map((worldView) => {
          const isSelected = value === worldView
          const name = getWorldViewName(worldView)
          const keywords = getWorldViewKeywords(worldView)
          const colors = getWorldViewColors(worldView)

          return (
            <button
              key={worldView}
              type="button"
              onClick={() => onChange(worldView)}
              className="relative p-2 rounded-lg text-left transition-all duration-200 active:scale-[0.98] touch-manipulation min-h-[70px] border-2"
              style={isSelected ? {
                background: `linear-gradient(to bottom right, ${colors.bgFrom}, ${colors.bgTo})`,
                borderColor: colors.border,
                boxShadow: `0 0 20px ${colors.shadow}`,
              } : {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: `${colors.border}40`, // 40% opacity
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.opacity = '0.8'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.opacity = '1'
                }
              }}
            >
              <div 
                className="font-semibold text-xs leading-tight mb-1"
                style={{ color: colors.text }}
              >
                {name}
              </div>
              <div 
                className="text-[10px] leading-tight mb-1"
                style={{ color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }}
              >
                {keywords.join(', ')}
              </div>
              {/* 주사위 면 정보 표시 */}
              <DiceFacesDisplay worldView={worldView} colors={colors} />
              {isSelected && (
                <div 
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ 
                    backgroundColor: colors.indicator,
                    boxShadow: `0 0 6px ${colors.indicator}80`
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default WorldViewSelector

