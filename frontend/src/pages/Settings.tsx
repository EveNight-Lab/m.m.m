import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import { useFontSize } from '../hooks/useFontSize'
import { useAuth } from '../contexts/AuthContext'

function Settings() {
  const navigate = useNavigate()
  const { logout, userNickname } = useAuth()
  const { fontSize, setFontSize, resetFontSize, minFontSize, maxFontSize, defaultFontSize } = useFontSize()
  const [localFontSize, setLocalFontSize] = useState(fontSize)

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

  return (
    <PageLayout title="설정">
      <div className="max-w-md mx-auto space-y-6">
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
                  type="button"
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
                  type="button"
                  onClick={handleLogout}
                  className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 font-semibold transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}

export default Settings
