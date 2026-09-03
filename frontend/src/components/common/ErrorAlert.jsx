const ErrorAlert = ({ children, className = '' }) => {
  if (!children) return null

  return (
    <div
      role="alert"
      className={`rounded-soft border-2 border-berry bg-blush px-4 py-3 text-sm font-semibold text-ink ${className}`}
    >
      {children}
    </div>
  )
}

export default ErrorAlert
