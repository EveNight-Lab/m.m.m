import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import { useFontSize } from '../hooks/useFontSize'
import { useAuth } from '../contexts/AuthContext'
import { getApiUrl } from '../utils/api'
import { MONSTER_CLASSIFICATIONS, MONSTER_JOBS } from '../constants/monsterTypes'

function Settings() {
  const navigate = useNavigate()
  const { currentUser, logout, userNickname } = useAuth()
  const { fontSize, setFontSize, resetFontSize, minFontSize, maxFontSize, defaultFontSize } = useFontSize()
  const [localFontSize, setLocalFontSize] = useState(fontSize)
  
  // 템플릿 이미지 생성 관련 상태
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ 
    current: 0, 
    total: 0,
    progress: 0,
    currentWorldView: '',
    currentWorldViewIndex: 0,
    totalWorldViews: 0,
  })
  const [generatedImages, setGeneratedImages] = useState<Array<{
    id: string
    imageUrl: string
    tags: string[]
    classification: string
    job: string
    worldView: string
  }>>([])
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)
  const [repeatCount, setRepeatCount] = useState(1) // 반복 횟수
  const [currentRepeat, setCurrentRepeat] = useState(0) // 현재 반복 횟수
  const [shouldStopRepeat, setShouldStopRepeat] = useState(false) // 반복 중단 플래그
  const balanceTemplatesReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null) // 균형 맞추기 스트리밍 reader
  const generateTemplatesReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null) // 전체 생성 스트리밍 reader
  const [allGeneratedImages, setAllGeneratedImages] = useState<Array<{
    id: string
    imageUrl: string
    tags: string[]
    classification: string
    job: string
    worldView: string
    repeatIndex: number
  }>>([]) // 모든 반복에서 생성된 이미지

  const handleLogout = async () => {
    if (confirm('로그아웃하시겠습니까?')) {
      try {
        await logout()
        navigate('/login')
      } catch (error) {
        console.error('로그아웃 실패:', error)
      }
    }
  }

  const handleFontSizeChange = (newSize: number) => {
    setLocalFontSize(newSize)
    setFontSize(newSize)
  }

  const handleReset = () => {
    setLocalFontSize(defaultFontSize)
    resetFontSize()
  }

  // 폰트 크기 비율 계산 (기본값 대비)
  const fontSizeRatio = ((fontSize / defaultFontSize) * 100).toFixed(0)

  // 템플릿 이미지 생성 (모든 세계관)
  const handleGenerateTemplates = async () => {
    // 중지 플래그 확인
    if (shouldStopRepeat) {
      console.log('🛑 [템플릿 생성] 사용자가 반복을 중지했습니다.')
      setIsGenerating(false)
      setShouldStopRepeat(false)
      return
    }

    const totalWorldViews = 6
    const totalCombinations = MONSTER_CLASSIFICATIONS.length * MONSTER_JOBS.length
    const totalImages = totalWorldViews * totalCombinations
    const estimatedMinutes = Math.ceil(totalImages * 5 / 60)
    const totalImagesWithRepeat = totalImages * repeatCount
    const totalEstimatedMinutes = Math.ceil(totalImagesWithRepeat * 5 / 60)

    // 안전장치: 반복 횟수 제한 (최대 5회)
    const MAX_REPEAT_COUNT = 5
    const safeRepeatCount = Math.min(repeatCount, MAX_REPEAT_COUNT)
    if (repeatCount > MAX_REPEAT_COUNT) {
      alert(`⚠️ 반복 횟수는 최대 ${MAX_REPEAT_COUNT}회로 제한됩니다.\n요청하신 ${repeatCount}회 대신 ${safeRepeatCount}회로 설정됩니다.`)
      setRepeatCount(MAX_REPEAT_COUNT)
    }

    // 비용 추정 계산
    const estimateCost = (imageCount: number) => {
      // 입력 비용: 프롬프트당 약 700 토큰 가정
      const inputTokens = imageCount * 700
      const inputCost = (inputTokens / 1_000_000) * 2.0
      
      // 출력 비용: 1K/2K 이미지 기준 (이미지당 $0.134)
      // 4K 이미지의 경우 이미지당 $0.24
      const outputCost1K = imageCount * 0.134
      const outputCost4K = imageCount * 0.24
      
      return {
        inputCost: inputCost.toFixed(2),
        outputCost1K: outputCost1K.toFixed(2),
        outputCost4K: outputCost4K.toFixed(2),
        totalCost1K: (inputCost + outputCost1K).toFixed(2),
        totalCost4K: (inputCost + outputCost4K).toFixed(2),
      }
    }
    
    const totalImageCount = totalImages * safeRepeatCount
    const costEstimate = estimateCost(totalImageCount)

    // 첫 반복일 때만 confirm 표시
    if (currentRepeat === 0) {
      const confirmMessage = `⚠️⚠️⚠️ 경고: 대량 이미지 생성 ⚠️⚠️⚠️\n\n` +
        `📊 생성 정보:\n` +
        `• 세계관: ${totalWorldViews}개\n` +
        `• 조합: ${totalCombinations}개\n` +
        `• 반복 횟수: ${safeRepeatCount}회\n` +
        `• 총 생성 이미지: ${totalImageCount}개\n` +
        `• 예상 소요 시간: 약 ${Math.ceil(totalImageCount * 5 / 60)}분\n\n` +
        `💰 예상 비용 (Gemini 3 Pro Image Preview):\n` +
        `• 입력 비용: 약 $${costEstimate.inputCost}\n` +
        `• 출력 비용 (1K/2K): 약 $${costEstimate.outputCost1K}\n` +
        `• 출력 비용 (4K): 약 $${costEstimate.outputCost4K}\n` +
        `• 총 예상 비용 (1K/2K): 약 $${costEstimate.totalCost1K}\n` +
        `• 총 예상 비용 (4K): 약 $${costEstimate.totalCost4K}\n\n` +
        `⚠️ 실제 비용은 해상도에 따라 달라질 수 있습니다.\n` +
        `⚠️ 중지하려면 생성 중 "중지" 버튼을 클릭하세요.\n\n` +
        `정말 생성하시겠습니까?`
      
      if (!confirm(confirmMessage)) {
        return
      }
      
      // 중지 플래그 초기화
      setShouldStopRepeat(false)
    }

    setIsGenerating(true)
    setGenerationProgress({ 
      current: 0, 
      total: totalImages,
      progress: 0,
      currentWorldView: '',
      currentWorldViewIndex: 0,
      totalWorldViews: totalWorldViews,
    })
    // 첫 반복이 아니면 기존 이미지 유지, 첫 반복이면 초기화
    if (currentRepeat === 0) {
      setGeneratedImages([])
      setAllGeneratedImages([])
    } else {
      setGeneratedImages([])
    }
    setGenerationError(null)

    try {
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.')
      }

      console.log('🔵 [템플릿 생성] 토큰 가져오기 시작...')
      const idToken = await currentUser.getIdToken()
      console.log('🔵 [템플릿 생성] 토큰 획득 완료, POST 요청 전송...')

      const apiUrl = getApiUrl('/api/images/generate-templates-all')
      console.log('🔵 [템플릿 생성] 요청 URL:', apiUrl)

      // POST 요청으로 스트리밍 응답 받기
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      })

      console.log('🔵 [템플릿 생성] 응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [템플릿 생성] 응답 오류:', response.status, errorText)
        throw new Error(`생성 시작 실패: ${response.status} ${errorText}`)
      }

      if (!response.body) {
        console.error('❌ [템플릿 생성] 스트리밍 응답 본문 없음')
        throw new Error('스트리밍 응답을 받을 수 없습니다.')
      }

      console.log('✅ [템플릿 생성] 스트리밍 시작')

      const reader = response.body.getReader()
      generateTemplatesReaderRef.current = reader // reader 저장
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      const processStream = async () => {
        try {
          let lastActivityTime = Date.now()
          const HEARTBEAT_TIMEOUT = 120000 // 2분 동안 활동이 없으면 타임아웃
          
          // 하트비트 체크
          const heartbeatInterval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivityTime
            if (timeSinceLastActivity > HEARTBEAT_TIMEOUT) {
              console.warn('⚠️ [템플릿 생성] 스트리밍 타임아웃 감지, 연결 확인 중...')
              // 타임아웃이지만 연결이 살아있을 수 있으므로 계속 대기
            }
          }, 30000) // 30초마다 체크
          
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              console.log('✅ [템플릿 생성] 스트리밍 완료 (done=true)')
              clearInterval(heartbeatInterval)
              generateTemplatesReaderRef.current = null
              setIsGenerating(false)
              break
            }
            
            // 중지 플래그 확인
            if (shouldStopRepeat) {
              console.log('🛑 [템플릿 생성] 사용자가 중지 요청, 스트림 취소')
              reader.cancel().catch(e => console.error("Reader cancel failed:", e))
              generateTemplatesReaderRef.current = null
              clearInterval(heartbeatInterval)
              setIsGenerating(false)
              setShouldStopRepeat(false)
              break
            }

            lastActivityTime = Date.now()
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.substring(7).trim()
                continue
              }
              
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim()
                if (!dataStr) continue
                
                try {
                  const data = JSON.parse(dataStr)
                  
                  if (currentEvent === 'start' || (data.total && !currentEvent)) {
                    console.log('📊 [템플릿 생성] 시작:', data)
                    setGenerationProgress(prev => ({
                      ...prev,
                      total: data.total || prev.total,
                      totalWorldViews: data.totalWorldViews || prev.totalWorldViews,
                    }))
                  } else if (currentEvent === 'worldViewStart' || data.worldViewName) {
                    console.log('🌍 [템플릿 생성] 세계관 시작:', data.worldViewName)
                    setGenerationProgress(prev => ({
                      ...prev,
                      currentWorldView: data.worldViewName || prev.currentWorldView,
                      currentWorldViewIndex: data.worldViewIndex || prev.currentWorldViewIndex,
                    }))
                  } else if (currentEvent === 'imageComplete' || data.image) {
                    console.log(`✅ [템플릿 생성] 이미지 완료: ${data.current}/${data.total}`)
                    setGeneratedImages(prev => [...prev, data.image])
                    setGenerationProgress(prev => ({
                      ...prev,
                      current: data.current || prev.current,
                      progress: data.progress || prev.progress,
                    }))
                  } else if (currentEvent === 'imageError' || (data.error && typeof data.error === 'object')) {
                    // imageError 이벤트는 무시 (개별 이미지 에러는 로그만)
                    console.warn('⚠️ [템플릿 생성] 이미지 생성 에러:', data.error)
                  } else if (currentEvent === 'quotaExceeded') {
                    console.error('❌ [템플릿 생성] 할당량 초과!', data)
                    clearInterval(heartbeatInterval)
                    setGenerationError(data.message || 'Gemini API 일일 할당량이 초과되었습니다. 내일 다시 시도하거나 플랜을 확인해주세요.')
                    setIsGenerating(false)
                  } else if (currentEvent === 'complete' || data.success) {
                    console.log('🎉 [템플릿 생성] 전체 완료:', data)
                    clearInterval(heartbeatInterval)
                    setGenerationProgress(prev => ({
                      ...prev,
                      current: data.generated || prev.current,
                      progress: 100,
                    }))
                    if (data.errors > 0) {
                      setGenerationError(`${data.errors}개의 이미지 생성에 실패했습니다.`)
                    }
                    
                    // 현재 반복에서 생성된 이미지에 repeatIndex 추가
                    const imagesWithRepeat = generatedImages.map(img => ({
                      ...img,
                      repeatIndex: currentRepeat + 1
                    }))
                    setAllGeneratedImages(prev => [...prev, ...imagesWithRepeat])
                    
                    // 반복 횟수 확인 (중지 플래그도 확인)
                    if (!shouldStopRepeat && currentRepeat + 1 < safeRepeatCount) {
                      // 다음 반복 시작
                      console.log(`🔄 [템플릿 생성] 반복 ${currentRepeat + 1}/${safeRepeatCount} 완료, 다음 반복 시작...`)
                      setCurrentRepeat(prev => prev + 1)
                      setGeneratedImages([])
                      setGenerationError(null)
                      // 2초 후 다음 반복 시작
                      setTimeout(() => {
                        handleGenerateTemplates()
                      }, 2000)
                    } else {
                      // 모든 반복 완료 또는 중지됨
                      if (shouldStopRepeat) {
                        console.log(`🛑 [템플릿 생성] 사용자가 반복을 중지했습니다. (${currentRepeat + 1}/${safeRepeatCount}회 완료)`)
                        setGenerationError('사용자가 반복을 중지했습니다.')
                      } else {
                        console.log(`✅ [템플릿 생성] 모든 반복 완료: ${safeRepeatCount}회`)
                      }
                      setIsGenerating(false)
                      setShouldStopRepeat(false)
                      generateTemplatesReaderRef.current = null
                    }
                  } else if (currentEvent === 'error' || data.error) {
                    // 에러가 객체인 경우 에러 메시지 추출
                    const errorMessage = typeof data.error === 'string' 
                      ? data.error 
                      : (data.error?.error || data.error?.message || '오류가 발생했습니다.')
                    console.error('❌ [템플릿 생성] 전체 프로세스 에러:', errorMessage)
                    clearInterval(heartbeatInterval)
                    setGenerationError(errorMessage)
                    setIsGenerating(false)
                  }
                  
                  currentEvent = ''
                } catch (e) {
                  console.error('❌ [템플릿 생성] JSON 파싱 오류:', e, dataStr)
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ [템플릿 생성] 스트리밍 읽기 오류:', error)
          const errorObj = error instanceof Error ? error : new Error(String(error))
          console.error('❌ [템플릿 생성] 에러 상세:', {
            name: errorObj.name,
            message: errorObj.message,
            stack: errorObj.stack
          })
          setGenerationError(`스트리밍 연결이 끊겼습니다. 백엔드에서는 계속 생성 중일 수 있습니다. (${errorObj.message})`)
          // 연결이 끊겨도 백엔드는 계속 생성 중일 수 있으므로 isGenerating을 false로 설정하지 않음
          // 대신 사용자에게 알림만 표시
        }
      }

      processStream()
    } catch (error) {
      console.error('❌ [템플릿 생성] 전체 프로세스 오류:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      console.error('❌ [템플릿 생성] 에러 메시지:', errorMessage)
      setGenerationError(errorMessage)
      setIsGenerating(false)
      if (eventSource) {
        eventSource.close()
        setEventSource(null)
      }
    }
  }

  // 템플릿 이미지 균형 맞추기
  const handleBalanceTemplates = async () => {
    if (!currentUser) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!confirm('현재 저장된 템플릿 이미지 개수를 확인하고,\n부족한 조합에 대해서만 이미지를 생성하여\n모든 조합이 동일한 개수를 가지도록 합니다.\n\n계속하시겠습니까?')) {
      return
    }

    try {
      const idToken = await currentUser.getIdToken()
      const apiUrl = getApiUrl('/api/images/balance-templates')

      setIsGenerating(true)
      setGenerationProgress({ 
        current: 0, 
        total: 0,
        progress: 0,
        currentWorldView: '',
        currentWorldViewIndex: 0,
        totalWorldViews: 0,
      })
      setGeneratedImages([])
      setAllGeneratedImages([])
      setGenerationError(null)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`균형 맞추기 시작 실패: ${response.status} ${errorText}`)
      }

      if (!response.body) {
        throw new Error('스트리밍 응답을 받을 수 없습니다.')
      }

      const reader = response.body.getReader()
      balanceTemplatesReaderRef.current = reader // reader 저장 (중지 시 사용)
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''
      let lastActivityTime = Date.now()

      const heartbeatInterval = setInterval(() => {
        const now = Date.now()
        if (now - lastActivityTime > 120000) { // 2분 동안 활동 없으면
          setGenerationError('연결이 끊어진 것 같습니다. 백엔드는 계속 생성 중일 수 있습니다.')
          clearInterval(heartbeatInterval)
        }
      }, 30000)

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()
            
            if (done) {
              clearInterval(heartbeatInterval)
              setIsGenerating(false)
              balanceTemplatesReaderRef.current = null
              break
            }

            lastActivityTime = Date.now()
            buffer += decoder.decode(value, { stream: true })
            
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.substring(7).trim()
              } else if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6))
                
                if (currentEvent === 'start') {
                  setGenerationProgress(prev => ({
                    ...prev,
                    total: data.total || 0,
                    totalWorldViews: data.totalWorldViews || 0,
                  }))
                } else if (currentEvent === 'worldViewStart') {
                  setGenerationProgress(prev => ({
                    ...prev,
                    currentWorldView: data.worldViewName || '',
                    currentWorldViewIndex: data.worldViewIndex || 0,
                  }))
                } else if (currentEvent === 'imageComplete') {
                  setGeneratedImages(prev => [...prev, {
                    id: data.image.id,
                    imageUrl: data.image.imageUrl,
                    tags: data.image.tags || [],
                    classification: data.image.classification,
                    job: data.image.job,
                    worldView: data.image.worldView,
                  }])
                  setGenerationProgress(prev => ({
                    ...prev,
                    current: data.current || 0,
                    progress: data.progress || 0,
                  }))
                } else if (currentEvent === 'imageError') {
                  console.warn('⚠️ [균형 맞추기] 이미지 생성 에러:', data.error)
                } else if (currentEvent === 'complete') {
                  clearInterval(heartbeatInterval)
                  setIsGenerating(false)
                } else if (currentEvent === 'error') {
                  clearInterval(heartbeatInterval)
                  setIsGenerating(false)
                  setGenerationError(data.error?.error || data.error?.message || '오류가 발생했습니다.')
                }
              }
            }
          }
        } catch (error: any) {
          clearInterval(heartbeatInterval)
          setIsGenerating(false)
          balanceTemplatesReaderRef.current = null
          console.error('❌ [균형 맞추기] 스트리밍 읽기 오류:', error)
          if (error.name === 'TypeError' && error.message.includes('network')) {
            setGenerationError('네트워크 오류가 발생했습니다. 백엔드는 계속 생성 중일 수 있습니다.')
          } else {
            setGenerationError(`스트리밍 오류: ${error.message || '알 수 없는 오류'}`)
          }
        }
      }

      processStream()
    } catch (error: any) {
      setIsGenerating(false)
      setGenerationError(error.message || '균형 맞추기 중 오류가 발생했습니다.')
      console.error('❌ [균형 맞추기] 오류:', error)
    }
  }

  // 전체 생성 중지
  const handleStopGenerateTemplates = () => {
    if (generateTemplatesReaderRef.current) {
      generateTemplatesReaderRef.current.cancel().catch(e => console.error("Reader cancel failed:", e))
      generateTemplatesReaderRef.current = null
    }
    setShouldStopRepeat(true)
    setIsGenerating(false)
    setGenerationError('사용자가 이미지 생성을 중지했습니다.')
    console.log('🛑 [템플릿 생성] 사용자가 중지했습니다.')
  }

  // 균형 맞추기 중지
  const handleStopBalanceTemplates = () => {
    if (balanceTemplatesReaderRef.current) {
      balanceTemplatesReaderRef.current.cancel().catch(e => console.error("Reader cancel failed:", e))
      balanceTemplatesReaderRef.current = null
      setIsGenerating(false)
      setGenerationError('사용자가 중지했습니다.')
      console.log('🛑 [균형 맞추기] 사용자가 중지했습니다.')
    }
  }

  // 모달 닫을 때 EventSource 정리
  const handleCloseModal = () => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
    }
    // 균형 맞추기 스트리밍도 중지
    if (balanceTemplatesReaderRef.current) {
      balanceTemplatesReaderRef.current.cancel().catch(e => console.error("Reader cancel failed:", e))
      balanceTemplatesReaderRef.current = null
    }
    // 전체 생성 스트리밍도 중지
    if (generateTemplatesReaderRef.current) {
      generateTemplatesReaderRef.current.cancel().catch(e => console.error("Reader cancel failed:", e))
      generateTemplatesReaderRef.current = null
    }
    setShouldStopRepeat(true)
    setIsTemplateModalOpen(false)
    setGeneratedImages([])
    setAllGeneratedImages([])
    setGenerationError(null)
    setIsGenerating(false)
    setCurrentRepeat(0)
  }

  return (
    <PageLayout title="설정">
      <Card>
        <div className="space-y-6">
          {/* 글자 크기 설정 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">글자 크기</h3>
                <p className="text-sm text-gray-400">
                  현재: {fontSize}px ({fontSizeRatio}%)
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-gray-300"
              >
                기본값
              </button>
            </div>
            
            {/* 슬라이더 */}
            <div className="space-y-2">
              <input
                type="range"
                min={minFontSize}
                max={maxFontSize}
                value={localFontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                style={{
                  background: `linear-gradient(to right, rgb(34, 211, 238) 0%, rgb(34, 211, 238) ${((localFontSize - minFontSize) / (maxFontSize - minFontSize)) * 100}%, rgba(255,255,255,0.1) ${((localFontSize - minFontSize) / (maxFontSize - minFontSize)) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>작게 ({minFontSize}px)</span>
                <span>기본 ({defaultFontSize}px)</span>
                <span>크게 ({maxFontSize}px)</span>
              </div>
            </div>
          </div>

          {/* 템플릿 이미지 생성 (관리자용) */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-base font-semibold text-white mb-3">템플릿 이미지 생성</h3>
            <div className="space-y-2">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="w-full p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-300 font-semibold transition-colors"
              >
                전체 템플릿 이미지 생성
              </button>
              <button
                onClick={handleBalanceTemplates}
                className="w-full p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-300 font-semibold transition-colors"
              >
                템플릿 이미지 균형 맞추기
              </button>
              <button
                onClick={async () => {
                  if (!currentUser) {
                    alert('로그인이 필요합니다.')
                    return
                  }
                  
                  const deleteAll = confirm(
                    '⚠️ 경고: 모든 템플릿 이미지를 삭제합니다.\n\n' +
                    '이 작업은 되돌릴 수 없습니다.\n' +
                    '정말 삭제하시겠습니까?'
                  )
                  
                  if (!deleteAll) return
                  
                  const confirmDelete = confirm(
                    '마지막 확인: 정말로 모든 템플릿 이미지를 삭제하시겠습니까?\n\n' +
                    '이 작업은 되돌릴 수 없습니다!'
                  )
                  
                  if (!confirmDelete) return
                  
                  try {
                    const idToken = await currentUser.getIdToken()
                    const apiUrl = getApiUrl('/api/images/delete-templates')
                    
                    const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`,
                      },
                      body: JSON.stringify({
                        deleteAll: true,
                        confirmDeleteAll: true,
                      }),
                    })
                    
                    if (!response.ok) {
                      const errorText = await response.text()
                      throw new Error(`삭제 실패: ${response.status} ${errorText}`)
                    }
                    
                    const result = await response.json()
                    alert(`✅ ${result.deleted}개 이미지가 삭제되었습니다.\n${result.failed > 0 ? `⚠️ ${result.failed}개 삭제 실패` : ''}`)
                  } catch (error: any) {
                    alert(`❌ 삭제 중 오류: ${error.message}`)
                    console.error('❌ [이미지 삭제] 오류:', error)
                  }
                }}
                className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 font-semibold transition-colors"
              >
                ⚠️ 템플릿 이미지 전체 삭제 (비상용)
              </button>
            </div>
          </div>

          {/* 계정 정보 */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-base font-semibold text-white mb-3">계정</h3>
            <div className="space-y-2">
              {userNickname && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">닉네임</div>
                  <div className="text-sm text-white">{userNickname}</div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 font-semibold transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 템플릿 이미지 생성 모달 */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 pb-[calc(100px+env(safe-area-inset-bottom))] overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[calc(100vh-120px)] bg-gradient-to-br from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-purple-500/60 rounded-3xl p-6 shadow-[0_0_60px_rgba(168,85,247,0.4)] my-4 overflow-y-auto">
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/60 text-red-300 hover:text-red-200 transition-all duration-300 z-20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-6">
              <h2 className="text-2xl font-black text-center bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                전체 템플릿 이미지 생성
              </h2>
              <p className="text-center text-gray-400 text-xs mb-4">
                모든 세계관에 대해 모든 조합당 1개씩 생성됩니다
              </p>

              {isGenerating ? (
                <>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-white mb-2">
                      반복 {currentRepeat + 1}/{Math.min(repeatCount, 5)}: {generationProgress.current}/{generationProgress.total} ({generationProgress.progress}%)
                    </p>
                    {generationProgress.currentWorldView && (
                      <p className="text-sm text-purple-300 mb-2">
                        현재 세계관: {generationProgress.currentWorldView} ({generationProgress.currentWorldViewIndex}/{generationProgress.totalWorldViews})
                      </p>
                    )}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      전체 진행: {allGeneratedImages.length + generatedImages.length}개 생성됨
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleStopGenerateTemplates}
                      className="flex-1 py-3 rounded-xl bg-red-500/50 hover:bg-red-500/70 text-white font-semibold transition-all duration-200"
                    >
                      생성 중지
                    </button>
                  </div>
                </>
              ) : !isGenerating && generatedImages.length === 0 && allGeneratedImages.length === 0 ? (
                <>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                    <p className="text-sm text-gray-300 mb-2">
                      생성 정보:
                    </p>
                    <p className="text-xs text-gray-400">
                      • 세계관 6개 × 조합 {MONSTER_CLASSIFICATIONS.length * MONSTER_JOBS.length}개 = 총 {6 * MONSTER_CLASSIFICATIONS.length * MONSTER_JOBS.length}개 이미지
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      • 예상 소요 시간: 약 {Math.ceil(6 * MONSTER_CLASSIFICATIONS.length * MONSTER_JOBS.length * 5 / 60)}분 (1회 기준)
                    </p>
                  </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                    <label className="text-sm text-gray-300 mb-2 block">
                      반복 횟수: {Math.min(repeatCount, 5)}회 (최대 5회)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={Math.min(repeatCount, 5)}
                      onChange={(e) => setRepeatCount(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1회</span>
                      <span>5회</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      • 총 {Math.min(repeatCount, 5) * 6 * MONSTER_CLASSIFICATIONS.length * MONSTER_JOBS.length}개 이미지 생성
                      • 예상 소요 시간: 약 {Math.ceil(Math.min(repeatCount, 5) * 6 * MONSTER_CLASSIFICATIONS.length * MONSTER_JOBS.length * 5 / 60)}분
                    </p>
                    <p className="text-xs text-red-400 mt-2">
                      ⚠️ 반복 횟수는 안전을 위해 최대 5회로 제한됩니다.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-3 rounded-xl bg-gray-600/50 hover:bg-gray-600/70 text-white font-semibold transition-all duration-200"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentRepeat(0)
                        handleGenerateTemplates()
                      }}
                      disabled={isGenerating}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        !isGenerating
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.45)]'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      생성 시작 ({repeatCount}회 반복)
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    {isGenerating ? (
                      <>
                        <p className="text-lg font-semibold text-white mb-2">
                          반복 {currentRepeat + 1}/{repeatCount}: {generationProgress.current}/{generationProgress.total} ({generationProgress.progress}%)
                        </p>
                        {generationProgress.currentWorldView && (
                          <p className="text-sm text-purple-300 mb-2">
                            현재 세계관: {generationProgress.currentWorldView} ({generationProgress.currentWorldViewIndex}/{generationProgress.totalWorldViews})
                          </p>
                        )}
                        <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${generationProgress.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                          전체 진행: {allGeneratedImages.length + generatedImages.length}개 생성됨
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-white mb-2">
                          모든 반복 완료: 총 {allGeneratedImages.length}개 생성됨
                        </p>
                        {generationError && (
                          <p className="text-sm text-red-400 mb-2">{generationError}</p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-gray-400 mb-4">
                      조합별로 그룹화되어 표시됩니다
                    </p>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto space-y-6">
                    {(() => {
                      // 모든 이미지 (allGeneratedImages + generatedImages)를 조합별로 그룹화
                      const allImages = [...allGeneratedImages, ...generatedImages]
                      const grouped: Record<string, typeof allImages> = {}
                      allImages.forEach(img => {
                        const key = `${img.classification || '미정'}_${img.job || '미정'}`
                        if (!grouped[key]) grouped[key] = []
                        grouped[key].push(img)
                      })
                      
                      return Object.entries(grouped).map(([key, images]) => {
                        const [classification, job] = key.split('_')
                        // 반복별로 그룹화
                        const byRepeat: Record<number, typeof images> = {}
                        images.forEach(img => {
                          const repeatIdx = (img as any).repeatIndex || 1
                          if (!byRepeat[repeatIdx]) byRepeat[repeatIdx] = []
                          byRepeat[repeatIdx].push(img)
                        })
                        
                        return (
                          <div key={key} className="space-y-3">
                            <h3 className="text-sm font-semibold text-purple-300">
                              {classification} × {job} (총 {images.length}개)
                            </h3>
                            {Object.entries(byRepeat).map(([repeatIdx, repeatImages]) => (
                              <div key={repeatIdx} className="space-y-1">
                                {repeatCount > 1 && (
                                  <p className="text-xs text-gray-400 pl-2">
                                    반복 {repeatIdx}: {repeatImages.length}개
                                  </p>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                  {repeatImages.map((image) => (
                                    <div
                                      key={image.id}
                                      className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-white/20"
                                    >
                                      <img
                                        src={image.imageUrl}
                                        alt="템플릿"
                                        className="w-full h-full object-cover"
                                        draggable="false"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })
                    })()}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-3 rounded-xl bg-gray-600/50 hover:bg-gray-600/70 text-white font-semibold transition-all duration-200"
                    >
                      닫기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGeneratedImages([])
                        setAllGeneratedImages([])
                        setGenerationError(null)
                        setCurrentRepeat(0)
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold transition-all duration-200"
                    >
                      다시 생성
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

export default Settings

