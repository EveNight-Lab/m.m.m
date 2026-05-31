import { ReactNode, useRef, useEffect, useState, useCallback } from 'react'

interface SlotContainerProps {
  children: ReactNode
}

/**
 * 슬롯 컨테이너 컴포넌트
 * 모든 화면 크기에서 가로 스크롤 가능한 슬롯 영역
 * 한 줄로 유지하며, 공간이 부족하면 가로 스크롤로 처리
 * PC에서 마우스 드래그로 스크롤 가능
 */
function SlotContainer({ children }: SlotContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [layoutState, setLayoutState] = useState({
    left: false,
    right: false,
    needsScroll: false,
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, scrollLeft: 0, pageX: 0, pageY: 0 })
  const hasDraggedRef = useRef(false) // 실제로 드래그가 발생했는지 추적

  const checkScroll = () => {
    if (!scrollRef.current) return

    const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current
    const needsScroll = scrollWidth > clientWidth

    if (needsScroll) {
      // 스크롤이 필요할 때만 그라데이션 표시
      setLayoutState({
        left: scrollLeft > 0, // 왼쪽에 스크롤 가능한 콘텐츠가 있을 때
        right: scrollLeft < scrollWidth - clientWidth - 1, // 오른쪽에 스크롤 가능한 콘텐츠가 있을 때
        needsScroll: true,
      })
    } else {
      // 스크롤이 필요 없으면 중앙 정렬, 그라데이션 숨김
      setLayoutState({ left: false, right: false, needsScroll: false })
    }
  }

  // 마우스 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    hasDraggedRef.current = false // 드래그 플래그 초기화
    dragStartRef.current = {
      x: e.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft,
      pageX: e.pageX,
      pageY: e.pageY,
    }
    scrollRef.current.style.cursor = 'grabbing'
    scrollRef.current.style.userSelect = 'none'
  }

  // 마우스 드래그 중
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - dragStartRef.current.x) * 2 // 스크롤 속도 조절
    const newScrollLeft = dragStartRef.current.scrollLeft - walk
    
    // 스크롤이 실제로 발생했는지 확인 (1px 이상 변경)
    const scrollDelta = Math.abs(newScrollLeft - dragStartRef.current.scrollLeft)
    if (scrollDelta > 1) {
      hasDraggedRef.current = true
    }
    
    scrollRef.current.scrollLeft = newScrollLeft
  }, [isDragging])

  // 마우스 드래그 종료
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!scrollRef.current) return
    
    // 스크롤이 실제로 발생했는지 최종 확인
    const finalScrollDelta = Math.abs(scrollRef.current.scrollLeft - dragStartRef.current.scrollLeft)
    if (finalScrollDelta > 1) {
      hasDraggedRef.current = true
    }
    
    // 드래그가 발생했으면 클릭 이벤트 방지
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setIsDragging(false)
    hasDraggedRef.current = false
    scrollRef.current.style.cursor = 'grab'
    scrollRef.current.style.userSelect = ''
  }, [])

  // 마우스가 영역을 벗어났을 때
  const handleMouseLeave = () => {
    if (!scrollRef.current) return
    setIsDragging(false)
    hasDraggedRef.current = false
    scrollRef.current.style.cursor = 'grab'
    scrollRef.current.style.userSelect = ''
  }
  
  // 클릭 이벤트 방지 (드래그가 발생했을 때)
  const handleClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  useEffect(() => {
    checkScroll()

    const scrollElement = scrollRef.current
    if (!scrollElement) return

    // 스크롤 이벤트 리스너
    scrollElement.addEventListener('scroll', checkScroll)

    // 마우스 드래그 이벤트 리스너
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    // ResizeObserver로 크기 변경 감지
    const resizeObserver = new ResizeObserver(checkScroll)
    resizeObserver.observe(scrollElement)

    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', checkScroll)

    return () => {
      scrollElement.removeEventListener('scroll', checkScroll)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      resizeObserver.disconnect()
      window.removeEventListener('resize', checkScroll)
    }
  }, [children, isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="relative -mx-4 px-4 overflow-hidden">
      <div 
        ref={scrollRef}
        className={`flex gap-3 xl:gap-4 2xl:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 cursor-grab active:cursor-grabbing select-none ${
          layoutState.needsScroll ? 'justify-start' : 'justify-evenly'
        }`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </div>
      
      {/* 왼쪽 그라데이션 마스크 - 스크롤이 필요하고 왼쪽에 콘텐츠가 있을 때만 표시 */}
      {layoutState.left && (
        <div className="absolute left-0 top-0 bottom-2 w-20 bg-gradient-to-r from-white/5 via-white/5 to-transparent pointer-events-none z-10" />
      )}
      
      {/* 오른쪽 그라데이션 마스크 - 스크롤이 필요하고 오른쪽에 콘텐츠가 있을 때만 표시 */}
      {layoutState.right && (
        <div className="absolute right-0 top-0 bottom-2 w-20 bg-gradient-to-l from-white/5 via-white/5 to-transparent pointer-events-none z-10" />
      )}
    </div>
  )
}

export default SlotContainer

