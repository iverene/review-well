import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

// One button language for the whole app (DESIGN.md §5). Renders a <button>
// by default, a router <Link> with `to`, or a plain <a> with `href`.
const VARIANTS = {
  primary: 'border-accent bg-accent text-paper shadow-sticker-sm hover:-translate-y-0.5',
  secondary: 'border-stone bg-paper text-ink hover:border-line hover:bg-cream',
  quiet: 'border-transparent bg-transparent text-ink hover:bg-stone/50',
  danger: 'border-blush bg-blush/50 text-accent hover:bg-blush',
}

const SIZES = {
  sm: 'min-h-9 gap-1.5 px-3 py-1.5 text-xs',
  md: 'min-h-11 gap-2 px-4 py-2 text-sm',
  lg: 'min-h-12 gap-2 px-6 py-3 text-sm',
  icon: 'h-10 w-10 justify-center p-0',
}

export const buttonClasses = ({ variant = 'secondary', size = 'md', block = false, className = '' } = {}) => [
  'inline-flex shrink-0 items-center justify-center rounded-soft border-2 font-extrabold',
  'transition-[transform,background-color,border-color] duration-150 ease-out-soft active:scale-[0.97]',
  'disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  VARIANTS[variant] || VARIANTS.secondary,
  SIZES[size] || SIZES.md,
  block ? 'w-full' : '',
  className,
].filter(Boolean).join(' ')

const Button = forwardRef(({ variant, size, block, className, to, href, type, children, ...props }, ref) => {
  const classes = buttonClasses({ variant, size, block, className })
  if (to) return <Link ref={ref} to={to} className={classes} {...props}>{children}</Link>
  if (href) return <a ref={ref} href={href} className={classes} {...props}>{children}</a>
  return <button ref={ref} type={type || 'button'} className={classes} {...props}>{children}</button>
})

Button.displayName = 'Button'

export default Button
