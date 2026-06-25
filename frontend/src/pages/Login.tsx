/**
 * 로그인/회원가입 페이지 (닉네임 기반)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import { useAuth } from '../contexts/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 닉네임 유효성 검사
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.')
      setLoading(false)
      return
    }

    if (nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    if (nickname.trim().length > 20) {
      setError('닉네임은 20자 이하여야 합니다.')
      setLoading(false)
      return
    }

    // 특수문자 제한 (영문, 한글, 숫자만 허용)
    if (!/^[a-zA-Z0-9가-힣]+$/.test(nickname.trim())) {
      setError('닉네임은 영문, 한글, 숫자만 사용할 수 있습니다.')
      setLoading(false)
      return
    }

    // 비밀번호 유효성 검사
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.')
      setLoading(false)
      return
    }

    if (password.trim().length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        await login(nickname.trim(), password.trim())
        navigate('/manage')
      } else {
        await signup(nickname.trim(), password.trim())
        navigate('/manage')
      }
    } catch (err: any) {
      // 에러 메시지를 사용자에게 친절하게 표시
      const errorMessage = err.message || '오류가 발생했습니다.'
      setError(errorMessage)
      console.error('인증 에러:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await login('제미나이마스터', '123456')
      navigate('/manage')
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title={isLogin ? '로그인' : '회원가입'}>
      <div className="max-w-md mx-auto">
        <Card>
          {/* 회원가입 화면에만 표시되는 환영 메시지 */}
          {!isLogin && (
            <div className="mb-6 text-center">
              <div className="text-3xl mb-2">👋</div>
              <h2 className="text-xl font-bold text-white mb-2">나몬생에 오신 것을 환영합니다!</h2>
              <p className="text-sm text-gray-400">
                나만의 몬스터를 만들고 키워보세요
              </p>
            </div>
          )}

          {/* 로그인 화면에만 표시되는 간단한 안내 */}
          {isLogin && (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-white mb-2">다시 오신 것을 환영합니다!</h2>
              <p className="text-sm text-gray-400">
                계정에 로그인하여 계속하세요
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                닉네임
                {!isLogin && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder="닉네임을 입력하세요 (2-20자)"
                required
                minLength={2}
                maxLength={20}
                pattern="[a-zA-Z0-9가-힣]+"
              />
              <p className="text-xs text-gray-400 mt-1">
                영문, 한글, 숫자만 사용 가능합니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                비밀번호
                {!isLogin && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                placeholder={isLogin ? "비밀번호를 입력하세요" : "비밀번호를 입력하세요 (최소 6자)"}
                required
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-gray-400 mt-1">
                  최소 6자 이상의 비밀번호를 입력해주세요.
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600'
                  : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-600'
              } disabled:cursor-not-allowed`}
            >
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입 시작하기'}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full p-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-500/35 to-cyan-500/35 hover:from-purple-500/50 hover:to-cyan-500/50 border border-purple-500/50 text-white shadow-[0_4px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_4px_25px_rgba(168,85,247,0.45)] mt-2"
              >
                로그인 없이 시작하기 (게스트)
              </button>
            )}

            <div className="pt-4 border-t border-white/10">
              <div className="text-center text-sm text-gray-400 mb-2">
                {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                  setNickname('')
                  setPassword('')
                }}
                className="w-full px-4 py-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg text-sm font-medium transition-colors border border-cyan-400/30"
              >
                {isLogin ? '회원가입하기' : '로그인하기'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </PageLayout>
  )
}

export default Login
