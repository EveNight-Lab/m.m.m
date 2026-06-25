import { useEffect, useState, useRef, useMemo } from 'react'
import type { WorldView } from '../constants/worldViews'
import { getWorldViewColors } from '../constants/worldViews'

interface Dice2DSceneProps {
  diceList: Array<{ id: string; theme: string; position: [number, number, number] }>
  onDiceRoll?: (id: string, result: number) => void
  onRollAllReady?: (rollAll: () => void) => void
  attackerChar?: { imageUrl?: string | null; imageData?: string | null; name: string; worldView?: WorldView }
  overlayMode?: boolean
  specialDiceValue?: number
}

export default function Dice2DScene({
  diceList,
  onDiceRoll,
  onRollAllReady,
  attackerChar,
  overlayMode = false,
  specialDiceValue
}: Dice2DSceneProps) {
  const [rolling, setRolling] = useState(false)
  const displayValuesRef = useRef<Record<string, number>>({})
  const [displayValues, setDisplayValues] = useState<Record<string, number>>({})
  
  const worldViewColors = useMemo(() => {
    if (attackerChar?.worldView) {
      return getWorldViewColors(attackerChar.worldView)
    }
    return null
  }, [attackerChar?.worldView])

  const primaryColor = worldViewColors?.primary || '#06b6d4' // default cyan

  // Initialize display values
  useEffect(() => {
    const initial: Record<string, number> = {}
    diceList.forEach(d => {
      initial[d.id] = specialDiceValue !== undefined ? specialDiceValue : 1
    })
    setDisplayValues(initial)
    displayValuesRef.current = initial
  }, [diceList, specialDiceValue])

  // Roll function
  const rollAllDice = () => {
    if (rolling) return
    setRolling(true)

    let elapsed = 0
    const duration = 1000 // 1 second roll animation
    const intervalTime = 80 // fast number cycling

    // Start cycling numbers
    const interval = window.setInterval(() => {
      setDisplayValues(prev => {
        const next = { ...prev }
        diceList.forEach(d => {
          if (specialDiceValue !== undefined) {
            next[d.id] = specialDiceValue
          } else {
            next[d.id] = Math.floor(Math.random() * 6) + 1
          }
        })
        displayValuesRef.current = next
        return next
      })
      elapsed += intervalTime
      if (elapsed >= duration) {
        window.clearInterval(interval)
        
        // Determine final results
        const finalResults: Record<string, number> = {}
        diceList.forEach(d => {
          const result = specialDiceValue !== undefined 
            ? specialDiceValue 
            : Math.floor(Math.random() * 6) + 1
          finalResults[d.id] = result
          onDiceRoll?.(d.id, result)
        })
        setDisplayValues(finalResults)
        displayValuesRef.current = finalResults
        setRolling(false)
      }
    }, intervalTime)
  }

  // Register the roll function to parent
  useEffect(() => {
    if (onRollAllReady) {
      onRollAllReady(rollAllDice)
    }
  }, [onRollAllReady, diceList.length])

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30 p-4 rounded-lg">
      <div className="flex justify-center items-center gap-3">
        {diceList.map((dice) => {
          const value = displayValues[dice.id] || 1
          const isSpecial = value === -1
          
          return (
            <div
              key={dice.id}
              style={{
                borderColor: primaryColor,
                boxShadow: `0 0 15px ${primaryColor}40`,
              }}
              className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-black/80 border-2 rounded-xl text-lg md:text-2xl font-black text-white transition-all duration-100 ${
                rolling ? 'animate-pulse rotate-12 scale-110' : 'scale-100'
              }`}
            >
              {isSpecial ? '✨' : value}
            </div>
          )
        })}
      </div>
    </div>
  )
}
