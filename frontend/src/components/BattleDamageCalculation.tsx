/**
 * 데미지 계산 연출 컴포넌트
 * 주사위 합 + 고정 피해, 방어력 감소를 단계별로 표시
 */

import { useState, useEffect } from 'react'

interface BattleDamageCalculationProps {
  diceTotal: number
  fixedDamage: number
  defense: number
  finalDamage: number
  position: { x: number; y: number }
  isAttacker: boolean
  onComplete?: () => void
}

export default function BattleDamageCalculation({
  diceTotal,
  fixedDamage,
  defense,
  finalDamage,
  position,
  isAttacker,
  onComplete,
}: BattleDamageCalculationProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0) // 0: 주사위 합, 1: 고정 피해 추가, 2: 방어력 감소, 3: 최종 데미지

  useEffect(() => {
    if (isAttacker) {
      // 공격자: 주사위 합 → 고정 피해 추가
      const timer1 = setTimeout(() => setStep(1), 800)
      const timer2 = setTimeout(() => {
        if (onComplete) onComplete()
      }, 1600)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
      }
    } else {
      // 방어자: 원래 데미지 → 방어력 감소 → 최종 데미지
      const timer1 = setTimeout(() => setStep(1), 800)
      const timer2 = setTimeout(() => setStep(2), 1600)
      const timer3 = setTimeout(() => {
        if (onComplete) onComplete()
      }, 2400)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isAttacker, onComplete])

  const totalDamage = diceTotal + fixedDamage

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="bg-black/80 rounded-lg p-3 md:p-4 border-2 border-cyan-400/50 shadow-lg min-w-[200px] md:min-w-[250px]">
        {isAttacker ? (
          // 공격자: 주사위 합 + 고정 피해
          <>
            {step >= 0 && (
              <div className="text-white text-sm md:text-base mb-1 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-cyan-300">주사위 합:</span>{' '}
                <span className="text-yellow-300 font-bold">{diceTotal}</span>
              </div>
            )}
            {step >= 1 && (
              <div className="text-white text-sm md:text-base mb-1 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-cyan-300">+ 고정 피해:</span>{' '}
                <span className="text-orange-300 font-bold">{fixedDamage}</span>
              </div>
            )}
            {step >= 1 && (
              <div className="text-white text-base md:text-lg mt-2 pt-2 border-t border-white/20 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-cyan-300">총 공격력:</span>{' '}
                <span className="text-red-400 font-black text-xl md:text-2xl">{totalDamage}</span>
              </div>
            )}
          </>
        ) : (
          // 방어자: 원래 데미지 → 방어력 감소 → 최종 데미지
          <>
            {step >= 0 && (
              <div className="text-white text-sm md:text-base mb-1 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-red-300">받은 데미지:</span>{' '}
                <span className="text-red-400 font-bold">{totalDamage}</span>
              </div>
            )}
            {step >= 1 && (
              <div className="text-white text-sm md:text-base mb-1 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-cyan-300">- 방어력:</span>{' '}
                <span className="text-blue-300 font-bold">{defense}</span>
              </div>
            )}
            {step >= 2 && (
              <div className="text-white text-base md:text-lg mt-2 pt-2 border-t border-white/20 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-cyan-300">최종 데미지:</span>{' '}
                <span className="text-red-400 font-black text-xl md:text-2xl">{finalDamage}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

