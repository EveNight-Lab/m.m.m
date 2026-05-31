import { useScrollIntoViewOnFocus } from '../hooks/useScrollIntoViewOnFocus'

interface SelectFieldProps {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: readonly string[]
  placeholder?: string
}

/**
 * 선택 필드 컴포넌트
 * 드롭다운 선택을 위한 공통 컴포넌트
 */
function SelectField({ label, value, onChange, options, placeholder = '선택해주세요' }: SelectFieldProps) {
  const handleInputFocus = useScrollIntoViewOnFocus()
  
  // select 요소용 포커스 핸들러
  const handleFocus = (event: React.FocusEvent<HTMLSelectElement>) => {
    // useScrollIntoViewOnFocus는 input/textarea용이므로 select를 input처럼 처리
    handleInputFocus(event as unknown as React.FocusEvent<HTMLInputElement>)
  }
  
  const baseClasses =
    'w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40 transition-all duration-150 appearance-none cursor-pointer'

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/80">
        {label}
      </label>
      <div className="relative">
        <select
          className={baseClasses}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
        >
          <option value="" className="bg-slate-900 text-white">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option} className="bg-slate-900 text-white">
              {option}
            </option>
          ))}
        </select>
        {/* 드롭다운 화살표 아이콘 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default SelectField

