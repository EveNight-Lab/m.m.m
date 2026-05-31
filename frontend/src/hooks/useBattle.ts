/**
 * 전투 상태 관리 커스텀 훅
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Character, BattleState, BattleCharacter, StatusEffect, BattleEvent } from '../types'
import { getMaxHP, getMaxMana, rollDice, calculateDamage, checkCombo } from '../utils/battleEngine'
import {
  canUseActiveSkill,
  applySkillEffect,
  processStatusEffects,
} from '../utils/skillProcessor'

/**
 * 캐릭터를 전투용 캐릭터로 변환
 */
function createBattleCharacter(character: Character): BattleCharacter {
  return {
    character,
    currentHP: getMaxHP(character),
    currentMana: getMaxMana(character),
    fatigue: 0,
    isBerserk: false,
    statusEffects: [],
    buffs: [],
  }
}

/**
 * 전투 훅
 */
export function useBattle(playerCharacter: Character | null, enemyCharacter: Character | null) {
  const [battleState, setBattleState] = useState<BattleState | null>(null)
  const battleStateRef = useRef<BattleState | null>(null) // 현재 상태를 추적하기 위한 ref
  const pendingDiceResultsRef = useRef<{ diceCount: number; attacker: 'player' | 'enemy'; specialDiceValue?: number } | null>(null) // 대기 중인 주사위 결과
  const turnProcessingRef = useRef<boolean>(false) // 턴 처리 중 플래그

  // 전투 시작
  const startBattle = useCallback(() => {
    if (!playerCharacter || !enemyCharacter) return

    const player = createBattleCharacter(playerCharacter)
    const enemy = createBattleCharacter(enemyCharacter)

    const initialState = {
      state: 'fighting' as const,
      player,
      enemy,
      turn: 0,
      battleTime: 0,
      events: [],
      autoMode: false,
    }
    setBattleState(initialState)
    battleStateRef.current = initialState
    turnProcessingRef.current = false // 전투 시작 시 플래그 초기화
    pendingDiceResultsRef.current = null // 주사위 결과 초기화
  }, [playerCharacter, enemyCharacter])

  // 주사위 굴리기 시작 (3D 주사위를 굴리기 위해 호출)
  const startDiceRoll = useCallback(() => {
    const stackTrace = new Error().stack
    console.log('[useBattle] startDiceRoll 호출됨', {
      battleStateRef: battleStateRef.current?.state,
      pendingDiceResultsRef: pendingDiceResultsRef.current,
      turnProcessingRef: turnProcessingRef.current,
      stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n')
    })
    
    // battleStateRef를 먼저 체크하여 중복 호출 방지
    if (battleStateRef.current?.state === 'attacking') {
      console.warn('[useBattle] startDiceRoll: 이미 attacking 상태임 (ref 체크), 무시', {
        battleStateRef: battleStateRef.current,
        pendingDiceResultsRef: pendingDiceResultsRef.current
      })
      return
    }
    
    // pendingDiceResultsRef가 이미 있으면 무시 (이미 주사위 굴리는 중)
    if (pendingDiceResultsRef.current) {
      console.warn('[useBattle] startDiceRoll: pendingDiceResultsRef가 이미 있음, 무시', {
        pendingDiceResultsRef: pendingDiceResultsRef.current,
        battleStateRef: battleStateRef.current
      })
      return
    }
    
    setBattleState((prev) => {
      if (!prev || prev.state !== 'fighting') {
        return prev
      }

      // 이미 attacking 상태면 무시 (중복 호출 방지)
      // 함수형 업데이트이므로 prev만 체크하면 됨
      // TypeScript 타입 가드: prev.state가 'fighting'이면 'attacking'이 될 수 없지만, 
      // 비동기 업데이트 중 상태 변경 가능성을 대비한 체크
      if (prev.state !== 'fighting') {
        return prev
      }
      
      // pendingDiceResultsRef가 이미 설정되어 있으면 무시 (React Strict Mode에서 두 번째 실행 방지)
      if (pendingDiceResultsRef.current) {
        return prev
      }

      // 현재 턴의 공격자 결정 (플레이어가 먼저, 그 다음 적)
      const attacker = prev.turn % 2 === 0 ? 'player' : 'enemy'
      let attackerChar = attacker === 'player' ? prev.player : prev.enemy

      // 다음턴 효과 적용 및 초기화
      const nextTurnEffects = attackerChar.nextTurnEffects
      let currentDiceCount = Math.max(1, attackerChar.character.stats.diceCount) // 최소 1개
      let specialDiceValue: number | undefined = undefined

      if (nextTurnEffects) {
        // 주사위 수 수정자 적용
        if (nextTurnEffects.diceCountModifier !== undefined) {
          currentDiceCount = Math.max(1, currentDiceCount + nextTurnEffects.diceCountModifier)
        }
        
        // 특수 주사위 값 저장
        if (nextTurnEffects.specialDice !== undefined) {
          specialDiceValue = nextTurnEffects.specialDice
        }
        
        // 다음턴 효과 사용 후 제거
        attackerChar = {
          ...attackerChar,
          nextTurnEffects: undefined,
        }
      }

      // 업데이트된 공격자 정보 반영
      const newState = { ...prev, state: 'attacking' as const }
      if (attacker === 'player') {
        newState.player = attackerChar
      } else {
        newState.enemy = attackerChar
      }

      console.log('[useBattle] 주사위 굴리기 시작, 턴:', prev.turn, '공격자:', attacker, '주사위 수:', currentDiceCount, '특수 주사위:', specialDiceValue)
      
      battleStateRef.current = newState
      pendingDiceResultsRef.current = { 
        diceCount: currentDiceCount, 
        attacker,
        specialDiceValue, // 특수 주사위 값 전달
      }
      
      return newState
    })
  }, [])

  // 주사위 결과 적용 (3D 주사위에서 결과를 받아서 전투 로직 진행)
  const applyDiceResults = useCallback((diceResults: number[]) => {
    console.log('[useBattle] applyDiceResults 호출, 결과:', diceResults, 'pendingDiceResultsRef:', pendingDiceResultsRef.current)
    
    // pendingDiceResultsRef를 먼저 체크하여 중복 호출 방지
    if (!pendingDiceResultsRef.current) {
      console.warn('[useBattle] applyDiceResults: pendingDiceResultsRef가 null (이미 처리됨), 무시')
      return
    }
    
    setBattleState((prev) => {
      if (!prev) {
        console.warn('[useBattle] applyDiceResults: prev가 null')
        return prev
      }
      if (prev.state !== 'attacking') {
        console.warn('[useBattle] applyDiceResults: 상태가 attacking이 아님', prev.state)
        return prev
      }
      
      // pendingDiceResultsRef를 다시 체크 (비동기 업데이트 중일 수 있음)
      if (!pendingDiceResultsRef.current) {
        console.warn('[useBattle] applyDiceResults: pendingDiceResultsRef가 null (이미 처리됨), 무시')
        return prev
      }

      const { diceCount, attacker } = pendingDiceResultsRef.current
      pendingDiceResultsRef.current = null // 즉시 초기화하여 중복 적용 방지

      let attackerChar = attacker === 'player' ? prev.player : prev.enemy
      let defenderChar = attacker === 'player' ? prev.enemy : prev.player

      const newEvents: BattleEvent[] = []

      // 주사위 굴리기 결과
      // 특수 값: -1만 특수 값으로 인식
      const specialCount = diceResults.filter(r => r === -1).length
      
      newEvents.push({
        type: 'skill',
        actor: attacker,
        message: `${attackerChar.character.name}이(가) 주사위 ${diceCount}개를 굴렸습니다! (${diceResults.join(', ')})`,
        timestamp: Date.now(),
      })

      // 콤보 체크
      const comboCheck = checkCombo(diceResults)
      let damageMultiplier = 1

      if (comboCheck.comboType === 'triple') {
        // 트리플: 각 주사위가 2번씩 발동 (데미지 2배)
        damageMultiplier = 2
        newEvents.push({
          type: 'skill',
          actor: attacker,
          message: `🎲 콤보 발동: ${comboCheck.comboName}! 같은 숫자 ${comboCheck.matchedValues?.[0]}이(가) 3개! 각 주사위가 2번씩 발동합니다!`,
          timestamp: Date.now(),
        })
      } else if (comboCheck.comboType === 'straight') {
        // 스트레이트: 다음 턴부터 주사위 갯수+1
        attackerChar = {
          ...attackerChar,
          nextTurnEffects: {
            ...attackerChar.nextTurnEffects,
            diceCountModifier: (attackerChar.nextTurnEffects?.diceCountModifier || 0) + 1,
          },
        }
        newEvents.push({
          type: 'skill',
          actor: attacker,
          message: `🎲 콤보 발동: ${comboCheck.comboName}! 연속된 숫자 ${comboCheck.matchedValues?.join(', ')}! 다음 턴부터 주사위 갯수+1!`,
          timestamp: Date.now(),
        })
      } else if (comboCheck.comboType === 'allzero') {
        // 올제로: 상대의 체력을 10으로 변경
        defenderChar = {
          ...defenderChar,
          currentHP: Math.min(10, defenderChar.currentHP), // 최대 체력보다 높으면 현재 체력 유지
        }
        newEvents.push({
          type: 'skill',
          actor: attacker,
          message: `🎲 콤보 발동: ${comboCheck.comboName}! 0이 3개! 상대의 체력을 10으로 변경합니다!`,
          timestamp: Date.now(),
        })
      }

      // 특수 행동 처리 (6이 나온 개수만큼 실행)
      if (specialCount > 0) {
        for (let i = 0; i < specialCount; i++) {
          const activeSkill = attackerChar.character.activeSkill
          const effect = activeSkill.effect

          // 특수 행동 실행
          const skillResult = applySkillEffect(effect, attackerChar, defenderChar)
          attackerChar = skillResult.self
          defenderChar = skillResult.enemy

          newEvents.push({
            type: 'skill',
            actor: attacker,
            message: `${attackerChar.character.name}이(가) 특수 행동 "${activeSkill.name}"을(를) 실행했습니다!`,
            timestamp: Date.now(),
          })
          newEvents.push(...skillResult.events)
        }
      }

      // 데미지 계산 (특수 값이 아닌 주사위들의 합 + 고정피해 - 방어력)
      // 매 턴마다 현재 스텟 확인 (변동 가능)
      const currentFixedDamage = attackerChar.character.stats.fixedDamage
      const currentDefense = defenderChar.character.stats.defense
      
      // 트리플인 경우 주사위 합을 2배로 계산
      const damage = calculateDamage(diceResults, currentFixedDamage, currentDefense, damageMultiplier)

      // 데미지 적용
      const newState = { ...prev }
      if (attacker === 'player') {
        newState.enemy = { ...defenderChar, currentHP: Math.max(0, defenderChar.currentHP - damage) }
        newState.player = attackerChar
      } else {
        newState.player = { ...defenderChar, currentHP: Math.max(0, defenderChar.currentHP - damage) }
        newState.enemy = attackerChar
      }

      newEvents.push({
        type: 'damage',
        actor: attacker,
        message: `${defenderChar.character.name}에게 ${damage}의 피해를 입혔습니다!`,
        timestamp: Date.now(),
        data: {
          damage,
          attackerAttack: diceResults.filter(r => r !== -1).reduce((sum, r) => sum + r, 0) + currentFixedDamage,
          defenderDefense: currentDefense,
        },
      })

      // 승패 체크
      if (newState.player.currentHP <= 0 || newState.enemy.currentHP <= 0) {
        newState.state = 'finished'
        turnProcessingRef.current = false // 전투 종료 시 플래그 해제
      } else {
        // 턴 종료
        newState.turn += 1
        newState.state = 'fighting' // 턴 종료, 다음 턴 준비
        turnProcessingRef.current = false // 다음 턴 준비 완료
      }

      newState.events = [...newState.events, ...newEvents]
      battleStateRef.current = newState
      console.log('[useBattle] 주사위 결과 적용 완료, 다음 턴:', newState.turn, '상태:', newState.state, '승패:', newState.state === 'finished' ? '종료' : '진행중')
      return newState
    })
  }, [])

  // 턴제 공격 처리 (플레이어가 먼저, 그 다음 적)
  // 주사위 굴리기만 시작하고, 결과는 applyDiceResults에서 처리
  const processTurn = useCallback(() => {
    const stackTrace = new Error().stack
    console.log('[useBattle] processTurn 호출됨', {
      battleStateRef: battleStateRef.current?.state,
      battleStateRefTurn: battleStateRef.current?.turn,
      pendingDiceResultsRef: pendingDiceResultsRef.current,
      turnProcessingRef: turnProcessingRef.current,
      stackTrace: stackTrace?.split('\n').slice(1, 4).join('\n')
    })
    
    // 이미 attacking 상태면 무시 (중복 호출 방지)
    if (battleStateRef.current?.state === 'attacking') {
      console.warn('[useBattle] processTurn: 이미 attacking 상태임, 무시', {
        battleStateRef: battleStateRef.current,
        pendingDiceResultsRef: pendingDiceResultsRef.current
      })
      return
    }
    
    // pendingDiceResultsRef가 있으면 아직 주사위 결과를 기다리는 중이므로 무시
    if (pendingDiceResultsRef.current) {
      console.warn('[useBattle] processTurn: pendingDiceResultsRef가 있음, 무시', {
        pendingDiceResultsRef: pendingDiceResultsRef.current,
        battleStateRef: battleStateRef.current
      })
      return
    }
    
    console.log('[useBattle] processTurn: startDiceRoll 호출 시작')
    startDiceRoll()
  }, [startDiceRoll])

  // 공격 처리 (기존 호환성 유지 - 게이지 시스템 제거 후 턴제로 변경)
  const processAttack = useCallback((attacker: 'player' | 'enemy') => {
    // 턴제로 변경되었으므로 processTurn 사용
    processTurn()
  }, [processTurn])

  // 전투 시간 업데이트
  useEffect(() => {
    if (!battleState || battleState.state !== 'fighting') return

    const timeInterval = setInterval(() => {
      setBattleState((prev) => {
        if (!prev || prev.state !== 'fighting') return prev
        return { ...prev, battleTime: prev.battleTime + 0.1 }
      })
    }, 100)

    return () => clearInterval(timeInterval)
  }, [battleState])

  // 상태이상 타이머 처리 (공격 턴 중에는 멈춤)
  useEffect(() => {
    if (!battleState || battleState.state !== 'fighting') return

    const statusInterval = setInterval(() => {
      setBattleState((prev) => {
        if (!prev || prev.state !== 'fighting') return prev

        // 상태이상 처리 (공격 턴 중에는 멈춤)
        const playerStatus = processStatusEffects(prev.player, true)
        const enemyStatus = processStatusEffects(prev.enemy, false)

        const newEvents: BattleEvent[] = [
          ...playerStatus.events,
          ...enemyStatus.events,
        ]

        // 상태이상 효과가 있을 때만 업데이트
        if (newEvents.length > 0 || playerStatus.battleChar !== prev.player || enemyStatus.battleChar !== prev.enemy) {
          return {
            ...prev,
            player: playerStatus.battleChar,
            enemy: enemyStatus.battleChar,
            events: [...prev.events, ...newEvents],
          }
        }

        return prev
      })
    }, 1000) // 1초마다 상태이상 처리

    return () => clearInterval(statusInterval)
  }, [battleState])

  // 턴제 전투: 플레이어가 먼저 공격하고, 그 다음 적이 공격
  // 전투 상태가 'fighting'일 때 자동으로 다음 턴 시작
  useEffect(() => {
    console.log('[useBattle] 턴 시작 useEffect 실행', {
      battleState: battleState?.state,
      battleStateTurn: battleState?.turn,
      turnProcessingRef: turnProcessingRef.current,
      pendingDiceResultsRef: pendingDiceResultsRef.current,
      battleStateRef: battleStateRef.current?.state
    })
    
    if (!battleState || battleState.state !== 'fighting') {
      console.log('[useBattle] 턴 시작 useEffect: fighting 상태가 아님, 플래그 해제')
      turnProcessingRef.current = false
      return
    }

    // 이미 처리 중이면 무시
    if (turnProcessingRef.current) {
      console.log('[useBattle] 턴 시작 useEffect: 이미 처리 중, 무시')
      return
    }

    // pendingDiceResultsRef가 있으면 아직 주사위 결과를 기다리는 중이므로 무시
    if (pendingDiceResultsRef.current) {
      console.log('[useBattle] 턴 시작 useEffect: pending 결과 있음, 무시', {
        pendingDiceResultsRef: pendingDiceResultsRef.current
      })
      return
    }
    
    // battleStateRef가 이미 attacking 상태면 무시
    if (battleStateRef.current?.state === 'attacking') {
      console.log('[useBattle] 턴 시작 useEffect: 이미 attacking 상태, 무시', {
        battleStateRef: battleStateRef.current
      })
      return
    }

    console.log('[useBattle] 턴 시작 예약, 현재 턴:', battleState.turn, '상태:', battleState.state)
    
    // 처리 중 플래그 설정
    turnProcessingRef.current = true
    
    // 첫 턴은 0.5초 후, 다음 턴들은 1초 후 시작
    const delay = battleState.turn === 0 ? 500 : 1000
    
    console.log('[useBattle] 턴 시작 타이머 설정', { delay, turn: battleState.turn })
    
    const timer = setTimeout(() => {
      console.log('[useBattle] 턴 시작 타이머 실행', {
        battleStateRef: battleStateRef.current?.state,
        pendingDiceResultsRef: pendingDiceResultsRef.current,
        turnProcessingRef: turnProcessingRef.current
      })
      
      // 타이머 실행 시점에 다시 한 번 체크
      if (battleStateRef.current?.state === 'attacking' || pendingDiceResultsRef.current) {
        console.warn('[useBattle] 턴 시작 타이머: 이미 attacking 상태이거나 pending 결과가 있음, 무시', {
          battleStateRef: battleStateRef.current,
          pendingDiceResultsRef: pendingDiceResultsRef.current
        })
        turnProcessingRef.current = false
        return
      }
      
      console.log('[useBattle] 턴 시작 실행, 턴:', battleState.turn)
      processTurn()
      // turnProcessingRef는 applyDiceResults 완료 시 해제됨
    }, delay)

    return () => {
      console.log('[useBattle] 턴 시작 useEffect cleanup', { turn: battleState?.turn })
      clearTimeout(timer)
      // cleanup 시에는 플래그를 해제하지 않음 (타이머가 취소된 경우에만)
      // 실제 턴 처리가 완료되면 applyDiceResults에서 해제됨
    }
  }, [battleState?.state, battleState?.turn, processTurn])

  return {
    battleState,
    startBattle,
    processAttack,
    startDiceRoll,
    applyDiceResults,
  }
}
