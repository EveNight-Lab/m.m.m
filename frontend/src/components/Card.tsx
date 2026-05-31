import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

/**
 * 카드 컴포넌트
 * 컨텐츠를 담는 재사용 가능한 카드 UI
 */
function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`w-full max-w-full p-4 sm:p-6 my-3 sm:my-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 box-border shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-shadow duration-300 hover:shadow-[0_0_25px_rgba(125,211,252,0.25)] ${className}`}
    >
      {children}
    </div>
  )
}

export default Card

