import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import FormField from '../components/FormField'
import WorldViewSelector from '../components/WorldViewSelector'
import { useScrollIntoViewOnFocus } from '../hooks/useScrollIntoViewOnFocus'
import { useAuth } from '../contexts/AuthContext'
import { getUserCharacters, updateCharacter } from '../utils/characters'
import { generateCharacterSecond } from '../services/characterService'
import type { WorldView } from '../constants/worldViews'
import type { UserInput } from '../types'
import type { Character } from '../types'

function Create() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentUser } = useAuth()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [form, setForm] = useState<UserInput>({
    name: '',
    species: '',
    battleStyle: '',
    appearance: '',
    worldView: '',
  })

  const [isCreating, setIsCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState('')
  const [loadingStage, setLoadingStage] = useState('')
  const [loadingTip, setLoadingTip] = useState('')

  // 계약된 캐릭터만 필터링
  const contractedCharacters = useMemo(
    () => characters.filter((char) => char.contracted),
    [characters]
  )

  // URL 파라미터에서 캐릭터 ID 읽기
  useEffect(() => {
    const charId = searchParams.get('character')
    if (charId) {
      setSelectedCharacterId(charId)
      const char = contractedCharacters.find((c) => c.id === charId)
      if (char) {
        setForm((prev) => ({
          ...prev,
          worldView: char.worldView || '',
          name: char.name || '',
        }))
      }
    }
  }, [searchParams, contractedCharacters])

  // 계약된 캐릭터 목록 로드
  useEffect(() => {
    if (!currentUser) return

    const loadCharacters = async () => {
      try {
        const savedCharacters = await getUserCharacters(currentUser.uid)
        const normalizedCharacters = savedCharacters.map((char: Character) => ({
          ...char,
          contracted: char.contracted ?? false,
        }))
        setCharacters(normalizedCharacters)
      } catch (error) {
        console.error('캐릭터 목록 로드 실패:', error)
      }
    }

    loadCharacters()
  }, [currentUser])

  // 로딩 팁 목록
  const loadingTips = [
    '💡 몬스터의 특성은 전투에서 중요한 역할을 합니다',
    '🎲 주사위 수가 많을수록 공격 게이지가 빨리 차오릅니다',
    '🛡️ 방어력이 높을수록 계약 미니게임에서 성공 구간이 넓어집니다',
    '⚔️ 고정데미지가 높을수록 실패 시 패널티가 커집니다',
    '✨ 특수행동은 전투 중 자동으로 발동됩니다',
    '🌟 세계관에 맞는 몬스터를 만들면 더 일관성 있는 스토리가 됩니다',
    '🎨 외형을 자세히 묘사하면 더 생생한 이미지가 생성됩니다',
    '⚡ 전투 방식에 따라 몬스터의 특성이 달라집니다',
  ]

  // 로딩 중 팁 랜덤 변경
  useEffect(() => {
    if (isCreating) {
      // 초기 팁 설정
      setLoadingTip(loadingTips[Math.floor(Math.random() * loadingTips.length)])
      
      // 3초마다 팁 변경
      const tipInterval = setInterval(() => {
        setLoadingTip(loadingTips[Math.floor(Math.random() * loadingTips.length)])
      }, 3000)

      return () => clearInterval(tipInterval)
    }
  }, [isCreating])

  const handleChange = (field: keyof UserInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
    // 메시지 초기화
    if (createMessage) setCreateMessage('')
  }

  const handleWorldViewChange = (worldView: WorldView) => {
    setForm((prev) => ({
      ...prev,
      worldView,
    }))
    // 메시지 초기화
    if (createMessage) setCreateMessage('')
  }

  const handleFocus = useScrollIntoViewOnFocus()

  const handleCreate = async () => {
    if (isCreating) return

    // 계약된 캐릭터 선택 확인
    if (!selectedCharacterId) {
      setCreateMessage('❌ 계약된 캐릭터를 선택해주세요.')
      return
    }

    const selectedCharacter = contractedCharacters.find((c) => c.id === selectedCharacterId)
    if (!selectedCharacter) {
      setCreateMessage('❌ 선택한 캐릭터를 찾을 수 없습니다.')
      return
    }

    setIsCreating(true)
    setCreateMessage('생성 중...')
    setLoadingStage('AI가 몬스터 정보를 생성하고 있습니다...')

    try {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.')
      }
      
      // 2차 캐릭터 생성 서비스 호출
      const generatedChar = await generateCharacterSecond(
        selectedCharacter,
        form.name ? form.name.trim() : '',
        form.species ? form.species.trim() : '',
        form.battleStyle ? form.battleStyle.trim() : '',
        form.appearance ? form.appearance.trim() : '',
        form.worldView ? form.worldView as WorldView : selectedCharacter.worldView as WorldView
      )

      setLoadingStage('완료! 저장 중...')

      // 캐릭터 정보 업데이트
      await updateCharacter(currentUser.uid, selectedCharacterId, generatedChar)

      // 폼 초기화
      setForm({
        name: '',
        species: '',
        battleStyle: '',
        appearance: '',
        worldView: '',
      })

      // 잠시 대기 후 관리 탭으로 이동
      setTimeout(() => {
        navigate('/manage')
      }, 500)
    } catch (error) {
      console.error('캐릭터 생성 오류:', error)
      let errorMessage = '알 수 없는 오류'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setCreateMessage(`❌ 생성 실패: ${errorMessage}`)
    } finally {
      setIsCreating(false)
      setLoadingStage('')
    }
  }

  return (
    <>
      {/* 로딩 팝업 */}
      {isCreating && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pb-[calc(100px+env(safe-area-inset-bottom))] bg-black/95 backdrop-blur-md">
          <div className="relative w-full max-w-md mx-4">
            {/* 마법진 배경 효과 */}
            <div className="absolute inset-0 bg-gradient-radial from-cyan-500/20 via-violet-500/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(125,211,252,0.15)_0%,transparent_70%)] pointer-events-none animate-pulse" />
            
            <div className="relative bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-cyan-500/60 rounded-3xl p-8 shadow-[0_0_60px_rgba(125,211,252,0.4),inset_0_0_40px_rgba(192,132,252,0.1)] backdrop-blur-xl">
              {/* 상단 장식 */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
              
              {/* 로딩 애니메이션 */}
              <div className="flex flex-col items-center justify-center space-y-6 mb-6">
                {/* 회전하는 마법진 */}
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin" style={{ animationDuration: '1s' }} />
                  <div className="absolute inset-2 border-4 border-violet-500/30 rounded-full" />
                  <div className="absolute inset-2 border-4 border-transparent border-t-violet-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-violet-400 rounded-full animate-pulse" />
                  </div>
                </div>
                
                {/* 진행 단계 */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black bg-gradient-to-r from-cyan-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                    몬스터 생성 중...
                  </h3>
                  {loadingStage && (
                    <p className="text-sm text-cyan-200/90 font-medium animate-pulse">
                      {loadingStage}
                    </p>
                  )}
                </div>
              </div>

              {/* 팁 섹션 */}
              <div className="border-t-2 border-cyan-500/30 pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">💡</div>
                  <div className="flex-1">
                    <p className="text-xs text-cyan-300/80 font-semibold mb-2 uppercase tracking-wider">팁</p>
                    <p className="text-sm text-white/90 leading-relaxed min-h-[3rem] transition-all duration-500">
                      {loadingTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* 하단 장식 */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
            </div>
          </div>
        </div>
      )}

      <PageLayout title="2차 생성" subtitle="계약된 캐릭터의 상세 정보를 입력하세요">
      <Card>
        <div className="space-y-4">
          {/* 계약된 캐릭터 선택 */}
          <div>
            <label className="block text-sm font-semibold mb-2">계약된 캐릭터 선택</label>
            {contractedCharacters.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                계약된 캐릭터가 없습니다. 먼저 창조를 통해 캐릭터를 만들고 계약해주세요.
              </div>
            ) : (
              <select
                value={selectedCharacterId || ''}
                onChange={(e) => {
                  setSelectedCharacterId(e.target.value || null)
                  const char = contractedCharacters.find((c) => c.id === e.target.value)
                  if (char) {
                    setForm((prev) => ({
                      ...prev,
                      worldView: char.worldView || '',
                      name: char.name || '',
                    }))
                  }
                  if (createMessage) setCreateMessage('')
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="">캐릭터 선택</option>
                {contractedCharacters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name} {char.nickname ? `(${char.nickname})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCharacterId && (
            <>
              <WorldViewSelector
                value={form.worldView || ''}
                onChange={handleWorldViewChange}
              />

          <FormField
            label="이름"
            placeholder="예) 레드레온, 그림자 검, 불꽃 용"
            value={form.name}
            onChange={handleChange('name')}
            onFocus={handleFocus}
          />

          <FormField
            label="종족"
            placeholder="예) 드래곤, 고블린, 스켈레톤"
            value={form.species}
            onChange={handleChange('species')}
            onFocus={handleFocus}
          />

          <FormField
            label="무기 / 전투 방식"
            placeholder="예) 거대한 도끼, 화염 마법, 독액 분사"
            value={form.battleStyle}
            onChange={handleChange('battleStyle')}
            onFocus={handleFocus}
            multiline
            rows={3}
          />

          <FormField
            label="외형"
            placeholder="예) 검은 비늘과 날카로운 발톱, 불타는 눈과 거대한 날개"
            value={form.appearance}
            onChange={handleChange('appearance')}
            onFocus={handleFocus}
            multiline
            rows={4}
          />

              <div className="pt-4 border-t border-white/10 space-y-3">
                {createMessage && (
                  <p className={`text-sm text-center ${
                    createMessage.startsWith('✅') 
                      ? 'text-cyan-300' 
                      : 'text-red-400'
                  }`}>
                    {createMessage}
                  </p>
                )}
                
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating || !selectedCharacterId}
                  className={`w-full py-3.5 rounded-2xl text-sm sm:text-base font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] ${
                    !isCreating && selectedCharacterId
                      ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-900 shadow-[0_10px_30px_rgba(56,189,248,0.45)]'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {isCreating ? '생성 중...' : '2차 생성'}
                </button>
              </div>
            </>
          )}
        </div>
      </Card>
      </PageLayout>
    </>
  )
}

export default Create

