import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { TAB_CONFIG } from '../constants/tabs'

/**
 * 하단 탭 네비게이션 바 컴포넌트
 * 앱의 주요 섹션으로 이동할 수 있는 하단 고정 네비게이션
 */
function BottomTabBar() {
  const location = useLocation()
  const [pulseTab, setPulseTab] = useState<string | null>(null)

  // 탭을 클릭했을 때 짧은 펄스 이펙트 부여
  useEffect(() => {
    if (!pulseTab) return
    const timer = setTimeout(() => setPulseTab(null), 220)
    return () => clearTimeout(timer)
  }, [pulseTab])

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 w-full bg-[rgba(5,8,22,0.9)] backdrop-blur-[18px] border-t border-white/10 flex justify-around items-start pt-2 pb-[env(safe-area-inset-bottom)] z-[9999] shadow-[0_-10px_35px_rgba(0,0,0,0.45)]"
      style={{
        height: 'calc(74px + env(safe-area-inset-bottom))',
        fontSize: '14px', // 고정 크기
        position: 'fixed', // 명시적으로 fixed 설정
      }}
    >
      {TAB_CONFIG.map((tab) => {
        const isActive = location.pathname === tab.path
        const isPulsing = pulseTab === tab.path
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            onClick={() => setPulseTab(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center p-2 no-underline transition-all duration-200 relative touch-manipulation [-webkit-tap-highlight-color:transparent] active:scale-95 border-r border-white/5 last:border-r-0 ${
              isActive
                ? 'text-white before:content-[""] before:absolute before:top-1 before:left-1/2 before:-translate-x-1/2 before:w-12 before:h-[3px] before:bg-cyan-300 before:rounded-full before:shadow-[0_0_12px_rgba(125,211,252,0.8)]'
                : 'text-white/65'
            }`}
            style={{
              minHeight: '70px',
              fontSize: '14px', // 고정 크기
            }}
          >
            <span
              className={`px-2.5 py-1 font-extrabold tracking-[0.12em] uppercase transition-all duration-200 ${
                isActive
                  ? 'text-white drop-shadow-[0_0_10px_rgba(125,211,252,0.5)]'
                  : 'text-white/70'
              } ${isPulsing ? 'animate-pulse' : ''}`}
              style={{
                fontSize: '14px', // 고정 크기 (rem 무시)
                lineHeight: '1.2',
              }}
            >
              {tab.label}
            </span>
            <span
              className={`mt-1 h-[3px] w-12 rounded-full transition-all duration-200 ${
                isActive ? 'bg-cyan-300/80 shadow-[0_0_10px_rgba(125,211,252,0.6)]' : 'bg-white/10'
              } ${isPulsing ? 'animate-pulse' : ''}`}
              style={{
                width: '48px', // 고정 크기
                height: '3px', // 고정 크기
              }}
            />
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomTabBar

