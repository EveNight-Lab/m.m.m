import { useCallback } from 'react'

/**
 * 인풋 포커스 시 스크롤 위치를 조정하는 훅
 * - PC: 포커스된 요소를 화면 가운데로 이동
 * - 모바일: 키보드에 가려지지 않도록 화면 위쪽에 여유 있게 위치
 *
 * @param mobileOffset - 모바일에서 상단 여백 (기본값: 96px)
 */
export function useScrollIntoViewOnFocus(mobileOffset: number = 96) {
  return useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget
    if (!target) return

    // 실제 스크롤 컨테이너 찾기: data-scroll-container를 가진 가장 가까운 조상 우선
    const container =
      (target.closest('[data-scroll-container]') as HTMLElement) ||
      document.getElementById('root') ||
      document.scrollingElement ||
      document.documentElement

    if (!container) return

    // 모바일/PC 구분: 터치 지원 여부와 화면 너비로 판단
    const isMobile = 'ontouchstart' in window || window.innerWidth < 768

    // 모바일은 키보드가 올라오는 타이밍 고려, PC는 즉시
    const delay = isMobile ? 80 : 0

    window.setTimeout(() => {
      const targetRect = target.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const containerHeight = containerRect.height

      const targetTopInContainer =
        targetRect.top - containerRect.top + container.scrollTop
      const targetHeight = targetRect.height

      let scrollTop: number

      if (isMobile) {
        // 모바일: 키보드 고려해서 위쪽에 여유 있게
        scrollTop = Math.max(targetTopInContainer - mobileOffset, 0)
      } else {
        // PC: 화면 가운데로 위치
        const centerOffset = (containerHeight - targetHeight) / 2
        scrollTop = Math.max(targetTopInContainer - centerOffset, 0)
      }

      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      })
    }, delay)
  }, [mobileOffset])
}

