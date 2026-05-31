/**
 * 전투 페이지
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import MonsterCard from '../components/MonsterCard'
import SlotContainer from '../components/SlotContainer'
import { useAuth } from '../contexts/AuthContext'
import { getUserCharacters } from '../utils/characters'
import { getRandomUser, getOtherUserContractedMonsters } from '../utils/friends'
import type { Character } from '../types'
import { useBattle } from '../hooks/useBattle'
import { getMaxHP, getMaxMana } from '../utils/battleEngine'
import BattleCharacterDisplay from '../components/BattleCharacter'
import BattleEffect from '../components/BattleEffect'
import BattleDamageNumber from '../components/BattleDamageNumber'
import BattleDiceDisplay from '../components/BattleDiceDisplay'
import BattleDamageCalculation from '../components/BattleDamageCalculation'
import DamageSummationDisplay from '../components/DamageSummationDisplay'
import { checkCombo } from '../utils/battleEngine'
import { addInjury } from '../utils/injurySystem'
import Dice3DScene from '../components/Dice3D'

type BattleMode = 'select' | 'normal' | 'friend' | 'battling'

function Battle() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [battleMode, setBattleMode] = useState<BattleMode>('select') // 'select' | 'normal' | 'friend' | 'battling'
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Character | null>(null)
  const [selectedEnemy, setSelectedEnemy] = useState<Character | null>(null)
  const [enemyId, setEnemyId] = useState<string>('') // 특정 적 ID 입력
  const [isMatching, setIsMatching] = useState(false) // 매칭 중 상태
  const [playerAction, setPlayerAction] = useState<'attacking' | 'hit' | 'miss' | 'damaged' | 'defended' | null>(null)
  const [enemyAction, setEnemyAction] = useState<'attacking' | 'hit' | 'miss' | 'damaged' | 'defended' | null>(null)
  const [lastDamage, setLastDamage] = useState<{ damage: number; target: 'player' | 'enemy'; isCritical: boolean } | null>(null) // 마지막 데미지
  
  // 주사위 표시 및 데미지 계산 연출 상태
  const [diceDisplay, setDiceDisplay] = useState<{
    diceResults: number[]
    position: { x: number; y: number }
    attacker: 'player' | 'enemy'
  } | null>(null)
  const [damageSummation, setDamageSummation] = useState<{
    diceResults: number[]
    fixedDamage: number
    defense: number
    comboCheck: ReturnType<typeof checkCombo> | null
    specialActions: Array<{ name: string; effect: string }>
    position: { x: number; y: number }
    target: 'player' | 'enemy' // 피해를 받는 쪽 (방어자)
  } | null>(null)
  const [damageCalculation, setDamageCalculation] = useState<{
    diceTotal: number
    fixedDamage: number
    defense: number
    finalDamage: number
    position: { x: number; y: number }
    isAttacker: boolean
  } | null>(null)
  
  // 주사위 표시 완료 처리 중복 방지
  const diceDisplayProcessingRef = useRef<string | null>(null)

  const { battleState, startBattle, applyDiceResults } = useBattle(selectedPlayer, selectedEnemy)
  
  // 3D 주사위 관련 상태
  const [diceList, setDiceList] = useState<Array<{ id: string; theme: 'fantasy' | 'cyberpunk' | 'steampunk' | 'apocalypse' | 'futuristic'; position: [number, number, number] }>>([])
  const [diceResults, setDiceResults] = useState<Map<string, number>>(new Map())
  const rollAllDiceRef = useRef<(() => void) | null>(null)
  
  // 주사위 위치 계산 (그리드 형태) - 더 촘촘하게 배치
  const getGridPosition = (index: number, total: number): [number, number, number] => {
    const spacing = 1.8 // 간격 줄임
    const cols = Math.ceil(Math.sqrt(total))
    const row = Math.floor(index / cols)
    const col = index % cols
    const startX = -(cols - 1) * spacing / 2
    const startZ = -(Math.ceil(total / cols) - 1) * spacing / 2
    return [startX + col * spacing, 1.5, startZ + row * spacing] // 높이도 낮춤
  }
  
  // 전투 상태에 따라 주사위 리스트 업데이트
  const lastTurnRef = useRef<number>(-1)
  useEffect(() => {
    if (!battleState || battleState.state !== 'attacking') {
      setDiceList([])
      setDiceResults(new Map())
      if (battleState?.state !== 'attacking') {
        appliedResultsRef.current = null
      }
      return
    }
    
    // 새로운 턴이 시작되었는지 확인
    if (lastTurnRef.current !== battleState.turn) {
      lastTurnRef.current = battleState.turn
      appliedResultsRef.current = null // 새로운 턴이 시작되면 적용 결과 초기화
      setDiceResults(new Map()) // 주사위 결과 초기화
    }
    
    // 현재 공격자의 주사위 수 확인
    const attacker = battleState.turn % 2 === 0 ? 'player' : 'enemy'
    const attackerChar = attacker === 'player' ? battleState.player : battleState.enemy
    
    // 다음턴 효과 확인 (주사위 수 수정자 적용)
    let diceCount = Math.max(1, attackerChar.character.stats.diceCount)
    if (attackerChar.nextTurnEffects?.diceCountModifier !== undefined) {
      diceCount = Math.max(1, diceCount + attackerChar.nextTurnEffects.diceCountModifier)
    }
    
    // 주사위 리스트 생성 (판타지 테마로 통일)
    const newDiceList = Array.from({ length: diceCount }, (_, i) => ({
      id: `dice-${battleState.turn}-${i}`,
      theme: 'fantasy' as const,
      position: getGridPosition(i, diceCount),
    }))
    
    setDiceList(newDiceList)
  }, [battleState?.state, battleState?.turn])
  
  // 주사위 굴리기 (전투 턴 시작 시)
  useEffect(() => {
    if (battleState?.state === 'attacking' && diceList.length > 0 && rollAllDiceRef.current) {
      // 약간의 딜레이 후 주사위 굴리기 (startDiceRoll은 processTurn에서 이미 호출됨)
      const timer = setTimeout(() => {
        rollAllDiceRef.current?.()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [battleState?.state, diceList.length])
  
  // 주사위 결과 처리
  const handleDiceRoll = (diceId: string, result: number) => {
    setDiceResults(prev => {
      const newResults = new Map(prev)
      newResults.set(diceId, result)
      return newResults
    })
  }
  
  // 주사위 표시 완료 후 합산 구역 표시 시작
  const handleDiceDisplayComplete = () => {
    if (!battleState || !diceDisplay) {
      console.log('[Battle] handleDiceDisplayComplete: battleState 또는 diceDisplay 없음')
      return
    }
    
    // 중복 호출 방지: 이미 처리 중인 주사위 표시인지 확인
    const processingKey = `turn-${battleState.turn}-${diceDisplay.attacker}`
    
    // 플래그가 설정되어 있지 않으면 주사위 표시가 시작되지 않은 것이므로 무시
    if (diceDisplayProcessingRef.current !== processingKey) {
      console.log('[Battle] handleDiceDisplayComplete: 플래그 불일치, 무시', processingKey, '현재 플래그:', diceDisplayProcessingRef.current)
      return
    }
    
    // 이미 완료 처리 중인지 확인하는 별도 플래그 사용
    const completedKey = `${processingKey}-completed`
    if (diceDisplayProcessingRef.current === completedKey) {
      console.log('[Battle] handleDiceDisplayComplete: 이미 완료 처리됨, 무시', processingKey)
      return
    }
    
    // 완료 처리 플래그 설정
    diceDisplayProcessingRef.current = completedKey
    console.log('[Battle] handleDiceDisplayComplete 시작', processingKey, '주사위 결과:', diceDisplay.diceResults)
    
    const attacker = diceDisplay.attacker
    const attackerChar = attacker === 'player' ? battleState.player : battleState.enemy
    const defenderChar = attacker === 'player' ? battleState.enemy : battleState.player
    
    // 콤보 체크
    const comboCheck = checkCombo(diceDisplay.diceResults)
    
    // 특수 행동 수집
    const specialCount = diceDisplay.diceResults.filter(r => r === -1).length
    const specialActions: Array<{ name: string; effect: string }> = []
    if (specialCount > 0) {
      const activeSkill = attackerChar.character.activeSkill
      for (let i = 0; i < specialCount; i++) {
        specialActions.push({
          name: activeSkill.name,
          effect: activeSkill.effect,
        })
      }
    }
    
    const fixedDamage = attackerChar.character.stats.fixedDamage
    const defense = defenderChar.character.stats.defense
    
    // 주사위 결과 저장 (나중에 사용)
    const savedResults = [...diceDisplay.diceResults]
    
    console.log('[Battle] 합산 구역 표시 시작', processingKey, savedResults, comboCheck)
    
    // 합산 구역 표시 (피해를 받는 쪽(방어자)에 표시)
    const defender = attacker === 'player' ? 'enemy' : 'player'
    setDamageSummation({
      diceResults: diceDisplay.diceResults,
      fixedDamage,
      defense,
      comboCheck,
      specialActions,
      position: { x: 0, y: 0 }, // 위치는 BattleCharacter 내부에서 처리
      target: defender, // 피해를 받는 쪽
    })
  }
  
  // 합산 구역 표시 완료 후 실제 데미지 적용
  const handleSummationComplete = () => {
    if (!battleState || !damageSummation) {
      return
    }
    
    const savedResults = [...damageSummation.diceResults]
    
    // 합산 구역 제거
    setDamageSummation(null)
    setDiceDisplay(null)
    
    // 실제 데미지 적용
    console.log('[Battle] 실제 데미지 적용', savedResults)
    applyDiceResults(savedResults)
    
    // 플래그 해제 (데미지 적용 후)
    setTimeout(() => {
      diceDisplayProcessingRef.current = null
      console.log('[Battle] 플래그 해제 완료')
    }, 100)
  }
  
  // 턴이 변경되면 플래그 초기화
  useEffect(() => {
    if (battleState?.turn !== undefined) {
      // 새로운 턴이 시작되면 플래그 초기화
      const currentTurn = battleState.turn
      const timer = setTimeout(() => {
        // 턴이 변경되지 않았는지 확인
        if (battleState?.turn === currentTurn && diceDisplayProcessingRef.current) {
          const processingKey = diceDisplayProcessingRef.current
          const expectedKey = `turn-${currentTurn}-${battleState.turn % 2 === 0 ? 'player' : 'enemy'}`
          // 현재 턴의 플래그가 아니면 초기화
          if (processingKey !== expectedKey) {
            console.log('[Battle] 턴 변경으로 인한 플래그 초기화', processingKey, '->', expectedKey)
            diceDisplayProcessingRef.current = null
          }
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [battleState?.turn])
  
  // 모든 주사위가 멈췄을 때 결과 적용
  const appliedResultsRef = useRef<string | null>(null)
  const isApplyingRef = useRef<boolean>(false) // 적용 중 플래그 추가
  
  // fighting 상태로 변경되면 플래그 해제
  useEffect(() => {
    if (battleState?.state === 'fighting') {
      isApplyingRef.current = false
    }
  }, [battleState?.state])
  
  useEffect(() => {
    // attacking 상태가 아니면 실행하지 않음
    if (!battleState || battleState.state !== 'attacking' || diceList.length === 0) {
      return
    }
    
    // 이미 적용 중이면 무시
    if (isApplyingRef.current) {
      return
    }
    
    // 주사위 결과가 없으면 실행하지 않음
    if (diceResults.size === 0) {
      return
    }
    
    // 이미 적용된 결과인지 먼저 확인 (중복 적용 방지)
    const resultKey = `turn-${battleState.turn}-attacking`
    if (appliedResultsRef.current === resultKey) {
      return
    }
    
    const allDiceStopped = diceResults.size === diceList.length && diceResults.size > 0
    if (!allDiceStopped) {
      return
    }
    
    // 적용 중 플래그 설정 (먼저 설정하여 중복 실행 방지)
    isApplyingRef.current = true
    appliedResultsRef.current = resultKey
    
    // 주사위 결과 저장 (초기화 전에 저장)
    const results = Array.from(diceResults.values())
    
    // 주사위 결과를 전투 로직에 적용
    console.log('[Battle] 주사위 결과 적용 시도:', results, '턴:', battleState.turn, '주사위 수:', diceList.length)
    
    // 주사위 결과를 즉시 초기화하여 중복 적용 방지
    setDiceResults(new Map())
    
    // 현재 턴의 공격자 결정
    const attacker = battleState.turn % 2 === 0 ? 'player' : 'enemy'
    
    // 주사위 표시 시작 (실제 데미지 적용은 handleDiceDisplayComplete에서 처리)
    // 주사위 표시 시작 시 플래그 설정 (중복 방지)
    const processingKey = `turn-${battleState.turn}-${attacker}`
    diceDisplayProcessingRef.current = processingKey
    console.log('[Battle] 주사위 표시 시작, 플래그 설정:', processingKey)
    
    setDiceDisplay({
      diceResults: results,
      position: { x: 0, y: 0 }, // 위치는 BattleCharacter 내부에서 처리
      attacker,
    })
    
    // applyDiceResults는 handleDiceDisplayComplete에서 호출됨
  }, [diceResults, diceList.length, battleState?.state, battleState?.turn, applyDiceResults])

  // 전투 이벤트 감지하여 물리적 움직임 애니메이션
  useEffect(() => {
    if (!battleState || battleState.events.length === 0) return

    const lastEvent = battleState.events[battleState.events.length - 1]

    // 데미지 표시 및 애니메이션
    if (lastEvent.type === 'damage' && lastEvent.data?.damage) {
      const damage = lastEvent.data.damage
      const target = lastEvent.actor === 'player' ? 'enemy' : 'player'
      const isCritical = damage > 20 // 임계치 설정
      
      // 공격 애니메이션
      if (lastEvent.actor === 'player') {
        setPlayerAction('attacking')
        setTimeout(() => {
          setPlayerAction('hit')
          setEnemyAction('damaged')
          setTimeout(() => {
            setPlayerAction(null)
            setEnemyAction(null)
          }, 400)
        }, 300)
      } else {
        setEnemyAction('attacking')
        setTimeout(() => {
          setEnemyAction('hit')
          setPlayerAction('damaged')
          setTimeout(() => {
            setEnemyAction(null)
            setPlayerAction(null)
          }, 400)
        }, 300)
      }
      
      setLastDamage({ damage, target, isCritical })
      // 2초 후 제거
      setTimeout(() => setLastDamage(null), 2000)
    }
  }, [battleState?.events])

  // Firestore에서 캐릭터 목록 불러오기
  const { currentUser } = useAuth()
  
  // 자동 매칭 (몬스터 선택 시 호출)
  const handleAutoMatch = async (player: Character) => {
    console.log('[Battle] handleAutoMatch 시작', player.name)
    
    if (!currentUser) {
      console.error('[Battle] currentUser 없음')
      alert('로그인이 필요합니다.')
      return
    }
    
    setIsMatching(true)
    console.log('[Battle] 매칭 시작')
    
    try {
      // 무작위 사용자 선택
      console.log('[Battle] 무작위 사용자 선택 시작...')
      const randomUser = await getRandomUser(currentUser.uid)
      console.log('[Battle] 무작위 사용자 선택 결과:', randomUser)
      
      if (!randomUser) {
        console.warn('[Battle] 전투할 수 있는 다른 사용자가 없음')
        alert('전투할 수 있는 다른 사용자가 없습니다.')
        setIsMatching(false)
        return
      }
      
      // 해당 사용자의 계약된 몬스터 가져오기
      console.log('[Battle] 상대방 몬스터 가져오기 시작...', randomUser.userId)
      const enemyMonsters = await getOtherUserContractedMonsters(randomUser.userId)
      console.log('[Battle] 상대방 몬스터 개수:', enemyMonsters.length)
      
      if (enemyMonsters.length === 0) {
        console.warn('[Battle] 상대방에게 계약된 몬스터 없음')
        alert(`${randomUser.nickname}님에게 계약된 몬스터가 없습니다.`)
        setIsMatching(false)
        return
      }
      
      // 무작위 몬스터 선택
      const randomEnemy = enemyMonsters[Math.floor(Math.random() * enemyMonsters.length)]
      console.log('[Battle] 선택된 적:', randomEnemy.name)
      
      // selectedEnemy를 설정하고 battleMode를 변경
      // useEffect에서 selectedPlayer와 selectedEnemy가 모두 있을 때 자동으로 startBattle 호출
      setSelectedEnemy(randomEnemy)
      setBattleMode('battling')
      console.log('[Battle] selectedEnemy 설정 완료, battleMode 변경 완료')
    } catch (error) {
      console.error('[Battle] 자동 매칭 실패:', error)
      alert(`매칭에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      setIsMatching(false)
    }
  }

  // selectedPlayer와 selectedEnemy가 모두 있고 battleMode가 'battling'일 때 전투 시작
  useEffect(() => {
    if (selectedPlayer && selectedEnemy && battleMode === 'battling' && !battleState) {
      console.log('[Battle] selectedPlayer와 selectedEnemy 모두 설정됨, startBattle 호출', {
        player: selectedPlayer.name,
        enemy: selectedEnemy.name
      })
      try {
        startBattle()
        console.log('[Battle] startBattle 호출 완료')
      } catch (error) {
        console.error('[Battle] startBattle 에러:', error)
        alert('전투 시작에 실패했습니다.')
        setIsMatching(false)
        setBattleMode('normal')
      }
    }
  }, [selectedPlayer, selectedEnemy, battleMode, battleState, startBattle])

  // battleState가 생성되면 매칭 상태 해제
  useEffect(() => {
    if (battleState && battleMode === 'battling' && isMatching) {
      console.log('[Battle] battleState 생성됨, 매칭 상태 해제')
      setIsMatching(false)
    }
  }, [battleState, battleMode, isMatching])

  useEffect(() => {
    if (!currentUser) return

    const loadCharacters = async () => {
      try {
        const savedCharacters = await getUserCharacters(currentUser.uid)
        const normalizedCharacters = savedCharacters.map((char: Character) => ({
          ...char,
          contracted: char.contracted ?? false,
        }))
        const contractedCharacters = normalizedCharacters.filter((char: Character) => char.contracted) // 계약된 캐릭터만
        setCharacters(contractedCharacters)
        
        // URL 파라미터에서 플레이어 ID 읽기 (기존 호환성)
        const playerId = searchParams.get('player')
        if (playerId && battleMode === 'select') {
          const player = contractedCharacters.find((char) => char.id === playerId)
          if (player) {
            setSelectedPlayer(player)
            setBattleMode('normal')
            // 자동으로 랜덤 매칭 시작
            handleAutoMatch(player).catch(console.error)
          }
        }
      } catch (error) {
        console.error('캐릭터 목록 로드 실패:', error)
      }
    }

    loadCharacters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, searchParams])

  // 몬스터 선택 핸들러
  const handleSelectMonster = (character: Character) => {
    console.log('[Battle] handleSelectMonster 호출:', character.name)
    setSelectedPlayer(character)
    console.log('[Battle] handleAutoMatch 호출 예정')
    handleAutoMatch(character).catch((error) => {
      console.error('[Battle] handleAutoMatch 예외:', error)
      alert('매칭 중 오류가 발생했습니다.')
      setIsMatching(false)
    })
  }

  // 무작위 적 선택 (다른 사용자의 무작위 몬스터) - 기존 호환성 유지
  const selectRandomEnemy = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      // 무작위 사용자 선택
      const randomUser = await getRandomUser(currentUser.uid)
      if (!randomUser) {
        alert('전투할 수 있는 다른 사용자가 없습니다.')
        return
      }
      
      // 해당 사용자의 계약된 몬스터 가져오기
      const enemyMonsters = await getOtherUserContractedMonsters(randomUser.userId)
      if (enemyMonsters.length === 0) {
        alert(`${randomUser.nickname}님에게 계약된 몬스터가 없습니다.`)
        return
      }
      
      // 무작위 몬스터 선택
      const randomEnemy = enemyMonsters[Math.floor(Math.random() * enemyMonsters.length)]
      setSelectedEnemy(randomEnemy)
    } catch (error) {
      console.error('무작위 적 선택 실패:', error)
      alert('적 선택에 실패했습니다.')
    }
  }

  // ID로 적 선택 (다른 사용자의 몬스터 ID로 검색)
  const selectEnemyById = async () => {
    if (!enemyId.trim()) {
      alert('적 ID를 입력해주세요.')
      return
    }
    
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      // 모든 사용자 프로필을 가져와서 몬스터 검색
      const { collection, getDocs } = await import('firebase/firestore')
      const { db } = await import('../config/firebase')
      const profilesRef = collection(db, 'userProfiles')
      const profilesSnapshot = await getDocs(profilesRef)
      
      // 각 사용자의 몬스터를 검색
      for (const profileDoc of profilesSnapshot.docs) {
        const userId = profileDoc.id
        if (userId === currentUser.uid) continue // 자기 자신 제외
        
        try {
          const userMonsters = await getOtherUserContractedMonsters(userId)
          const enemy = userMonsters.find((char) => char.id === enemyId.trim())
          if (enemy) {
            setSelectedEnemy(enemy)
            return
          }
        } catch (error) {
          // 해당 사용자의 몬스터를 가져올 수 없으면 다음 사용자로
          continue
        }
      }
      
      alert('해당 ID의 캐릭터를 찾을 수 없습니다.')
    } catch (error) {
      console.error('적 ID로 검색 실패:', error)
      alert('적 검색에 실패했습니다.')
    }
  }

  // 전투 시작 (기존 호환성 유지)
  const handleStartBattle = () => {
    if (!selectedPlayer || !selectedEnemy) {
      alert('플레이어와 적을 모두 선택해주세요.')
      return
    }
    setBattleMode('battling')
    startBattle()
  }

  // 전투 모드 선택 핸들러
  const handleSelectMode = (mode: 'normal' | 'friend') => {
    setBattleMode(mode)
    if (mode === 'normal' && characters.length === 0) {
      alert('계약된 몬스터가 없습니다.')
      return
    }
  }

  // 뒤로가기 핸들러
  const handleBack = () => {
    if (battleState && battleState.state !== 'finished') {
      if (confirm('전투를 중단하시겠습니까?')) {
        setSelectedPlayer(null)
        setSelectedEnemy(null)
        setBattleMode('select')
      }
    } else {
      setSelectedPlayer(null)
      setSelectedEnemy(null)
      setBattleMode('select')
    }
  }

  // 전투 결과
  const battleResult = useMemo(() => {
    if (!battleState || battleState.state !== 'finished') return null

    if (battleState.player.currentHP <= 0 && battleState.enemy.currentHP <= 0) {
      return 'draw'
    }
    if (battleState.player.currentHP <= 0) {
      return 'lose'
    }
    return 'win'
  }, [battleState])

  // 패배 시 부상 추가 (사이드 이펙트는 useEffect에서 처리)
  useEffect(() => {
    if (battleResult === 'lose') {
      addInjury()
    }
  }, [battleResult])

  // 전투 모드 선택 화면
  if (battleMode === 'select') {
    return (
      <PageLayout title="전투">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 일반 전투 */}
            <Card>
              <button
                onClick={() => handleSelectMode('normal')}
                className="w-full p-8 text-center space-y-4 hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="text-4xl mb-4">⚔️</div>
                <h2 className="text-2xl font-black mb-2">일반 전투</h2>
                <p className="text-gray-400 text-sm">
                  랜덤 상대와 전투합니다
                </p>
              </button>
            </Card>

            {/* 친구와 전투 */}
            <Card>
              <button
                onClick={() => handleSelectMode('friend')}
                className="w-full p-8 text-center space-y-4 hover:scale-[1.02] transition-transform duration-200 opacity-50 cursor-not-allowed"
                disabled
              >
                <div className="text-4xl mb-4">👥</div>
                <h2 className="text-2xl font-black mb-2">친구와 전투</h2>
                <p className="text-gray-400 text-sm">
                  준비 중...
                </p>
              </button>
            </Card>
          </div>
        </div>
      </PageLayout>
    )
  }

  // 일반 전투 - 몬스터 선택 화면
  if (battleMode === 'normal' && !battleState) {
    return (
      <PageLayout title="전투 - 몬스터 선택">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">전투할 몬스터를 선택하세요</h2>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-semibold"
            >
              뒤로가기
            </button>
          </div>

          {isMatching ? (
            <Card>
              <div className="text-center py-8 space-y-4">
                <div className="text-4xl animate-spin">⚔️</div>
                <p className="text-lg font-semibold">상대를 찾는 중...</p>
              </div>
            </Card>
          ) : characters.length === 0 ? (
            <Card>
              <div className="text-center space-y-4 py-8">
                <p className="text-gray-300">계약된 캐릭터가 없습니다.</p>
                <button
                  onClick={() => navigate('/manage')}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg"
                >
                  관리 탭으로 이동
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <SlotContainer>
                {characters.map((character) => (
                  <MonsterCard
                    key={character.id}
                    character={character}
                    onClick={() => handleSelectMonster(character)}
                  />
                ))}
              </SlotContainer>
            </Card>
          )}
        </div>
      </PageLayout>
    )
  }

  // 친구와 전투 화면 (빈 틀)
  if (battleMode === 'friend') {
    return (
      <PageLayout title="친구와 전투">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">친구와 전투</h2>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-semibold"
            >
              뒤로가기
            </button>
          </div>
          <Card>
            <div className="text-center py-16 space-y-4">
              <div className="text-6xl mb-4 opacity-50">👥</div>
              <p className="text-xl font-semibold text-gray-400">준비 중입니다</p>
              <p className="text-sm text-gray-500">곧 친구와 함께 전투할 수 있습니다</p>
            </div>
          </Card>
        </div>
      </PageLayout>
    )
  }

  // 매칭 중이거나 battleState가 생성 중일 때
  if (isMatching || (battleMode === 'battling' && !battleState)) {
    return (
      <PageLayout title="전투">
        <Card>
          <div className="text-center py-8 space-y-4">
            <div className="text-4xl animate-spin">⚔️</div>
            <p className="text-lg font-semibold">상대를 찾는 중...</p>
          </div>
        </Card>
      </PageLayout>
    )
  }

  // 전투 진행 중 또는 전투 종료 화면
  return (
    <PageLayout title="전투">
      <div className="space-y-4">
        {/* 뒤로가기 버튼 (전투 종료 시에만) */}
        {battleState && battleState.state === 'finished' && (
          <div className="flex justify-end">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-semibold"
            >
              전투 선택으로
            </button>
          </div>
        )}


        {/* 전투 진행 중 */}
        {battleState && (battleState.state === 'fighting' || battleState.state === 'attacking') && (
          <Card>
            <div className="space-y-4">
              {/* 전투 장면 - 반응형 레이아웃 (넓으면 좌우, 좁으면 상하) */}
              <div className="relative flex flex-col md:flex-row items-center justify-around gap-2 md:gap-4 bg-gradient-to-b from-purple-900/20 via-blue-900/20 to-purple-900/20 rounded-lg p-2 md:p-4 border-2 border-cyan-500/30 overflow-visible" style={{ minHeight: 'calc(100vh - 250px)', maxHeight: 'calc(100vh - 200px)' }}>
                {/* 데미지 계산 연출 (기존 호환성 유지) */}
                {damageCalculation && (
                  <BattleDamageCalculation
                    diceTotal={damageCalculation.diceTotal}
                    fixedDamage={damageCalculation.fixedDamage}
                    defense={damageCalculation.defense}
                    finalDamage={damageCalculation.finalDamage}
                    position={damageCalculation.position}
                    isAttacker={damageCalculation.isAttacker}
                  />
                )}
                {/* 플레이어 캐릭터 */}
                <div className="relative z-10 order-1 md:order-1">
                  <BattleCharacterDisplay
                    battleChar={battleState.player}
                    isPlayer={true}
                    attackAction={playerAction}
                    diceOverlay={
                      battleState.state === 'attacking' && 
                      battleState.turn % 2 === 0 && 
                      diceList.length > 0 ? (
                        <Dice3DScene
                          diceList={diceList}
                          onDiceRoll={handleDiceRoll}
                          onRollAllReady={(rollAll) => {
                            rollAllDiceRef.current = rollAll
                          }}
                          attackerChar={battleState.player.character}
                          overlayMode={true}
                          specialDiceValue={battleState.player.nextTurnEffects?.specialDice}
                        />
                      ) : undefined
                    }
                    diceDisplay={
                      diceDisplay && diceDisplay.attacker === 'player' ? {
                        diceResults: diceDisplay.diceResults,
                        onComplete: handleDiceDisplayComplete,
                      } : null
                    }
                    damageSummation={
                      damageSummation && damageSummation.diceResults.length > 0 && damageSummation.target === 'player' ? {
                        diceResults: damageSummation.diceResults,
                        fixedDamage: damageSummation.fixedDamage,
                        defense: damageSummation.defense,
                        comboCheck: damageSummation.comboCheck,
                        specialActions: damageSummation.specialActions,
                        onComplete: handleSummationComplete,
                      } : null
                    }
                  />
                  {/* 데미지 숫자 표시 (플레이어가 피해를 받았을 때) */}
                  {lastDamage && lastDamage.target === 'player' && (
                    <BattleDamageNumber
                      damage={lastDamage.damage}
                      isCritical={lastDamage.isCritical}
                      position={{ x: 50, y: 40 }}
                    />
                  )}
                </div>

                {/* VS 표시 */}
                <div className="absolute left-1/2 top-1/2 md:left-1/2 md:top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 order-2 md:order-2">
                  <div className="text-2xl md:text-3xl lg:text-4xl font-black text-white/30 drop-shadow-lg">VS</div>
                </div>

                {/* 적 캐릭터 */}
                <div className="relative z-10 order-3 md:order-3">
                  <BattleCharacterDisplay
                    battleChar={battleState.enemy}
                    isPlayer={false}
                    attackAction={enemyAction}
                    diceOverlay={
                      battleState.state === 'attacking' && 
                      battleState.turn % 2 === 1 && 
                      diceList.length > 0 ? (
                        <Dice3DScene
                          diceList={diceList}
                          onDiceRoll={handleDiceRoll}
                          onRollAllReady={(rollAll) => {
                            rollAllDiceRef.current = rollAll
                          }}
                          attackerChar={battleState.enemy.character}
                          overlayMode={true}
                          specialDiceValue={battleState.enemy.nextTurnEffects?.specialDice}
                        />
                      ) : undefined
                    }
                    diceDisplay={
                      diceDisplay && diceDisplay.attacker === 'enemy' ? {
                        diceResults: diceDisplay.diceResults,
                        onComplete: handleDiceDisplayComplete,
                      } : null
                    }
                    damageSummation={
                      damageSummation && damageSummation.diceResults.length > 0 && damageSummation.target === 'enemy' ? {
                        diceResults: damageSummation.diceResults,
                        fixedDamage: damageSummation.fixedDamage,
                        defense: damageSummation.defense,
                        comboCheck: damageSummation.comboCheck,
                        specialActions: damageSummation.specialActions,
                        onComplete: handleSummationComplete,
                      } : null
                    }
                  />
                  {/* 데미지 숫자 표시 (적이 피해를 받았을 때) */}
                  {lastDamage && lastDamage.target === 'enemy' && (
                    <BattleDamageNumber
                      damage={lastDamage.damage}
                      isCritical={lastDamage.isCritical}
                      position={{ x: 50, y: 40 }}
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 전투 종료 */}
        {battleState && battleState.state === 'finished' && (
          <Card>
            <div className="space-y-4 text-center">
              <div className="text-2xl font-bold">
                {battleResult === 'win' && '승리!'}
                {battleResult === 'lose' && '패배!'}
                {battleResult === 'draw' && '무승부!'}
              </div>
              <button
                onClick={handleBack}
                className="w-full p-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold"
              >
                전투 선택으로
              </button>
            </div>
          </Card>
        )}

        {/* 캐릭터가 없을 때 */}
        {characters.length === 0 && (
          <Card>
            <div className="text-center space-y-4">
              <p className="text-gray-300">계약된 캐릭터가 없습니다.</p>
              <button
                onClick={() => navigate('/manage')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg"
              >
                관리 탭으로 이동
              </button>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}

export default Battle

