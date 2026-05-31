/**
 * 데미지 합산 표시 컴포넌트
 * 주사위 합산, 고정 피해, 특수 행동, 방어력 감소를 단계적으로 표시
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import type { ComboCheckResult } from '../utils/battleEngine'

interface DamageSummationDisplayProps {
  diceResults: number[]
  fixedDamage: number
  defense: number
  comboCheck: ComboCheckResult | null
  specialActions: Array<{ name: string; effect: string }>
  position: { x: number; y: number }
  onComplete?: () => void
}

export default function DamageSummationDisplay({
  diceResults,
  fixedDamage,
  defense,
  comboCheck,
  specialActions,
  position,
  onComplete,
}: DamageSummationDisplayProps) {
  // 콤보가 실제로 있는지 확인 (엄격한 체크)
  const hasValidCombo = useMemo(() => {
    if (!comboCheck) return false
    if (comboCheck.comboType === null || comboCheck.comboType === undefined) return false
    if (!comboCheck.comboName || comboCheck.comboName.trim() === '') return false
    return true
  }, [comboCheck])

  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(hasValidCombo ? 0 : 1) // 0: 콤보 메시지, 1: 주사위 합산, 2: 고정 피해, 3: 특수 행동, 4: 방어력 감소
  const [displayedDiceSum, setDisplayedDiceSum] = useState(0)
  const [displayedDice, setDisplayedDice] = useState<number[]>([])
  const [currentDiceIndex, setCurrentDiceIndex] = useState(0)
  const processedRef = useRef(false) // 이미 처리했는지 추적

  // comboCheck가 변경될 때 step 재설정 (초기화 시에만)
  useEffect(() => {
    // 초기 상태 설정: hasValidCombo가 변경될 때만 step 재설정
    processedRef.current = false // 리셋
    if (hasValidCombo) {
      setStep(0)
    } else {
      setStep(1)
    }
    setDisplayedDiceSum(0)
    setDisplayedDice([])
    setCurrentDiceIndex(0)
  }, [hasValidCombo]) // step을 dependency에서 제거하여 무한 루프 방지

  // 특수 값(-1) 제외한 주사위들
  const normalDice = diceResults.filter(r => r !== -1)
  
  // 트리플인 경우 같은 숫자를 두 번씩 추가
  const diceForSummation = comboCheck?.comboType === 'triple' && comboCheck.matchedValues?.[0] !== undefined
    ? normalDice.flatMap(d => {
        if (d === comboCheck.matchedValues![0]) {
          return [d, d] // 트리플 숫자는 두 번
        }
        return [d]
      })
    : normalDice

  // 주사위 합계
  const diceTotal = diceForSummation.reduce((sum, d) => sum + d, 0)
  const totalDamage = diceTotal + fixedDamage
  const finalDamage = Math.max(1, totalDamage - defense)

  useEffect(() => {
    // 스트레이트나 올제로는 콤보 메시지만 표시하고 끝
    if (step === 0 && (comboCheck?.comboType === 'straight' || comboCheck?.comboType === 'allzero')) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 2000) // 2초 후 완료
      return () => clearTimeout(timer)
    }

    // 트리플 콤보: 콤보 메시지 표시 후 주사위 합산 시작 (한 번만 실행)
    if (step === 0 && hasValidCombo && comboCheck?.comboType === 'triple' && !processedRef.current) {
      processedRef.current = true // 처리 완료 표시
      console.log('[DamageSummation] 트리플 콤보 메시지 표시, 1.5초 후 step 1로 이동')
      const timer = setTimeout(() => {
        console.log('[DamageSummation] step 0 -> 1 이동')
        setStep(1)
      }, 1500)
      return () => clearTimeout(timer)
    }
    
    // 콤보가 없는 경우: 바로 주사위 합산 시작 (한 번만 실행)
    if (step === 0 && !hasValidCombo && !processedRef.current) {
      processedRef.current = true // 처리 완료 표시
      console.log('[DamageSummation] 콤보 없음, 바로 step 1로 이동')
      const timer = setTimeout(() => {
        setStep(1)
      }, 100)
      return () => clearTimeout(timer)
    }

    // 주사위 합산 단계
    if (step === 1) {
      if (currentDiceIndex < diceForSummation.length) {
        const timer = setTimeout(() => {
          const nextDice = diceForSummation[currentDiceIndex]
          setDisplayedDice(prev => [...prev, nextDice])
          setDisplayedDiceSum(prev => prev + nextDice)
          setCurrentDiceIndex(prev => prev + 1)
        }, 400) // 각 주사위마다 0.4초 간격
        return () => clearTimeout(timer)
      } else if (currentDiceIndex === diceForSummation.length) {
        // 모든 주사위 합산 완료
        const timer = setTimeout(() => {
          if (fixedDamage > 0) {
            setStep(2)
          } else if (specialActions.length > 0) {
            setStep(3)
          } else {
            setStep(4) // 방어력 감소
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    }

    // 고정 피해 추가
    if (step === 2) {
      const timer = setTimeout(() => {
        if (specialActions.length > 0) {
          setStep(3)
        } else {
          setStep(4) // 방어력 감소
        }
      }, 800)
      return () => clearTimeout(timer)
    }

    // 특수 행동 표시
    if (step === 3) {
      const timer = setTimeout(() => {
        setStep(4) // 방어력 감소
      }, 1500)
      return () => clearTimeout(timer)
    }

    // 방어력 감소 표시
    if (step === 4) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [step, currentDiceIndex, comboCheck, fixedDamage, specialActions.length, diceForSummation, onComplete, hasValidCombo])

  // 트리플인 경우 강조할 숫자
  const tripleValue = comboCheck?.comboType === 'triple' ? comboCheck.matchedValues?.[0] : null

  return (
    <div
      className="relative pointer-events-none z-50"
      style={{
        width: '100%',
      }}
    >
      <div className="bg-black/90 rounded-lg p-4 md:p-5 border-2 border-cyan-400/60 shadow-xl min-w-[280px] md:min-w-[320px]">
        {/* 콤보 메시지 - 콤보가 실제로 있을 때만 표시 */}
        {step === 0 && hasValidCombo && comboCheck && (
          <div className="text-center animate-[fadeIn_0.5s_ease-out]">
            <div className="text-2xl md:text-3xl font-black mb-2 bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              🎲 콤보 발동: {comboCheck.comboName}!
            </div>
            {comboCheck.comboType === 'triple' && (
              <div className="text-sm md:text-base text-gray-300">
                같은 숫자 {comboCheck.matchedValues?.[0]}이(가) 3개! 각 주사위가 2번씩 발동합니다!
              </div>
            )}
            {comboCheck.comboType === 'straight' && (
              <div className="text-sm md:text-base text-gray-300">
                연속된 숫자 {comboCheck.matchedValues?.join(', ')}!
              </div>
            )}
            {comboCheck.comboType === 'allzero' && (
              <div className="text-sm md:text-base text-gray-300">
                0이 3개! 상대의 체력을 10으로 변경합니다!
              </div>
            )}
          </div>
        )}

        {/* 합산 구역 */}
        {(step >= 1 || (!comboCheck && step === 0)) && (
          <div className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
            {/* 주사위 합산 */}
            {step >= 1 && (
              <div className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-2 gap-1.5 justify-items-center">
                  {displayedDice.map((value, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 md:w-12 md:h-12 bg-white/90 rounded-lg border-2 flex items-center justify-center text-lg md:text-xl font-black shadow-md transition-all duration-300 ${
                        tripleValue === value
                          ? 'border-yellow-400 bg-yellow-100 text-yellow-700 animate-[pulse_0.5s_ease-in-out]'
                          : 'border-cyan-400 text-cyan-600'
                      }`}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      {value}
                    </div>
                  ))}
                </div>
                {displayedDice.length > 0 && (
                  <div className="text-white text-lg md:text-xl font-bold">
                    = {displayedDiceSum}
                  </div>
                )}
              </div>
            )}

            {/* 고정 피해 추가 */}
            {step >= 2 && fixedDamage > 0 && (
              <div className="flex items-center justify-center gap-2 animate-[fadeIn_0.3s_ease-out]">
                <span className="text-orange-400 text-lg md:text-xl font-bold">+{fixedDamage}</span>
              </div>
            )}

            {/* 총합 */}
            {(step >= 2 || (step >= 1 && fixedDamage === 0 && specialActions.length === 0)) && (
              <div className="pt-2 border-t border-white/20 animate-[fadeIn_0.3s_ease-out] text-center">
                <div className="text-red-400 text-xl md:text-2xl font-black">
                  {displayedDiceSum}
                  {step >= 2 && fixedDamage > 0 && ` + ${fixedDamage} = ${totalDamage}`}
                  {step < 2 && fixedDamage === 0 && displayedDiceSum > 0 && ` = ${diceTotal}`}
                  {step >= 3 && specialActions.length > 0 && (
                    <div className="text-purple-400 text-sm md:text-base font-semibold mt-1">
                      {specialActions.map(a => {
                        let displayEffect = a.effect
                        if (a.effect.includes('체력+')) {
                          const match = a.effect.match(/체력\+(\d+)/)
                          if (match) displayEffect = `체력 +${match[1]}`
                        } else if (a.effect.includes('마나+')) {
                          const match = a.effect.match(/마나\+(\d+)/)
                          if (match) displayEffect = `마나 +${match[1]}`
                        } else if (a.effect.includes('고정 피해+')) {
                          const match = a.effect.match(/고정 피해\+(\d+)/)
                          if (match) displayEffect = `공격 +${match[1]}`
                        } else if (a.effect.includes('적 최대 체력')) {
                          const match = a.effect.match(/적 최대 체력 (\d+)감소/)
                          if (match) displayEffect = `적 체력 -${match[1]}`
                        } else if (a.effect.includes('상대 방어-')) {
                          const match = a.effect.match(/상대 방어-(\d+)/)
                          if (match) displayEffect = `적 방어 -${match[1]}`
                        } else if (a.effect.includes('상대 고정 피해-')) {
                          const match = a.effect.match(/상대 고정 피해-(\d+)/)
                          if (match) displayEffect = `적 공격 -${match[1]}`
                        }
                        return displayEffect
                      }).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 특수 행동 표시 */}
            {step >= 3 && specialActions.length > 0 && (
              <div className="pt-2 border-t border-purple-400/30 animate-[fadeIn_0.3s_ease-out] text-center">
                <div className="text-purple-400 text-sm md:text-base font-semibold">
                  {specialActions.map((action, index) => {
                    let displayEffect = action.effect
                    if (action.effect.includes('체력+')) {
                      const match = action.effect.match(/체력\+(\d+)/)
                      if (match) displayEffect = `체력 +${match[1]}`
                    } else if (action.effect.includes('마나+')) {
                      const match = action.effect.match(/마나\+(\d+)/)
                      if (match) displayEffect = `마나 +${match[1]}`
                    } else if (action.effect.includes('고정 피해+')) {
                      const match = action.effect.match(/고정 피해\+(\d+)/)
                      if (match) displayEffect = `공격 +${match[1]}`
                    } else if (action.effect.includes('적 최대 체력')) {
                      const match = action.effect.match(/적 최대 체력 (\d+)감소/)
                      if (match) displayEffect = `적 체력 -${match[1]}`
                    } else if (action.effect.includes('상대 방어-')) {
                      const match = action.effect.match(/상대 방어-(\d+)/)
                      if (match) displayEffect = `적 방어 -${match[1]}`
                    } else if (action.effect.includes('상대 고정 피해-')) {
                      const match = action.effect.match(/상대 고정 피해-(\d+)/)
                      if (match) displayEffect = `적 공격 -${match[1]}`
                    }
                    return <span key={index}>{displayEffect}</span>
                  }).reduce((acc, curr, index) => {
                    return index === 0 ? [curr] : [...acc, <span key={`sep-${index}`}>, </span>, curr]
                  }, [] as React.ReactNode[])}
                </div>
              </div>
            )}

            {/* 방어력 감소 */}
            {step >= 4 && (
              <div className="pt-2 border-t border-blue-400/30 animate-[fadeIn_0.3s_ease-out] text-center">
                <div className="text-blue-400 text-lg md:text-xl font-bold">-{defense}</div>
                <div className="mt-2 pt-2 border-t border-red-400/30">
                  <div className="text-red-400 text-2xl md:text-3xl font-black">
                    -{finalDamage}
                    <span className="text-sm md:text-base text-gray-400 font-normal ml-1">(방어 {defense})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

