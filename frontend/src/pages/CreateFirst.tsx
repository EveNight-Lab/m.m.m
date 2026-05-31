import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import FormField from '../components/FormField'
import WorldViewSelector from '../components/WorldViewSelector'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../utils/api'
import type { WorldView } from '../constants/worldViews'
import { MONSTER_CLASSIFICATIONS, MONSTER_JOBS } from '../constants/monsterTypes'
import type { MonsterClassification, MonsterJob } from '../constants/monsterTypes'

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

      const idToken = await currentUser.getIdToken()

      // 전송할 데이터 준비
      const requestData = {
        name: name.trim(),
        worldView,
        classification,
        job,
      }

      // 디버깅: 전송할 데이터 로그
      console.log('📤 [1차 생성] 전송할 데이터:', {
        name: requestData.name,
        worldView: requestData.worldView,
        classification: requestData.classification,
        job: requestData.job,
        worldViewType: typeof requestData.worldView,
        worldViewLength: requestData.worldView?.length,
      })

      // 1차 생성 API 호출 (이미지 없이)
      const response = await fetch(getApiUrl('/api/ai/generate-character-first'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '캐릭터 생성 실패')
      }

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

            <button
              type="button"
              onClick={handleCreateClick}
              disabled={isCreating || !worldView || !name.trim() || !classification || !job}
              className={`w-full py-3.5 rounded-2xl text-sm sm:text-base font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] ${
                !isCreating && worldView && name.trim() && classification && job
                  ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-900 shadow-[0_10px_30px_rgba(56,189,248,0.45)]'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isCreating ? '생성 중...' : '생성'}
            </button>
          </div>
        </div>
      </Card>
    </PageLayout>
  )
}

export default CreateFirst

