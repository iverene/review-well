import { forwardRef } from 'react'

// Form controls share one border, radius, and focus treatment. Borders use
// the `line` token so fields stay identifiable (>= 3:1) on every surface.
export const fieldClasses = 'w-full rounded-soft border-2 border-line bg-paper px-4 py-2.5 text-ink placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60'

export const Label = ({ htmlFor, children, hint, className = '' }) => (
  <label htmlFor={htmlFor} className={`mb-1.5 block text-sm font-extrabold text-ink ${className}`}>
    {children}
    {hint && <span className="ml-1 font-semibold text-muted">{hint}</span>}
  </label>
)

export const Input = forwardRef(({ className = '', ...props }, ref) => (
  <input ref={ref} className={`${fieldClasses} ${className}`} {...props} />
))
Input.displayName = 'Input'

export const Select = forwardRef(({ className = '', children, ...props }, ref) => (
  <select ref={ref} className={`${fieldClasses} ${className}`} {...props}>{children}</select>
))
Select.displayName = 'Select'

export const Textarea = forwardRef(({ className = '', ...props }, ref) => (
  <textarea ref={ref} className={`${fieldClasses} ${className}`} {...props} />
))
Textarea.displayName = 'Textarea'
