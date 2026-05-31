/**
 * PWA 설치 프롬프트 컴포넌트
 * 사이트 접속 시 자동으로 설치 안내 표시
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const { currentUser } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [wasLoggedOut, setWasLoggedOut] = useState(true)

  useEffect(() => {
    // iOS 확인
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(isIOSDevice)

    // 이미 설치되었는지 확인
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches
    if (standaloneMode) {
      setIsInstalled(true)
      return
    }

    // iOS의 경우 별도 안내 (로그인 상태 체크는 아래에서)
    if (isIOSDevice) {
      return
    }

    // Android/Chrome 등: beforeinstallprompt 이벤트 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      // 로그인 시점에 표시하므로 여기서는 이벤트만 저장
    }

    // 앱이 설치되었는지 감지
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setShowIOSPrompt(false)
      setDeferredPrompt(null)
      localStorage.removeItem('pwa-install-dismissed')
      localStorage.removeItem('pwa-ios-install-dismissed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // 로그인 상태 변화 감지: 로그인 성공 시 프롬프트 표시
  useEffect(() => {
    // 로그아웃 상태에서 로그인 상태로 변경되었을 때만 표시
    if (currentUser && wasLoggedOut && !isInstalled) {
      setWasLoggedOut(false)
      
      // 로그인 성공 후 약간의 딜레이를 두고 프롬프트 표시
      const timer = setTimeout(() => {
        if (isIOS) {
          const dismissed = localStorage.getItem('pwa-ios-install-dismissed')
          const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
          
          if (!dismissed || dismissedTime < oneDayAgo) {
            setShowIOSPrompt(true)
          }
        } else if (deferredPrompt) {
          // Android/Chrome: 로그인 시점에 프롬프트 표시
          const dismissed = localStorage.getItem('pwa-install-dismissed')
          const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
          
          if (!dismissed || dismissedTime < oneDayAgo) {
            setShowPrompt(true)
          }
        }
      }, 1000) // 로그인 후 1초 후 표시

      return () => clearTimeout(timer)
    } else if (!currentUser) {
      // 로그아웃 상태로 변경
      setWasLoggedOut(true)
      setShowPrompt(false)
      setShowIOSPrompt(false)
    }
  }, [currentUser, wasLoggedOut, isInstalled, isIOS, deferredPrompt])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      // 설치 프롬프트 표시
      await deferredPrompt.prompt()
      
      // 사용자 선택 대기
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setShowPrompt(false)
        setDeferredPrompt(null)
        localStorage.removeItem('pwa-install-dismissed')
      } else {
        // 거부한 경우 하루 동안 표시하지 않음
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
        setShowPrompt(false)
      }
    } catch (error) {
      console.error('설치 프롬프트 오류:', error)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  const handleIOSDismiss = () => {
    localStorage.setItem('pwa-ios-install-dismissed', Date.now().toString())
    setShowIOSPrompt(false)
  }

  // 이미 설치되었으면 표시하지 않음
  if (isInstalled) {
    return null
  }

  // iOS 안내 메시지
  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe bg-black/90 backdrop-blur-sm border-t border-white/20 animate-slide-up">
        <div className="max-w-md mx-auto">
          <div className="text-white font-semibold text-sm mb-2">
            📱 홈 화면에 추가하기
          </div>
          <div className="text-gray-300 text-xs mb-3 space-y-1">
            <p>1. 하단 공유 버튼 <span className="text-cyan-400">□↑</span> 탭</p>
            <p>2. "홈 화면에 추가" 선택</p>
          </div>
          <button
            onClick={handleIOSDismiss}
            className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    )
  }

  // Android/Chrome 설치 프롬프트
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe bg-black/90 backdrop-blur-sm border-t border-white/20 animate-slide-up">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1">
            <div className="text-white font-semibold text-sm mb-1">
              📱 앱으로 설치하기
            </div>
            <div className="text-gray-300 text-xs">
              홈 화면에 추가하여 더 빠르게 접속하세요
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              나중에
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              설치
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
