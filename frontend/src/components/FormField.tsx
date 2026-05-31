import { forwardRef } from 'react'

interface FormFieldProps {
  label: string
  placeholder?: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFocus?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  multiline?: boolean
  rows?: number
}

/**
 * 공통 폼 필드 컴포넌트
 * 라벨 + 인풋/텍스트에어아 조합을 일관된 스타일로 제공
 */
const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onKeyDown,
  multiline = false,
  rows = 3,
}, ref) => {
  const baseClasses =
    'w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm sm:text-base text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40 transition-all duration-150'

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white/80">
        {label}
      </label>
      {multiline ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={`${baseClasses} resize-none min-h-[96px]`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          rows={rows}
        />
      ) : (
        <input
          ref={ref}
          className={baseClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  )
})

FormField.displayName = 'FormField'

export default FormField

