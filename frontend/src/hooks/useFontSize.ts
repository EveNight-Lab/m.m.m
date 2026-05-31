import { useState, useEffect } from 'react'

const FONT_SIZE_STORAGE_KEY = 'namonsaeng-font-size'
const DEFAULT_FONT_SIZE = 16 // 기본 16px (1rem)
const MIN_FONT_SIZE = 12 // 최소 12px
const MAX_FONT_SIZE = 24 // 최대 24px

/**
 * 폰트 크기 관리 커스텀 훅
 * html 요소의 font-size를 동적으로 변경하여 전체 앱의 폰트 크기를 조절합니다.
 */
export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<number>(() => {
    // localStorage에서 저장된 값 불러오기
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
        return parsed
      }
    }
    return DEFAULT_FONT_SIZE
  })

  // html 요소의 font-size 변경
  useEffect(() => {
    const htmlElement = document.documentElement
    htmlElement.style.fontSize = `${fontSize}px`
    
    // cleanup: 컴포넌트 언마운트 시 기본값으로 복원 (선택사항)
    return () => {
      // 기본값으로 복원하지 않음 (사용자 설정 유지)
    }
  }, [fontSize])

  // 폰트 크기 변경 함수
  const setFontSize = (size: number) => {
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size))
    setFontSizeState(clampedSize)
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, clampedSize.toString())
  }

  // 폰트 크기 리셋
  const resetFontSize = () => {
    setFontSize(DEFAULT_FONT_SIZE)
  }

  return {
    fontSize,
    setFontSize,
    resetFontSize,
    minFontSize: MIN_FONT_SIZE,
    maxFontSize: MAX_FONT_SIZE,
    defaultFontSize: DEFAULT_FONT_SIZE,
  }
}

