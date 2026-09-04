const AuthLoading = ({ message = 'Signing you in...', hint = 'Please wait while we complete your authentication.' }) => (
  <div
    className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-4"
    role="status"
    aria-label={message}
  >
    <span className="auth-orbit" aria-hidden="true">
      <img src="/logo.png" alt="Review Well" className="auth-logo h-20 w-20 rounded-3xl object-contain" />
    </span>
    <img src="/word-logo.png" alt="Review Well" className="auth-fade h-7 w-auto max-w-[200px] object-contain" />
    <p className="text-sm font-extrabold text-ink">{message}</p>
    <p className="-mt-3 text-xs text-muted">{hint}</p>
    <span className="auth-bar" aria-hidden="true" />
  </div>
)

export default AuthLoading
