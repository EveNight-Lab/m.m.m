import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import FormField from '../components/FormField'
import WorldViewSelector from '../components/WorldViewSelector'
import { useAuth } from '../contexts/AuthContext'
import { WORLD_VIEWS } from '../constants/worldViews'
import type { WorldView } from '../constants/worldViews'
import { MONSTER_CLASSIFICATIONS, MONSTER_JOBS } from '../constants/monsterTypes'
import type { MonsterClassification, MonsterJob } from '../constants/monsterTypes'
import { generateCharacterFirst } from '../services/characterService'
import { saveCharacter } from '../utils/characters'

function CreateFirst() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [worldView, setWorldView] = useState<WorldView | ''>('')
  const [name, setName] = useState('')
  const [classification, setClassification] = useState<MonsterClassification | ''>('')
  const [job, setJob] = useState<MonsterJob | ''>('')
  
  // 스크롤을 위한 ref들
  const nameFieldRef = useRef<HTMLInputElement>(null)
  const classificationRef = useRef<HTMLDivElement>(null)
  const jobRef = useRef<HTMLDivElement>(null)
  
  // 초기 상태 추적 (비어있을 때만 스크롤)
  const prevWorldViewRef = useRef<WorldView | ''>('')
  const prevNameRef = useRef<string>('')
  const prevClassificationRef = useRef<MonsterClassification | ''>('')
  const [isCreating, setIsCreating] = useState(false)
  const [createMessage, setCreateMessage] = useState('')

  const handleCreateClick = async () => {
    if (!worldView) {
      setCreateMessage('❌ 세계관을 선택해주세요.')
      return
    }

    if (!name.trim()) {
      setCreateMessage('❌ 이름을 입력해주세요.')
      return
    }

    if (!classification) {
      setCreateMessage('❌ 분류를 선택해주세요.')
      return
    }

    if (!job) {
      setCreateMessage('❌ 직업을 선택해주세요.')
      return
    }

    setIsCreating(true)
    setCreateMessage('생성 중...')

    try {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.')
      }

      // 1차 생성 서비스 호출
      const generatedChar = await generateCharacterFirst(
        name.trim(),
        worldView,
        classification,
        job,
        null // 템플릿 이미지 URL은 1차에서는 null
      )

      // 로컬/원격 데이터베이스에 저장
      await saveCharacter(currentUser.uid, generatedChar)

      // 성공 시 관리 탭으로 이동
      navigate('/manage')
    } catch (error) {
      console.error('캐릭터 생성 오류:', error)
      let errorMessage = '알 수 없는 오류'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      setCreateMessage(`❌ 생성 실패: ${errorMessage}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleQuickGenerateClick = async () => {
    setIsCreating(true)
    setCreateMessage('빠른 생성 진행 중...')

    try {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.')
      }

      // 1. 무작위 값 결정
      const randomWorldView = WORLD_VIEWS[Math.floor(Math.random() * WORLD_VIEWS.length)]
      const randomCls = MONSTER_CLASSIFICATIONS[Math.floor(Math.random() * MONSTER_CLASSIFICATIONS.length)]
      const randomJob = MONSTER_JOBS[Math.floor(Math.random() * MONSTER_JOBS.length)]
      
      const namesMap: Record<string, string[]> = {
        '스팀하이븐 (스팀펑크, 기계, 증기)': ['태엽전사', '볼트크러셔', '기어하트', '증기골렘', '메카스파이더', '스팀브레이커', '동력 피스톤'],
        '아르칸드리아 (마법, 중세, 판타지)': ['엘드마스터', '룬실드', '마나로드', '파이어위버', '섀도우캐스터', '실버보우', '룬 펜서'],
        '네온 시티 (SF, 미래, 사이버펑크)': ['네온스톰', '사이버하운드', '글리치헌터', '레이저나이프', '메카블레이드', '플라즈마킹', '홀로스나이퍼'],
        '코스모스 (우주, 별, 신비)': ['네뷸라엔젤', '스텔라드래곤', '스타더스트', '퀘이사', '블랙홀골렘', '아스트랄비스트', '코스믹가디언'],
        '천무계 (동양 판타지, 무술, 정령)': ['청풍학', '태극현자', '백련사수', '뇌룡검사', '염화정령', '풍류귀신', '도술선인'],
        '데스랜드 (암흑, 언데드, 고딕)': ['데스하운드', '본크러셔', '레이스나이트', '소울리퍼', '네크로멘서', '그림리퍼', '암흑집행자'],
      }
      
      const possibleNames = namesMap[randomWorldView] || ['미확인 괴수']
      const randomName = possibleNames[Math.floor(Math.random() * possibleNames.length)] + '_' + Math.floor(Math.random() * 900 + 100)

      // 2. 입력 상태 업데이트 (비주얼적 피드백 제공)
      setWorldView(randomWorldView)
      setName(randomName)
      setClassification(randomCls)
      setJob(randomJob)

      // 3. 1차 생성 서비스 호출
      const generatedChar = await generateCharacterFirst(
        randomName,
        randomWorldView,
        randomCls,
        randomJob,
        null
      )

      // 4. 저장
      await saveCharacter(currentUser.uid, generatedChar)

      // 성공 시 관리 탭으로 이동
      navigate('/manage')
    } catch (error) {
      console.error('빠른 생성 오류:', error)
      let errorMessage = '알 수 없는 오류'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      setCreateMessage(`❌ 생성 실패: ${errorMessage}`)
    } finally {
      setIsCreating(false)
    }
  }


  return (
    <PageLayout title="창조" subtitle="기본 정보를 입력하여 캐릭터를 생성하세요">
      <Card>
        <div className="space-y-4">
          <WorldViewSelector
            value={worldView}
            onChange={(wv) => {
              const wasEmpty = prevWorldViewRef.current === ''
              setWorldView(wv)
              prevWorldViewRef.current = wv
              if (createMessage) setCreateMessage('')
              
              // 이름이 비어있을 때만 스크롤 (초기 선택일 때만)
              if (wasEmpty && name === '' && nameFieldRef.current) {
                setTimeout(() => {
                  nameFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  nameFieldRef.current?.focus()
                }, 100)
              }
            }}
          />

          <FormField
            ref={nameFieldRef}
            label="이름"
            placeholder="예) 레드레온, 그림자 검"
            value={name}
            onChange={(e) => {
              const wasEmpty = prevNameRef.current === ''
              setName(e.target.value)
              prevNameRef.current = e.target.value
              if (createMessage) setCreateMessage('')
            }}
            onKeyDown={(e) => {
              // 엔터 키를 누르고 이름이 비어있지 않을 때만 분류로 스크롤
              if (e.key === 'Enter' && name.trim() !== '' && classification === '' && classificationRef.current) {
                e.preventDefault()
                setTimeout(() => {
                  classificationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 100)
              }
            }}
          />

          <div ref={classificationRef}>
            <label className="block text-sm font-semibold mb-3">분류</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MONSTER_CLASSIFICATIONS.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    const wasEmpty = prevClassificationRef.current === ''
                    setClassification(cls)
                    prevClassificationRef.current = cls
                    if (createMessage) setCreateMessage('')
                    
                    // 직업이 비어있을 때만 스크롤
                    if (wasEmpty && job === '' && jobRef.current) {
                      setTimeout(() => {
                        jobRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 100)
                    }
                  }}
                  className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-semibold ${
                    classification === cls
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 scale-105'
                      : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div ref={jobRef}>
            <label className="block text-sm font-semibold mb-3">직업</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MONSTER_JOBS.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    setJob(j)
                    if (createMessage) setCreateMessage('')
                  }}
                  className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-semibold ${
                    job === j
                      ? 'bg-violet-500/30 border-violet-400 text-violet-200 shadow-lg shadow-violet-500/20 scale-105'
                      : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleQuickGenerateClick}
                disabled={isCreating}
                className="w-full py-3.5 rounded-2xl text-sm sm:text-base font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⚡ 빠른 생성 (1-Click)
              </button>

              <button
                type="button"
                onClick={handleCreateClick}
                disabled={isCreating || !worldView || !name.trim() || !classification || !job}
                className={`w-full py-3.5 rounded-2xl text-sm sm:text-base font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] ${
                  !isCreating && worldView && name.trim() && classification && job
                    ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-900 shadow-[0_10px_30px_rgba(56,189,248,0.45)] hover:brightness-110'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {isCreating ? '생성 중...' : '직접 생성'}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  )
}

export default CreateFirst

