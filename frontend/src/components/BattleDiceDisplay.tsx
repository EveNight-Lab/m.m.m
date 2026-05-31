/**
 * 주사위 값 표시 컴포넌트
 * 주사위 값들을 하나씩 순차적으로 표시
 */

import { useState, useEffect, useRef } from 'react'

interface BattleDiceDisplayProps {
  diceResults: number[]
  position: { x: number; y: number }
  onComplete?: () => void
}

export default function BattleDiceDisplay({
  diceResults,
  position,
  onComplete,
}: BattleDiceDisplayProps) {
  const [displayedDice, setDisplayedDice] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const onCompleteCalledRef = useRef(false)
  const lastDiceResultsRef = useRef<number[]>([])

  // diceResults가 변경되면 상태 초기화
  useEffect(() => {
    if (diceResults.length === 0) {
      setDisplayedDice([])
      setCurrentIndex(0)
      onCompleteCalledRef.current = false
      lastDiceResultsRef.current = []
      return
    }

    // diceResults가 변경되었는지 확인
    const diceResultsChanged = 
      lastDiceResultsRef.current.length !== diceResults.length ||
      lastDiceResultsRef.current.some((val, idx) => val !== diceResults[idx])
    
    if (diceResultsChanged) {
      setDisplayedDice([])
      setCurrentIndex(0)
      onCompleteCalledRef.current = false
      lastDiceResultsRef.current = [...diceResults]
    }
  }, [diceResults])

  useEffect(() => {
    if (diceResults.length === 0) {
      return
    }

    // 첫 번째 주사위부터 하나씩 표시
    if (currentIndex < diceResults.length) {
      const timer = setTimeout(() => {
        setDisplayedDice((prev) => [...prev, diceResults[currentIndex]])
        setCurrentIndex((prev) => prev + 1)
      }, 300) // 각 주사위마다 0.3초 간격

      return () => clearTimeout(timer)
    } else if (currentIndex === diceResults.length && onComplete && !onCompleteCalledRef.current) {
      // 모든 주사위 표시 완료 후 약간의 딜레이 (한 번만 호출)
      onCompleteCalledRef.current = true
      const timer = setTimeout(() => {
        onComplete()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [diceResults, currentIndex, onComplete])

  if (diceResults.length === 0 || displayedDice.length === 0) {
    return null
  }

  return (
    <div
      className="relative pointer-events-none z-50 flex justify-center"
      style={{
        width: '100%',
      }}
    >
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-center">
        {displayedDice.map((value, index) => (
          <div
            key={index}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/90 rounded-lg border-2 border-cyan-400 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-black text-cyan-600 shadow-lg animate-[dicePop_0.4s_ease-out]"
            style={{
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {value === -1 ? '⚡' : value}
          </div>
        ))}
      </div>
    </div>
  )
}

