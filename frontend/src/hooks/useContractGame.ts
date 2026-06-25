import { useState, useEffect, useCallback, useRef } from 'react'
import type { ContractGameConfig } from '../utils/contractGameStats'
import type { ContractGameState } from '../types'

export interface UseContractGameReturn {
  gameState: ContractGameState
  gauge: number
  gaugePercent: number
  barPosition: number
  targetZones: number[]
  cycleCount: number
  handleClick: () => void
  handleStart: () => void
  resetGame: () => void
}

/**
 * 계약 게임 로직을 관리하는 커스텀 훅
 * 게임 상태, 게이지, 타이밍 바 위치 등을 관리합니다.
 */
export function useContractGame(
  config: ContractGameConfig,
  onSuccess: () => void
): UseContractGameReturn {
  const [gameState, setGameState] = useState<ContractGameState>('waiting')
  const [gauge, setGauge] = useState(config.initialGauge)
  const [barPosition, setBarPosition] = useState(0)
  const [targetZones, setTargetZones] = useState<number[]>([])
  const [cycleCount, setCycleCount] = useState(0) // 바퀴 수

  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>(0) // 게임 시작 시간 (정확한 위치 계산용)
  const barPositionRef = useRef<number>(0) // 클릭 시점의 정확한 위치를 위한 ref

  // 단일 타겟 존 생성 (기존 존들과 겹치지 않도록)
  const generateSingleZone = useCallback((existingZones: number[]): [number, number] | null => {
    const minGap = config.successZoneWidth * 0.5 // 구간 간 최소 간격 (구간 폭의 50%)
    
    // 사용 가능한 위치들
    const availablePositions: number[] = []
    for (let pos = 10; pos <= 90 - config.barWidth - config.successZoneWidth; pos += 1) {
      availablePositions.push(pos)
    }

    // 랜덤하게 위치 선택 시도
    let attempts = 0
    while (attempts < 100) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length)
      const zoneStart = availablePositions[randomIndex]
      const zoneEnd = Math.min(zoneStart + config.successZoneWidth, 90 - config.barWidth)
      
      // 기존 존들과 겹치지 않는지 확인
      const valid = existingZones.every((existingStart, idx) => {
        if (idx % 2 === 0) {
          const existingEnd = existingZones[idx + 1]
          const newEnd = zoneEnd
          return (
            (newEnd < existingStart - minGap) || 
            (zoneStart > existingEnd + minGap)
          )
        }
        return true
      })

      if (valid) {
        return [zoneStart, zoneEnd]
      }

      attempts++
    }

    // 랜덤 배치 실패 시 null 반환 (드물지만 가능)
    return null
  }, [config.barWidth, config.successZoneWidth])

  // 타겟 구간 생성 (마나에 따라 개수 결정, 랜덤 위치)
  const generateTargetZones = useCallback(() => {
    const zones: number[] = []
    const zoneCount = config.targetZones
    const totalWidth = 100 - config.barWidth // 바가 움직일 수 있는 범위
    const availableWidth = totalWidth - 20 // 양쪽 여백 10%씩
    const minGap = config.successZoneWidth * 0.5 // 구간 간 최소 간격 (구간 폭의 50%)

    // 사용 가능한 위치들을 랜덤하게 선택
    const availablePositions: number[] = []
    for (let pos = 10; pos <= 90 - config.barWidth - config.successZoneWidth; pos += 1) {
      availablePositions.push(pos)
    }

    // 구간들을 랜덤하게 배치
    const selectedZones: number[] = []
    for (let i = 0; i < zoneCount; i++) {
      let attempts = 0
      let zoneStart: number
      let valid = false

      // 겹치지 않는 위치를 찾을 때까지 시도
      while (!valid && attempts < 100) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length)
        zoneStart = availablePositions[randomIndex]
        
        // 기존 구간들과 겹치지 않는지 확인
        valid = selectedZones.every((existingStart, idx) => {
          if (idx % 2 === 0) {
            const existingEnd = selectedZones[idx + 1]
            // 새 구간이 기존 구간과 겹치지 않고, 최소 간격을 유지하는지 확인
            const newEnd = zoneStart + config.successZoneWidth
            return (
              (newEnd < existingStart - minGap) || 
              (zoneStart > existingEnd + minGap)
            )
          }
          return true
        })

        attempts++
      }

      if (valid && zoneStart !== undefined) {
        const zoneEnd = Math.min(zoneStart + config.successZoneWidth, 90 - config.barWidth)
        selectedZones.push(zoneStart, zoneEnd)
        zones.push(zoneStart, zoneEnd)
      } else {
        // 랜덤 배치가 실패하면 균등하게 배치 (폴백)
        const fallbackStart = 10 + (availableWidth / zoneCount) * i
        const fallbackEnd = Math.min(fallbackStart + config.successZoneWidth, 90 - config.barWidth)
        zones.push(fallbackStart, fallbackEnd)
      }
    }

    // 구간들을 시작 위치 순으로 정렬 (시각적으로 깔끔하게)
    const zonePairs: Array<[number, number]> = []
    for (let i = 0; i < zones.length; i += 2) {
      zonePairs.push([zones[i], zones[i + 1]])
    }
    zonePairs.sort((a, b) => a[0] - b[0])

    // 정렬된 구간들을 평탄화
    const finalZones: number[] = []
    for (const [start, end] of zonePairs) {
      finalZones.push(start, end)
    }

    return finalZones.length > 0 ? finalZones : zones
  }, [config.targetZones, config.barWidth, config.successZoneWidth])

  // 게임 초기화
  const resetGame = useCallback(() => {
    setGameState('waiting')
    setGauge(config.initialGauge)
    setBarPosition(0)
    barPositionRef.current = 0
    setCycleCount(0)
    cycleCountRef.current = 0
    accumulatedDistanceRef.current = 0
    lastTimestampRef.current = null
    const zones = generateTargetZones()
    setTargetZones(zones)
    startTimeRef.current = 0
  }, [config.initialGauge, generateTargetZones])

  // 게임 시작
  const handleStart = useCallback(() => {
    if (gameState === 'waiting') {
      // 시작 시간 기록 (정확한 위치 계산을 위해)
      const now = performance.now()
      startTimeRef.current = now
      lastTimestampRef.current = now
      setBarPosition(0)
      barPositionRef.current = 0
      accumulatedDistanceRef.current = 0
      cycleCountRef.current = 0
      // 상태를 마지막에 변경하여 애니메이션이 제대로 시작되도록
      // requestAnimationFrame이 즉시 시작되도록 약간의 지연 추가
      requestAnimationFrame(() => {
        setGameState('playing')
      })
    }
  }, [gameState])

  // 게임 시작 시 초기화
  // config의 개별 값들을 의존성으로 사용하여 무한 루프 방지
  useEffect(() => {
    resetGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.initialGauge,
    config.targetZones,
    config.barWidth,
    config.successZoneWidth,
  ])

  // cycleCount를 ref로 관리하여 애니메이션 재시작 방지
  const cycleCountRef = useRef(0)
  const lastTimestampRef = useRef<number | null>(null)
  const accumulatedDistanceRef = useRef(0) // 누적 이동 거리 (0~100% 사이)
  const dynamicBarSpeedRef = useRef<number>(config.barSpeed)

  // 타이밍 바 애니메이션 (시간 기반 정확한 계산으로 무한 회전)
  // 자동 감소량이 증가할수록 바 속도도 증가
  useEffect(() => {
    // playing 상태일 때만 애니메이션 실행
    if (gameState !== 'playing') {
      // 게임이 중지되면 애니메이션도 중지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      lastTimestampRef.current = null
      return
    }

    // 시작 시간이 없으면 초기화
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now()
      accumulatedDistanceRef.current = 0
      cycleCountRef.current = 0
      lastTimestampRef.current = null
    }

    const animate = (timestamp: number) => {
      // 이전 프레임과의 시간 차이 계산
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }
      const deltaTime = timestamp - lastTimestampRef.current
      lastTimestampRef.current = timestamp
      
      // 기본 barSpeed (전체 구간을 지나가는 데 걸리는 시간, 밀리초)
      const baseBarSpeed = Math.max(500, Math.min(5000, config.barSpeed))
      
      // 자동 감소량 계산 (cycleCountRef에 비례)
      const baseLoss = Math.max(0.5, config.failureLoss * 0.2)
      const zoneCount = config.targetZones
      let cycleMultiplierRate: number
      if (zoneCount === 1) {
        cycleMultiplierRate = 0.3
      } else if (zoneCount === 2) {
        cycleMultiplierRate = 0.5
      } else {
        cycleMultiplierRate = 0.5
      }
      const cycleMultiplier = 1 + (cycleCountRef.current * cycleMultiplierRate)
      const passiveLoss = baseLoss * cycleMultiplier
      
      // 자동 감소량이 증가할수록 바 속도 증가 (barSpeed 감소 = 속도 증가)
      // 난이도 상승에 따른 속도 증가를 완화하여 예측 가능한 리듬 유지 (최대 15%만 증가)
      const lossMultiplier = passiveLoss / baseLoss // 감소량 배수
      const speedReduction = Math.min(0.15, (lossMultiplier - 1) * 0.01)
      const dynamicBarSpeed = baseBarSpeed * (1 - speedReduction)
      dynamicBarSpeedRef.current = dynamicBarSpeed
      
      // 속도 변화에 따른 거리 증가 (deltaTime 동안 이동한 거리)
      const distancePerMs = 100 / dynamicBarSpeed // 1ms당 이동 거리 (%)
      const distanceDelta = deltaTime * distancePerMs
      
      // 누적 거리 업데이트 (부드러운 연속성 유지)
      accumulatedDistanceRef.current += distanceDelta
      
      // 바퀴 수 계산
      const newCycleCount = Math.floor(accumulatedDistanceRef.current / 100)
      if (newCycleCount !== cycleCountRef.current) {
        cycleCountRef.current = newCycleCount
        setCycleCount(newCycleCount)
      }
      
      // 위치 업데이트 (0~100% 사이로 정규화)
      const position = accumulatedDistanceRef.current % 100
      barPositionRef.current = position // ref에도 동시에 업데이트 (클릭 시점 정확한 위치 캡처)
      setBarPosition(position)

      // 게임이 계속 진행 중이면 다음 프레임 요청
      if (gameState === 'playing') {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    // 애니메이션 시작
    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      lastTimestampRef.current = null
    }
  }, [gameState, config.barSpeed, config.barWidth, config.failureLoss, config.targetZones])

  // 판정: 바가 타겟 구간 안에 있는지 확인하고 성공한 존의 인덱스 반환
  // ref(마지막 프레임 시뮬레이션)와 state(마지막 렌더링 화면)를 모두 확인하고, 반응 지연 보정을 위한 lookback 버퍼 검사 적용
  const checkHit = useCallback((): number | null => {
    const pointerPosRef = barPositionRef.current
    const pointerPosState = barPosition
    const currentSpeed = dynamicBarSpeedRef.current || config.barSpeed

    // 반응 속도 보정 (180ms 정도의 유저 반응 속도 및 입력 지연 보정)
    const reactionTimeMs = 180
    const reactionOffset = (reactionTimeMs / currentSpeed) * 100

    for (let i = 0; i < targetZones.length; i += 2) {
      const zoneStart = targetZones[i]
      const zoneEnd = targetZones[i + 1]

      // 사용자가 시각적으로 인식하고 누른 위치의 오차 보정 (4% 여유)
      const tolerance = 4.0
      
      // 현재 포인터 위치와 반응 속도를 고려한 과거 위치들 검사 (과거 궤적 보간)
      const pointsToCheck = [
        pointerPosRef,
        pointerPosState,
        (pointerPosRef - reactionOffset * 0.2 + 100) % 100,
        (pointerPosRef - reactionOffset * 0.4 + 100) % 100,
        (pointerPosRef - reactionOffset * 0.6 + 100) % 100,
        (pointerPosRef - reactionOffset * 0.8 + 100) % 100,
        (pointerPosRef - reactionOffset + 100) % 100,
        (pointerPosState - reactionOffset * 0.25 + 100) % 100,
        (pointerPosState - reactionOffset * 0.5 + 100) % 100,
        (pointerPosState - reactionOffset * 0.75 + 100) % 100,
        (pointerPosState - reactionOffset + 100) % 100,
      ]

      const isHit = pointsToCheck.some(p => p >= zoneStart - tolerance && p <= zoneEnd + tolerance)

      if (isHit) {
        return i // 성공한 존의 시작 인덱스 반환
      }
    }

    return null // 실패
  }, [targetZones, barPosition, config.barSpeed])

  // 버튼 클릭 핸들러
  const handleClick = useCallback(() => {
    if (gameState !== 'playing') return

    const hitZoneIndex = checkHit()

    if (hitZoneIndex !== null) {
      // 성공: 게이지 증가 및 성공한 존 제거 후 새 존 생성
      setGauge((prev) => {
        const newGauge = Math.min(config.maxGauge, prev + config.successGain)
        if (newGauge >= config.maxGauge) {
          setGameState('success')
          setTimeout(() => {
            onSuccess()
          }, 1000)
        }
        return newGauge
      })

      // 성공한 존 제거 및 새 존 생성
      setTargetZones((prevZones) => {
        // 성공한 존 제거 (시작 인덱스와 끝 인덱스 제거)
        const newZones = [...prevZones]
        newZones.splice(hitZoneIndex, 2)

        // 새 존 생성 (기존 존들과 겹치지 않도록)
        const newZone = generateSingleZone(newZones)
        if (newZone) {
          newZones.push(newZone[0], newZone[1])
          
          // 시작 위치 순으로 정렬
          const zonePairs: Array<[number, number]> = []
          for (let i = 0; i < newZones.length; i += 2) {
            zonePairs.push([newZones[i], newZones[i + 1]])
          }
          zonePairs.sort((a, b) => a[0] - b[0])
          
          // 정렬된 구간들을 평탄화
          const finalZones: number[] = []
          for (const [start, end] of zonePairs) {
            finalZones.push(start, end)
          }
          
          return finalZones.length > 0 ? finalZones : newZones
        }
        
        return newZones
      })
    } else {
      // 실패: 게이지 감소
      setGauge((prev) => {
        const newGauge = Math.max(0, prev - config.failureLoss)
        if (newGauge <= 0) {
          setGameState('failed')
        }
        return newGauge
      })
    }
  }, [gameState, checkHit, config, onSuccess, generateSingleZone])

  // 게임 진행 중 게이지 서서히 감소 (너무 천천히 판단하는 것 방지)
  // 바퀴 수에 비례해서 감소량 증가
  // 판정 구역 개수(마나)에 따라 감소량 증가폭 차등 적용
  useEffect(() => {
    if (gameState !== 'playing') {
      return
    }

    const timer = setInterval(() => {
      setGauge((prev) => {
        // 게이지가 이미 maxGauge에 도달했으면 감소하지 않음
        if (prev >= config.maxGauge) {
          return prev
        }

        // 기본 감소량 (실패 시 감소량의 1/5 정도)
        const baseLoss = Math.max(0.5, config.failureLoss * 0.2)
        
        // 판정 구역 개수에 따른 증가폭 조정
        // 구역이 적을수록 증가폭을 줄임 (1개: 0.3배, 2개: 0.5배, 3개 이상: 0.5배)
        const zoneCount = config.targetZones
        let cycleMultiplierRate: number
        if (zoneCount === 1) {
          cycleMultiplierRate = 0.3 // 1개 구역: 바퀴당 30% 증가 (느리게 증가)
        } else if (zoneCount === 2) {
          cycleMultiplierRate = 0.5 // 2개 구역: 바퀴당 50% 증가 (기존과 동일)
        } else {
          cycleMultiplierRate = 0.5 // 3개 이상: 바퀴당 50% 증가
        }
        
        // 바퀴 수에 비례해서 감소량 증가 (판정 구역 개수에 따라 증가폭 차등)
        // cycleCountRef를 사용하여 최신 값을 참조 (의존성 배열 문제 방지)
        // 예: 1개 구역, 0바퀴 = baseLoss, 1바퀴 = baseLoss * 1.3, 2바퀴 = baseLoss * 1.6, ...
        // 예: 2개 구역, 0바퀴 = baseLoss, 1바퀴 = baseLoss * 1.5, 2바퀴 = baseLoss * 2.0, ...
        const cycleMultiplier = 1 + (cycleCountRef.current * cycleMultiplierRate)
        const passiveLoss = baseLoss * cycleMultiplier

        const newGauge = Math.max(0, prev - passiveLoss)
        if (newGauge <= 0) {
          setGameState('failed')
          return 0
        }
        return newGauge
      })
    }, 1000) // 1초마다 감소

    return () => clearInterval(timer)
  }, [gameState, config.failureLoss, config.targetZones])

  const gaugePercent = (gauge / config.maxGauge) * 100

  return {
    gameState,
    gauge,
    gaugePercent,
    barPosition,
    targetZones,
    cycleCount,
    handleClick,
    handleStart,
    resetGame,
  }
}

