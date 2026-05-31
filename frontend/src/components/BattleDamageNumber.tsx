/**
 * 데미지 숫자 표시 컴포넌트
 * 데미지가 발생할 때 애니메이션과 함께 표시
 */

interface BattleDamageNumberProps {
  damage: number
  isCritical?: boolean
  isHeal?: boolean
  position: { x: number; y: number }
}

export default function BattleDamageNumber({
  damage,
  isCritical = false,
  isHeal = false,
  position,
}: BattleDamageNumberProps) {
  return (
    <div
      className={`absolute pointer-events-none z-50 font-black ${
        isHeal
          ? 'text-green-400 text-4xl md:text-5xl lg:text-6xl'
          : isCritical
          ? 'text-yellow-400 text-5xl md:text-6xl lg:text-7xl'
          : 'text-red-400 text-4xl md:text-5xl lg:text-6xl'
      } drop-shadow-[0_0_10px_currentColor,0_0_20px_currentColor]`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        animation: 'damageFloat 1.5s ease-out forwards',
        textStroke: '2px rgba(0,0,0,0.8)',
        WebkitTextStroke: '2px rgba(0,0,0,0.8)',
      }}
    >
      <div className="relative">
        {isHeal ? '+' : '-'}
        {damage}
        {isCritical && (
          <span className="absolute -top-2 -right-4 text-3xl md:text-4xl animate-pulse">!</span>
        )}
      </div>
    </div>
  )
}

