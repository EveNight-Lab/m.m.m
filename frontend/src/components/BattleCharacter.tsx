/**
 * 전투 화면용 캐릭터 컴포넌트
 * 캐릭터 이미지와 상태 정보를 표시 (토큰 형태)
 */

import type { BattleCharacter } from '../types'
import { getMaxHP } from '../utils/battleEngine'
import { ReactNode } from 'react'
import BattleDiceDisplay from './BattleDiceDisplay'
import DamageSummationDisplay from './DamageSummationDisplay'
import type { ComboCheckResult } from '../utils/battleEngine'

interface BattleCharacterProps {
  battleChar: BattleCharacter
  isPlayer: boolean
  attackAction?: 'attacking' | 'hit' | 'miss' | 'damaged' | 'defended' | null // 공격 액션 상태
  diceOverlay?: ReactNode // 주사위 오버레이
  diceDisplay?: {
    diceResults: number[]
    onComplete?: () => void
  } | null
  damageSummation?: {
    diceResults: number[]
    fixedDamage: number
    defense: number
    comboCheck: ComboCheckResult | null
    specialActions: Array<{ name: string; effect: string }>
    onComplete?: () => void
  } | null
}

export default function BattleCharacterDisplay({
  battleChar,
  isPlayer,
  attackAction = null,
  diceOverlay,
  diceDisplay,
  damageSummation,
}: BattleCharacterProps) {
  const maxHP = getMaxHP(battleChar.character)
  const hpPercent = (battleChar.currentHP / maxHP) * 100

  // 액션에 따른 애니메이션 클래스
  const getAnimationClass = () => {
    switch (attackAction) {
      case 'attacking':
        return isPlayer ? 'animate-attack-forward' : 'animate-attack-forward-reverse'
      case 'hit':
        return 'animate-hit-shake'
      case 'miss':
        return isPlayer ? 'animate-dodge-back' : 'animate-dodge-back-reverse'
      case 'damaged':
        return 'animate-damage-shake'
      case 'defended':
        return isPlayer ? 'animate-defend-push' : 'animate-defend-push-reverse'
      default:
        return ''
    }
  }

  return (
    <div className={`relative flex flex-col items-center ${isPlayer ? 'order-1' : 'order-2'} w-full max-w-[180px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px]`}>
      {/* 캐릭터 토큰 (이미지) */}
      <div
        className={`relative w-full aspect-[3/4] transition-transform duration-200 ${getAnimationClass()}`}
        style={{
          transformOrigin: 'center bottom', // 하단 중심으로 회전/움직임
        }}
      >
        {/* 이름 - 카드 내부 상부에 배치 (모바일 대응) */}
        <div className="absolute top-0 left-0 right-0 z-30 text-center">
          <div className="font-bold text-white text-[10px] sm:text-xs md:text-sm bg-black/70 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-b backdrop-blur-sm">
            {battleChar.character.name}
          </div>
          {battleChar.character.nickname && (
            <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 bg-black/50 px-1.5 sm:px-2 py-0.5 rounded-b backdrop-blur-sm">
              {battleChar.character.nickname}
            </div>
          )}
        </div>
        {battleChar.character.imageUrl ? (
          <img
            src={battleChar.character.imageUrl}
            alt={battleChar.character.name}
            draggable="false"
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(125,211,252,0.5)]"
          />
        ) : battleChar.character.imageData ? (
          <img
            src={`data:image/png;base64,${battleChar.character.imageData}`}
            alt={battleChar.character.name}
            draggable="false"
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(125,211,252,0.5)]"
          />
        ) : (
          <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">🎭</div>
              <div className="text-xs">이미지 없음</div>
            </div>
          </div>
        )}

        {/* 공격 중 효과 (이제 attackAction으로 처리되므로 제거) */}

        {/* 상태이상 아이콘 */}
        {battleChar.statusEffects.length > 0 && (
          <div className="absolute -top-2 -right-2 flex flex-wrap gap-1 max-w-[60px]">
            {battleChar.statusEffects.map((se, idx) => (
              <div
                key={idx}
                className="text-xs bg-red-500/80 rounded-full px-1.5 py-0.5 text-white font-bold"
                title={se.type}
              >
                {se.type === '출혈' && '🩸'}
                {se.type === '중독' && '☠️'}
                {se.type === '둔화' && '🐌'}
                {se.type === '실명' && '👁️'}
                {se.type === '취약' && '💔'}
                {se.stacks && se.stacks > 1 && `x${se.stacks}`}
              </div>
            ))}
          </div>
        )}

        {/* 광란 상태 */}
        {battleChar.isBerserk && (
          <div className="absolute top-0 left-0 right-0 bg-red-600/80 text-white text-xs font-bold py-1 text-center rounded-t-lg z-40" style={{ marginTop: battleChar.character.nickname ? '2.5rem' : '2rem' }}>
            광란!
          </div>
        )}

        {/* 주사위 오버레이 */}
        {diceOverlay && (
          <div className="absolute inset-0 z-50">
            {diceOverlay}
          </div>
        )}

        {/* 합산 구역 표시 (카드 중앙에서 전개) */}
        {damageSummation && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 z-60 w-full max-w-[320px]" 
            style={{ 
              top: '50%', 
              transform: 'translate(-50%, -50%)',
            }}
          >
            <DamageSummationDisplay
              diceResults={damageSummation.diceResults}
              fixedDamage={damageSummation.fixedDamage}
              defense={damageSummation.defense}
              comboCheck={damageSummation.comboCheck}
              specialActions={damageSummation.specialActions}
              position={{ x: 50, y: 50 }}
              onComplete={damageSummation.onComplete}
            />
          </div>
        )}

        {/* 주사위 결과 표시 (카드 정 중앙) */}
        {diceDisplay && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 z-60 w-full max-w-[280px] md:max-w-[320px]" 
            style={{ 
              top: '50%', 
              transform: 'translate(-50%, -50%)',
            }}
          >
            <BattleDiceDisplay
              diceResults={diceDisplay.diceResults}
              position={{ x: 50, y: 50 }}
              onComplete={diceDisplay.onComplete}
            />
          </div>
        )}
      </div>

      {/* 체력바 */}
      <div className="w-full mb-1 mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] sm:text-xs text-gray-300">HP</span>
          <span className="text-[10px] sm:text-xs text-gray-300">
            {battleChar.currentHP} / {maxHP}
          </span>
        </div>
        <div className="w-full h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <div
            className={`h-full transition-all duration-300 ${
              hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* 피로도 */}
      {battleChar.fatigue > 0 && (
        <div className="w-full mb-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] sm:text-xs text-gray-300">피로도</span>
            <span className="text-[10px] sm:text-xs text-gray-300">{battleChar.fatigue}%</span>
          </div>
          <div className="w-full h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <div
              className={`h-full transition-all duration-300 ${
                battleChar.fatigue >= 100 ? 'bg-red-600' : 'bg-orange-500'
              }`}
              style={{ width: `${battleChar.fatigue}%` }}
            />
          </div>
        </div>
      )}

      {/* 스텟 및 능력 - 체력바 아래에 배치 */}
      <div className="w-full mt-1 p-1 sm:p-1.5 bg-black/60 rounded border border-cyan-400/20">
        {/* 스텟 - 한 줄로 표시 */}
        <div className="flex items-center justify-between gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] md:text-[10px] mb-1 pb-1 border-b border-white/10">
          <div className="flex items-center gap-0.5">
            <span className="text-gray-400">주:</span>
            <span className="text-yellow-300 font-bold">{battleChar.character.stats.diceCount}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-gray-400">공:</span>
            <span className="text-orange-300 font-bold">{battleChar.character.stats.fixedDamage}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-gray-400">방:</span>
            <span className="text-blue-300 font-bold">{battleChar.character.stats.defense}</span>
          </div>
        </div>
        
        {/* 특수행동 - 간단히 표시 */}
        <div className="text-[8px] sm:text-[9px] md:text-[10px]">
          <div className="text-purple-300 font-semibold truncate">{battleChar.character.activeSkill.name}</div>
          <div className="text-gray-400 line-clamp-1 mt-0.5">
            {battleChar.character.activeSkill.description}
          </div>
        </div>
      </div>
    </div>
  )
}

