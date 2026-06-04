import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import MonsterCard from '../components/MonsterCard'
import EmptySlot from '../components/EmptySlot'
import SlotContainer from '../components/SlotContainer'
import MonsterDetailModal from '../components/MonsterDetailModal'
import ContractMiniGame from '../components/ContractMiniGame'
import { useAuth } from '../contexts/AuthContext'
import { getUserCharacters, updateCharacter, deleteCharacter } from '../utils/characters'
import { getApiUrl } from '../utils/api'
import type { Character } from '../types'
import { checkIsMockMode } from '../services/characterService'

const SLOT_COUNT = 5 // 미계약/계약 슬롯 각각 5개

function Manage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [contractingCharacter, setContractingCharacter] = useState<Character | null>(null)
  const [isGameOpen, setIsGameOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [templates, setTemplates] = useState<Array<{
    id: string
    imageUrl: string
    tags: string[]
    characterName: string
  }>>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [selectedTemplateForCreation, setSelectedTemplateForCreation] = useState<string | null>(null)

  // Firestore에서 몬스터 목록 불러오기
  useEffect(() => {
    if (!currentUser) return

    const loadCharacters = async () => {
      try {
        setLoading(true)
        const savedCharacters = await getUserCharacters(currentUser.uid)
        // 기존 데이터 호환성: contracted 필드가 없으면 false로 설정
        const normalizedCharacters = savedCharacters.map((char: Character) => ({
          ...char,
          contracted: char.contracted ?? false,
        }))
        setCharacters(normalizedCharacters)
      } catch (error) {
        console.error('캐릭터 목록 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCharacters()
  }, [currentUser])

  // 계약 시작 (미니게임 열기)
  const handleContractStart = (character: Character) => {
    setContractingCharacter(character)
    setIsGameOpen(true)
    setIsModalOpen(false) // 상세 모달 닫기
  }

  // 이미지 템플릿 로드
  const loadTemplates = async (character: Character) => {
    if (!currentUser || !character.worldView) return

    setIsLoadingTemplates(true)
    try {
      if (checkIsMockMode()) {
        const { getFallbackTemplatesByWorldView } = await import('../constants/fallbackTemplates')
        const localTemplates = getFallbackTemplatesByWorldView(character.worldView)
        setTemplates(localTemplates.slice(0, 3))
        return
      }

      const idToken = await currentUser.getIdToken()
      const params = new URLSearchParams({ worldView: character.worldView })

      const response = await fetch(getApiUrl(`/api/images/templates?${params.toString()}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('템플릿 로드 실패')
      }

      const data = await response.json()
      const selectedTemplates = (data.templates || []).slice(0, 3)
      
      if (selectedTemplates.length === 0) {
        const { getFallbackTemplatesByWorldView } = await import('../constants/fallbackTemplates')
        setTemplates(getFallbackTemplatesByWorldView(character.worldView).slice(0, 3))
      } else {
        setTemplates(selectedTemplates)
      }
    } catch (error) {
      console.error('템플릿 로드 오류, 로컬 대체 템플릿 사용:', error)
      const { getFallbackTemplatesByWorldView } = await import('../constants/fallbackTemplates')
      setTemplates(getFallbackTemplatesByWorldView(character.worldView).slice(0, 3))
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  // 계약 성공 처리
  const handleContractSuccess = async () => {
    if (!contractingCharacter || !currentUser) return
    
    try {
      // 먼저 계약 상태 업데이트
      await updateCharacter(currentUser.uid, contractingCharacter.id, { contracted: true })
      
      const updatedCharacters = characters.map((char) =>
        char.id === contractingCharacter.id ? { ...char, contracted: true } : char
      )
      setCharacters(updatedCharacters)
      
      setIsGameOpen(false)
      
      // 이미지가 없으면 이미지 선택 팝업 표시
      if (!contractingCharacter.imageUrl && !contractingCharacter.imageData) {
        setSelectedTemplateForCreation(null)
        setTemplates([])
        setIsImageModalOpen(true)
        await loadTemplates(contractingCharacter)
      } else {
        setContractingCharacter(null)
      }
    } catch (error) {
      console.error('캐릭터 업데이트 실패:', error)
      alert('계약 저장에 실패했습니다.')
      setIsGameOpen(false)
      setContractingCharacter(null)
    }
  }

  // 이미지 선택 완료 처리
  const handleImageSelectConfirm = async () => {
    if (!selectedTemplateForCreation || !contractingCharacter || !currentUser) return

    try {
      const idToken = await currentUser.getIdToken()
      const template = templates.find((t) => t.id === selectedTemplateForCreation)

      if (!template) {
        alert('선택한 이미지를 찾을 수 없습니다.')
        return
      }

      // 캐릭터 이미지 업데이트
      await updateCharacter(currentUser.uid, contractingCharacter.id, {
        imageUrl: template.imageUrl,
      })

      const updatedCharacters = characters.map((char) =>
        char.id === contractingCharacter.id
          ? { ...char, imageUrl: template.imageUrl }
          : char
      )
      setCharacters(updatedCharacters)

      setIsImageModalOpen(false)
      setContractingCharacter(null)
      setSelectedTemplateForCreation(null)
      setTemplates([])
    } catch (error) {
      console.error('이미지 업데이트 실패:', error)
      alert('이미지 저장에 실패했습니다.')
    }
  }

  // 미니게임 닫기
  const handleGameClose = () => {
    setIsGameOpen(false)
    setContractingCharacter(null)
  }

  // 카드 클릭 핸들러
  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character)
    setIsModalOpen(true)
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCharacter(null)
  }

  // 캐릭터 삭제 핸들러
  const handleDelete = async (characterId: string) => {
    if (!currentUser) return
    
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await deleteCharacter(currentUser.uid, characterId)
      
      const updatedCharacters = characters.filter((char) => char.id !== characterId)
      setCharacters(updatedCharacters)
      
      // 삭제된 캐릭터가 선택된 상태였다면 모달 닫기
      if (selectedCharacter?.id === characterId) {
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('캐릭터 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  // 빈 슬롯 클릭 핸들러 - 창조 탭으로 이동
  const handleEmptySlotClick = () => {
    navigate('/create')
  }

  // 전투하기 핸들러 - 전투 탭으로 이동 (플레이어로 선택)
  const handleBattle = (characterId: string) => {
    navigate(`/battle?player=${characterId}`)
  }

  // 2차 생성 핸들러 - 2차 생성 탭으로 이동
  const handleSecondCreate = (characterId: string) => {
    navigate(`/create-second?character=${characterId}`)
  }

  // 미계약/계약 몬스터 분리
  const uncontractedMonsters = useMemo(
    () => characters.filter((char) => !char.contracted),
    [characters]
  )
  const contractedMonsters = useMemo(
    () => characters.filter((char) => char.contracted),
    [characters]
  )

  // 슬롯 배열 생성 (최대 5개)
  const uncontractedSlots = useMemo(() => {
    const slots: (Character | null)[] = []
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots.push(uncontractedMonsters[i] || null)
    }
    return slots
  }, [uncontractedMonsters])

  const contractedSlots = useMemo(() => {
    const slots: (Character | null)[] = []
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots.push(contractedMonsters[i] || null)
    }
    return slots
  }, [contractedMonsters])

  return (
    <PageLayout title="관리" subtitle="내 몬스터들을 관리하고 키워보세요!">
      <div className="space-y-6">
        {/* 미계약 몬스터 섹션 */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">미계약 몬스터</h2>
              <span className="text-sm text-white/60">
                {uncontractedMonsters.length}/{SLOT_COUNT}
              </span>
            </div>
            <SlotContainer>
              {uncontractedSlots.map((monster, index) =>
                monster ? (
                  <MonsterCard
                    key={monster.id}
                    character={monster}
                    onContract={() => handleContractStart(monster)}
                    onClick={() => handleCardClick(monster)}
                  />
                ) : (
                  <EmptySlot
                    key={`empty-uncontracted-${index}`}
                    onClick={handleEmptySlotClick}
                    isLoading={loading}
                  />
                )
              )}
            </SlotContainer>
          </div>
        </Card>

        {/* 계약 몬스터 섹션 */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">계약 몬스터</h2>
              <span className="text-sm text-white/60">
                {contractedMonsters.length}/{SLOT_COUNT}
              </span>
            </div>
            <SlotContainer>
              {contractedSlots.map((monster, index) =>
                monster ? (
                  <MonsterCard
                    key={monster.id}
                    character={monster}
                    onBattle={handleBattle}
                    onSecondCreate={handleSecondCreate}
                    onClick={() => handleCardClick(monster)}
                  />
                ) : (
                  <EmptySlot
                    key={`empty-contracted-${index}`}
                    onClick={handleEmptySlotClick}
                    isLoading={loading}
                  />
                )
              )}
            </SlotContainer>
          </div>
        </Card>
      </div>

      {/* 몬스터 상세 정보 모달 */}
      <MonsterDetailModal
        character={selectedCharacter}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onContract={selectedCharacter ? () => handleContractStart(selectedCharacter) : undefined}
        onDelete={handleDelete}
      />

      {/* 계약 미니게임 */}
      {contractingCharacter && (
        <ContractMiniGame
          character={contractingCharacter}
          onSuccess={handleContractSuccess}
          onClose={handleGameClose}
        />
      )}

      {/* 이미지 템플릿 선택 모달 */}
      {isImageModalOpen && contractingCharacter && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 pb-[calc(100px+env(safe-area-inset-bottom))]">
          <div className="relative w-full max-w-4xl max-h-[calc(100vh-120px)] overflow-y-auto bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-cyan-500/60 rounded-3xl p-6 shadow-[0_0_60px_rgba(125,211,252,0.4)]">
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => {
                setIsImageModalOpen(false)
                setContractingCharacter(null)
                setSelectedTemplateForCreation(null)
                setTemplates([])
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/60 text-red-300 hover:text-red-200 transition-all duration-300 z-20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-6">
              <h2 className="text-2xl font-black text-center bg-gradient-to-r from-cyan-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                이미지 템플릿 선택
              </h2>
              <p className="text-center text-gray-400 text-sm">
                계약 성공! {contractingCharacter.name}의 이미지를 선택해주세요
              </p>

              {isLoadingTemplates ? (
                <div className="text-center py-16">
                  <div className="inline-block w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">템플릿을 불러오는 중...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  조건에 맞는 템플릿이 없습니다.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplateForCreation(template.id)}
                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          selectedTemplateForCreation === template.id
                            ? 'border-cyan-400 ring-4 ring-cyan-400/50 scale-105 shadow-[0_0_30px_rgba(56,189,248,0.6)]'
                            : 'border-white/20 hover:border-white/40 hover:scale-[1.02]'
                        }`}
                      >
                        <img
                          src={template.imageUrl}
                          alt={template.characterName || '템플릿'}
                          className="w-full h-full object-cover"
                          draggable="false"
                        />
                        {selectedTemplateForCreation === template.id && (
                          <div className="absolute inset-0 bg-cyan-400/30 flex items-center justify-center">
                            <div className="text-4xl font-black text-cyan-200 drop-shadow-lg">✓</div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <p className="text-white text-sm font-semibold text-center">
                            {template.characterName || '템플릿'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsImageModalOpen(false)
                        setContractingCharacter(null)
                        setSelectedTemplateForCreation(null)
                        setTemplates([])
                      }}
                      className="flex-1 py-3 rounded-xl bg-gray-600/50 hover:bg-gray-600/70 text-white font-semibold transition-all duration-200"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleImageSelectConfirm}
                      disabled={!selectedTemplateForCreation}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        selectedTemplateForCreation
                          ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-900 shadow-[0_10px_30px_rgba(56,189,248,0.45)]'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      선택 완료
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default Manage

