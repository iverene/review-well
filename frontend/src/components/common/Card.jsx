import { Link } from 'react-router-dom'

// Sheet on the page: repeated content, tools, and framed sections.
// Pass `to` for a whole-card link with a gentle lift on hover.
const Card = ({ to, className = '', children, ...props }) => {
  const base = 'block rounded-club border-2 border-stone bg-paper p-4 shadow-sticker'
  if (to) {
    return (
      <Link
        to={to}
        className={`${base} transition-transform duration-150 ease-out-soft hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
        {...props}
      >
        {children}
      </Link>
    )
  }
  return <div className={`${base} ${className}`} {...props}>{children}</div>
}

export default Card
